import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { LayoutDashboard, LogOut, Bell, Settings, PieChart, Utensils, Users, MessageSquare, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';

export function OwnerLayout() {
  const { logout, user } = useAuth();
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/owner', icon: LayoutDashboard },
    { name: 'Analytics', path: '/owner/analytics', icon: PieChart },
    { name: 'Menu Management', path: '/owner/menu', icon: Utensils },
    { name: 'Table Config', path: '/owner/tables', icon: LayoutDashboard },
    { name: 'Managers', path: '/owner/managers', icon: Users },
    { name: 'Feedback', path: '/owner/feedback', icon: MessageSquare },
    { name: 'Settings', path: '/owner/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-white tracking-tight">Owner Portal</h2>
          <p className="text-slate-400 text-sm mt-1">{user?.name}</p>
        </div>
        
        <nav className="flex-1 px-4 space-y-1 mt-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={cn(
                  "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                  isActive 
                    ? "bg-indigo-600 text-white" 
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                )}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={logout}
            className="flex items-center w-full px-4 py-3 text-sm font-medium text-slate-300 rounded-lg hover:bg-slate-800 hover:text-white transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-8">
          <div className="flex items-center space-x-4">
            <select className="bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5">
              <option>Downtown Location</option>
              <option>Uptown Location</option>
            </select>
          </div>
          <div className="flex items-center space-x-4">
            <button className="p-2 text-slate-400 hover:text-slate-500 relative">
              <Bell className="h-6 w-6" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
            </button>
            <button className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm font-medium flex items-center hover:bg-red-100 transition-colors">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Emergency Stop
            </button>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
