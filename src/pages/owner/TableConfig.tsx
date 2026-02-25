import { useState } from 'react';
import { Plus, Download, QrCode, Trash2, Edit2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface TableConfigItem {
  id: string;
  number: number;
  seats: number;
  qrCodeUrl: string;
}

const MOCK_TABLES: TableConfigItem[] = Array.from({ length: 12 }, (_, i) => ({
  id: `t-${i + 1}`,
  number: i + 1,
  seats: i % 3 === 0 ? 2 : i % 5 === 0 ? 6 : 4,
  qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://restaurant.app/table/${i + 1}`,
}));

export function TableConfig() {
  const [tables, setTables] = useState<TableConfigItem[]>(MOCK_TABLES);
  const [isAdding, setIsAdding] = useState(false);

  return (
    <div className="space-y-8 h-full flex flex-col">
      <div className="flex justify-between items-end shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Table Configuration</h1>
          <p className="text-slate-500 mt-2">Manage tables and generate QR codes for ordering.</p>
        </div>
        <div className="flex space-x-4">
          <button className="flex items-center px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
            <Download className="w-4 h-4 mr-2 text-slate-500" />
            Download All QR Codes (PDF)
          </button>
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Table
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex-1 flex flex-col overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center shrink-0 bg-slate-50">
          <h3 className="text-lg font-bold text-slate-900">Configured Tables ({tables.length})</h3>
          <div className="text-sm text-slate-500">
            Total Capacity: {tables.reduce((acc, t) => acc + t.seats, 0)} seats
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {tables.map((table) => (
              <div key={table.id} className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col items-center text-center hover:shadow-md transition-shadow">
                <div className="w-24 h-24 bg-slate-100 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                  <img src={table.qrCodeUrl} alt={`QR Code for Table ${table.number}`} className="w-full h-full object-cover mix-blend-multiply" />
                </div>
                <h4 className="text-xl font-bold text-slate-900 mb-1">Table {table.number}</h4>
                <p className="text-sm text-slate-500 mb-4">{table.seats} Seats</p>
                
                <div className="flex space-x-2 w-full mt-auto">
                  <button className="flex-1 flex items-center justify-center py-2 px-3 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors">
                    <Download className="w-4 h-4 mr-1" />
                    PNG
                  </button>
                  <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            
            <button 
              onClick={() => setIsAdding(true)}
              className="border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:border-indigo-500 hover:bg-indigo-50 transition-colors group min-h-[240px]"
            >
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-indigo-100 transition-colors">
                <Plus className="w-6 h-6 text-slate-400 group-hover:text-indigo-600 transition-colors" />
              </div>
              <h4 className="text-lg font-medium text-slate-600 group-hover:text-indigo-600 transition-colors">Add New Table</h4>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
