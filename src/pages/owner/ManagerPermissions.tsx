import { useState } from 'react';
import { Plus, Shield, UserX, Edit2, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

interface Manager {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive';
  permissions: {
    editMenu: boolean;
    viewAnalytics: boolean;
    manageTables: boolean;
    issueRefunds: boolean;
  };
}

const MOCK_MANAGERS: Manager[] = [
  {
    id: '1',
    name: 'Bob Manager',
    email: 'manager@test.com',
    status: 'active',
    permissions: {
      editMenu: true,
      viewAnalytics: false,
      manageTables: true,
      issueRefunds: true,
    }
  },
  {
    id: '2',
    name: 'Sarah Jenkins',
    email: 'sarah@test.com',
    status: 'active',
    permissions: {
      editMenu: false,
      viewAnalytics: false,
      manageTables: true,
      issueRefunds: false,
    }
  }
];

export function ManagerPermissions() {
  const [managers, setManagers] = useState<Manager[]>(MOCK_MANAGERS);

  return (
    <div className="space-y-8 h-full flex flex-col">
      <div className="flex justify-between items-end shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Manager Permissions</h1>
          <p className="text-slate-500 mt-2">Control access levels for your restaurant managers.</p>
        </div>
        <div className="flex space-x-4">
          <button className="flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-indigo-700 transition-colors">
            <Plus className="w-4 h-4 mr-2" />
            Invite Manager
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50 sticky top-0 z-10">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Manager</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Edit Menu</th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">View Analytics</th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Manage Tables</th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Issue Refunds</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {managers.map((manager) => (
                <tr key={manager.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                        {manager.name.charAt(0)}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-slate-900">{manager.name}</div>
                        <div className="text-sm text-slate-500">{manager.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={cn(
                      "px-2 inline-flex text-xs leading-5 font-semibold rounded-full",
                      manager.status === 'active' ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-800"
                    )}>
                      {manager.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {manager.permissions.editMenu ? <CheckCircle className="w-5 h-5 text-emerald-500 mx-auto" /> : <XCircle className="w-5 h-5 text-slate-300 mx-auto" />}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {manager.permissions.viewAnalytics ? <CheckCircle className="w-5 h-5 text-emerald-500 mx-auto" /> : <XCircle className="w-5 h-5 text-slate-300 mx-auto" />}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {manager.permissions.manageTables ? <CheckCircle className="w-5 h-5 text-emerald-500 mx-auto" /> : <XCircle className="w-5 h-5 text-slate-300 mx-auto" />}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {manager.permissions.issueRefunds ? <CheckCircle className="w-5 h-5 text-emerald-500 mx-auto" /> : <XCircle className="w-5 h-5 text-slate-300 mx-auto" />}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-indigo-600 hover:text-indigo-900 mr-4">
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button className="text-red-600 hover:text-red-900">
                      <UserX className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
