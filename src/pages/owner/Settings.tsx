import { useState } from 'react';
import { AlertTriangle, Palette, Save, Check } from 'lucide-react';
import { cn } from '../../lib/utils';

const THEMES = [
  { id: 'modern', name: 'Modern Minimal', color: 'bg-slate-900', text: 'text-white' },
  { id: 'classic', name: 'Classic Elegance', color: 'bg-amber-900', text: 'text-amber-50' },
  { id: 'vibrant', name: 'Vibrant Pop', color: 'bg-rose-500', text: 'text-white' },
  { id: 'nature', name: 'Earthy Nature', color: 'bg-emerald-800', text: 'text-emerald-50' },
  { id: 'ocean', name: 'Ocean Breeze', color: 'bg-cyan-700', text: 'text-cyan-50' },
  { id: 'dark', name: 'Midnight Dark', color: 'bg-black', text: 'text-slate-300' },
];

export function Settings() {
  const [activeTheme, setActiveTheme] = useState('modern');
  const [isShutdown, setIsShutdown] = useState(false);

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Settings</h1>
        <p className="text-slate-500 mt-2">Manage your restaurant's appearance and critical operations.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center mb-1">
            <Palette className="w-5 h-5 text-indigo-600 mr-2" />
            <h2 className="text-xl font-bold text-slate-900">Customer Facing Theme</h2>
          </div>
          <p className="text-slate-500 text-sm">Select the visual style for your digital menu and ordering experience.</p>
        </div>
        
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {THEMES.map((theme) => (
            <button
              key={theme.id}
              onClick={() => setActiveTheme(theme.id)}
              className={cn(
                "relative rounded-xl border-2 transition-all overflow-hidden text-left group hover:shadow-md",
                activeTheme === theme.id ? "border-indigo-600 ring-4 ring-indigo-500 ring-opacity-20" : "border-slate-200 hover:border-indigo-300"
              )}
            >
              <div className={cn("h-24 w-full flex items-center justify-center", theme.color)}>
                <span className={cn("font-bold text-lg", theme.text)}>Menu</span>
              </div>
              <div className="p-4 bg-white">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-slate-900">{theme.name}</span>
                  {activeTheme === theme.id && <Check className="w-5 h-5 text-indigo-600" />}
                </div>
              </div>
            </button>
          ))}
        </div>
        <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button className="flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-indigo-700 transition-colors">
            <Save className="w-4 h-4 mr-2" />
            Save Theme
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-red-200 overflow-hidden">
        <div className="p-6 border-b border-red-100 bg-red-50">
          <div className="flex items-center mb-1">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
            <h2 className="text-xl font-bold text-red-900">Emergency Shutdown</h2>
          </div>
          <p className="text-red-700 text-sm">Instantly pause all new orders. Existing orders will remain active.</p>
        </div>
        
        <div className="p-6 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900">Current Status</h3>
            <p className="text-slate-500 text-sm mt-1">
              {isShutdown ? 'Operations are currently paused. Customers cannot place new orders.' : 'Operations are running normally.'}
            </p>
          </div>
          
          <button
            onClick={() => setIsShutdown(!isShutdown)}
            className={cn(
              "flex items-center px-6 py-3 border border-transparent rounded-xl text-sm font-bold text-white transition-colors shadow-sm",
              isShutdown ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"
            )}
          >
            {isShutdown ? 'Resume Operations' : 'Pause All Operations'}
          </button>
        </div>
      </div>
    </div>
  );
}
