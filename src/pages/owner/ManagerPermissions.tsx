import { useState, useEffect } from 'react';
import { Plus, Edit2, CheckCircle, XCircle, Loader2, Save, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../store/AuthContext';

interface ManagerWithPerms {
  id: string;
  full_name: string | null;
  email: string | null;
  status: string;
  permissions: {
    id: string;
    edit_menu: boolean;
    view_analytics: boolean;
    manage_tables: boolean;
    issue_refunds: boolean;
  } | null;
}

export function ManagerPermissions() {
  const { profile } = useAuth();
  const [managers, setManagers] = useState<ManagerWithPerms[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [permsEdit, setPermsEdit] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  const fetchManagers = async () => {
    if (!profile?.restaurant_id) return;
    setLoading(true);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, email, status')
      .eq('restaurant_id', profile.restaurant_id)
      .eq('role', 'manager');

    const { data: perms } = await supabase
      .from('manager_permissions')
      .select('*')
      .eq('restaurant_id', profile.restaurant_id);

    const combined: ManagerWithPerms[] = (profiles ?? []).map(p => ({
      ...p,
      permissions: perms?.find(perm => perm.manager_id === p.id) ?? null,
    }));
    setManagers(combined);
    setLoading(false);
  };

  useEffect(() => { fetchManagers(); }, [profile?.restaurant_id]);

  const startEdit = (m: ManagerWithPerms) => {
    setEditingId(m.id);
    setPermsEdit({
      edit_menu: m.permissions?.edit_menu ?? false,
      view_analytics: m.permissions?.view_analytics ?? false,
      manage_tables: m.permissions?.manage_tables ?? true,
      issue_refunds: m.permissions?.issue_refunds ?? false,
    });
  };

  const savePerms = async (m: ManagerWithPerms) => {
    if (!profile?.restaurant_id) return;
    setSaving(true);
    if (m.permissions) {
      await supabase.from('manager_permissions').update(permsEdit).eq('id', m.permissions.id);
    } else {
      await supabase.from('manager_permissions').insert({
        manager_id: m.id,
        restaurant_id: profile.restaurant_id,
        ...permsEdit,
      });
    }
    setSaving(false);
    setEditingId(null);
    fetchManagers();
  };

  const permKeys = [
    { key: 'edit_menu', label: 'Edit Menu' },
    { key: 'view_analytics', label: 'View Analytics' },
    { key: 'manage_tables', label: 'Manage Tables' },
    { key: 'issue_refunds', label: 'Issue Refunds' },
  ];

  return (
    <div className="space-y-8 h-full flex flex-col">
      <div className="flex justify-between items-end shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Manager Permissions</h1>
          <p className="text-slate-500 mt-2">Control access levels for your restaurant managers.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-40"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
          ) : (
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Manager</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                  {permKeys.map(p => (
                    <th key={p.key} className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">{p.label}</th>
                  ))}
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {managers.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-12 text-slate-400">No managers found. Managers will appear here after they create an account.</td></tr>
                ) : managers.map(m => (
                  <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                          {(m.full_name ?? m.email ?? '?').charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-slate-900">{m.full_name ?? 'No name'}</div>
                          <div className="text-sm text-slate-500">{m.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={cn("px-2 inline-flex text-xs leading-5 font-semibold rounded-full",
                        m.status === 'active' ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-800")}>
                        {m.status}
                      </span>
                    </td>
                    {permKeys.map(p => {
                      const val = editingId === m.id ? permsEdit[p.key] : (m.permissions?.[p.key as keyof typeof m.permissions] ?? false);
                      return (
                        <td key={p.key} className="px-6 py-4 whitespace-nowrap text-center">
                          {editingId === m.id ? (
                            <button onClick={() => setPermsEdit(prev => ({ ...prev, [p.key]: !prev[p.key] }))}>
                              {val ? <CheckCircle className="w-5 h-5 text-emerald-500 mx-auto" /> : <XCircle className="w-5 h-5 text-slate-300 mx-auto" />}
                            </button>
                          ) : (
                            val ? <CheckCircle className="w-5 h-5 text-emerald-500 mx-auto" /> : <XCircle className="w-5 h-5 text-slate-300 mx-auto" />
                          )}
                        </td>
                      );
                    })}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {editingId === m.id ? (
                        <div className="flex justify-end gap-2">
                          <button onClick={() => savePerms(m)} disabled={saving} className="text-emerald-600 hover:text-emerald-900">
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                          </button>
                          <button onClick={() => setEditingId(null)} className="text-slate-400 hover:text-slate-700"><X className="h-4 w-4" /></button>
                        </div>
                      ) : (
                        <button onClick={() => startEdit(m)} className="text-indigo-600 hover:text-indigo-900"><Edit2 className="h-4 w-4" /></button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
