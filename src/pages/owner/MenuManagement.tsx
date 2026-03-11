import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../store/AuthContext';
import { supabase } from '../../lib/supabase';
import { PageHeader, EmptyState, Modal, Input, Select, Button, Badge } from '../../components/ui';
import { cn, formatCurrency } from '../../lib/utils';
import { Plus, Pencil, Trash2, Loader2, Utensils, Search, Tag } from 'lucide-react';
import { useToast } from '../../components/Toast';

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  is_available: boolean;
  image_url: string | null;
}

interface Category { name: string; count: number; }

const DEFAULT_FORM = { name: '', description: '', price: '', category: '', is_available: true };

export function MenuManagement() {
  const { profile } = useAuth();
  const toast = useToast();
  const [items, setItems]           = useState<MenuItem[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [activeCategory, setActive] = useState('All');
  const [showModal, setShowModal]   = useState(false);
  const [editItem, setEditItem]     = useState<MenuItem | null>(null);
  const [form, setForm]             = useState(DEFAULT_FORM);
  const [saving, setSaving]         = useState(false);
  const [deleting, setDeleting]     = useState<string | null>(null);
  const restaurantId = profile?.restaurant_id;

  const fetch = useCallback(async () => {
    if (!restaurantId) return;
    const { data } = await supabase.from('menu_items').select('*').eq('restaurant_id', restaurantId).order('category').order('name');
    setItems(data ?? []);
    setLoading(false);
  }, [restaurantId]);

  useEffect(() => { fetch(); }, [fetch]);

  const categories: Category[] = [
    { name: 'All', count: items.length },
    ...Array.from(new Set(items.map(i => i.category))).map(c => ({ name: c, count: items.filter(i => i.category === c).length })),
  ];

  const filtered = items.filter(i => {
    const matchesCat = activeCategory === 'All' || i.category === activeCategory;
    const matchesSearch = !search || i.name.toLowerCase().includes(search.toLowerCase()) || i.description?.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const openAdd = () => { setEditItem(null); setForm(DEFAULT_FORM); setShowModal(true); };
  const openEdit = (item: MenuItem) => {
    setEditItem(item);
    setForm({ name: item.name, description: item.description ?? '', price: String(item.price), category: item.category, is_available: item.is_available });
    setShowModal(true);
  };

  const save = async () => {
    if (!restaurantId || !form.name || !form.price || !form.category) {
      toast.error('Please fill in all required fields.');
      return;
    }
    setSaving(true);
    const payload = { name: form.name, description: form.description || null, price: parseFloat(form.price), category: form.category, is_available: form.is_available, restaurant_id: restaurantId };
    let error;
    if (editItem) {
      ({ error } = await supabase.from('menu_items').update(payload).eq('id', editItem.id));
    } else {
      ({ error } = await supabase.from('menu_items').insert(payload));
    }
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(editItem ? 'Item updated!' : 'Item added to menu!');
    setShowModal(false);
    fetch();
  };

  const deleteItem = async (id: string) => {
    setDeleting(id);
    const { error } = await supabase.from('menu_items').delete().eq('id', id);
    setDeleting(null);
    if (error) { toast.error(error.message); return; }
    toast.success('Item removed from menu.');
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const toggleAvailability = async (item: MenuItem) => {
    await supabase.from('menu_items').update({ is_available: !item.is_available }).eq('id', item.id);
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_available: !i.is_available } : i));
    toast.info(`${item.name} marked as ${item.is_available ? 'unavailable' : 'available'}`);
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <PageHeader title="Menu" subtitle="Manage your restaurant's items and categories"
        action={<Button onClick={openAdd}><Plus className="w-4 h-4" /> Add Item</Button>}
      />

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#4A4A6A]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search items…"
            className="w-full pl-9 pr-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-[#F0F0FF] placeholder-[#3A3A5C] focus:outline-none focus:border-orange-500/40 transition-all" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {categories.map(c => (
            <button key={c.name} onClick={() => setActive(c.name)}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border',
                activeCategory === c.name
                  ? 'bg-orange-500/20 border-orange-500/30 text-orange-400'
                  : 'bg-white/[0.03] border-white/[0.07] text-[#6B6B9A] hover:bg-white/[0.06] hover:text-[#F0F0FF]',
              )}>
              {c.name} <span className="opacity-60">({c.count})</span>
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><Loader2 className="w-7 h-7 animate-spin text-orange-500" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Utensils} title="No items found" description={search ? 'Try a different search term.' : 'Click "Add Item" to build your menu.'} action={!search && <Button onClick={openAdd}><Plus className="w-4 h-4" /> Add First Item</Button>} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(item => (
            <div key={item.id} className="glass rounded-2xl p-5 space-y-4 group">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-[#F0F0FF] truncate">{item.name}</h3>
                    <Badge color={item.is_available ? 'green' : 'gray'}>{item.is_available ? 'Available' : 'Off menu'}</Badge>
                  </div>
                  {item.description && <p className="text-xs text-[#6B6B9A] mt-1 line-clamp-2">{item.description}</p>}
                </div>
                <p className="text-base font-bold text-orange-400 shrink-0">{formatCurrency(item.price)}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <Tag className="w-3 h-3 text-[#4A4A6A]" />
                <span className="text-xs text-[#6B6B9A]">{item.category}</span>
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-white/[0.05]">
                <button onClick={() => toggleAvailability(item)}
                  className="flex-1 py-1.5 rounded-lg text-xs font-semibold bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.07] text-[#6B6B9A] hover:text-[#F0F0FF] transition-all">
                  {item.is_available ? 'Mark Off' : 'Mark On'}
                </button>
                <button onClick={() => openEdit(item)}
                  className="p-2 rounded-lg bg-white/[0.03] hover:bg-orange-500/10 border border-white/[0.07] hover:border-orange-500/20 text-[#6B6B9A] hover:text-orange-400 transition-all">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => deleteItem(item.id)} disabled={!!deleting}
                  className="p-2 rounded-lg bg-white/[0.03] hover:bg-red-500/10 border border-white/[0.07] hover:border-red-500/20 text-[#6B6B9A] hover:text-red-400 transition-all disabled:opacity-50">
                  {deleting === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editItem ? 'Edit Menu Item' : 'Add Menu Item'}>
        <div className="space-y-4">
          <Input label="Item Name *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Grilled Salmon" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Price ($) *" type="number" min="0" step="0.01" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} placeholder="0.00" />
            <Input label="Category *" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} placeholder="e.g. Mains" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#A0A0C0] uppercase tracking-wider">Description</label>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} placeholder="Short description…"
              className="w-full px-3.5 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-[#F0F0FF] placeholder-[#3A3A5C] focus:outline-none focus:border-orange-500/50 transition-all resize-none" />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <div onClick={() => setForm(p => ({ ...p, is_available: !p.is_available }))}
              className={cn('w-9 h-5 rounded-full border transition-all relative', form.is_available ? 'bg-orange-500 border-orange-500' : 'bg-white/[0.05] border-white/[0.10]')}>
              <span className={cn('absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all', form.is_available ? 'left-4' : 'left-0.5')} />
            </div>
            <span className="text-sm text-[#E0E0F0]">Available on menu</span>
          </label>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button className="flex-1" loading={saving} onClick={save}>{editItem ? 'Save Changes' : 'Add to Menu'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
