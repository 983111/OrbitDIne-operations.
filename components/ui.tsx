import React from 'react';
import { cn } from '../src/lib/utils';
import { LucideIcon, X } from 'lucide-react';

/* ─── Stat Card ─────────────────────────────────────────────────────────── */
interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: LucideIcon;
  trend?: { value: string; up: boolean };
  color?: 'orange' | 'emerald' | 'indigo' | 'rose' | 'amber';
}
const COLOR: Record<NonNullable<StatCardProps['color']>, string> = {
  orange:  'bg-orange-500/10 border-orange-500/20 [&_.ico]:text-orange-400',
  emerald: 'bg-emerald-500/10 border-emerald-500/20 [&_.ico]:text-emerald-400',
  indigo:  'bg-indigo-500/10 border-indigo-500/20 [&_.ico]:text-indigo-400',
  rose:    'bg-rose-500/10 border-rose-500/20 [&_.ico]:text-rose-400',
  amber:   'bg-amber-500/10 border-amber-500/20 [&_.ico]:text-amber-400',
};

export function StatCard({ label, value, sub, icon: Icon, trend, color = 'orange' }: StatCardProps) {
  return (
    <div className="glass rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#6B6B9A]">{label}</p>
        <div className={cn('w-9 h-9 rounded-xl border flex items-center justify-center', COLOR[color])}>
          <Icon className="ico w-4 h-4" />
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold text-[#F0F0FF]">{value}</p>
        {sub && <p className="text-xs text-[#6B6B9A] mt-1">{sub}</p>}
        {trend && (
          <p className={cn('text-xs font-semibold mt-1', trend.up ? 'text-emerald-400' : 'text-rose-400')}>
            {trend.up ? '↑' : '↓'} {trend.value}
          </p>
        )}
      </div>
    </div>
  );
}

/* ─── Page Header ────────────────────────────────────────────────────────── */
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}
export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-8 gap-4">
      <div>
        <h1 className="text-2xl font-bold text-[#F0F0FF]">{title}</h1>
        {subtitle && <p className="text-sm text-[#6B6B9A] mt-1">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/* ─── Empty State ────────────────────────────────────────────────────────── */
interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}
export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
      <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
        <Icon className="w-6 h-6 text-[#3A3A5C]" />
      </div>
      <div>
        <p className="text-sm font-semibold text-[#6B6B9A]">{title}</p>
        {description && <p className="text-xs text-[#3A3A5C] mt-1 max-w-xs">{description}</p>}
      </div>
      {action}
    </div>
  );
}

/* ─── Modal ──────────────────────────────────────────────────────────────── */
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}
export function Modal({ open, onClose, title, children, maxWidth = 'max-w-lg' }: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={cn('relative w-full animate-scale-in', maxWidth)}>
        <div className="bg-[#0E0E1C] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07]">
            <h3 className="text-base font-bold text-[#F0F0FF]">{title}</h3>
            <button onClick={onClose} className="w-7 h-7 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center text-[#6B6B9A] hover:text-[#F0F0FF] transition-all">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="p-6">{children}</div>
        </div>
      </div>
    </div>
  );
}

/* ─── Input ──────────────────────────────────────────────────────────────── */
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}
export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <div className="space-y-1.5">
      {label && <label className="text-xs font-semibold text-[#A0A0C0] uppercase tracking-wider">{label}</label>}
      <input
        {...props}
        className={cn(
          'w-full px-3.5 py-2.5 bg-white/[0.04] border rounded-xl text-[#F0F0FF] placeholder-[#3A3A5C] text-sm',
          'focus:outline-none focus:border-orange-500/50 focus:bg-white/[0.06] transition-all',
          error ? 'border-red-500/40' : 'border-white/[0.08]',
          className,
        )}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

/* ─── Select ─────────────────────────────────────────────────────────────── */
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}
export function Select({ label, className, children, ...props }: SelectProps) {
  return (
    <div className="space-y-1.5">
      {label && <label className="text-xs font-semibold text-[#A0A0C0] uppercase tracking-wider">{label}</label>}
      <select
        {...props}
        className={cn(
          'w-full px-3.5 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-[#F0F0FF] text-sm',
          'focus:outline-none focus:border-orange-500/50 transition-all appearance-none',
          className,
        )}
      >
        {children}
      </select>
    </div>
  );
}

/* ─── Button ─────────────────────────────────────────────────────────────── */
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md';
  loading?: boolean;
}
export function Button({ variant = 'primary', size = 'md', loading, className, children, disabled, ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed';
  const sizes = { sm: 'px-3.5 py-2 text-xs', md: 'px-5 py-2.5 text-sm' };
  const variants = {
    primary:   'bg-orange-500 hover:bg-orange-600 text-white',
    secondary: 'bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.09] text-[#E0E0F0]',
    danger:    'bg-red-500/15 hover:bg-red-500/25 border border-red-500/25 text-red-400',
    ghost:     'text-[#6B6B9A] hover:text-[#F0F0FF] hover:bg-white/[0.05]',
  };
  return (
    <button {...props} disabled={disabled || loading} className={cn(base, sizes[size], variants[variant], className)}>
      {loading && <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />}
      {children}
    </button>
  );
}

/* ─── Badge ──────────────────────────────────────────────────────────────── */
type BadgeColor = 'green' | 'orange' | 'red' | 'blue' | 'gray' | 'purple';
const BADGE_COLOR: Record<BadgeColor, string> = {
  green:  'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  orange: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
  red:    'bg-red-500/15 text-red-400 border-red-500/20',
  blue:   'bg-indigo-500/15 text-indigo-400 border-indigo-500/20',
  gray:   'bg-white/5 text-[#6B6B9A] border-white/10',
  purple: 'bg-violet-500/15 text-violet-400 border-violet-500/20',
};
export function Badge({ color = 'gray', children }: { color?: BadgeColor; children: React.ReactNode }) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border', BADGE_COLOR[color])}>
      {children}
    </span>
  );
}
