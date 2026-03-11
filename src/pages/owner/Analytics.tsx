import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../store/AuthContext';
import { supabase } from '../../lib/supabase';
import { StatCard, PageHeader, EmptyState } from '../../components/ui';
import { cn, formatCurrency } from '../../lib/utils';
import { BarChart3, DollarSign, ShoppingBag, TrendingUp, Loader2, ChefHat } from 'lucide-react';

type Period = '7d' | '30d' | '90d';

interface DayRevenue { date: string; revenue: number; orders: number; }
interface TopItem { name: string; count: number; revenue: number; }

export function Analytics() {
  const { profile } = useAuth();
  const [period, setPeriod] = useState<Period>('7d');
  const [loading, setLoading] = useState(true);
  const [dailyRevenue, setDailyRevenue] = useState<DayRevenue[]>([]);
  const [topItems, setTopItems] = useState<TopItem[]>([]);
  const [totals, setTotals] = useState({ revenue: 0, orders: 0, avg: 0, items: 0 });
  const restaurantId = profile?.restaurant_id;

  const load = useCallback(async () => {
    if (!restaurantId) return;
    setLoading(true);
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const since = new Date();
    since.setDate(since.getDate() - days);

    const { data: orders } = await supabase
      .from('orders')
      .select('id, total, created_at, status, order_items(name, price, quantity)')
      .eq('restaurant_id', restaurantId)
      .eq('status', 'paid')
      .gte('created_at', since.toISOString());

    if (!orders) { setLoading(false); return; }

    // Daily aggregation
    const dayMap: Record<string, { revenue: number; orders: number }> = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dayMap[key] = { revenue: 0, orders: 0 };
    }
    for (const o of orders) {
      const key = new Date(o.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (dayMap[key]) { dayMap[key].revenue += Number(o.total); dayMap[key].orders += 1; }
    }
    const daily = Object.entries(dayMap).map(([date, v]) => ({ date, ...v }));

    // Top items
    const itemMap: Record<string, { count: number; revenue: number }> = {};
    for (const o of orders) {
      for (const item of (o.order_items as any[]) ?? []) {
        const qty = item.quantity ?? 1;
        if (!itemMap[item.name]) itemMap[item.name] = { count: 0, revenue: 0 };
        itemMap[item.name].count += qty;
        itemMap[item.name].revenue += Number(item.price) * qty;
      }
    }
    const top = Object.entries(itemMap).map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.revenue - a.revenue).slice(0, 8);

    const totalRev = orders.reduce((s, o) => s + Number(o.total), 0);
    const totalItems = orders.reduce((s, o) => s + ((o.order_items as any[])?.reduce((ss: number, i: any) => ss + (i.quantity ?? 1), 0) ?? 0), 0);
    setTotals({ revenue: totalRev, orders: orders.length, avg: orders.length ? totalRev / orders.length : 0, items: totalItems });
    setDailyRevenue(daily);
    setTopItems(top);
    setLoading(false);
  }, [restaurantId, period]);

  useEffect(() => { load(); }, [load]);

  const maxRev = Math.max(...dailyRevenue.map(d => d.revenue), 1);

  return (
    <div className="space-y-8 animate-fade-up">
      <PageHeader title="Analytics" subtitle="Revenue and order performance"
        action={
          <div className="flex rounded-xl overflow-hidden border border-white/[0.08]">
            {(['7d', '30d', '90d'] as Period[]).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={cn('px-4 py-2 text-xs font-semibold transition-all',
                  period === p ? 'bg-orange-500 text-white' : 'bg-white/[0.03] text-[#6B6B9A] hover:bg-white/[0.07] hover:text-[#F0F0FF]',
                )}>
                {p === '7d' ? 'Week' : p === '30d' ? 'Month' : '3 Months'}
              </button>
            ))}
          </div>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-7 h-7 animate-spin text-orange-500" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard label="Revenue"      value={formatCurrency(totals.revenue)} icon={DollarSign} color="orange"  />
            <StatCard label="Paid Orders"  value={String(totals.orders)}          icon={ShoppingBag} color="emerald" />
            <StatCard label="Avg Order"    value={formatCurrency(totals.avg)}     icon={TrendingUp}  color="indigo"  />
            <StatCard label="Items Sold"   value={String(totals.items)}           icon={ChefHat}     color="amber"   />
          </div>

          {/* Revenue bar chart */}
          <div className="glass rounded-2xl p-6 space-y-5">
            <h2 className="text-sm font-bold text-[#F0F0FF]">Daily Revenue</h2>
            {totals.revenue === 0 ? (
              <EmptyState icon={BarChart3} title="No paid orders in this period" description="Revenue data will appear once orders are marked as paid." />
            ) : (
              <div className="space-y-3">
                <div className="flex items-end gap-1 h-40">
                  {dailyRevenue.map((d, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1 group">
                      <div className="relative w-full">
                        <div
                          className="w-full rounded-t-md bg-orange-500/70 hover:bg-orange-500 transition-all"
                          style={{ height: `${Math.max((d.revenue / maxRev) * 140, d.revenue > 0 ? 4 : 0)}px` }}
                        />
                        {d.revenue > 0 && (
                          <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[#1A1A2E] border border-white/10 text-[10px] text-[#F0F0FF] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                            {formatCurrency(d.revenue)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-1 overflow-hidden">
                  {dailyRevenue.map((d, i) => (
                    <div key={i} className="flex-1 text-center">
                      <p className="text-[9px] text-[#4A4A6A] truncate">{d.date.split(' ')[1]}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Top items + orders breakdown */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="glass rounded-2xl p-6 space-y-4">
              <h2 className="text-sm font-bold text-[#F0F0FF]">Top Menu Items</h2>
              {topItems.length === 0 ? (
                <EmptyState icon={ChefHat} title="No items data yet" />
              ) : (
                <div className="space-y-3">
                  {topItems.map((item, i) => (
                    <div key={i} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#E0E0F0] font-medium truncate pr-4">{item.name}</span>
                        <span className="text-[#6B6B9A] shrink-0">{item.count}× · {formatCurrency(item.revenue)}</span>
                      </div>
                      <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full"
                          style={{ width: `${(item.revenue / (topItems[0]?.revenue || 1)) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="glass rounded-2xl p-6 space-y-4">
              <h2 className="text-sm font-bold text-[#F0F0FF]">Revenue Breakdown</h2>
              {dailyRevenue.filter(d => d.revenue > 0).length === 0 ? (
                <EmptyState icon={BarChart3} title="No revenue data yet" />
              ) : (
                <div className="space-y-3">
                  {dailyRevenue.filter(d => d.orders > 0).slice(-7).map((d, i) => (
                    <div key={i} className="flex items-center justify-between px-3.5 py-2.5 bg-white/[0.03] border border-white/[0.05] rounded-xl">
                      <div>
                        <p className="text-sm font-semibold text-[#F0F0FF]">{d.date}</p>
                        <p className="text-[11px] text-[#6B6B9A]">{d.orders} orders</p>
                      </div>
                      <p className="text-sm font-bold text-orange-400">{formatCurrency(d.revenue)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
