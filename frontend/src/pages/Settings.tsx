import React, { useState } from 'react';
import { User, Bell, Shield, Sliders, Moon, Globe, HelpCircle, LogOut, Upload, CheckCircle2, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { User as UserType } from '../types';

interface SettingsProps {
  currentUser?: UserType;
  onUserUpdate?: (user: UserType) => void;
}

export const Settings: React.FC<SettingsProps> = ({ currentUser: propUser, onUserUpdate }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'notifications' | 'security'>('profile');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load logged-in user from prop or localStorage
  const storedUser: UserType | null = (() => {
    if (propUser && propUser.email) return propUser;
    try {
      const s = localStorage.getItem('current_user');
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  })();

  const nameParts = (storedUser?.name || propUser?.name || '').split(' ');
  const [firstName, setFirstName] = useState(nameParts[0] ?? '');
  const [lastName, setLastName] = useState(nameParts.slice(1).join(' ') ?? '');
  const [emailVal, setEmailVal] = useState(storedUser?.email || propUser?.email || '');
  const [roleVal, setRoleVal] = useState(storedUser?.role || propUser?.role || 'operator');

  // Keep state in sync if prop changes
  React.useEffect(() => {
    const effectiveUser = storedUser || propUser;
    if (effectiveUser) {
      const parts = (effectiveUser.name || '').split(' ');
      setFirstName(parts[0] || '');
      setLastName(parts.slice(1).join(' ') || '');
      setEmailVal(effectiveUser.email || '');
      setRoleVal(effectiveUser.role || 'operator');
    }
  }, [propUser?.email, propUser?.name]);

  const initials = (firstName[0] ?? '') + (lastName[0] ?? '') || ((storedUser?.name || propUser?.name)?.[0] ?? '?');

  const handleSaveProfile = () => {
    const targetUser = storedUser || propUser;
    if (targetUser) {
      const updated = { ...targetUser, name: `${firstName} ${lastName}`.trim(), email: emailVal };
      localStorage.setItem('current_user', JSON.stringify(updated));
      if (onUserUpdate) onUserUpdate(updated);
    }
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_user');
    window.location.href = '/';
  };

  return (
    <div className="max-w-[1200px] mx-auto pb-12">
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Account Settings</h1>
        <p className="text-sm font-medium text-slate-500 mt-1">Manage your profile, preferences, and security settings.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Sidebar */}
        <div className="w-full md:w-64 space-y-1">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'profile' ? 'bg-white shadow-sm border border-slate-200 text-emerald-700' : 'text-slate-500 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            <User className="w-4 h-4" /> Personal Profile
          </button>
          
          <button 
            onClick={() => setActiveTab('preferences')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'preferences' ? 'bg-white shadow-sm border border-slate-200 text-emerald-700' : 'text-slate-500 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-4 h-4" /> Preferences
          </button>

          <button 
            onClick={() => setActiveTab('notifications')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'notifications' ? 'bg-white shadow-sm border border-slate-200 text-emerald-700' : 'text-slate-500 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            <Bell className="w-4 h-4" /> Notifications
          </button>

          <button 
            onClick={() => setActiveTab('security')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'security' ? 'bg-white shadow-sm border border-slate-200 text-emerald-700' : 'text-slate-500 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            <Shield className="w-4 h-4" /> Security
          </button>

          <div className="pt-6 pb-2">
            <div className="h-px w-full bg-slate-200"></div>
          </div>

          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-all">
            <HelpCircle className="w-4 h-4" /> Help & Support
          </button>

          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-rose-500 hover:bg-rose-50 transition-all"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          {activeTab === 'profile' && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden transition-all duration-300">
              <div className="p-6 md:p-8 border-b border-slate-100">
                <h2 className="text-xl font-black text-slate-900 mb-6">Personal Profile</h2>
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-8">
                  <div className="w-24 h-24 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-3xl font-black text-emerald-700 uppercase">
                    {initials}
                  </div>
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <button className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs shadow-sm hover:bg-slate-50 flex items-center gap-2 transition-colors">
                        <Upload className="w-3.5 h-3.5" /> Upload new picture
                      </button>
                      <button className="px-4 py-2 rounded-xl bg-slate-50 text-slate-500 font-bold text-xs hover:bg-slate-100 transition-colors">
                        Remove
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Recommended size 256x256px.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">First Name</label>
                    <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-black focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Last Name</label>
                    <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-black focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Email Address</label>
                    <input type="email" value={emailVal} onChange={(e) => setEmailVal(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-black focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Role</label>
                    <input type="text" value={roleVal} readOnly className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-100 text-sm font-bold text-slate-700 cursor-not-allowed capitalize" />
                  </div>
                </div>
              </div>
              <div className="bg-slate-50 p-6 flex items-center justify-end gap-3">
                {saveSuccess && (
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Saved!
                  </span>
                )}
                <button onClick={handleSaveProfile} className="px-6 py-2.5 rounded-xl bg-emerald-700 text-white font-bold text-sm shadow-md hover:bg-emerald-800 transition-colors flex items-center gap-2">
                  <Save className="w-4 h-4" /> Save Changes
                </button>
              </div>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden transition-all duration-300">
              <div className="p-6 md:p-8">
                <h2 className="text-xl font-black text-slate-900 mb-6">Display Preferences</h2>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-slate-100 rounded-lg text-slate-600"><Moon className="w-5 h-5" /></div>
                      <div>
                        <div className="font-bold text-slate-900 text-sm">Theme Mode</div>
                        <div className="text-xs text-slate-500 font-medium mt-0.5">Currently using pristine Light Mode.</div>
                      </div>
                    </div>
                    <div className="flex bg-slate-100 p-1 rounded-lg">
                      <button className="px-3 py-1.5 rounded-md bg-white shadow-sm text-xs font-bold text-slate-900">Light</button>
                      <button className="px-3 py-1.5 rounded-md text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors">Dark</button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-slate-100 rounded-lg text-slate-600"><Globe className="w-5 h-5" /></div>
                      <div>
                        <div className="font-bold text-slate-900 text-sm">Language & Region</div>
                        <div className="text-xs text-slate-500 font-medium mt-0.5">English (US), Timezone: UTC-8</div>
                      </div>
                    </div>
                    <button className="px-4 py-2 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-lg hover:bg-emerald-100 transition-colors">
                      Change
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden transition-all duration-300">
              <div className="p-6 md:p-8 border-b border-slate-100">
                <h2 className="text-xl font-black text-slate-900 mb-6">Notification Routing</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900 text-sm">Critical AI Alerts</div>
                      <div className="text-xs text-slate-500 font-medium mt-0.5">Immediate notifications for asset failure predictions.</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>
                  
                  <div className="w-full h-px bg-slate-100"></div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900 text-sm">Daily Digest</div>
                      <div className="text-xs text-slate-500 font-medium mt-0.5">End of day summary of fleet health and generation.</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>

                  <div className="w-full h-px bg-slate-100"></div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900 text-sm">Work Order Updates</div>
                      <div className="text-xs text-slate-500 font-medium mt-0.5">When a technician completes a maintenance task.</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>
                </div>
              </div>
              <div className="bg-slate-50 p-6 flex justify-end">
                <button className="px-6 py-2.5 rounded-xl bg-emerald-700 text-white font-bold text-sm shadow-md hover:bg-emerald-800 transition-colors flex items-center gap-2">
                  <Save className="w-4 h-4" /> Save Preferences
                </button>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden transition-all duration-300">
              <div className="p-6 md:p-8">
                <h2 className="text-xl font-black text-slate-900 mb-6">Security & Authentication</h2>
                
                <div className="space-y-6">
                  <div className="space-y-4 max-w-sm">
                    <h3 className="text-sm font-bold text-slate-900 mb-2">Change Password</h3>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Current Password</label>
                      <input type="password" placeholder="••••••••" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">New Password</label>
                      <input type="password" placeholder="••••••••" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" />
                    </div>
                    <button className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors mt-2">
                      Update Password
                    </button>
                  </div>

                  <div className="w-full h-px bg-slate-100 my-6"></div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900 mb-2">Two-Factor Authentication (2FA)</h3>
                    <p className="text-xs text-slate-500 font-medium mb-4 max-w-md">Add an extra layer of security to your account by requiring more than just a password to sign in.</p>
                    <button className="px-5 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-xs hover:bg-emerald-100 transition-colors">
                      Enable 2FA
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
