import { useState, useEffect, useCallback } from 'react';
import { cn } from '../../lib/utils';
import {
  Users, Clock, DollarSign, Printer, FileText, CheckCircle2,
  ChefHat, X, Loader2, ArrowRight, AlertCircle, Hash,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../store/AuthContext';
import { useToast } from '../../components/Toast';

type TableStatus = 'available' | 'open' | 'bill_requested';

interface OrderItem {
  id: string;
  name: string;
  price: number;
  customizations?: string[];
  status: 'preparing' | 'ready' | 'served';
}

interface TableWithOrder {
  id: string;
  number: number;
  seats: number;
  status: TableStatus;
  orderTime?: Date;
  orderId?: string;
  items?: OrderItem[];
  total?: number;
}

const STATUS_CONFIG: Record<TableStatus, {
  bg: string; border: string; dot: string; label: string; badge: string;
}> = {
  available:      { bg: 'bg-[#0E1A14]', border: 'border-emerald-500/25', dot: 'bg-emerald-400', label: 'Available',       badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
  open:           { bg: 'bg-[#1A1508]', border: 'border-amber-500/25',   dot: 'bg-amber-400',   label: 'Dining',          badge: 'bg-amber-500/15 text-amber-400 border-amber-500/20' },
  bill_requested: { bg: 'bg-[#0E0E1A]', border: 'border-indigo-500/25',  dot: 'bg-indigo-400',  label: 'Bill Requested',  badge: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/20' },
};

const ITEM_STATUS_CONFIG = {
  preparing: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  ready:     'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  served:    'bg-white/5 text-[#6B6B9A] border-white/10',
};

export function ManagerDashboard() {
  const { profile } = useAuth();
  const toast = useToast();
  const [tables, setTables]             = useState<TableWithOrder[]>([]);
  const [selected, setSelected]         = useState<TableWithOrder | null>(null);
  const [loading, setLoading]           = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const restaurantId = profile?.restaurant_id;

  const fetchTables = useCallback(async () => {
    if (!restaurantId) return;
    const [{ data: dbTables }, { data: openOrders }] = await Promise.all([
      supabase.from('tables').select('*').eq('restaurant_id', restaurantId).order('number'),
      supabase.from('orders').select('*, order_items(*)').eq('restaurant_id', restaurantId).in('status', ['open', 'bill_requested']),
    ]);

    const combined: TableWithOrder[] = (dbTables ?? []).map(t => {
      const order = openOrders?.find(o => o.table_id === t.id);
      if (!order) return { id: t.id, number: t.number, seats: t.seats, status: 'available' };
      return {
        id: t.id, number: t.number, seats: t.seats,
        status: order.status as TableStatus,
        orderTime: new Date(order.created_at),
        orderId: order.id,
        items: order.order_items.map((oi: any) => ({
          id: oi.id, name: oi.name, price: Number(oi.price),
          customizations: oi.customizations ?? [], status: oi.status,
        })),
        total: Number(order.total),
      };
    });

    setTables(combined);
    setSelected(prev => prev ? (combined.find(t => t.id === prev.id) ?? null) : null);
    setLoading(false);
  }, [restaurantId]);

  useEffect(() => {
    fetchTables();
    const channel = supabase.channel('manager-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchTables)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, fetchTables)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchTables]);

  const updateItemStatus = async (itemId: string, next: 'ready' | 'served') => {
    setActionLoading(true);
    await supabase.from('order_items').update({ status: next }).eq('id', itemId);
    toast.success(`Item marked as ${next}`);
    await fetchTables();
    setActionLoading(false);
  };

  const markPaid = async (t: TableWithOrder) => {
    if (!t.orderId) return;
    setActionLoading(true);
    await supabase.from('orders').update({ status: 'paid' }).eq('id', t.orderId);
    toast.success(`Table ${t.number} cleared — payment received`);
    setSelected(null);
    await fetchTables();
    setActionLoading(false);
  };

  const printKitchen = (t: TableWithOrder) => {
    const win = window.open('', '_blank', 'width=420,height=640');
    if (!win) return;
    const rows = (t.items ?? []).map(i => `<tr><td>${i.name}</td><td>${(i.customizations ?? []).join(', ')}</td><td style="font-weight:bold;text-transform:uppercase;">${i.status}</td></tr>`).join('');
    win.document.write(`<!DOCTYPE html><html><head><title>Kitchen — T${t.number}</title>
      <style>body{font-family:monospace;padding:20px;}table{width:100%;border-collapse:collapse;}td{padding:6px 8px;border-bottom:1px solid #ddd;font-size:13px;}</style>
      </head><body><h2>Table ${t.number}</h2><p style="color:#999;font-size:11px;">Order #${t.orderId?.slice(0,8)} · ${t.orderTime ? new Date(t.orderTime).toLocaleTimeString() : ''}</p>
      <table>${rows}</table></body></html>`);
    win.document.close(); win.focus(); win.print();
    toast.info('Kitchen slip sent to printer');
  };

  const generateBill = (t: TableWithOrder) => {
    const win = window.open('', '_blank', 'width=520,height=720');
    if (!win) return;
    const rows = (t.items ?? []).map(i => `<tr><td>${i.name}</td><td style="text-align:right;">$${i.price.toFixed(2)}</td></tr>`).join('');
    win.document.write(`<!DOCTYPE html><html><head><title>Bill — Table ${t.number}</title>
      <style>body{font-family:Arial,sans-serif;padding:32px;max-width:380px;margin:auto;}h2{text-align:center;}table{width:100%;border-collapse:collapse;}td{padding:8px;border-bottom:1px solid #eee;font-size:14px;}.total td{font-weight:bold;font-size:16px;border-top:2px solid #333;}@media print{button{display:none;}}</style>
      </head><body><h2>OrbitDine</h2><p style="text-align:center;color:#999;font-size:11px;">Table ${t.number} · ${new Date().toLocaleDateString()}</p>
      <table><thead><tr><th style="text-align:left;padding:8px;">Item</th><th style="text-align:right;padding:8px;">Price</th></tr></thead>
      <tbody>${rows}</tbody><tfoot><tr class="total"><td>Total</td><td style="text-align:right;">$${(t.total ?? 0).toFixed(2)}</td></tr></tfoot></table>
      <p style="text-align:center;margin-top:28px;color:#999;font-size:11px;">Thank you for dining with us!</p>
      <button onclick="window.print()" style="display:block;width:100%;margin-top:16px;padding:12px;background:#f97316;color:white;border:none;border-radius:8px;cursor:pointer;font-size:14px;">Print / Save PDF</button>
      </body></html>`);
    win.document.close(); win.focus();
    toast.info('Bill PDF opened in new tab');
  };

  const activeTables = tables.filter(t => t.status !== 'available').length;
  const totalItems   = tables.reduce((s, t) => s + (t.items?.length ?? 0), 0);
  const revenue      = tables.reduce((s, t) => s + (t.total ?? 0), 0);

  return (
    <div className="flex flex-1 overflow-hidden">

      {/* ── Floor grid ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Stats bar */}
        <div className="px-6 py-3 border-b border-white/[0.05] bg-[#07070F] flex items-center gap-6 shrink-0">
          {[
            { icon: Users, label: 'Active Tables', value: `${activeTables} / ${tables.length}`, color: 'text-orange-400', bg: 'bg-orange-500/10' },
            { icon: ChefHat, label: 'Active Orders', value: String(totalItems), color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            { icon: DollarSign, label: 'Session Revenue', value: `$${revenue.toFixed(2)}`, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
          ].map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="flex items-center gap-3">
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', s.bg)}>
                  <Icon className={cn('w-4 h-4', s.color)} />
                </div>
                <div>
                  <p className="text-[10px] text-[#6B6B9A] font-medium uppercase tracking-wider">{s.label}</p>
                  <p className="text-sm font-bold text-[#F0F0FF]">{s.value}</p>
                </div>
              </div>
            );
          })}

          <div className="ml-auto flex items-center gap-4 text-xs text-[#6B6B9A]">
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <span key={k} className="flex items-center gap-1.5">
                <span className={cn('w-2 h-2 rounded-full', v.dot)} />
                {v.label}
              </span>
            ))}
          </div>
        </div>

        {/* Table grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-7 h-7 animate-spin text-orange-500" />
            </div>
          ) : tables.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.07] flex items-center justify-center">
                <Users className="w-6 h-6 text-[#3A3A5C]" />
              </div>
              <p className="text-[#6B6B9A] text-sm">No tables configured yet.</p>
              <p className="text-[#3A3A5C] text-xs">Ask your restaurant owner to add tables.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {tables.map(table => {
                const cfg = STATUS_CONFIG[table.status];
                const isSelected = selected?.id === table.id;
                return (
                  <button key={table.id} onClick={() => setSelected(table)}
                    className={cn(
                      'relative p-5 rounded-2xl border-2 text-left transition-all hover:scale-[1.02] active:scale-[0.98]',
                      cfg.bg, cfg.border,
                      isSelected && 'ring-2 ring-orange-500/50 border-orange-500/50 scale-[1.02]',
                    )}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-lg font-bold text-[#F0F0FF]">T{table.number}</span>
                      <span className={cn('w-2.5 h-2.5 rounded-full', cfg.dot)} />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs text-[#6B6B9A]">
                        <Users className="w-3 h-3" />{table.seats} seats
                      </div>
                      {table.orderTime && (
                        <div className="flex items-center gap-1.5 text-xs text-[#6B6B9A]">
                          <Clock className="w-3 h-3" />{formatDistanceToNow(table.orderTime)}
                        </div>
                      )}
                      {table.total != null && table.total > 0 && (
                        <p className="text-sm font-bold text-[#F0F0FF] mt-1">${table.total.toFixed(2)}</p>
                      )}
                    </div>
                    <div className={cn('mt-3 px-2 py-0.5 rounded-md inline-flex text-[10px] font-bold uppercase tracking-wider border', cfg.badge)}>
                      {cfg.label}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Order detail panel ── */}
      {selected && (
        <div className="w-96 bg-[#0A0A14] border-l border-white/[0.05] flex flex-col animate-slide-right shrink-0">
          {/* Panel header */}
          <div className="px-6 py-4 border-b border-white/[0.05] flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#F0F0FF]">Table {selected.number}</h3>
                <span className={cn('px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border', STATUS_CONFIG[selected.status].badge)}>
                  {STATUS_CONFIG[selected.status].label}
                </span>
              </div>
              {selected.orderTime && (
                <p className="text-xs text-[#6B6B9A] mt-0.5 flex items-center gap-1">
                  <Hash className="w-3 h-3" />{selected.orderId?.slice(0, 8)}
                  <span className="mx-1">·</span>
                  <Clock className="w-3 h-3" />{formatDistanceToNow(selected.orderTime)} ago
                </p>
              )}
            </div>
            <button onClick={() => setSelected(null)}
              className="w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[#6B6B9A] hover:text-[#F0F0FF] flex items-center justify-center transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Order items */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {selected.status === 'available' ? (
              <div className="flex flex-col items-center justify-center h-40 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                </div>
                <p className="text-sm text-[#6B6B9A]">This table is available.</p>
              </div>
            ) : (
              <>
                <p className="text-xs font-semibold text-[#6B6B9A] uppercase tracking-wider">Order Items</p>
                {selected.items?.map(item => (
                  <div key={item.id} className="glass rounded-xl p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-[#F0F0FF] leading-snug">{item.name}</p>
                      <p className="text-sm font-bold text-[#F0F0FF] shrink-0">${item.price.toFixed(2)}</p>
                    </div>
                    {item.customizations && item.customizations.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {item.customizations.map((c, i) => (
                          <span key={i} className="text-[10px] bg-white/[0.05] border border-white/[0.08] text-[#8888A8] px-2 py-0.5 rounded-md">{c}</span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-1 border-t border-white/[0.06]">
                      <span className={cn('text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border', ITEM_STATUS_CONFIG[item.status])}>
                        {item.status}
                      </span>
                      {item.status !== 'served' && (
                        <button
                          onClick={() => updateItemStatus(item.id, item.status === 'preparing' ? 'ready' : 'served')}
                          disabled={actionLoading}
                          className="flex items-center gap-1.5 text-xs font-semibold text-orange-400 hover:text-orange-300 transition-colors disabled:opacity-50">
                          Mark {item.status === 'preparing' ? 'Ready' : 'Served'}
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Actions */}
          {selected.status !== 'available' && (
            <div className="p-5 border-t border-white/[0.05] space-y-2.5 bg-[#07070F]/50">
              {/* Total */}
              <div className="flex items-center justify-between px-1 pb-3 border-b border-white/[0.06]">
                <span className="text-sm font-semibold text-[#6B6B9A]">Order total</span>
                <span className="text-lg font-bold text-[#F0F0FF]">${(selected.total ?? 0).toFixed(2)}</span>
              </div>

              <button onClick={() => printKitchen(selected)}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-[#E0E0F0] rounded-xl text-sm font-semibold transition-all">
                <Printer className="w-4 h-4" /> Print Kitchen Slip
              </button>
              <button onClick={() => generateBill(selected)}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-[#E0E0F0] rounded-xl text-sm font-semibold transition-all">
                <FileText className="w-4 h-4" /> Generate Bill PDF
              </button>
              {selected.status === 'bill_requested' && (
                <button onClick={() => markPaid(selected)} disabled={actionLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white rounded-xl text-sm font-bold transition-all">
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Mark Paid & Clear Table
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
