import { useState, useEffect } from 'react';
import {
  TrendingUp,
  Users,
  DollarSign,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Loader2,
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
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../store/AuthContext';
import { startOfDay, endOfDay, subDays, format } from 'date-fns';

interface HourlyRevenue {
  time: string;
  value: number;
}

interface TopItem {
  name: string;
  sales: number;
  revenue: number;
}

interface DashboardStats {
  todayRevenue: number;
  yesterdayRevenue: number;
  todayOrders: number;
  yesterdayOrders: number;
  activeTables: number;
  totalTables: number;
  avgRating: number | null;
  lastWeekRating: number | null;
  hourlyRevenue: HourlyRevenue[];
  topItems: TopItem[];
}

export function OwnerDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const restaurantId = profile?.restaurant_id;

  useEffect(() => {
    if (!restaurantId) return;

    const fetchStats = async () => {
      setLoading(true);

      const now = new Date();
      const todayStart = startOfDay(now).toISOString();
      const todayEnd = endOfDay(now).toISOString();
      const yesterdayStart = startOfDay(subDays(now, 1)).toISOString();
      const yesterdayEnd = endOfDay(subDays(now, 1)).toISOString();
      const lastWeekStart = startOfDay(subDays(now, 7)).toISOString();
      const lastWeekEnd = endOfDay(subDays(now, 1)).toISOString();

      const [
        { data: todayOrders },
        { data: yesterdayOrders },
        { data: activeTables },
        { data: allTables },
        { data: todayFeedback },
        { data: lastWeekFeedback },
        { data: topItemsData },
      ] = await Promise.all([
        supabase
          .from('orders')
          .select('total, created_at')
          .eq('restaurant_id', restaurantId)
          .gte('created_at', todayStart)
          .lte('created_at', todayEnd),
        supabase
          .from('orders')
          .select('total')
          .eq('restaurant_id', restaurantId)
          .gte('created_at', yesterdayStart)
          .lte('created_at', yesterdayEnd),
        supabase
          .from('orders')
          .select('table_id')
          .eq('restaurant_id', restaurantId)
          .in('status', ['open', 'bill_requested']),
        supabase
          .from('tables')
          .select('id')
          .eq('restaurant_id', restaurantId),
        supabase
          .from('feedback')
          .select('rating')
          .eq('restaurant_id', restaurantId)
          .gte('created_at', todayStart),
        supabase
          .from('feedback')
          .select('rating')
          .eq('restaurant_id', restaurantId)
          .gte('created_at', lastWeekStart)
          .lte('created_at', lastWeekEnd),
        supabase
          .from('order_items')
          .select('name, price')
          .in(
            'order_id',
            (
              await supabase
                .from('orders')
                .select('id')
                .eq('restaurant_id', restaurantId)
                .gte('created_at', todayStart)
            ).data?.map((o) => o.id) ?? []
          ),
      ]);

      // Today revenue & hourly breakdown
      const todayRevenue = (todayOrders ?? []).reduce(
        (sum, o) => sum + Number(o.total),
        0
      );
      const yesterdayRevenue = (yesterdayOrders ?? []).reduce(
        (sum, o) => sum + Number(o.total),
        0
      );

      // Build hourly buckets (10am–10pm)
      const hourlyMap: Record<string, number> = {};
      for (let h = 10; h <= 22; h++) {
        hourlyMap[`${h > 12 ? h - 12 : h}${h >= 12 ? 'pm' : 'am'}`] = 0;
      }
      (todayOrders ?? []).forEach((o) => {
        const h = new Date(o.created_at).getHours();
        const label = `${h > 12 ? h - 12 : h}${h >= 12 ? 'pm' : 'am'}`;
        if (label in hourlyMap) hourlyMap[label] += Number(o.total);
      });
      const hourlyRevenue: HourlyRevenue[] = Object.entries(hourlyMap).map(
        ([time, value]) => ({ time, value })
      );

      // Active unique tables
      const uniqueActive = new Set((activeTables ?? []).map((o) => o.table_id))
        .size;

      // Ratings
      const avgRating =
        (todayFeedback ?? []).length > 0
          ? (todayFeedback ?? []).reduce((s, f) => s + f.rating, 0) /
            (todayFeedback ?? []).length
          : null;
      const lastWeekRating =
        (lastWeekFeedback ?? []).length > 0
          ? (lastWeekFeedback ?? []).reduce((s, f) => s + f.rating, 0) /
            (lastWeekFeedback ?? []).length
          : null;

      // Top items
      const itemMap: Record<string, { sales: number; revenue: number }> = {};
      (topItemsData ?? []).forEach((item) => {
        if (!itemMap[item.name])
          itemMap[item.name] = { sales: 0, revenue: 0 };
        itemMap[item.name].sales += 1;
        itemMap[item.name].revenue += Number(item.price);
      });
      const topItems: TopItem[] = Object.entries(itemMap)
        .map(([name, v]) => ({ name, ...v }))
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 4);

      setStats({
        todayRevenue,
        yesterdayRevenue,
        todayOrders: (todayOrders ?? []).length,
        yesterdayOrders: (yesterdayOrders ?? []).length,
        activeTables: uniqueActive,
        totalTables: (allTables ?? []).length,
        avgRating,
        lastWeekRating,
        hourlyRevenue,
        topItems,
      });
      setLoading(false);
    };

    fetchStats();
  }, [restaurantId]);

  const pctChange = (curr: number, prev: number) => {
    if (prev === 0) return null;
    return ((curr - prev) / prev) * 100;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  const revenueChange = stats ? pctChange(stats.todayRevenue, stats.yesterdayRevenue) : null;
  const ordersChange = stats ? pctChange(stats.todayOrders, stats.yesterdayOrders) : null;
  const ratingDiff =
    stats?.avgRating != null && stats?.lastWeekRating != null
      ? stats.avgRating - stats.lastWeekRating
      : null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          Dashboard Overview
        </h1>
        <p className="text-slate-500 mt-2">
          Here's what's happening at your restaurant today.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Revenue */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Today's Revenue</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-2">
                ${(stats?.todayRevenue ?? 0).toFixed(2)}
              </h3>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl">
              <DollarSign className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            {revenueChange !== null ? (
              revenueChange >= 0 ? (
                <>
                  <ArrowUpRight className="w-4 h-4 text-emerald-500 mr-1" />
                  <span className="text-emerald-500 font-medium">
                    +{revenueChange.toFixed(1)}%
                  </span>
                </>
              ) : (
                <>
                  <ArrowDownRight className="w-4 h-4 text-red-500 mr-1" />
                  <span className="text-red-500 font-medium">
                    {revenueChange.toFixed(1)}%
                  </span>
                </>
              )
            ) : (
              <span className="text-slate-400">No data yet</span>
            )}
            {revenueChange !== null && (
              <span className="text-slate-400 ml-2">vs yesterday</span>
            )}
          </div>
        </div>

        {/* Orders */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Orders</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-2">
                {stats?.todayOrders ?? 0}
              </h3>
            </div>
            <div className="p-3 bg-indigo-50 rounded-xl">
              <Activity className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            {ordersChange !== null ? (
              ordersChange >= 0 ? (
                <>
                  <ArrowUpRight className="w-4 h-4 text-emerald-500 mr-1" />
                  <span className="text-emerald-500 font-medium">
                    +{ordersChange.toFixed(1)}%
                  </span>
                </>
              ) : (
                <>
                  <ArrowDownRight className="w-4 h-4 text-red-500 mr-1" />
                  <span className="text-red-500 font-medium">
                    {ordersChange.toFixed(1)}%
                  </span>
                </>
              )
            ) : (
              <span className="text-slate-400">No data yet</span>
            )}
            {ordersChange !== null && (
              <span className="text-slate-400 ml-2">vs yesterday</span>
            )}
          </div>
        </div>

        {/* Active Tables */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Active Tables</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-2">
                {stats?.activeTables ?? 0} / {stats?.totalTables ?? 0}
              </h3>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-slate-500 font-medium">
              {stats && stats.totalTables > 0
                ? `${Math.round((stats.activeTables / stats.totalTables) * 100)}% Capacity`
                : 'No tables configured'}
            </span>
          </div>
        </div>

        {/* Rating */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Average Rating</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-2">
                {stats?.avgRating != null
                  ? stats.avgRating.toFixed(1)
                  : '—'}
              </h3>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl">
              <Star className="w-6 h-6 text-amber-500" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            {ratingDiff !== null ? (
              ratingDiff >= 0 ? (
                <>
                  <ArrowUpRight className="w-4 h-4 text-emerald-500 mr-1" />
                  <span className="text-emerald-500 font-medium">
                    +{ratingDiff.toFixed(1)}
                  </span>
                  <span className="text-slate-400 ml-2">vs last week</span>
                </>
              ) : (
                <>
                  <ArrowDownRight className="w-4 h-4 text-red-500 mr-1" />
                  <span className="text-red-500 font-medium">
                    {ratingDiff.toFixed(1)}
                  </span>
                  <span className="text-slate-400 ml-2">vs last week</span>
                </>
              )
            ) : (
              <span className="text-slate-400">No ratings today</span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-900">Revenue Today</h3>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={stats?.hourlyRevenue ?? []}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e2e8f0"
                />
                <XAxis
                  dataKey="time"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                  formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#4f46e5"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorValue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Items */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-900">Top Selling Items</h3>
          </div>
          {(stats?.topItems ?? []).length === 0 ? (
            <div className="text-center text-slate-400 mt-10">
              <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No orders yet today</p>
            </div>
          ) : (
            <div className="space-y-6">
              {(stats?.topItems ?? []).map((item, i) => (
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
                    <p className="font-bold text-slate-900">
                      ${item.revenue.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
