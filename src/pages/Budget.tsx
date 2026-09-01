import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/db';
import type { Budget as BudgetType, CategoryBudget, Category, Transaction } from '../lib/types';
import { 
  Trash2, 
  Check, 
  X, 
  Edit2, 
  Wallet,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
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

  // Editing states
  const [editingOverall, setEditingOverall] = useState(false);
  const [overallLimitInput, setOverallLimitInput] = useState('');
  const [editingCategoryBudgetId, setEditingCategoryBudgetId] = useState<string | null>(null);
  const [categoryLimitInput, setCategoryLimitInput] = useState('');
  const [error, setError] = useState('');
  const [copySuccess, setCopySuccess] = useState('');

  // Calendar Month Popover State
  const [showCalendarPicker, setShowCalendarPicker] = useState(false);
  const [pickerYear, setPickerYear] = useState<number>(() => {
    const [y] = selectedMonth.split('-');
    return parseInt(y) || new Date().getFullYear();
  });

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
  };

  useEffect(() => {
    loadData();
  }, [user, selectedMonth]);

  if (!user) return null;

  const currentCalendarMonth = (() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  })();

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
      const [y, m] = selectedMonth.split('-').map(Number);
      const prevDate = new Date(y, m - 2, 1);
      const prevMonthStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

      const prevBudget = await db.getBudget(user.id, prevMonthStr);
      if (!prevBudget) {
        setError(`No budget found for ${formatMonthLabel(prevMonthStr)} to copy from.`);
        return;
      }

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
      
      {/* Header & Calendar Month Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-display">Budget</h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Control your monthly spending pace and category limits.</p>
        </div>

        {/* Interactive Calendar Month Picker Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              const [y] = selectedMonth.split('-');
              if (y) setPickerYear(parseInt(y));
              setShowCalendarPicker(prev => !prev);
            }}
            className="flex items-center gap-2.5 bg-white border border-slate-200/90 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 shadow-xs hover:border-violet-300 hover:bg-slate-50/80 active:scale-98 transition-all cursor-pointer select-none"
          >
            <div className="w-6 h-6 rounded-lg bg-violet-100/70 text-violet-600 flex items-center justify-center shrink-0">
              <Calendar className="w-3.5 h-3.5" />
            </div>
            <span className="font-display font-bold text-slate-900">{formatMonthLabel(selectedMonth)}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 ml-0.5 transition-transform duration-200 ${showCalendarPicker ? 'rotate-180 text-violet-600' : ''}`} />
          </button>

          {/* Interactive Calendar Month Popover */}
          {showCalendarPicker && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowCalendarPicker(false)} 
              />
              
              <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150 select-none">
                {/* Year navigation */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                  <button
                    type="button"
                    onClick={() => setPickerYear(prev => prev - 1)}
                    className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="font-display font-extrabold text-xs text-slate-800 tracking-tight">
                    {pickerYear} Calendar
                  </span>
                  <button
                    type="button"
                    onClick={() => setPickerYear(prev => prev + 1)}
                    className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* 12 Months Grid */}
                <div className="grid grid-cols-3 gap-2">
                  {Array.from({ length: 12 }, (_, i) => {
                    const mStr = String(i + 1).padStart(2, '0');
                    const mKey = `${pickerYear}-${mStr}`;
                    const isSelected = selectedMonth === mKey;
                    const isCurrent = mKey === currentCalendarMonth;
                    const monthName = new Date(pickerYear, i, 1).toLocaleDateString('en-US', { month: 'short' });

                    return (
                      <button
                        key={mKey}
                        type="button"
                        onClick={() => {
                          setSelectedMonth(mKey);
                          setShowCalendarPicker(false);
                        }}
                        className={`py-2 px-1 rounded-xl text-xs font-semibold flex flex-col items-center justify-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-violet-600 text-white font-bold shadow-md shadow-violet-200 scale-105'
                            : isCurrent
                            ? 'bg-violet-50 text-violet-700 border border-violet-200 font-bold'
                            : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900'
                        }`}
                      >
                        <span>{monthName}</span>
                        {isCurrent && <span className={`text-[8px] mt-0.5 ${isSelected ? 'opacity-90 text-violet-100' : 'text-violet-500 font-bold'}`}>• Today</span>}
                      </button>
                    );
                  })}
                </div>

                {/* Date Input Shortcut */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-medium">Or pick date:</span>
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => {
                      if (e.target.value) {
                        setSelectedMonth(e.target.value);
                        setShowCalendarPicker(false);
                      }
                    }}
                    className="px-2 py-1 bg-slate-50 border border-slate-200/80 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20 cursor-pointer"
                  />
                </div>
              </div>
            </>
          )}
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
            <span className="text-slate-400 font-semibold">Spending Utilization</span>
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

      {/* Row 2: Category Budgets Settings */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display font-semibold text-slate-800 text-sm">Category Budgets</h3>
            <p className="text-[10px] text-slate-400 font-semibold uppercase">Set individual category monthly limits</p>
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

        {!budget ? (
          <div className="py-8 text-center text-xs text-slate-400 font-semibold">
            Please configure your overall monthly budget limit above to enable category budgets.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {categories.map((cat) => {
              const catBudget = categoryBudgets.find(cb => cb.category_id === cat.id);
              const catSpent = transactions
                .filter(t => t.category_id === cat.id)
                .reduce((sum, t) => sum + t.amount, 0);

              const percent = catBudget && catBudget.amount > 0 
                ? Math.round((catSpent / catBudget.amount) * 100) 
                : 0;

              const isEditing = editingCategoryBudgetId === cat.id;
              const IconComponent = getCategoryIcon(cat.icon);

              return (
                <div 
                  key={cat.id} 
                  className={`p-4 rounded-2xl border transition-all ${
                    catBudget 
                      ? 'border-slate-100 bg-slate-50/10' 
                      : 'border-dashed border-slate-200 hover:border-violet-300 bg-white'
                  }`}
                >
                  {/* Category Header */}
                  <div className="flex justify-between items-center gap-3">
                    <div className="flex items-center gap-2.5">
                      <div 
                        className="w-8.5 h-8.5 rounded-xl flex items-center justify-center border text-xs shrink-0" 
                        style={{ backgroundColor: `${cat.color}10`, borderColor: `${cat.color}20` }}
                      >
                        <IconComponent className="w-4.5 h-4.5" style={{ color: cat.color }} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800 leading-tight">{cat.name}</p>
                        {catBudget && (
                          <p className="text-[9px] text-slate-400 font-semibold mt-0.5 leading-none">
                            {user.currency}{catSpent.toLocaleString('en-IN')} spent
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Budget Actions / Forms */}
                    {isEditing ? (
                      <div className="flex items-center gap-1.5 animate-in slide-in-from-right-1 duration-150">
                        <div className="relative w-32 sm:w-36">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 font-display text-[10px] font-semibold">
                            {user.currency}
                          </span>
                          <input
                            type="number"
                            value={categoryLimitInput}
                            onChange={(e) => setCategoryLimitInput(e.target.value)}
                            className="w-full pl-5 pr-1 py-1 bg-white border border-slate-200/70 rounded-lg text-xs font-semibold font-display text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                            placeholder="Limit"
                            autoFocus
                          />
                        </div>
                        <button
                          onClick={() => handleSaveCategoryBudget(cat.id)}
                          className="p-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingCategoryBudgetId(null);
                            setCategoryLimitInput('');
                          }}
                          className="p-1 border border-slate-200 text-slate-400 rounded-lg hover:bg-slate-50 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : catBudget ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-extrabold text-slate-700 font-display">
                          {user.currency}{catBudget.amount.toLocaleString('en-IN')}
                        </span>
                        <button
                          onClick={() => {
                            setCategoryLimitInput(catBudget.amount.toString());
                            setEditingCategoryBudgetId(cat.id);
                          }}
                          className="p-1 text-slate-400 hover:text-violet-600 rounded-md hover:bg-violet-50 transition-colors cursor-pointer"
                          title="Edit category budget"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategoryBudget(cat.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Remove limit"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setCategoryLimitInput('');
                          setEditingCategoryBudgetId(cat.id);
                        }}
                        className="text-[10px] text-violet-600 hover:text-violet-700 font-bold flex items-center gap-0.5 hover:bg-violet-50/70 border border-violet-100 px-2.5 py-1 rounded-xl transition-all cursor-pointer"
                      >
                        + Set Limit
                      </button>
                    )}
                  </div>

                  {/* Category Progress Bar */}
                  {catBudget && (
                    <div className="mt-3.5 space-y-1">
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-300"
                          style={{ 
                            width: `${Math.min(100, percent)}%`,
                            backgroundColor: cat.color
                          }}
                        ></div>
                      </div>
                      <div className="flex justify-between items-center text-[9px] font-semibold text-slate-400">
                        <span>{percent}% Used</span>
                        {catSpent > catBudget.amount && (
                          <span className="text-rose-500 font-bold animate-pulse">Over Budget!</span>
                        )}
                      </div>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
