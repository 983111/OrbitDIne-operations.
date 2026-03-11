import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../store/AuthContext';
import { supabase } from '../../lib/supabase';
import { PageHeader, EmptyState, Modal, Input, Button, Badge } from '@/components/ui';
import { cn } from '../../lib/utils';
import { Plus, Trash2, Loader2, Users, TableProperties, Pencil } from 'lucide-react';
import { useToast } from '@/components/Toast';

interface Table { id: string; number: number; seats: number; qr_code?: string | null; }

export function TableConfig() {
  const { profile } = useAuth();
  const toast = useToast();
  const [tables, setTables]       = useState<Table[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showAdd, setShowAdd]     = useState(false);
  const [editTable, setEditTable] = useState<Table | null>(null);
  const [form, setForm]           = useState({ number: '', seats: '4' });
  const [saving, setSaving]       = useState(false);
  const [deleting, setDeleting]   = useState<string | null>(null);
  const restaurantId = profile?.restaurant_id;

  const load = useCallback(async () => {
    if (!restaurantId) return;
    const { data } = await supabase.from('tables').select('*').eq('restaurant_id', restaurantId).order('number');
    setTables(data ?? []);
    setLoading(false);
  }, [restaurantId]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setEditTable(null); setForm({ number: '', seats: '4' }); setShowAdd(true); };
  const openEdit = (t: Table) => { setEditTable(t); setForm({ number: String(t.number), seats: String(t.seats) }); setShowAdd(true); };

  const save = async () => {
    if (!restaurantId || !form.number || !form.seats) { toast.error('Fill in all fields.'); return; }
    const num = parseInt(form.number);
    const seats = parseInt(form.seats);
    if (isNaN(num) || isNaN(seats) || seats < 1 || num < 1) { toast.error('Invalid table number or seats.'); return; }
    // check duplicate
    const dup = tables.find(t => t.number === num && t.id !== editTable?.id);
    if (dup) { toast.error(`Table ${num} already exists.`); return; }

    setSaving(true);
    let error;
    if (editTable) {
      ({ error } = await supabase.from('tables').update({ number: num, seats }).eq('id', editTable.id));
    } else {
      ({ error } = await supabase.from('tables').insert({ number: num, seats, restaurant_id: restaurantId }));
    }
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(editTable ? `Table ${num} updated.` : `Table ${num} added.`);
    setShowAdd(false);
    load();
  };

  const deleteTable = async (id: string, num: number) => {
    setDeleting(id);
    const { error } = await supabase.from('tables').delete().eq('id', id);
    setDeleting(null);
    if (error) { toast.error(error.message); return; }
    toast.success(`Table ${num} removed.`);
    setTables(prev => prev.filter(t => t.id !== id));
  };

  const bulkAdd = async () => {
    if (!restaurantId) return;
    const existing = tables.map(t => t.number);
    const toAdd = [];
    for (let i = 1; i <= 10; i++) {
      if (!existing.includes(i)) toAdd.push({ number: i, seats: 4, restaurant_id: restaurantId });
    }
    if (toAdd.length === 0) { toast.info('Tables 1–10 already exist.'); return; }
    setSaving(true);
    const { error } = await supabase.from('tables').insert(toAdd);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`Added ${toAdd.length} tables.`);
    load();
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <PageHeader title="Tables" subtitle="Configure your restaurant's seating layout"
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={bulkAdd} loading={saving} size="sm">Quick Add 1–10</Button>
            <Button onClick={openAdd}><Plus className="w-4 h-4" /> Add Table</Button>
          </div>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center h-48"><Loader2 className="w-7 h-7 animate-spin text-orange-500" /></div>
      ) : tables.length === 0 ? (
        <EmptyState icon={TableProperties} title="No tables yet" description="Add tables to start managing your floor."
          action={<Button onClick={openAdd}><Plus className="w-4 h-4" /> Add First Table</Button>}
        />
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total Tables', value: tables.length },
              { label: 'Total Seats',  value: tables.reduce((s, t) => s + t.seats, 0) },
              { label: 'Avg Seats',    value: (tables.reduce((s, t) => s + t.seats, 0) / tables.length).toFixed(1) },
            ].map(s => (
              <div key={s.label} className="glass rounded-xl p-4 text-center">
                <p className="text-xl font-bold text-[#F0F0FF]">{s.value}</p>
                <p className="text-xs text-[#6B6B9A] mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Table grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {tables.map(t => (
              <div key={t.id} className="glass rounded-2xl p-4 space-y-3 group">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-[#F0F0FF]">T{t.number}</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(t)}
                      className="p-1.5 rounded-lg hover:bg-orange-500/10 text-[#6B6B9A] hover:text-orange-400 transition-all">
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button onClick={() => deleteTable(t.id, t.number)} disabled={!!deleting}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-[#6B6B9A] hover:text-red-400 transition-all disabled:opacity-50">
                      {deleting === t.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[#6B6B9A]">
                  <Users className="w-3 h-3" /> {t.seats} seats
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title={editTable ? `Edit Table ${editTable.number}` : 'Add New Table'}>
        <div className="space-y-4">
          <Input label="Table Number *" type="number" min="1" value={form.number} onChange={e => setForm(p => ({ ...p, number: e.target.value }))} placeholder="e.g. 5" />
          <Input label="Seats *" type="number" min="1" max="20" value={form.seats} onChange={e => setForm(p => ({ ...p, seats: e.target.value }))} placeholder="4" />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button className="flex-1" loading={saving} onClick={save}>{editTable ? 'Save Changes' : 'Add Table'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
