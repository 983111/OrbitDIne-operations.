import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import {
  LayoutDashboard, LogOut, Settings, PieChart, Utensils,
  Users, MessageSquare, ChefHat, AlertTriangle, Bell, TableProperties,
} from 'lucide-react';
import { cn } from '../lib/utils';

const navItems = [
  { name: 'Dashboard',   path: '/owner',            icon: LayoutDashboard },
  { name: 'Analytics',   path: '/owner/analytics',  icon: PieChart },
  { name: 'Menu',        path: '/owner/menu',        icon: Utensils },
  { name: 'Tables',      path: '/owner/tables',      icon: TableProperties },
  { name: 'Managers',    path: '/owner/managers',    icon: Users },
  { name: 'Feedback',    path: '/owner/feedback',    icon: MessageSquare },
  { name: 'Settings',    path: '/owner/settings',    icon: Settings },
];

export function OwnerLayout() {
  const { logout, profile } = useAuth();
  const location = useLocation();

  const initials = (profile?.full_name ?? profile?.email ?? 'O')
    .split(' ').map(s => s[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="min-h-screen flex bg-[#07070F]">

      {/* ── Sidebar ── */}
      <aside className="w-60 flex-shrink-0 flex flex-col bg-[#0A0A14] border-r border-white/[0.05]">
        {/* Logo */}
        <div className="px-5 py-6 border-b border-white/[0.05]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500/20 border border-orange-500/25 flex items-center justify-center">
              <ChefHat className="w-4.5 h-4.5 text-orange-400" />
            </div>
            <div>
              <p className="text-[#F0F0FF] font-bold text-sm">OrbitDine</p>
              <p className="text-[#4A4A6A] text-[10px] font-medium">Owner Portal</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map(item => {
            const Icon = item.icon;
            const exact = item.path === '/owner';
            const active = exact ? location.pathname === item.path : location.pathname.startsWith(item.path);
            return (
              <Link key={item.name} to={item.path}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                  active
                    ? 'bg-orange-500/15 text-orange-400 border border-orange-500/20'
                    : 'text-[#6B6B9A] hover:bg-white/[0.04] hover:text-[#C0C0E0]',
                )}>
                <Icon className="w-4 h-4 shrink-0" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="px-3 pb-4 space-y-1 border-t border-white/[0.05] pt-4">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500/30 to-indigo-500/30 border border-white/10 flex items-center justify-center text-xs font-bold text-[#F0F0FF]">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[#E0E0F0] truncate">{profile?.full_name ?? 'Owner'}</p>
              <p className="text-[10px] text-[#4A4A6A] truncate">{profile?.email}</p>
            </div>
          </div>
          <button onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#6B6B9A] hover:bg-white/[0.04] hover:text-[#F87171] transition-all">
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-14 px-8 flex items-center justify-between border-b border-white/[0.05] bg-[#07070F]/80 backdrop-blur-xl shrink-0">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-[#6B6B9A]">
              {navItems.find(n => {
                const exact = n.path === '/owner';
                return exact ? location.pathname === n.path : location.pathname.startsWith(n.path);
              })?.name ?? 'Dashboard'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 text-[#6B6B9A] hover:text-[#F0F0FF] transition-colors">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-orange-500 rounded-full" />
            </button>
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold hover:bg-red-500/20 transition-colors">
              <AlertTriangle className="w-3.5 h-3.5" />
              Emergency Stop
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
