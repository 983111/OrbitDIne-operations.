import { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Download, Trash2, Edit2, Loader2, X, Save, Upload, Move, LayoutGrid, Map } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../store/AuthContext';

interface TableItem {
  id: string;
  restaurant_id: string;
  number: number;
  seats: number;
  qr_code_url: string | null;
  pos_x: number;
  pos_y: number;
  shape: string;
  label: string | null;
  created_at: string;
}

type ViewMode = 'grid' | 'floormap';

export function TableConfig() {
  const { profile } = useAuth();
  const [tables, setTables] = useState<TableItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showModal, setShowModal] = useState(false);
  const [editTable, setEditTable] = useState<TableItem | null>(null);
  const [form, setForm] = useState({ number: '', seats: '4', shape: 'square', label: '' });
  const [saving, setSaving] = useState(false);

  // Floor map state
  const [floorMapUrl, setFloorMapUrl] = useState<string | null>(null);
  const [uploadingMap, setUploadingMap] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const floorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const restaurantId = profile?.restaurant_id;

  const fetchData = async () => {
    if (!restaurantId) return;
    setLoading(true);
    const [{ data: tablesData }, { data: restData }] = await Promise.all([
      supabase.from('tables').select('*').eq('restaurant_id', restaurantId).order('number'),
      supabase.from('restaurants').select('floor_map_url').eq('id', restaurantId).single(),
    ]);
    setTables((tablesData as TableItem[]) ?? []);
    setFloorMapUrl((restData as any)?.floor_map_url ?? null);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [restaurantId]);

  // ── Floor map drag-and-drop ──────────────────────────────────────────
  const handleMouseDown = (e: React.MouseEvent, tableId: string) => {
    e.preventDefault();
    const el = e.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    setDraggingId(tableId);
    setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!draggingId || !floorRef.current) return;
    const floor = floorRef.current.getBoundingClientRect();
    const rawX = ((e.clientX - floor.left - dragOffset.x) / floor.width) * 100;
    const rawY = ((e.clientY - floor.top - dragOffset.y) / floor.height) * 100;
    const x = Math.min(Math.max(rawX, 0), 93);
    const y = Math.min(Math.max(rawY, 0), 90);
    setTables(prev => prev.map(t => t.id === draggingId ? { ...t, pos_x: x, pos_y: y } : t));
  }, [draggingId, dragOffset]);

  const handleMouseUp = useCallback(async () => {
    if (!draggingId) return;
    const t = tables.find(t => t.id === draggingId);
    if (t) {
      await supabase.from('tables').update({ pos_x: t.pos_x, pos_y: t.pos_y }).eq('id', t.id);
    }
    setDraggingId(null);
  }, [draggingId, tables]);

  useEffect(() => {
    if (draggingId) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingId, handleMouseMove, handleMouseUp]);

  // ── Floor map image upload ───────────────────────────────────────────
  const handleMapUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !restaurantId) return;
    setUploadingMap(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${restaurantId}/floor-map.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from('floor-maps')
        .upload(path, file, { upsert: true });
      if (uploadErr) throw uploadErr;
      const { data: { publicUrl } } = supabase.storage.from('floor-maps').getPublicUrl(path);
      await supabase.from('restaurants').update({ floor_map_url: publicUrl }).eq('id', restaurantId);
      setFloorMapUrl(publicUrl + '?t=' + Date.now());
    } catch (err: any) {
      alert('Upload failed: ' + err.message);
    } finally {
      setUploadingMap(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ── Table CRUD ───────────────────────────────────────────────────────
  const openAdd = () => {
    setEditTable(null);
    const nextNum = tables.length > 0 ? Math.max(...tables.map(t => t.number)) + 1 : 1;
    setForm({ number: String(nextNum), seats: '4', shape: 'square', label: '' });
    setShowModal(true);
  };

  const openEdit = (t: TableItem) => {
    setEditTable(t);
    setForm({ number: String(t.number), seats: String(t.seats), shape: t.shape ?? 'square', label: t.label ?? '' });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!restaurantId) return;
    setSaving(true);
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://orbitdine.app/table/${form.number}`;
    const payload = {
      number: parseInt(form.number),
      seats: parseInt(form.seats),
      shape: form.shape,
      label: form.label || null,
      qr_code_url: qrUrl,
      restaurant_id: restaurantId,
    };
    if (editTable) {
      await supabase.from('tables').update(payload).eq('id', editTable.id);
    } else {
      await supabase.from('tables').insert({ ...payload, pos_x: 10, pos_y: 10 });
    }
    setSaving(false);
    setShowModal(false);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this table?')) return;
    await supabase.from('tables').delete().eq('id', id);
    fetchData();
  };

  const shapeClass = (shape: string) =>
    shape === 'round' ? 'rounded-full' : shape === 'rect' ? 'rounded-md' : 'rounded-lg';

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-end shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Table Configuration</h1>
          <p className="text-slate-500 mt-2">Manage tables, positions, and upload your floor plan.</p>
        </div>
        <div className="flex gap-3">
          <div className="flex bg-slate-100 rounded-lg p-1">
            <button onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'grid' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
              <LayoutGrid className="w-4 h-4" /> Grid
            </button>
            <button onClick={() => setViewMode('floormap')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'floormap' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
              <Map className="w-4 h-4" /> Floor Map
            </button>
          </div>
          <button onClick={openAdd}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
            <Plus className="w-4 h-4 mr-2" /> Add Table
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      ) : viewMode === 'grid' ? (
        /* ── GRID VIEW ── */
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex-1 flex flex-col overflow-hidden">
          <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <h3 className="text-lg font-bold text-slate-900">Configured Tables ({tables.length})</h3>
            <div className="text-sm text-slate-500">Total Capacity: {tables.reduce((acc, t) => acc + t.seats, 0)} seats</div>
          </div>
          <div className="flex-1 overflow-auto p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {tables.map(table => (
                <div key={table.id} className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col items-center text-center hover:shadow-md transition-shadow">
                  <div className="w-24 h-24 bg-slate-100 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                    {table.qr_code_url && (
                      <img src={table.qr_code_url} alt={`QR T${table.number}`} className="w-full h-full object-cover mix-blend-multiply" />
                    )}
                  </div>
                  <h4 className="text-xl font-bold text-slate-900 mb-1">
                    Table {table.number}{table.label ? ` — ${table.label}` : ''}
                  </h4>
                  <p className="text-sm text-slate-500 mb-4">{table.seats} Seats · {table.shape ?? 'square'}</p>
                  <div className="flex space-x-2 w-full mt-auto">
                    <a href={table.qr_code_url ?? '#'} download={`table-${table.number}-qr.png`} target="_blank" rel="noreferrer"
                      className="flex-1 flex items-center justify-center py-2 px-3 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-100">
                      <Download className="w-4 h-4 mr-1" /> PNG
                    </a>
                    <button onClick={() => openEdit(table)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(table.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
              <button onClick={openAdd}
                className="border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center hover:border-indigo-500 hover:bg-indigo-50 transition-colors group min-h-[240px]">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-indigo-100">
                  <Plus className="w-6 h-6 text-slate-400 group-hover:text-indigo-600" />
                </div>
                <h4 className="text-lg font-medium text-slate-600 group-hover:text-indigo-600">Add New Table</h4>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ── FLOOR MAP VIEW ── */
        <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Move className="w-4 h-4" />
              <span>Drag tables to position them · positions auto-save</span>
            </div>
            <div className="flex gap-2">
              <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={handleMapUpload} className="hidden" />
              <button onClick={() => fileInputRef.current?.click()} disabled={uploadingMap}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60 transition-colors">
                {uploadingMap ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {floorMapUrl ? 'Replace Floor Plan' : 'Upload Floor Plan'}
              </button>
            </div>
          </div>

          <div className="flex-1 relative p-4" style={{ minHeight: 520 }}>
            <div
              ref={floorRef}
              className="relative w-full h-full rounded-xl border-2 border-dashed border-slate-200 overflow-hidden select-none bg-slate-50"
              style={{ cursor: draggingId ? 'grabbing' : 'default', minHeight: 480 }}
            >
              {/* Floor plan background */}
              {floorMapUrl ? (
                <img src={floorMapUrl} alt="Floor plan" className="absolute inset-0 w-full h-full object-contain opacity-50 pointer-events-none" />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300 pointer-events-none">
                  <Map className="w-16 h-16 mb-3" />
                  <p className="text-sm font-medium">Upload a floor plan image to use as background</p>
                  <p className="text-xs mt-1">PNG, JPG, WebP, SVG — up to 5MB</p>
                </div>
              )}

              {/* Dot grid overlay */}
              <div className="absolute inset-0 pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

              {/* Draggable table tokens */}
              {tables.map(table => (
                <div
                  key={table.id}
                  onMouseDown={(e) => handleMouseDown(e, table.id)}
                  title={`Table ${table.number}${table.label ? ' — ' + table.label : ''} · ${table.seats} seats`}
                  className={`absolute flex flex-col items-center justify-center cursor-grab active:cursor-grabbing border-2 transition-all hover:scale-105 ${shapeClass(table.shape ?? 'square')} ${draggingId === table.id ? 'border-indigo-500 bg-indigo-50 shadow-lg shadow-indigo-200 z-20 scale-105' : 'border-slate-300 bg-white shadow-md z-10'}`}
                  style={{
                    left: `${table.pos_x ?? 10}%`,
                    top: `${table.pos_y ?? 10}%`,
                    width: table.shape === 'rect' ? '8%' : '6%',
                    minWidth: table.shape === 'rect' ? 72 : 56,
                    minHeight: 56,
                    aspectRatio: table.shape === 'rect' ? '2/1' : '1',
                  }}
                >
                  <span className="text-xs font-bold text-slate-800 leading-none">T{table.number}</span>
                  {table.label && <span className="text-[8px] text-slate-400 mt-0.5 leading-none truncate max-w-full px-1">{table.label}</span>}
                  <span className="text-[9px] text-slate-400 leading-none mt-0.5">{table.seats}p</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex justify-between items-center p-6 border-b border-slate-200">
              <h3 className="text-xl font-bold text-slate-900">{editTable ? 'Edit Table' : 'Add Table'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Table Number</label>
                <input type="number" min="1" value={form.number} onChange={e => setForm(f => ({ ...f, number: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Seats</label>
                <input type="number" min="1" max="20" value={form.seats} onChange={e => setForm(f => ({ ...f, seats: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Shape</label>
                <div className="flex gap-2">
                  {[
                    { id: 'square', label: '⬛ Square' },
                    { id: 'round', label: '⚫ Round' },
                    { id: 'rect', label: '▬ Rectangle' },
                  ].map(s => (
                    <button key={s.id} type="button" onClick={() => setForm(f => ({ ...f, shape: s.id }))}
                      className={`flex-1 py-2 rounded-lg border text-xs font-medium transition-colors ${form.shape === s.id ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600 hover:border-indigo-300'}`}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Label <span className="text-slate-400 font-normal">(optional)</span></label>
                <input type="text" placeholder="e.g. Window Seat, VIP, Patio…" value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.number || !form.seats}
                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
