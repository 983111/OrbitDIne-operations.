import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Download, Calendar } from 'lucide-react';

const peakHoursData = [
  { time: '11am', orders: 12 },
  { time: '12pm', orders: 45 },
  { time: '1pm', orders: 58 },
  { time: '2pm', orders: 32 },
  { time: '3pm', orders: 15 },
  { time: '4pm', orders: 20 },
  { time: '5pm', orders: 48 },
  { time: '6pm', orders: 85 },
  { time: '7pm', orders: 110 },
  { time: '8pm', orders: 95 },
  { time: '9pm', orders: 60 },
  { time: '10pm', orders: 25 },
];

const customerInsights = [
  { category: 'New Customers', value: 35, color: '#4f46e5' },
  { category: 'Returning Customers', value: 65, color: '#10b981' },
];

export function Analytics() {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Analytics & Insights</h1>
          <p className="text-slate-500 mt-2">Deep dive into your restaurant's performance metrics.</p>
        </div>
        <div className="flex space-x-4">
          <button className="flex items-center px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
            <Calendar className="w-4 h-4 mr-2 text-slate-500" />
            Last 30 Days
          </button>
          <button className="flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-indigo-700 transition-colors">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-900">Peak Hours (Average Orders)</h3>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={peakHoursData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip 
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="orders" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-900">Customer Retention</h3>
          </div>
          <div className="flex flex-col justify-center h-80">
            <div className="flex items-center justify-center mb-8">
              <div className="relative w-48 h-48 rounded-full border-8 border-slate-100 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-8 border-emerald-500" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 0)', transform: 'rotate(126deg)' }}></div>
                <div className="absolute inset-0 rounded-full border-8 border-indigo-600" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 0)', transform: 'rotate(0deg)' }}></div>
                <div className="text-center">
                  <span className="block text-3xl font-bold text-slate-900">65%</span>
                  <span className="block text-sm text-slate-500">Returning</span>
                </div>
              </div>
            </div>
            <div className="flex justify-center space-x-8">
              {customerInsights.map((insight, i) => (
                <div key={i} className="flex items-center">
                  <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: insight.color }}></span>
                  <span className="text-sm font-medium text-slate-700">{insight.category} ({insight.value}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
