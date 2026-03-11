import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../store/AuthContext';
import { supabase } from '../../lib/supabase';
import { PageHeader, Input, Select, Button } from '@/components/ui';
import { cn } from '../../lib/utils';
import { Settings as SettingsIcon, Store, Palette, Clock, AlertTriangle, Loader2, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/components/Toast';

interface RestaurantSettings {
  id: string;
  name: string;
  theme: string;
  is_operational: boolean;
  opening_time: string | null;
  closing_time: string | null;
  address: string | null;
  phone: string | null;
  currency: string | null;
}

const THEMES = [
  { value: 'modern',  label: 'Modern Dark',   desc: 'Clean dark theme with orange accents' },
  { value: 'light',   label: 'Classic Light',  desc: 'Bright, clean white interface' },
  { value: 'vintage', label: 'Vintage',        desc: 'Warm tones, classic feel' },
];

const SECTIONS = [
  { id: 'profile', icon: Store, label: 'Restaurant Profile' },
  { id: 'hours',   icon: Clock, label: 'Operating Hours' },
  { id: 'theme',   icon: Palette, label: 'Theme' },
  { id: 'danger',  icon: AlertTriangle, label: 'Danger Zone' },
];

export function Settings() {
  const { profile } = useAuth();
  const toast = useToast();
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('profile');
  const restaurantId = profile?.restaurant_id;

  const load = useCallback(async () => {
    if (!restaurantId) return;
    const { data } = await supabase.from('restaurants').select('*').eq('id', restaurantId).single();
    setSettings(data);
    setLoading(false);
  }, [restaurantId]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!settings || !restaurantId) return;
    setSaving(true);
    const { error } = await supabase.from('restaurants').update({
      name: settings.name,
      theme: settings.theme,
      is_operational: settings.is_operational,
      opening_time: settings.opening_time,
      closing_time: settings.closing_time,
      address: settings.address,
      phone: settings.phone,
      currency: settings.currency ?? 'USD',
    }).eq('id', restaurantId);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Settings saved!');
  };

  const toggleOperational = async () => {
    if (!settings || !restaurantId) return;
    const next = !settings.is_operational;
    await supabase.from('restaurants').update({ is_operational: next }).eq('id', restaurantId);
    setSettings(prev => prev ? { ...prev, is_operational: next } : prev);
    toast.info(`Restaurant ${next ? 'opened' : 'closed'}.`);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64"><Loader2 className="w-7 h-7 animate-spin text-orange-500" /></div>
  );

  if (!settings) return (
    <div className="text-center py-20 text-[#6B6B9A]">Could not load restaurant settings.</div>
  );

  return (
    <div className="space-y-6 animate-fade-up">
      <PageHeader title="Settings" subtitle="Manage your restaurant configuration" />

      <div className="flex gap-6">
        {/* Sidebar nav */}
        <div className="w-48 shrink-0 space-y-1">
          {SECTIONS.map(s => {
            const Icon = s.icon;
            return (
              <button key={s.id} onClick={() => setActiveSection(s.id)}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium text-left transition-all',
                  activeSection === s.id
                    ? 'bg-orange-500/15 border border-orange-500/20 text-orange-400'
                    : s.id === 'danger'
                      ? 'text-[#6B6B9A] hover:bg-red-500/10 hover:text-red-400'
                      : 'text-[#6B6B9A] hover:bg-white/[0.04] hover:text-[#C0C0E0]',
                )}>
                <Icon className="w-4 h-4 shrink-0" />
                {s.label}
              </button>
            );
          })}
        </div>

        {/* Content panels */}
        <div className="flex-1 glass rounded-2xl p-6">

          {/* Profile */}
          {activeSection === 'profile' && (
            <div className="space-y-5">
              <h2 className="text-base font-bold text-[#F0F0FF]">Restaurant Profile</h2>
              <Input label="Restaurant Name *" value={settings.name} onChange={e => setSettings(p => p ? { ...p, name: e.target.value } : p)} />
              <Input label="Address" value={settings.address ?? ''} onChange={e => setSettings(p => p ? { ...p, address: e.target.value } : p)} placeholder="123 Main St, City" />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Phone" value={settings.phone ?? ''} onChange={e => setSettings(p => p ? { ...p, phone: e.target.value } : p)} placeholder="+1 555 0000" />
                <Select label="Currency" value={settings.currency ?? 'USD'} onChange={e => setSettings(p => p ? { ...p, currency: e.target.value } : p)}>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="INR">INR (₹)</option>
                  <option value="AUD">AUD (A$)</option>
                </Select>
              </div>
              <Button onClick={save} loading={saving}>Save Changes</Button>
            </div>
          )}

          {/* Hours */}
          {activeSection === 'hours' && (
            <div className="space-y-5">
              <h2 className="text-base font-bold text-[#F0F0FF]">Operating Hours</h2>
              {/* Operational toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/[0.07]">
                <div>
                  <p className="text-sm font-semibold text-[#F0F0FF]">Restaurant Status</p>
                  <p className="text-xs text-[#6B6B9A] mt-0.5">Controls whether new orders can be placed</p>
                </div>
                <button onClick={toggleOperational}
                  className={cn('flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-all',
                    settings.is_operational
                      ? 'bg-emerald-500/15 border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/25'
                      : 'bg-red-500/15 border-red-500/25 text-red-400 hover:bg-red-500/25',
                  )}>
                  {settings.is_operational ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  {settings.is_operational ? 'Open' : 'Closed'}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Opening Time" type="time" value={settings.opening_time ?? ''} onChange={e => setSettings(p => p ? { ...p, opening_time: e.target.value } : p)} />
                <Input label="Closing Time" type="time" value={settings.closing_time ?? ''} onChange={e => setSettings(p => p ? { ...p, closing_time: e.target.value } : p)} />
              </div>
              <Button onClick={save} loading={saving}>Save Hours</Button>
            </div>
          )}

          {/* Theme */}
          {activeSection === 'theme' && (
            <div className="space-y-5">
              <h2 className="text-base font-bold text-[#F0F0FF]">Theme</h2>
              <div className="grid grid-cols-1 gap-3">
                {THEMES.map(t => (
                  <label key={t.value} onClick={() => setSettings(p => p ? { ...p, theme: t.value } : p)}
                    className={cn(
                      'flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all',
                      settings.theme === t.value
                        ? 'bg-orange-500/10 border-orange-500/30'
                        : 'bg-white/[0.02] border-white/[0.07] hover:bg-white/[0.05]',
                    )}>
                    <div className={cn('w-5 h-5 rounded-full border-2 transition-all shrink-0',
                      settings.theme === t.value ? 'border-orange-500 bg-orange-500' : 'border-[#4A4A6A]',
                    )} />
                    <div>
                      <p className="text-sm font-semibold text-[#F0F0FF]">{t.label}</p>
                      <p className="text-xs text-[#6B6B9A]">{t.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
              <Button onClick={save} loading={saving}>Apply Theme</Button>
            </div>
          )}

          {/* Danger zone */}
          {activeSection === 'danger' && (
            <div className="space-y-5">
              <h2 className="text-base font-bold text-red-400">Danger Zone</h2>
              <p className="text-sm text-[#6B6B9A]">These actions are irreversible. Please proceed with caution.</p>
              <div className="space-y-3">
                {[
                  { label: 'Clear All Orders', desc: 'Delete all order history permanently.', action: async () => {
                    if (!confirm('Delete ALL orders? This cannot be undone.')) return;
                    await supabase.from('orders').delete().eq('restaurant_id', restaurantId!);
                    toast.success('All orders deleted.');
                  }},
                  { label: 'Reset Menu', desc: 'Remove all menu items permanently.', action: async () => {
                    if (!confirm('Delete ALL menu items?')) return;
                    await supabase.from('menu_items').delete().eq('restaurant_id', restaurantId!);
                    toast.success('Menu cleared.');
                  }},
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between p-4 rounded-xl border border-red-500/20 bg-red-500/5">
                    <div>
                      <p className="text-sm font-semibold text-red-300">{item.label}</p>
                      <p className="text-xs text-[#6B6B9A] mt-0.5">{item.desc}</p>
                    </div>
                    <Button variant="danger" size="sm" onClick={item.action}>Delete</Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
