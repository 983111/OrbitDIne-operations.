import { useState, useEffect } from 'react';
import { Plus, Upload, Search, Edit2, Trash2, Image as ImageIcon, Loader2, X, Save } from 'lucide-react';
import { cn } from '../../lib/utils';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../store/AuthContext';
import { Database } from '../../lib/database.types';

type MenuItem = Database['public']['Tables']['menu_items']['Row'] & {
  menu_categories: { name: string } | null;
};
type Category = Database['public']['Tables']['menu_categories']['Row'];

export function MenuManagement() {
  const { profile } = useAuth();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<MenuItem | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [form, setForm] = useState({ name: '', price: '', category_id: '', image_url: '', status: 'available' });

  const restaurantId = profile?.restaurant_id;

  const fetchData = async () => {
    if (!restaurantId) return;
    setLoading(true);
    const [{ data: menuData }, { data: catData }] = await Promise.all([
      supabase.from('menu_items').select('*, menu_categories(name)').eq('restaurant_id', restaurantId).order('created_at'),
      supabase.from('menu_categories').select('*').eq('restaurant_id', restaurantId).order('display_order'),
    ]);
    setItems((menuData as MenuItem[]) ?? []);
    setCategories(catData ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [restaurantId]);

  const openAdd = () => {
    setEditItem(null);
    setForm({ name: '', price: '', category_id: categories[0]?.id ?? '', image_url: '', status: 'available' });
    setShowModal(true);
  };

  const openEdit = (item: MenuItem) => {
    setEditItem(item);
    setForm({
      name: item.name,
      price: String(item.price),
      category_id: item.category_id ?? '',
      image_url: item.image_url ?? '',
      status: item.status,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!restaurantId) return;
    setSaving(true);
    const payload = {
      name: form.name,
      price: parseFloat(form.price),
      category_id: form.category_id || null,
      image_url: form.image_url || null,
      status: form.status,
      restaurant_id: restaurantId,
    };

    if (editItem) {
      await supabase.from('menu_items').update(payload).eq('id', editItem.id);
    } else {
      await supabase.from('menu_items').insert(payload);
    }
    setSaving(false);
    setShowModal(false);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this item?')) return;
    await supabase.from('menu_items').delete().eq('id', id);
    fetchData();
  };

  const toggleStatus = async (item: MenuItem) => {
    const newStatus = item.status === 'available' ? 'sold_out' : 'available';
    await supabase.from('menu_items').update({ status: newStatus }).eq('id', item.id);
    fetchData();
  };

  const catNames = ['All', ...categories.map(c => c.name)];
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchesCat = activeCategory === 'All' || item.menu_categories?.name === activeCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-8 h-full flex flex-col">
      <div className="flex justify-between items-end shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Menu Management</h1>
          <p className="text-slate-500 mt-2">Add, edit, and organize your restaurant's offerings.</p>
        </div>
        <div className="flex space-x-4">
          <button onClick={openAdd} className="flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-indigo-700 transition-colors">
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex-1 flex flex-col overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center shrink-0 flex-wrap gap-4">
          <div className="flex space-x-2 flex-wrap gap-y-2">
            {catNames.map(c => (
              <button
                key={c}
                onClick={() => setActiveCategory(c)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  activeCategory === c ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="relative w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search items..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
          ) : (
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Item</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredItems.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center">
                          {item.image_url ? (
                            <img className="h-10 w-10 object-cover" src={item.image_url} alt="" referrerPolicy="no-referrer" />
                          ) : (
                            <ImageIcon className="h-5 w-5 text-slate-400" />
                          )}
                        </div>
                        <div className="ml-4 text-sm font-medium text-slate-900">{item.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{item.menu_categories?.name ?? '—'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">${Number(item.price).toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button onClick={() => toggleStatus(item)} className={cn(
                        "px-2 inline-flex text-xs leading-5 font-semibold rounded-full cursor-pointer",
                        item.status === 'available' ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                      )}>
                        {item.status.replace('_', ' ')}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => openEdit(item)} className="text-indigo-600 hover:text-indigo-900 mr-4"><Edit2 className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-900"><Trash2 className="h-4 w-4" /></button>
                    </td>
                  </tr>
                ))}
                {filteredItems.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-12 text-slate-400">No items found.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b border-slate-200">
              <h3 className="text-xl font-bold text-slate-900">{editItem ? 'Edit Item' : 'Add Menu Item'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500" placeholder="Item name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Price ($)</label>
                <input type="number" step="0.01" min="0" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500" placeholder="0.00" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                <select value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500">
                  <option value="">No category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Image URL</label>
                <input value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500" placeholder="https://..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500">
                  <option value="available">Available</option>
                  <option value="sold_out">Sold Out</option>
                </select>
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.name || !form.price}
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
