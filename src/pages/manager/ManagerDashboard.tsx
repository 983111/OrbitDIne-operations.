import { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { 
  Users, 
  Clock, 
  DollarSign, 
  WifiOff, 
  Printer, 
  FileText, 
  CheckCircle, 
  ChefHat,
  X
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

type TableStatus = 'available' | 'dining' | 'new_order' | 'bill_requested';

interface OrderItem {
  id: string;
  name: string;
  price: number;
  customizations?: string[];
  status: 'preparing' | 'ready' | 'served';
}

interface Table {
  id: string;
  number: number;
  status: TableStatus;
  seats: number;
  orderTime?: Date;
  items?: OrderItem[];
}

const MOCK_TABLES: Table[] = Array.from({ length: 16 }, (_, i) => {
  const statuses: TableStatus[] = ['available', 'dining', 'new_order', 'bill_requested'];
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  
  return {
    id: `t-${i + 1}`,
    number: i + 1,
    status: status,
    seats: 4,
    orderTime: status !== 'available' ? new Date(Date.now() - Math.random() * 3600000) : undefined,
    items: status !== 'available' ? [
      { id: '1', name: 'Truffle Burger', price: 18.50, customizations: ['No onions', 'Extra cheese'], status: 'preparing' },
      { id: '2', name: 'Sweet Potato Fries', price: 6.00, status: 'ready' },
      { id: '3', name: 'Craft IPA', price: 8.00, status: 'served' }
    ] : undefined
  };
});

export function ManagerDashboard() {
  const [tables, setTables] = useState<Table[]>(MOCK_TABLES);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const activeTables = tables.filter(t => t.status !== 'available').length;
  const totalOrders = tables.reduce((acc, t) => acc + (t.items?.length || 0), 0);
  const revenue = tables.reduce((acc, t) => acc + (t.items?.reduce((sum, item) => sum + item.price, 0) || 0), 0);

  const getStatusColor = (status: TableStatus) => {
    switch (status) {
      case 'available': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'dining': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'new_order': return 'bg-red-100 text-red-800 border-red-200 animate-pulse';
      case 'bill_requested': return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getStatusDot = (status: TableStatus) => {
    switch (status) {
      case 'available': return 'bg-emerald-500';
      case 'dining': return 'bg-amber-500';
      case 'new_order': return 'bg-red-500';
      case 'bill_requested': return 'bg-blue-500';
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex space-x-8">
          <div className="flex items-center">
            <div className="p-2 bg-indigo-50 rounded-lg mr-3">
              <Users className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Active Tables</p>
              <p className="text-xl font-bold text-slate-900">{activeTables} / {tables.length}</p>
            </div>
          </div>
          <div className="flex items-center">
            <div className="p-2 bg-emerald-50 rounded-lg mr-3">
              <ChefHat className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Active Orders</p>
              <p className="text-xl font-bold text-slate-900">{totalOrders}</p>
            </div>
          </div>
          <div className="flex items-center">
            <div className="p-2 bg-blue-50 rounded-lg mr-3">
              <DollarSign className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Current Revenue</p>
              <p className="text-xl font-bold text-slate-900">${revenue.toFixed(2)}</p>
            </div>
          </div>
        </div>
        
        {isOffline && (
          <div className="flex items-center text-amber-600 bg-amber-50 px-4 py-2 rounded-full text-sm font-medium">
            <WifiOff className="w-4 h-4 mr-2" />
            Offline Mode (Cached)
          </div>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Floor Map</h2>
            <div className="flex space-x-4 text-sm">
              <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-emerald-500 mr-2"></span> Available</div>
              <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-amber-500 mr-2"></span> Dining</div>
              <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-red-500 mr-2 animate-pulse"></span> New Order</div>
              <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-blue-500 mr-2"></span> Bill Requested</div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {tables.map(table => (
              <button
                key={table.id}
                onClick={() => setSelectedTable(table)}
                className={cn(
                  "relative p-6 rounded-2xl border-2 text-left transition-all hover:shadow-md",
                  getStatusColor(table.status),
                  selectedTable?.id === table.id ? "ring-4 ring-indigo-500 ring-opacity-50 border-transparent" : ""
                )}
              >
                <div className="flex justify-between items-start mb-4">
                  <span className="text-2xl font-bold">T{table.number}</span>
                  <span className={cn("w-3 h-3 rounded-full", getStatusDot(table.status))}></span>
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm font-medium opacity-80 flex items-center">
                    <Users className="w-4 h-4 mr-1" /> {table.seats} Seats
                  </div>
                  {table.orderTime && (
                    <div className="text-sm font-medium opacity-80 flex items-center">
                      <Clock className="w-4 h-4 mr-1" /> {formatDistanceToNow(table.orderTime)} ago
                    </div>
                  )}
                  {table.items && (
                    <div className="text-sm font-bold mt-2">
                      ${table.items.reduce((s, i) => s + i.price, 0).toFixed(2)}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {selectedTable && (
          <div className="w-96 bg-white border-l border-slate-200 flex flex-col shrink-0 shadow-xl z-20">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Table {selectedTable.number}</h3>
                <p className="text-sm text-slate-500 capitalize flex items-center mt-1">
                  <span className={cn("w-2 h-2 rounded-full mr-2", getStatusDot(selectedTable.status))}></span>
                  {selectedTable.status.replace('_', ' ')}
                </p>
              </div>
              <button 
                onClick={() => setSelectedTable(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {selectedTable.status === 'available' ? (
                <div className="text-center text-slate-500 mt-10">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>Table is currently available.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Order Items</h4>
                    <div className="space-y-4">
                      {selectedTable.items?.map(item => (
                        <div key={item.id} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-medium text-slate-900">{item.name}</span>
                            <span className="font-medium text-slate-900">${item.price.toFixed(2)}</span>
                          </div>
                          {item.customizations && (
                            <ul className="text-sm text-slate-500 mb-3 list-disc list-inside">
                              {item.customizations.map((c, i) => <li key={i}>{c}</li>)}
                            </ul>
                          )}
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200">
                            <span className={cn(
                              "text-xs font-bold uppercase px-2 py-1 rounded-md",
                              item.status === 'preparing' ? "bg-amber-100 text-amber-800" :
                              item.status === 'ready' ? "bg-emerald-100 text-emerald-800" :
                              "bg-slate-200 text-slate-600"
                            )}>
                              {item.status}
                            </span>
                            {item.status !== 'served' && (
                              <button className="text-xs font-medium text-indigo-600 hover:text-indigo-800">
                                Mark {item.status === 'preparing' ? 'Ready' : 'Served'}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-4">
                    <div className="flex justify-between text-lg font-bold text-slate-900">
                      <span>Total</span>
                      <span>${selectedTable.items?.reduce((s, i) => s + i.price, 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {selectedTable.status !== 'available' && (
              <div className="p-6 border-t border-slate-200 bg-slate-50 space-y-3">
                <button className="w-full flex items-center justify-center py-3 px-4 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-sm">
                  <Printer className="w-5 h-5 mr-2" />
                  Print Kitchen Slip
                </button>
                <button className="w-full flex items-center justify-center py-3 px-4 bg-white border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors shadow-sm">
                  <FileText className="w-5 h-5 mr-2" />
                  Generate Bill PDF
                </button>
                {selectedTable.status === 'bill_requested' && (
                  <button className="w-full flex items-center justify-center py-3 px-4 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors shadow-sm mt-4">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Mark as Paid & Clear
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
