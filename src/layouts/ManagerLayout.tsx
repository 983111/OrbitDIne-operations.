import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { LayoutDashboard, LogOut, Bell, ChefHat, Wifi, WifiOff } from 'lucide-react';
import { cn } from '../lib/utils';
import { useState, useEffect } from 'react';

export function ManagerLayout() {
  const { logout, profile } = useAuth();
  const location = useLocation();
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const on  = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  const initials = (profile?.full_name ?? profile?.email ?? 'M')
    .split(' ').map(s => s[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="min-h-screen flex flex-col bg-[#07070F]">

      {/* ── Top navbar ── */}
      <header className="h-14 px-6 flex items-center justify-between bg-[#0A0A14] border-b border-white/[0.05] shrink-0 z-20">
        <div className="flex items-center gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 border border-orange-500/25 flex items-center justify-center">
              <ChefHat className="w-4 h-4 text-orange-400" />
            </div>
            <span className="text-sm font-bold text-[#F0F0FF]">OrbitDine</span>
          </div>

          {/* Nav */}
          <nav className="flex gap-1">
            {[{ name: 'Floor Map', path: '/manager', icon: LayoutDashboard }].map(item => {
              const Icon = item.icon;
              const active = location.pathname === item.path;
              return (
                <Link key={item.name} to={item.path}
                  className={cn(
                    'flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all',
                    active
                      ? 'bg-orange-500/15 text-orange-400 border border-orange-500/20'
                      : 'text-[#6B6B9A] hover:bg-white/[0.05] hover:text-[#C0C0E0]',
                  )}>
                  <Icon className="w-3.5 h-3.5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {/* Connection indicator */}
          <div className={cn(
            'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border',
            online
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-amber-500/10 border-amber-500/20 text-amber-400',
          )}>
            {online ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {online ? 'Live' : 'Offline'}
          </div>

          <button className="relative p-2 text-[#6B6B9A] hover:text-[#F0F0FF] transition-colors">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-orange-500 rounded-full" />
          </button>

          <div className="h-6 w-px bg-white/[0.08]" />

          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-500/30 to-indigo-500/30 border border-white/10 flex items-center justify-center text-[10px] font-bold text-[#F0F0FF]">
              {initials}
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-semibold text-[#E0E0F0] leading-none">{profile?.full_name ?? 'Manager'}</p>
              <p className="text-[10px] text-[#4A4A6A] mt-0.5">Manager</p>
            </div>
          </div>

          <button onClick={logout}
            className="p-2 text-[#6B6B9A] hover:text-[#F87171] transition-colors" title="Sign out">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ── Content ── */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
