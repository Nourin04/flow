import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/db';
import type { Category, MonthlyIncome } from '../lib/types';
import { 
  User, 
  DollarSign, 
  Tag, 
  Check, 
  Plus,
  Pizza,
  Car,
  Home,
  ShoppingBag,
  GraduationCap,
  Gift,
  Sparkles,
  HelpCircle,
  X
} from 'lucide-react';

interface SettingsProps {
  selectedMonth: string;
}

export const Settings: React.FC<SettingsProps> = ({ selectedMonth: _selectedMonth }) => {
  const { user, updateUser, logout } = useAuth();
  
  // Profile settings state
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [currency, setCurrency] = useState('₹');

  // Categories management state
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#8B5CF6');
  const [newCatIcon, setNewCatIcon] = useState('Sparkles');

  // Income history state
  const [incomeList, setIncomeList] = useState<MonthlyIncome[]>([]);
  const [monthToEdit, setMonthToEdit] = useState<string | null>(null);
  const [monthlyIncomeInput, setMonthlyIncomeInput] = useState('');

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadData = async () => {
    if (!user) return;
    setProfileName(user.name);
    setProfileEmail(user.email);
    setCurrency(user.currency);

    const cats = await db.getCategories(user.id);
    setCategories(cats);

    const incomes = db.getAllIncome(user.id);
    setIncomeList(incomes);
  };

  useEffect(() => {
    loadData();
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
    } catch (err) {
      console.error(err);
      setError('Failed to update profile.');
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!newCatName.trim()) {
      setError('Category name is required.');
      return;
    }

    try {
      await db.addCategory(user.id, {
        name: newCatName.trim(),
        color: newCatColor,
        icon: newCatIcon,
        is_active: true
      });
      setNewCatName('');
      const updatedCats = await db.getCategories(user.id);
      setCategories(updatedCats);
      setMessage('Custom category added successfully.');
    } catch (err) {
      console.error(err);
      setError('Failed to create category.');
    }
  };

  const handleToggleCategory = async (catId: string, currentActive: boolean) => {
    try {
      await db.updateCategory(user.id, catId, { is_active: !currentActive });
      const updatedCats = await db.getCategories(user.id);
      setCategories(updatedCats);
    } catch (err) {
      console.error(err);
      setError('Failed to toggle category.');
    }
  };

  const handleUpdateIncome = async (monthKey: string) => {
    const parsed = parseFloat(monthlyIncomeInput);
    if (isNaN(parsed) || parsed < 0) {
      setError('Income must be a positive number.');
      return;
    }

    try {
      await db.setIncome(user.id, monthKey, parsed);
      setMonthToEdit(null);
      setMonthlyIncomeInput('');
      const updatedIncomes = db.getAllIncome(user.id);
      setIncomeList(updatedIncomes);
      setMessage('Income updated successfully.');
    } catch (err) {
      console.error(err);
      setError('Failed to update income.');
    }
  };

  const handleAddMonthIncome = async () => {
    setError('');
    // Prompt simple inputs to create income for another month
    const month = prompt('Enter month (YYYY-MM), e.g. 2026-09:');
    if (!month) return;
    const amountStr = prompt('Enter income amount:');
    if (!amountStr) return;
    const amount = parseFloat(amountStr);

    if (!/^\d{4}-\d{2}$/.test(month)) {
      alert('Invalid month format. Please use YYYY-MM.');
      return;
    }
    if (isNaN(amount) || amount < 0) {
      alert('Invalid amount.');
      return;
    }

    try {
      await db.setIncome(user.id, month, amount);
      const updatedIncomes = db.getAllIncome(user.id);
      setIncomeList(updatedIncomes);
      setMessage('Monthly income entry created.');
    } catch (err) {
      console.error(err);
      setError('Failed to add income entry.');
    }
  };

  const handleDeleteAccount = () => {
    const doubleConfirm = window.confirm('Are you absolutely sure you want to delete your Flow account? This will wipe all financial logs permanently.');
    if (doubleConfirm) {
      localStorage.clear();
      logout();
    }
  };

  // Category Icon components
  const availableIcons = ['Pizza', 'Car', 'Home', 'ShoppingBag', 'GraduationCap', 'Gift', 'Sparkles', 'HelpCircle'];
  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Pizza': return Pizza;
      case 'Car': return Car;
      case 'Home': return Home;
      case 'ShoppingBag': return ShoppingBag;
      case 'GraduationCap': return GraduationCap;
      case 'Gift': return Gift;
      case 'Sparkles': return Sparkles;
      default: return HelpCircle;
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 font-display">Settings</h2>
        <p className="text-xs text-slate-400 font-medium">Configure profile attributes, historical incomes, categories, and account states.</p>
      </div>

      {message && (
        <div className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-xl p-3">
          {message}
        </div>
      )}
      {error && (
        <div className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl p-3">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        
        {/* Left column: Profile form & Income configuration */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          
          {/* Profile Details */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs">
            <h3 className="font-display font-semibold text-slate-800 text-sm mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-violet-500" /> Profile Settings
            </h3>
            
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Name</label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-violet-500 focus:bg-white"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Email Address</label>
                <input
                  type="email"
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-violet-500 focus:bg-white"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Currency Symbol</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-violet-500 focus:bg-white"
                >
                  <option value="₹">Rupee (₹)</option>
                  <option value="$">Dollar ($)</option>
                  <option value="€">Euro (€)</option>
                  <option value="£">Pound (£)</option>
                </select>
              </div>

              <button
                type="submit"
                className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl px-4 py-2 text-xs font-semibold shadow-md shadow-violet-100 active:scale-98 transition-all cursor-pointer"
              >
                Save Profile
              </button>
            </form>
          </div>

          {/* Historical Income settings (Ensures Rule 51) */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-display font-semibold text-slate-800 text-sm flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-violet-500" /> Income History
              </h3>
              <button
                onClick={handleAddMonthIncome}
                className="text-[10px] text-violet-600 font-bold hover:text-violet-700 flex items-center gap-0.5"
              >
                <Plus className="w-3.5 h-3.5" /> Add Month
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                    <th className="py-2">Month</th>
                    <th className="py-2">Amount</th>
                    <th className="py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-display">
                  {incomeList.map((inc) => {
                    const isEditing = monthToEdit === inc.month;
                    return (
                      <tr key={inc.month} className="hover:bg-slate-50/40">
                        <td className="py-2.5 font-semibold text-slate-500 font-sans">{inc.month}</td>
                        <td className="py-2.5 font-extrabold text-slate-800">
                          {isEditing ? (
                            <div className="relative w-24">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 font-display text-[10px]">
                                {user.currency}
                              </span>
                              <input
                                type="number"
                                value={monthlyIncomeInput}
                                onChange={(e) => setMonthlyIncomeInput(e.target.value)}
                                className="w-full pl-5 pr-1 py-0.5 bg-white border border-slate-200 rounded-md text-xs font-semibold focus:outline-hidden"
                                autoFocus
                              />
                            </div>
                          ) : (
                            `${user.currency}${inc.amount.toLocaleString('en-IN')}`
                          )}
                        </td>
                        <td className="py-2.5 text-right">
                          {isEditing ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleUpdateIncome(inc.month)}
                                className="p-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-md"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setMonthToEdit(null);
                                  setMonthlyIncomeInput('');
                                }}
                                className="p-1 border border-slate-200 text-slate-400 rounded-md hover:bg-slate-50"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setMonthlyIncomeInput(inc.amount.toString());
                                setMonthToEdit(inc.month);
                              }}
                              className="text-[10px] text-violet-600 hover:text-violet-700 font-bold hover:underline"
                            >
                              Edit
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Right column: Categories Manager & Account settings */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          
          {/* Categories Manager */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs">
            <h3 className="font-display font-semibold text-slate-800 text-sm mb-4 flex items-center gap-2">
              <Tag className="w-4 h-4 text-violet-500" /> Categories Manager
            </h3>

            {/* Custom Category Quick Add Form */}
            <form onSubmit={handleAddCategory} className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-50/50 p-3.5 rounded-xl border border-slate-100 mb-4 items-end">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Category Name</label>
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. Subscriptions"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Icon & Color</label>
                <div className="flex gap-1.5">
                  <select
                    value={newCatIcon}
                    onChange={(e) => setNewCatIcon(e.target.value)}
                    className="flex-1 px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden"
                  >
                    {availableIcons.map(icon => (
                      <option key={icon} value={icon}>{icon}</option>
                    ))}
                  </select>
                  <input
                    type="color"
                    value={newCatColor}
                    onChange={(e) => setNewCatColor(e.target.value)}
                    className="w-8 h-8 p-0 border border-slate-200 rounded-lg cursor-pointer flex-shrink-0"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-violet-600 hover:bg-violet-700 text-white rounded-lg py-1.5 text-xs font-semibold shadow-xs flex items-center justify-center gap-1 cursor-pointer select-none"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </form>

            {/* List and toggle categories */}
            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {categories.map((cat) => {
                const IconComponent = getCategoryIcon(cat.icon);
                return (
                  <div key={cat.id} className="flex justify-between items-center py-1 border-b border-slate-50 last:border-0">
                    <div className="flex items-center gap-2.5">
                      <div 
                        className="w-7.5 h-7.5 rounded-lg flex items-center justify-center border text-[10px]" 
                        style={{ backgroundColor: `${cat.color}10`, borderColor: `${cat.color}20` }}
                      >
                        <IconComponent className="w-4 h-4" style={{ color: cat.color }} />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-700 leading-none">{cat.name}</span>
                        {!cat.user_id && (
                          <span className="ml-1.5 text-[8px] font-bold text-slate-400 border border-slate-200 px-1 rounded-sm uppercase tracking-wide">
                            Default
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Active Toggle */}
                    <button
                      onClick={() => handleToggleCategory(cat.id, cat.is_active)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md cursor-pointer select-none border transition-colors ${
                        cat.is_active 
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100/50' 
                          : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {cat.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Account operations */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="font-display font-semibold text-rose-600 text-sm">Account Operations</h3>
            <p className="text-[10px] text-slate-400 font-semibold uppercase -mt-2">Danger zone account adjustments</p>
            
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={logout}
                className="flex-1 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 active:scale-98 transition-all cursor-pointer"
              >
                Log Out
              </button>
              <button
                onClick={handleDeleteAccount}
                className="flex-1 py-2 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs font-semibold hover:bg-rose-100/50 active:scale-98 transition-all cursor-pointer"
              >
                Delete Account
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
