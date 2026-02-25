import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { LayoutDashboard, LogOut, Bell, UtensilsCrossed } from 'lucide-react';
import { cn } from '../lib/utils';

export function ManagerLayout() {
  const { logout, user } = useAuth();
  const location = useLocation();

  const navItems = [
    { name: 'Floor Map', path: '/manager', icon: LayoutDashboard },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-slate-900 text-white h-16 flex items-center justify-between px-6 shadow-md z-10">
        <div className="flex items-center space-x-8">
          <div className="flex items-center">
            <UtensilsCrossed className="h-6 w-6 text-indigo-400 mr-2" />
            <h1 className="text-xl font-bold tracking-tight">Manager Portal</h1>
          </div>
          <nav className="hidden md:flex space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={cn(
                    "flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors",
                    isActive 
                      ? "bg-indigo-600 text-white" 
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  )}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
        
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-4">
            <button className="p-2 text-slate-300 hover:text-white relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="h-8 w-px bg-slate-700"></div>
            <div className="text-sm">
              <p className="font-medium">{user?.name}</p>
              <p className="text-slate-400 text-xs">Downtown Location</p>
            </div>
            <button
              onClick={logout}
              className="p-2 text-slate-300 hover:text-white transition-colors"
              title="Sign Out"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden flex flex-col relative">
        <Outlet />
      </main>
    </div>
  );
}
