import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '../src/lib/utils';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: {
    success: (message: string) => void;
    error: (message: string) => void;
    warning: (message: string) => void;
    info: (message: string) => void;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const CONFIG: Record<ToastType, { icon: React.ElementType; cls: string }> = {
  success: { icon: CheckCircle2, cls: 'border-emerald-500/25 bg-emerald-500/10 [&_.icon]:text-emerald-400' },
  error:   { icon: XCircle,      cls: 'border-red-500/25 bg-red-500/10 [&_.icon]:text-red-400' },
  warning: { icon: AlertTriangle,cls: 'border-amber-500/25 bg-amber-500/10 [&_.icon]:text-amber-400' },
  info:    { icon: Info,         cls: 'border-indigo-500/25 bg-indigo-500/10 [&_.icon]:text-indigo-400' },
};

function Toast({ item, onDismiss }: { item: ToastItem; onDismiss: (id: string) => void }) {
  const { icon: Icon, cls } = CONFIG[item.type];
  return (
    <div className={cn(
      'animate-toast-in flex items-center gap-3 px-4 py-3.5 rounded-2xl border',
      'shadow-2xl min-w-[300px] max-w-[400px] backdrop-blur-2xl',
      'bg-[#0E0E1C]/90',
      cls,
    )}>
      <Icon className="icon w-5 h-5 shrink-0" />
      <p className="text-sm font-medium text-[#F0F0FF] flex-1 leading-snug">{item.message}</p>
      <button
        onClick={() => onDismiss(item.id)}
        className="text-white/30 hover:text-white/70 transition-colors shrink-0 ml-1"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const add = useCallback((message: string, type: ToastType) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev.slice(-4), { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const dismiss = useCallback((id: string) => setToasts(prev => prev.filter(t => t.id !== id)), []);

  const toast = {
    success: (msg: string) => add(msg, 'success'),
    error:   (msg: string) => add(msg, 'error'),
    warning: (msg: string) => add(msg, 'warning'),
    info:    (msg: string) => add(msg, 'info'),
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 right-6 flex flex-col gap-2.5 z-[9999] pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto">
            <Toast item={t} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx.toast;
}
