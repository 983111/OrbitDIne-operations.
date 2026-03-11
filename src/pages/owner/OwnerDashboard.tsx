import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../store/AuthContext';
import { supabase } from '../../lib/supabase';
import { StatCard, PageHeader, EmptyState } from '@/components/ui';
import { cn, formatCurrency } from '../../lib/utils';
import {
  DollarSign, Users, Utensils, TrendingUp, Clock,
  CheckCircle2, AlertTriangle, Loader2, ChefHat,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface DashboardData {
  totalRevenue: number;
  todayRevenue: number;
  activeTables: number;
  totalTables: number;
  totalOrders: number;
  todayOrders: number;
  avgOrderValue: number;
  recentOrders: Array<{
    id: string;
    tableNumber: number;
    total: number;
    status: string;
    createdAt: string;
    itemCount: number;
  }>;
  tableStatuses: Array<{ number: number; status: string; total?: number }>;
}

const ORDER_STATUS: Record<string, { label: string; color: string }> = {
  open:            { label: 'Dining',         color: 'text-amber-400' },
  bill_requested:  { label: 'Bill Requested', color: 'text-indigo-400' },
  paid:            { label: 'Paid',           color: 'text-emerald-400' },
  cancelled:       { label: 'Cancelled',      color: 'text-red-400' },
};

export function OwnerDashboard() {
  const { profile } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const restaurantId = profile?.restaurant_id;

  const fetchDashboard = useCallback(async () => {
    if (!restaurantId) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      { data: orders },
      { data: tables },
      { data: openOrders },
    ] = await Promise.all([
      supabase.from('orders').select('id, total, status, created_at, table_id').eq('restaurant_id', restaurantId),
      supabase.from('tables').select('id, number, seats').eq('restaurant_id', restaurantId).order('number'),
      supabase.from('orders').select('id, total, status, created_at, table_id, order_items(id)').eq('restaurant_id', restaurantId).in('status', ['open', 'bill_requested']).order('created_at', { ascending: false }),
    ]);

    const allOrders = orders ?? [];
    const todayOrders = allOrders.filter(o => new Date(o.created_at) >= today);
    const paidOrders = allOrders.filter(o => o.status === 'paid');

    // Build table status map
    const openMap: Record<string, { status: string; total: number }> = {};
    for (const o of openOrders ?? []) {
      openMap[o.table_id] = { status: o.status, total: Number(o.total) };
    }

    const tableStatuses = (tables ?? []).map(t => ({
      number: t.number,
      status: openMap[t.id]?.status ?? 'available',
      total: openMap[t.id]?.total,
    }));

    // Recent orders with table numbers
    const tableNumMap: Record<string, number> = {};
    for (const t of tables ?? []) tableNumMap[t.id] = t.number;

    const recentOrders = (openOrders ?? []).slice(0, 8).map(o => ({
      id: o.id,
      tableNumber: tableNumMap[o.table_id] ?? 0,
      total: Number(o.total),
      status: o.status,
      createdAt: o.created_at,
      itemCount: o.order_items?.length ?? 0,
    }));

    setData({
      totalRevenue: paidOrders.reduce((s, o) => s + Number(o.total), 0),
      todayRevenue: todayOrders.filter(o => o.status === 'paid').reduce((s, o) => s + Number(o.total), 0),
      activeTables: Object.keys(openMap).length,
      totalTables: (tables ?? []).length,
      totalOrders: allOrders.length,
      todayOrders: todayOrders.length,
      avgOrderValue: paidOrders.length ? paidOrders.reduce((s, o) => s + Number(o.total), 0) / paidOrders.length : 0,
      recentOrders,
      tableStatuses,
    });
    setLoading(false);
  }, [restaurantId]);

  useEffect(() => {
    fetchDashboard();
    const ch = supabase.channel('owner-dash').on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchDashboard).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchDashboard]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-7 h-7 animate-spin text-orange-500" />
    </div>
  );

  if (!data) return <EmptyState icon={ChefHat} title="No data yet" description="Start adding tables and taking orders." />;

  const tableStatusColor: Record<string, string> = {
    available:     'bg-emerald-500/20 border-emerald-500/30 text-emerald-400',
    open:          'bg-amber-500/20 border-amber-500/30 text-amber-400',
    bill_requested:'bg-indigo-500/20 border-indigo-500/30 text-indigo-400',
  };

  return (
    <div className="space-y-8 animate-fade-up">
      <PageHeader
        title={`Good ${new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, ${profile?.full_name?.split(' ')[0] ?? 'Chef'} 👋`}
        subtitle="Here's your restaurant's live overview"
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Today's Revenue"  value={formatCurrency(data.todayRevenue)}  sub={`All time: ${formatCurrency(data.totalRevenue)}`} icon={DollarSign}  color="orange"  trend={{ value: `${data.todayOrders} orders today`, up: true }} />
        <StatCard label="Active Tables"    value={`${data.activeTables} / ${data.totalTables}`} sub="Tables currently in use"  icon={Users}       color="emerald" />
        <StatCard label="Today's Orders"   value={String(data.todayOrders)}           sub={`${data.totalOrders} total`}        icon={Utensils}    color="indigo"  />
        <StatCard label="Avg Order Value"  value={formatCurrency(data.avgOrderValue)} sub="Across all paid orders"             icon={TrendingUp}  color="amber"   />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Live floor grid */}
        <div className="xl:col-span-3 glass rounded-2xl p-6 space-y-5">
          <h2 className="text-sm font-bold text-[#F0F0FF]">Live Floor</h2>
          {data.tableStatuses.length === 0 ? (
            <EmptyState icon={Users} title="No tables configured" description="Go to Tables in Settings to add them." />
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5">
              {data.tableStatuses.map(t => (
                <div key={t.number} className={cn(
                  'rounded-xl border p-3 text-center transition-all',
                  tableStatusColor[t.status] ?? tableStatusColor.available,
                )}>
                  <p className="text-sm font-bold">T{t.number}</p>
                  {t.total != null && t.total > 0 && (
                    <p className="text-[10px] mt-0.5 font-semibold opacity-80">${t.total.toFixed(0)}</p>
                  )}
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-4 text-[11px] text-[#6B6B9A] pt-1 border-t border-white/[0.05]">
            {[['available', 'bg-emerald-400', 'Available'], ['open', 'bg-amber-400', 'Dining'], ['bill_requested', 'bg-indigo-400', 'Bill Requested']].map(([, dot, label]) => (
              <span key={label} className="flex items-center gap-1.5">
                <span className={cn('w-2 h-2 rounded-full', dot)} /> {label}
              </span>
            ))}
          </div>
        </div>

        {/* Recent orders */}
        <div className="xl:col-span-2 glass rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-bold text-[#F0F0FF]">Active Orders</h2>
          {data.recentOrders.length === 0 ? (
            <EmptyState icon={CheckCircle2} title="All clear!" description="No active orders right now." />
          ) : (
            <div className="space-y-2">
              {data.recentOrders.map(o => {
                const sc = ORDER_STATUS[o.status] ?? ORDER_STATUS.open;
                return (
                  <div key={o.id} className="flex items-center justify-between px-3.5 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl">
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold text-[#F0F0FF]">Table {o.tableNumber}</p>
                      <p className="text-[11px] text-[#6B6B9A] flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(o.createdAt))} · {o.itemCount} items
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-[#F0F0FF]">{formatCurrency(o.total)}</p>
                      <p className={cn('text-[10px] font-bold uppercase tracking-wider', sc.color)}>{sc.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick health check */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-bold text-[#F0F0FF]">Quick Health</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Tables Set Up',   value: data.totalTables > 0,     msg: data.totalTables > 0 ? `${data.totalTables} tables` : 'No tables yet' },
            { label: 'Revenue Today',   value: data.todayRevenue > 0,    msg: data.todayRevenue > 0 ? formatCurrency(data.todayRevenue) : 'No revenue yet' },
            { label: 'Active Orders',   value: data.activeTables > 0,    msg: data.activeTables > 0 ? `${data.activeTables} tables busy` : 'Restaurant idle' },
            { label: 'Avg Order',       value: data.avgOrderValue > 0,   msg: data.avgOrderValue > 0 ? formatCurrency(data.avgOrderValue) : 'No data yet' },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-2.5">
              <div className={cn('w-7 h-7 rounded-lg border flex items-center justify-center shrink-0',
                item.value ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-amber-500/10 border-amber-500/20',
              )}>
                {item.value
                  ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  : <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
              </div>
              <div>
                <p className="text-[11px] font-semibold text-[#6B6B9A]">{item.label}</p>
                <p className="text-xs font-bold text-[#F0F0FF]">{item.msg}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
