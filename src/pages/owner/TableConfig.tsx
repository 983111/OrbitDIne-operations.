import { useState, useEffect } from 'react';
import { Plus, Download, Trash2, Edit2, Loader2, X, Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../store/AuthContext';
import { Database } from '../../lib/database.types';

type TableItem = Database['public']['Tables']['tables']['Row'];

export function TableConfig() {
  const { profile } = useAuth();
  const [tables, setTables] = useState<TableItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTable, setEditTable] = useState<TableItem | null>(null);
  const [form, setForm] = useState({ number: '', seats: '4' });
  const [saving, setSaving] = useState(false);

  const restaurantId = profile?.restaurant_id;

  const fetchTables = async () => {
    if (!restaurantId) return;
    setLoading(true);
    const { data } = await supabase.from('tables').select('*').eq('restaurant_id', restaurantId).order('number');
    setTables(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchTables(); }, [restaurantId]);

  const openAdd = () => {
    setEditTable(null);
    const nextNum = tables.length > 0 ? Math.max(...tables.map(t => t.number)) + 1 : 1;
    setForm({ number: String(nextNum), seats: '4' });
    setShowModal(true);
  };

  const openEdit = (t: TableItem) => {
    setEditTable(t);
    setForm({ number: String(t.number), seats: String(t.seats) });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!restaurantId) return;
    setSaving(true);
    const num = parseInt(form.number);
    const seats = parseInt(form.seats);
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://orbitdine.app/table/${num}`;

    if (editTable) {
      await supabase.from('tables').update({ number: num, seats, qr_code_url: qrUrl }).eq('id', editTable.id);
    } else {
      await supabase.from('tables').insert({ restaurant_id: restaurantId, number: num, seats, qr_code_url: qrUrl });
    }
    setSaving(false);
    setShowModal(false);
    fetchTables();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this table?')) return;
    await supabase.from('tables').delete().eq('id', id);
    fetchTables();
  };

  return (
    <div className="space-y-8 h-full flex flex-col">
      <div className="flex justify-between items-end shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Table Configuration</h1>
          <p className="text-slate-500 mt-2">Manage tables and generate QR codes for ordering.</p>
        </div>
        <div className="flex space-x-4">
          <button onClick={openAdd} className="flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-indigo-700 transition-colors">
            <Plus className="w-4 h-4 mr-2" />Add Table
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex-1 flex flex-col overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center shrink-0 bg-slate-50">
          <h3 className="text-lg font-bold text-slate-900">Configured Tables ({tables.length})</h3>
          <div className="text-sm text-slate-500">Total Capacity: {tables.reduce((acc, t) => acc + t.seats, 0)} seats</div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-40"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {tables.map(table => (
                <div key={table.id} className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col items-center text-center hover:shadow-md transition-shadow">
                  <div className="w-24 h-24 bg-slate-100 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                    {table.qr_code_url && (
                      <img src={table.qr_code_url} alt={`QR Table ${table.number}`} className="w-full h-full object-cover mix-blend-multiply" />
                    )}
                  </div>
                  <h4 className="text-xl font-bold text-slate-900 mb-1">Table {table.number}</h4>
                  <p className="text-sm text-slate-500 mb-4">{table.seats} Seats</p>
                  <div className="flex space-x-2 w-full mt-auto">
                    <a href={table.qr_code_url ?? '#'} download={`table-${table.number}-qr.png`} target="_blank" rel="noreferrer"
                      className="flex-1 flex items-center justify-center py-2 px-3 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors">
                      <Download className="w-4 h-4 mr-1" />PNG
                    </a>
                    <button onClick={() => openEdit(table)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(table.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}

              <button onClick={openAdd}
                className="border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:border-indigo-500 hover:bg-indigo-50 transition-colors group min-h-[240px]">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-indigo-100 transition-colors">
                  <Plus className="w-6 h-6 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                </div>
                <h4 className="text-lg font-medium text-slate-600 group-hover:text-indigo-600 transition-colors">Add New Table</h4>
              </button>
            </div>
          )}
        </div>
      </div>

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
