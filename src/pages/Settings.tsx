import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, LogOut, Trash2, ChevronDown, Check } from 'lucide-react';

interface SettingsProps {
  selectedMonth?: string;
  setSelectedMonth?: (month: string) => void;
}

export const Settings: React.FC<SettingsProps> = () => {
  const { user, updateUser, logout } = useAuth();

  // Profile settings state
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [currency, setCurrency] = useState('₹');

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setProfileName(user.name);
      setProfileEmail(user.email);
      setCurrency(user.currency || '₹');
    }
  }, [user]);

  if (!user) return null;

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      await updateUser({
        name: profileName.trim(),
        email: profileEmail.trim(),
        currency
      });
      setMessage('Profile updated successfully.');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error(err);
      setError('Failed to update profile.');
    }
  };

  const handleDeleteAccount = () => {
    const doubleConfirm = window.confirm(
      'Are you absolutely sure you want to delete your Flow account? This will wipe all financial logs permanently.'
    );
    if (doubleConfirm) {
      localStorage.clear();
      logout();
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-2xl animate-in fade-in duration-300">
      {/* Page Title */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 font-display">Settings</h2>
        <p className="text-xs text-slate-500 font-medium mt-1">
          Manage your personal profile and account preferences.
        </p>
      </div>

      {message && (
        <div className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-500" />
          {message}
        </div>
      )}
      {error && (
        <div className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl p-3">
          {error}
        </div>
      )}

      {/* Profile Section */}
      <div className="space-y-4">
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Profile</h3>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs">
          <h4 className="font-display font-bold text-slate-800 text-sm mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-violet-500" /> Profile Settings
          </h4>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600">Name</label>
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder="Noureen AC"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 focus:bg-white transition-all"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600">Email Address</label>
              <input
                type="email"
                value={profileEmail}
                onChange={(e) => setProfileEmail(e.target.value)}
                placeholder="noureenac@gmail.com"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 focus:bg-white transition-all"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600">Currency</label>
              <div className="relative">
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 focus:bg-white transition-all appearance-none pr-8 cursor-pointer"
                >
                  <option value="₹">Rupee (₹)</option>
                  <option value="$">Dollar ($)</option>
                  <option value="€">Euro (€)</option>
                  <option value="£">Pound (£)</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl px-5 py-2.5 text-xs font-bold shadow-md shadow-violet-100 active:scale-98 transition-all cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Account & Danger Zone Section */}
      <div className="space-y-4 pt-2 border-t border-slate-100">
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Account</h3>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h4 className="font-display font-bold text-slate-800 text-sm">Account Session</h4>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Sign out of your active session on this device.</p>
            </div>
            <button
              onClick={logout}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 active:scale-98 transition-all cursor-pointer shrink-0"
            >
              <LogOut className="w-4 h-4 text-slate-500" /> Log Out
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <h4 className="font-display font-bold text-rose-600 text-sm">Danger Zone</h4>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Permanently delete your account and all associated financial records.</p>
            </div>
            <div>
              <button
                onClick={handleDeleteAccount}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs font-bold hover:bg-rose-100/60 active:scale-98 transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-rose-500" /> Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
