import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Star, 
  ArrowUpRight, 
  ArrowDownRight,
  Activity
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
} from 'recharts';

const revenueData = [
  { time: '10am', value: 400 },
  { time: '12pm', value: 1200 },
  { time: '2pm', value: 800 },
  { time: '4pm', value: 600 },
  { time: '6pm', value: 2400 },
  { time: '8pm', value: 3200 },
  { time: '10pm', value: 1800 },
];

const topItems = [
  { name: 'Truffle Burger', sales: 145, revenue: 2682.50 },
  { name: 'Sweet Potato Fries', sales: 120, revenue: 720.00 },
  { name: 'Craft IPA', sales: 95, revenue: 760.00 },
  { name: 'Caesar Salad', sales: 64, revenue: 768.00 },
];

export function OwnerDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard Overview</h1>
        <p className="text-slate-500 mt-2">Here's what's happening at your restaurant today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Today's Revenue</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-2">$4,285.00</h3>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl">
              <DollarSign className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <ArrowUpRight className="w-4 h-4 text-emerald-500 mr-1" />
            <span className="text-emerald-500 font-medium">+12.5%</span>
            <span className="text-slate-400 ml-2">vs yesterday</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Orders</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-2">156</h3>
            </div>
            <div className="p-3 bg-indigo-50 rounded-xl">
              <Activity className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <ArrowUpRight className="w-4 h-4 text-emerald-500 mr-1" />
            <span className="text-emerald-500 font-medium">+8.2%</span>
            <span className="text-slate-400 ml-2">vs yesterday</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Active Tables</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-2">12 / 24</h3>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-slate-500 font-medium">50% Capacity</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Average Rating</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-2">4.8</h3>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl">
              <Star className="w-6 h-6 text-amber-500" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <ArrowDownRight className="w-4 h-4 text-red-500 mr-1" />
            <span className="text-red-500 font-medium">-0.1</span>
            <span className="text-slate-400 ml-2">vs last week</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-900">Revenue Today</h3>
            <select className="text-sm border-slate-200 rounded-lg text-slate-600 bg-slate-50">
              <option>Today</option>
              <option>Yesterday</option>
              <option>Last 7 Days</option>
            </select>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(val) => `$${val}`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [`$${value}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-900">Top Selling Items</h3>
            <button className="text-sm text-indigo-600 font-medium hover:text-indigo-800">View All</button>
          </div>
          <div className="space-y-6">
            {topItems.map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 font-bold mr-4">
                    #{i + 1}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{item.name}</p>
                    <p className="text-sm text-slate-500">{item.sales} orders</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900">${item.revenue.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
