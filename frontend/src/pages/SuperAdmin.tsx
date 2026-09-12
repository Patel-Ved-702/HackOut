import React, { useEffect, useState } from 'react';
import { User, WebDataSummary } from '../types';
import { api } from '../services/api';
import { Shield, Trash2, ShieldAlert, RefreshCw, Activity, Users, Database } from 'lucide-react';

export const SuperAdmin: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [webData, setWebData] = useState<WebDataSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAdminData = async () => {
    try {
      const [usersData, webDataStats] = await Promise.all([
        api.adminGetUsers(),
        api.adminGetWebData()
      ]);
      setUsers(usersData);
      setWebData(webDataStats);
    } catch (err) {
      console.error("Failed to load admin data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      await api.adminUpdateRole(userId, newRole);
      fetchAdminData();
    } catch (err) {
      alert("Failed to update role");
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await api.adminDeleteUser(userId);
      fetchAdminData();
    } catch (err) {
      alert("Failed to delete user");
    }
  };

  const handlePurgeData = async () => {
    if (!window.confirm("WARNING: This will delete telemetry older than 30 days. Proceed?")) return;
    try {
      const res = await api.adminPurgeData();
      alert(`Purged successfully. Readings deleted: ${res.readings_deleted}, Predictions deleted: ${res.predictions_deleted}`);
      fetchAdminData();
    } catch (err) {
      alert("Failed to purge data");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto pb-12 space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Shield className="w-8 h-8 text-indigo-600" />
            Super Admin Control Panel
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Manage platform users, roles, and global web data.</p>
        </div>
        <button onClick={fetchAdminData} className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500 transition-colors">
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Col: Users Table */}
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
              <Users className="w-5 h-5 text-slate-700" />
              <h2 className="text-lg font-bold text-slate-900">User Management</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-widest">
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map(user => (
                    <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900">{user.name}</td>
                      <td className="px-6 py-4 text-slate-500">{user.email}</td>
                      <td className="px-6 py-4">
                        <select 
                          value={user.role} 
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          className={`text-xs font-bold px-2 py-1 rounded-md border ${
                            user.role === 'superadmin' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                            user.role === 'technician' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          <option value="operator">Operator</option>
                          <option value="technician">Technician</option>
                          <option value="superadmin">Super Admin</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Col: Web Data / System Stats */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
              <Database className="w-5 h-5 text-slate-700" />
              <h2 className="text-lg font-bold text-slate-900">Web Data & Storage</h2>
            </div>
            
            <div className="p-5 space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-sm font-medium text-slate-500">Total Users</span>
                <span className="text-lg font-black text-slate-900">{webData?.total_users}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-sm font-medium text-slate-500">Registered Sites</span>
                <span className="text-lg font-black text-slate-900">{webData?.total_sites}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-sm font-medium text-slate-500">Managed Assets</span>
                <span className="text-lg font-black text-slate-900">{webData?.total_assets}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-sm font-medium text-slate-500">Sensor Readings</span>
                <span className="text-lg font-black text-emerald-600">{webData?.total_sensor_readings?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-sm font-medium text-slate-500">Generated Alerts</span>
                <span className="text-lg font-black text-rose-600">{webData?.total_alerts?.toLocaleString()}</span>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-200">
                <h4 className="text-xs font-bold text-rose-600 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4" /> Danger Zone
                </h4>
                <p className="text-xs text-slate-500 font-medium mb-4">
                  Clear historical telemetry data older than 30 days to free up database storage and improve query performance.
                </p>
                <button 
                  onClick={handlePurgeData}
                  className="w-full px-4 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-bold text-sm hover:bg-rose-100 transition-colors flex items-center justify-center gap-2"
                >
                  <Activity className="w-4 h-4" /> Purge Old Data
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
