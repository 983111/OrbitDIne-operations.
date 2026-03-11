import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../store/AuthContext';
import { supabase } from '../../lib/supabase';
import { PageHeader, EmptyState, Modal, Input, Button, Badge } from '../../components/ui';
import { cn, formatDate } from '../../lib/utils';
import { Plus, Trash2, Loader2, Users, Mail, Shield, UserCheck } from 'lucide-react';
import { useToast } from '../../components/Toast';

interface Manager {
  id: string;
  full_name: string | null;
  email: string;
  created_at: string;
  is_active: boolean;
}

export function ManagerPermissions() {
  const { profile } = useAuth();
  const toast = useToast();
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', name: '', tempPassword: '' });
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const restaurantId = profile?.restaurant_id;

  const load = useCallback(async () => {
    if (!restaurantId) return;
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email, created_at, is_active')
      .eq('restaurant_id', restaurantId)
      .eq('role', 'manager')
      .order('created_at', { ascending: false });
    setManagers((data ?? []).map(m => ({ ...m, is_active: m.is_active ?? true })));
    setLoading(false);
  }, [restaurantId]);

  useEffect(() => { load(); }, [load]);

  const inviteManager = async () => {
    if (!inviteForm.email || !inviteForm.tempPassword) { toast.error('Email and password are required.'); return; }
    setSaving(true);
    // Create the auth user + profile via signUp (admin-style flow using service calls)
    // Since we don't have admin API here, we use a cloud function or just signUp from client
    // For production: use Supabase Admin SDK edge function. Here we demonstrate the pattern.
    const { data: authData, error: authErr } = await supabase.auth.admin?.createUser
      ? { data: null, error: new Error('Use edge function for admin user creation') }
      : await (supabase.functions.invoke('create-manager', {
          body: { email: inviteForm.email, password: inviteForm.tempPassword, full_name: inviteForm.name, restaurant_id: restaurantId },
        }).then(r => ({ data: r.data, error: r.error })));

    // Fallback: show instructions if edge function not available
    if (authErr) {
      toast.info('To invite managers, use the Supabase Dashboard → Auth → Users, then set their role to "manager" and restaurant_id in profiles table.');
      setSaving(false);
      setShowInvite(false);
      return;
    }
    toast.success(`Manager invite sent to ${inviteForm.email}`);
    setSaving(false);
    setShowInvite(false);
    setInviteForm({ email: '', name: '', tempPassword: '' });
    load();
  };

  const toggleActive = async (m: Manager) => {
    await supabase.from('profiles').update({ is_active: !m.is_active }).eq('id', m.id);
    setManagers(prev => prev.map(x => x.id === m.id ? { ...x, is_active: !x.is_active } : x));
    toast.info(`${m.full_name ?? m.email} ${!m.is_active ? 'activated' : 'deactivated'}.`);
  };

  const removeManager = async (m: Manager) => {
    if (!confirm(`Remove ${m.full_name ?? m.email} from this restaurant?`)) return;
    setRemoving(m.id);
    await supabase.from('profiles').update({ restaurant_id: null }).eq('id', m.id);
    setRemoving(null);
    toast.success(`${m.full_name ?? m.email} removed.`);
    setManagers(prev => prev.filter(x => x.id !== m.id));
  };

  const initials = (name: string | null, email: string) =>
    (name ?? email).split(' ').map(s => s[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="space-y-6 animate-fade-up">
      <PageHeader title="Managers" subtitle="Control who has access to your restaurant"
        action={<Button onClick={() => setShowInvite(true)}><Plus className="w-4 h-4" /> Add Manager</Button>}
      />

      {/* Info banner */}
      <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm">
        <Shield className="w-4 h-4 shrink-0 mt-0.5 text-indigo-400" />
        <div>
          <p className="font-semibold text-indigo-200">How manager access works</p>
          <p className="text-xs text-indigo-400 mt-0.5">Managers sign up with their own email. To link them to your restaurant, set their <code className="bg-indigo-500/20 px-1 rounded">restaurant_id</code> in Supabase to your restaurant's ID.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><Loader2 className="w-7 h-7 animate-spin text-orange-500" /></div>
      ) : managers.length === 0 ? (
        <EmptyState icon={Users} title="No managers yet" description="Managers who join with the same restaurant ID will appear here." />
      ) : (
        <div className="space-y-3">
          {managers.map(m => (
            <div key={m.id} className="glass rounded-2xl px-5 py-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/25 to-indigo-500/25 border border-white/10 flex items-center justify-center text-sm font-bold text-[#F0F0FF] shrink-0">
                {initials(m.full_name, m.email)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-bold text-[#F0F0FF]">{m.full_name ?? 'Unnamed'}</p>
                  <Badge color={m.is_active ? 'green' : 'gray'}>{m.is_active ? 'Active' : 'Inactive'}</Badge>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[#6B6B9A] mt-0.5">
                  <Mail className="w-3 h-3" />{m.email}
                  <span className="mx-1">·</span>
                  Joined {formatDate(m.created_at)}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => toggleActive(m)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all',
                    m.is_active
                      ? 'bg-white/[0.04] border-white/[0.08] text-[#6B6B9A] hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400'
                      : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20',
                  )}>
                  {m.is_active ? 'Deactivate' : 'Activate'}
                </button>
                <button onClick={() => removeManager(m)} disabled={!!removing}
                  className="p-2 rounded-lg bg-white/[0.03] hover:bg-red-500/10 border border-white/[0.07] hover:border-red-500/20 text-[#6B6B9A] hover:text-red-400 transition-all">
                  {removing === m.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showInvite} onClose={() => setShowInvite(false)} title="Add Manager">
        <div className="space-y-4">
          <div className="px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
            <p className="font-semibold">Note</p>
            <p className="mt-1 text-amber-400">For security, manager accounts should be created via a server-side function. This sends a request to your <code>create-manager</code> Supabase Edge Function.</p>
          </div>
          <Input label="Manager Name" value={inviteForm.name} onChange={e => setInviteForm(p => ({ ...p, name: e.target.value }))} placeholder="Alex Johnson" />
          <Input label="Email *" type="email" value={inviteForm.email} onChange={e => setInviteForm(p => ({ ...p, email: e.target.value }))} placeholder="manager@restaurant.com" />
          <Input label="Temporary Password *" type="password" value={inviteForm.tempPassword} onChange={e => setInviteForm(p => ({ ...p, tempPassword: e.target.value }))} placeholder="Min 6 characters" />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setShowInvite(false)}>Cancel</Button>
            <Button className="flex-1" loading={saving} onClick={inviteManager}>Create Manager</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
