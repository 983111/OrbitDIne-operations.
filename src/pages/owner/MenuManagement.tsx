import { useState } from 'react';
import { Plus, Upload, Search, Edit2, Trash2, Image as ImageIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  status: 'available' | 'sold_out';
  image?: string;
}

const MOCK_MENU: MenuItem[] = [
  { id: '1', name: 'Truffle Burger', category: 'Mains', price: 18.50, status: 'available', image: 'https://picsum.photos/seed/burger/200/200' },
  { id: '2', name: 'Sweet Potato Fries', category: 'Sides', price: 6.00, status: 'available', image: 'https://picsum.photos/seed/fries/200/200' },
  { id: '3', name: 'Craft IPA', category: 'Drinks', price: 8.00, status: 'available', image: 'https://picsum.photos/seed/beer/200/200' },
  { id: '4', name: 'Caesar Salad', category: 'Starters', price: 12.00, status: 'sold_out', image: 'https://picsum.photos/seed/salad/200/200' },
];

export function MenuManagement() {
  const [items, setItems] = useState<MenuItem[]>(MOCK_MENU);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  const categories = ['All', 'Starters', 'Mains', 'Sides', 'Drinks', 'Desserts'];

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'All' || item.category === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8 h-full flex flex-col">
      <div className="flex justify-between items-end shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Menu Management</h1>
          <p className="text-slate-500 mt-2">Add, edit, and organize your restaurant's offerings.</p>
        </div>
        <div className="flex space-x-4">
          <button className="flex items-center px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
            <Upload className="w-4 h-4 mr-2 text-slate-500" />
            Bulk CSV Upload
          </button>
          <button className="flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-indigo-700 transition-colors">
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex-1 flex flex-col overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center shrink-0">
          <div className="flex space-x-2">
            {categories.map(c => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  category === c 
                    ? "bg-slate-900 text-white" 
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
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
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50 sticky top-0 z-10">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Item</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Category</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Price</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0 rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center">
                        {item.image ? (
                          <img className="h-10 w-10 object-cover" src={item.image} alt="" referrerPolicy="no-referrer" />
                        ) : (
                          <ImageIcon className="h-5 w-5 text-slate-400" />
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-slate-900">{item.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-500">{item.category}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-slate-900">${item.price.toFixed(2)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={cn(
                      "px-2 inline-flex text-xs leading-5 font-semibold rounded-full",
                      item.status === 'available' ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                    )}>
                      {item.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-indigo-600 hover:text-indigo-900 mr-4">
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button className="text-red-600 hover:text-red-900">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
