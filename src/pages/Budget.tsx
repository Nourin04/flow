import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/db';
import type { Budget as BudgetType, CategoryBudget, Category, Transaction } from '../lib/types';
import { 
  Plus, 
  Trash2, 
  Check, 
  X, 
  Edit2, 
  Wallet,
  Calendar,
  ChevronDown,
  Copy,
  Pizza,
  Car,
  Home,
  ShoppingBag,
  GraduationCap,
  Gift,
  Sparkles,
  HelpCircle
} from 'lucide-react';

interface BudgetProps {
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
}

export const Budget: React.FC<BudgetProps> = ({ selectedMonth, setSelectedMonth }) => {
  const { user } = useAuth();
  
  // Data states
  const [budget, setBudget] = useState<BudgetType | null>(null);
  const [categoryBudgets, setCategoryBudgets] = useState<CategoryBudget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [userMonths, setUserMonths] = useState<string[]>([]);

  // Editing states
  const [editingOverall, setEditingOverall] = useState(false);
  const [overallLimitInput, setOverallLimitInput] = useState('');
  const [editingCategoryBudgetId, setEditingCategoryBudgetId] = useState<string | null>(null);
  const [categoryLimitInput, setCategoryLimitInput] = useState('');
  const [error, setError] = useState('');
  const [copySuccess, setCopySuccess] = useState('');

  // Future month creation input state
  const [showAddMonthModal, setShowAddMonthModal] = useState(false);
  const [futureMonthInput, setFutureMonthInput] = useState('');

  const loadData = async () => {
    if (!user) return;
    
    // Load categories
    const cats = await db.getCategories(user.id);
    setCategories(cats);

    // Load overall budget for selected month
    const bgt = await db.getBudget(user.id, selectedMonth);
    setBudget(bgt);
    if (bgt) {
      setOverallLimitInput(bgt.total_amount.toString());
      const cb = await db.getCategoryBudgets(user.id, bgt.id);
      setCategoryBudgets(cb);
    } else {
      setOverallLimitInput('');
      setCategoryBudgets([]);
    }

    // Load transactions for selected month
    const txs = await db.getTransactions(user.id, selectedMonth);
    setTransactions(txs);

    // Calculate comprehensive months list
    const incomes = db.getAllIncome(user.id);
    const txsAll = await db.getTransactions(user.id);
    const mSet = new Set<string>();
    
    incomes.forEach(i => mSet.add(i.month));
    txsAll.forEach(t => mSet.add(t.transaction_date.slice(0, 7)));

    // Add current month, 3 past months, and 6 future months
    const now = new Date();
    for (let i = -6; i <= 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      mSet.add(`${y}-${m}`);
    }

    const sortedMonths = Array.from(mSet).sort();
    setUserMonths(sortedMonths);
  };

  useEffect(() => {
    loadData();
  }, [user, selectedMonth]);

  if (!user) return null;

  const currentCalendarMonth = (() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  })();

  const isCurrentMonth = selectedMonth === currentCalendarMonth;
  const isPastMonth = selectedMonth < currentCalendarMonth;
  const isFutureMonth = selectedMonth > currentCalendarMonth;

  // Month Formatter
  const formatMonthLabel = (mKey: string) => {
    try {
      const [year, monthNum] = mKey.split('-');
      const d = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
      return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } catch {
      return mKey;
    }
  };

  const handleSaveOverallBudget = async () => {
    setError('');
    const parsed = parseFloat(overallLimitInput);
    if (isNaN(parsed) || parsed <= 0) {
      setError('Spending limit must be a positive number.');
      return;
    }
    try {
      await db.setBudget(user.id, selectedMonth, parsed);
      setEditingOverall(false);
      loadData();
    } catch (err) {
      console.error(err);
      setError('Failed to save overall budget');
    }
  };

  const handleSaveCategoryBudget = async (categoryId: string) => {
    setError('');
    const parsed = parseFloat(categoryLimitInput);
    if (isNaN(parsed) || parsed <= 0) {
      setError('Category limit must be a positive number.');
      return;
    }

    if (!budget) {
      setError('Please set an overall budget first.');
      return;
    }

    try {
      await db.setCategoryBudget(user.id, budget.id, categoryId, parsed);
      setEditingCategoryBudgetId(null);
      setCategoryLimitInput('');
      loadData();
    } catch (err) {
      console.error(err);
      setError('Failed to save category budget');
    }
  };

  const handleDeleteCategoryBudget = async (categoryId: string) => {
    if (!budget) return;
    try {
      await db.deleteCategoryBudget(user.id, budget.id, categoryId);
      loadData();
    } catch (err) {
      console.error(err);
      setError('Failed to delete category budget');
    }
  };

  // Copy budget from previous month helper
  const handleCopyFromPreviousMonth = async () => {
    setError('');
    setCopySuccess('');
    try {
      // Find previous month string (e.g. 2026-08 from 2026-09)
      const [y, m] = selectedMonth.split('-').map(Number);
      const prevDate = new Date(y, m - 2, 1);
      const prevMonthStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

      const prevBudget = await db.getBudget(user.id, prevMonthStr);
      if (!prevBudget) {
        setError(`No budget found for ${formatMonthLabel(prevMonthStr)} to copy from.`);
        return;
      }

      // Create new budget for selectedMonth
      const newBudget = await db.setBudget(user.id, selectedMonth, prevBudget.total_amount);
      const prevCatBudgets = await db.getCategoryBudgets(user.id, prevBudget.id);

      for (const cb of prevCatBudgets) {
        await db.setCategoryBudget(user.id, newBudget.id, cb.category_id, cb.amount);
      }

      setCopySuccess(`Budget successfully copied from ${formatMonthLabel(prevMonthStr)}!`);
      setTimeout(() => setCopySuccess(''), 4000);
      loadData();
    } catch (err) {
      console.error(err);
      setError('Failed to copy budget from previous month.');
    }
  };

  // Add custom future month
  const handleAddFutureMonth = () => {
    if (!futureMonthInput) return;
    setSelectedMonth(futureMonthInput);
    setShowAddMonthModal(false);
    setFutureMonthInput('');
  };

  // Calculations
  const totalSpent = transactions.reduce((sum, tx) => sum + tx.amount, 0);
  const overallLimit = budget ? budget.total_amount : 0;
  const overallRemaining = Math.max(0, overallLimit - totalSpent);
  const overallUsedPctRaw = overallLimit > 0 ? Math.round((totalSpent / overallLimit) * 100) : 0;

  // Category Icon Mapper
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
      
      {/* Header & Month Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 font-display">Budget</h2>
            {isPastMonth && (
              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                📜 Past Month
              </span>
            )}
            {isCurrentMonth && (
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                🟢 Current Month
              </span>
            )}
            {isFutureMonth && (
              <span className="text-[10px] font-bold text-violet-600 bg-violet-50 border border-violet-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                🚀 Future Planning
              </span>
            )}
          </div>
          <p className="text-xs text-slate-900 font-bold mt-0.5">Control your monthly spending pace and category limits.</p>
        </div>

        {/* Themed Month Selector Pill & Future Month Button */}
        <div className="flex items-center gap-2.5">
          <div className="relative group">
            <div className="flex items-center gap-2.5 bg-white border border-slate-200/90 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 shadow-xs group-hover:border-violet-300 group-hover:bg-slate-50/80 transition-all cursor-pointer select-none">
              <div className="w-6 h-6 rounded-lg bg-violet-100/70 text-violet-600 flex items-center justify-center shrink-0">
                <Calendar className="w-3.5 h-3.5" />
              </div>
              <span className="font-display font-bold text-slate-900">{formatMonthLabel(selectedMonth)}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5 group-hover:text-slate-600 transition-colors" />
            </div>

            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
            >
              {userMonths.map((m) => (
                <option key={m} value={m}>
                  {formatMonthLabel(m)} {m === currentCalendarMonth ? '(Current)' : m > currentCalendarMonth ? '(Future)' : ''}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowAddMonthModal(true)}
            className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-3 py-2 text-xs font-bold shadow-xs flex items-center gap-1.5 active:scale-98 transition-all cursor-pointer select-none"
            title="Set budget for a future month"
          >
            <Plus className="w-3.5 h-3.5 text-violet-600" />
            <span>Future Month</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl p-3 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-rose-400 hover:text-rose-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {copySuccess && (
        <div className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{copySuccess}</span>
        </div>
      )}

      {/* Row 1: Overall Budget Card */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        
        {/* Metric info */}
        <div className="md:col-span-5 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-500 flex items-center justify-center flex-shrink-0">
              <Wallet className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-slate-800 text-sm">Overall Monthly Budget</h3>
              <p className="text-[10px] text-slate-400 font-semibold uppercase">{formatMonthLabel(selectedMonth)}</p>
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            {editingOverall ? (
              <div className="flex items-center gap-2 w-full mt-1">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-display text-sm font-semibold">
                    {user.currency}
                  </span>
                  <input
                    type="number"
                    value={overallLimitInput}
                    onChange={(e) => setOverallLimitInput(e.target.value)}
                    className="w-full pl-7 pr-3 py-1.5 bg-slate-50 border border-slate-200/70 rounded-xl text-sm font-semibold font-display text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 focus:bg-white transition-all"
                    placeholder="e.g. 8000"
                    autoFocus
                  />
                </div>
                <button
                  onClick={handleSaveOverallBudget}
                  className="p-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-all shadow-xs cursor-pointer select-none"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setEditingOverall(false);
                    setOverallLimitInput(budget ? budget.total_amount.toString() : '');
                  }}
                  className="p-2 border border-slate-200 text-slate-400 hover:bg-slate-50 rounded-xl transition-all cursor-pointer select-none"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <span className="text-3xl font-extrabold text-slate-800 font-display">
                  {budget ? `${user.currency}${budget.total_amount.toLocaleString('en-IN')}` : 'Not set'}
                </span>
                <button
                  onClick={() => {
                    setOverallLimitInput(budget ? budget.total_amount.toString() : '');
                    setEditingOverall(true);
                  }}
                  className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-all cursor-pointer"
                  title="Edit overall budget"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Dynamic usage graph */}
        <div className="md:col-span-7 flex flex-col gap-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 font-semibold">
              {isFutureMonth ? 'Planned Budget Target' : 'Spending Utilization'}
            </span>
            <span className="text-slate-700 font-bold font-display">
              {totalSpent.toLocaleString('en-IN')} / {overallLimit > 0 ? overallLimit.toLocaleString('en-IN') : 'N/A'} ({overallUsedPctRaw}%)
            </span>
          </div>

          <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 rounded-full ${
                overallUsedPctRaw > 100 
                  ? 'bg-rose-500 animate-pulse' 
                  : overallUsedPctRaw > 90 
                    ? 'bg-amber-500' 
                    : 'bg-violet-500'
              }`}
              style={{ width: `${Math.min(100, overallUsedPctRaw)}%` }}
            ></div>
          </div>

          <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
            <span>Spent: {user.currency}{totalSpent.toLocaleString('en-IN')}</span>
            <span>Remaining: {user.currency}{overallRemaining.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Zero Budget Setup Helper Card */}
      {!budget && (
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-4 select-none">
          <div className="space-y-1">
            <h3 className="font-display font-bold text-lg flex items-center gap-2">
              <span>🎯</span> Setup Budget for {formatMonthLabel(selectedMonth)}
            </h3>
            <p className="text-xs text-violet-100 font-medium">
              Establish your spending limit to keep your finances on track for this month.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCopyFromPreviousMonth}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl px-4 py-2.5 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5 text-violet-200" />
              <span>Copy Previous Month</span>
            </button>
            
            <button
              onClick={() => {
                setOverallLimitInput('8000');
                setEditingOverall(true);
              }}
              className="bg-white text-violet-700 hover:bg-violet-50 rounded-xl px-4 py-2.5 text-xs font-bold shadow-md transition-all cursor-pointer"
            >
              + Set Budget
            </button>
          </div>
        </div>
      )}

      {/* Row 2: Category Limits */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs flex flex-col gap-6">
        
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display font-semibold text-slate-800 text-sm">Category Budget Allocations</h3>
            <p className="text-[10px] text-slate-400 font-semibold uppercase">Set specific spending limits per category</p>
          </div>

          {budget && (
            <button
              onClick={handleCopyFromPreviousMonth}
              className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1.5 cursor-pointer hover:underline"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Previous Allocations</span>
            </button>
          )}
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => {
            const catBudget = categoryBudgets.find(cb => cb.category_id === cat.id);
            const catSpent = transactions
              .filter(t => t.category_id === cat.id)
              .reduce((sum, t) => sum + t.amount, 0);

            const catLimit = catBudget ? catBudget.amount : 0;
            const catPct = catLimit > 0 ? Math.round((catSpent / catLimit) * 100) : 0;
            const isEditing = editingCategoryBudgetId === cat.id;
            const IconComponent = getCategoryIcon(cat.icon);

            return (
              <div 
                key={cat.id}
                className="border border-slate-100 rounded-xl p-4 flex flex-col justify-between gap-3 bg-slate-50/30 hover:border-slate-200 transition-all"
              >
                {/* Category Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center border text-xs shrink-0" 
                      style={{ backgroundColor: `${cat.color}15`, borderColor: `${cat.color}30` }}
                    >
                      <IconComponent className="w-4 h-4" style={{ color: cat.color }} />
                    </div>
                    <span className="text-xs font-bold text-slate-800">{cat.name}</span>
                  </div>

                  {catBudget && !isEditing && (
                    <button
                      onClick={() => handleDeleteCategoryBudget(cat.id)}
                      className="text-slate-300 hover:text-rose-500 p-1 rounded transition-colors cursor-pointer"
                      title="Remove limit"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Amount & Input Controls */}
                <div className="flex items-center justify-between">
                  {isEditing ? (
                    <div className="flex items-center gap-2 w-full">
                      <div className="relative flex-1">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold font-display">
                          {user.currency}
                        </span>
                        <input
                          type="number"
                          value={categoryLimitInput}
                          onChange={(e) => setCategoryLimitInput(e.target.value)}
                          placeholder="Limit"
                          className="w-full pl-6 pr-2 py-1 bg-white border border-slate-200/70 rounded-lg text-xs font-bold font-display text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                          autoFocus
                        />
                      </div>
                      <button
                        onClick={() => handleSaveCategoryBudget(cat.id)}
                        className="p-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-all shadow-xs cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingCategoryBudgetId(null);
                          setCategoryLimitInput('');
                        }}
                        className="p-1.5 border border-slate-200 text-slate-400 hover:bg-white rounded-lg transition-all cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div>
                        <p className="text-[10px] text-slate-400 font-semibold uppercase">Limit</p>
                        <p className="text-sm font-extrabold text-slate-800 font-display">
                          {catBudget ? `${user.currency}${catBudget.amount.toLocaleString('en-IN')}` : 'No Limit'}
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          setEditingCategoryBudgetId(cat.id);
                          setCategoryLimitInput(catBudget ? catBudget.amount.toString() : '');
                        }}
                        className="text-xs text-blue-600 hover:text-blue-700 font-bold hover:underline cursor-pointer"
                      >
                        {catBudget ? 'Edit' : '+ Set Limit'}
                      </button>
                    </>
                  )}
                </div>

                {/* Progress bar */}
                {catBudget && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] font-bold text-slate-400">
                      <span>Spent: {user.currency}{catSpent.toLocaleString('en-IN')}</span>
                      <span className={catPct > 100 ? 'text-rose-600' : 'text-slate-600'}>{catPct}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 rounded-full ${
                          catPct > 100 ? 'bg-rose-500' : catPct > 90 ? 'bg-amber-500' : 'bg-violet-500'
                        }`}
                        style={{ width: `${Math.min(100, catPct)}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Future Month Custom Dialog Modal */}
      {showAddMonthModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-sm border border-slate-100 shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-display font-bold text-slate-900 text-base">Select Future Month</h3>
              <button 
                onClick={() => setShowAddMonthModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Choose a future month to set up its budget targets in advance.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Month</label>
              <input
                type="month"
                value={futureMonthInput}
                onChange={(e) => setFutureMonthInput(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/70 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddMonthModal(false)}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 active:scale-98 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!futureMonthInput}
                onClick={handleAddFutureMonth}
                className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold shadow-md shadow-violet-100 disabled:opacity-50 active:scale-98 transition-all"
              >
                Open Month
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
