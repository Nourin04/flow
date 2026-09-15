import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/db';
import type { Budget as BudgetType, CategoryBudget, Category, Transaction, MonthlyIncome } from '../lib/types';
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
  Plus,
  ArrowRight,
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
  const [income, setIncome] = useState<MonthlyIncome | null>(null);
  const [incomeList, setIncomeList] = useState<MonthlyIncome[]>([]);
  const [budget, setBudget] = useState<BudgetType | null>(null);
  const [categoryBudgets, setCategoryBudgets] = useState<CategoryBudget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Editing states for Top Header Card
  const [editingIncome, setEditingIncome] = useState(false);
  const [incomeInput, setIncomeInput] = useState('');

  const [editingOverallBudget, setEditingOverallBudget] = useState(false);
  const [overallBudgetInput, setOverallBudgetInput] = useState('');

  // Editing states for Category Budgets
  const [editingCategoryBudgetId, setEditingCategoryBudgetId] = useState<string | null>(null);
  const [categoryLimitInput, setCategoryLimitInput] = useState('');

  // Income History Modal state
  const [showIncomeHistoryModal, setShowIncomeHistoryModal] = useState(false);
  const [editingHistoryMonth, setEditingHistoryMonth] = useState<string | null>(null);
  const [historyAmountInput, setHistoryAmountInput] = useState('');
  const [showAddMonthIncome, setShowAddMonthIncome] = useState(false);
  const [newMonthStr, setNewMonthStr] = useState('');
  const [newMonthAmount, setNewMonthAmount] = useState('');

  // Alerts
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

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

    // Load monthly income for selected month
    const inc = await db.getIncome(user.id, selectedMonth);
    setIncome(inc);
    setIncomeInput(inc ? inc.amount.toString() : '');

    // Load all historical income entries
    const allIncomes = db.getAllIncome(user.id);
    // Sort descending by month
    allIncomes.sort((a, b) => b.month.localeCompare(a.month));
    setIncomeList(allIncomes);

    // Load overall budget for selected month
    const bgt = await db.getBudget(user.id, selectedMonth);
    setBudget(bgt);
    setOverallBudgetInput(bgt ? bgt.total_amount.toString() : '');

    if (bgt) {
      const cb = await db.getCategoryBudgets(user.id, bgt.id);
      setCategoryBudgets(cb);
    } else {
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

  const formatMonthLabel = (mKey: string) => {
    try {
      const [year, monthNum] = mKey.split('-');
      const d = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
      return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } catch {
      return mKey;
    }
  };

  // Handlers for Top Card Income & Overall Budget
  const handleSaveIncome = async () => {
    setError('');
    const parsed = parseFloat(incomeInput);
    if (isNaN(parsed) || parsed < 0) {
      setError('Monthly income must be a valid number.');
      return;
    }
    try {
      await db.setIncome(user.id, selectedMonth, parsed);
      setEditingIncome(false);
      loadData();
      setSuccessMessage('Monthly income updated successfully.');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error(err);
      setError('Failed to update monthly income.');
    }
  };

  const handleSaveOverallBudget = async () => {
    setError('');
    const parsed = parseFloat(overallBudgetInput);
    if (isNaN(parsed) || parsed <= 0) {
      setError('Monthly budget must be a positive number.');
      return;
    }
    try {
      await db.setBudget(user.id, selectedMonth, parsed);
      setEditingOverallBudget(false);
      loadData();
      setSuccessMessage('Monthly budget updated successfully.');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error(err);
      setError('Failed to save monthly budget.');
    }
  };

  // Income History Modal Handlers
  const handleSaveHistoryEntry = async (monthKey: string) => {
    const parsed = parseFloat(historyAmountInput);
    if (isNaN(parsed) || parsed < 0) {
      setError('Income amount must be valid.');
      return;
    }
    try {
      await db.setIncome(user.id, monthKey, parsed);
      setEditingHistoryMonth(null);
      setHistoryAmountInput('');
      loadData();
    } catch (err) {
      console.error(err);
      setError('Failed to update income entry.');
    }
  };

  const handleCreateNewMonthIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!newMonthStr) {
      setError('Please select a month.');
      return;
    }
    const parsed = parseFloat(newMonthAmount);
    if (isNaN(parsed) || parsed < 0) {
      setError('Please enter a valid income amount.');
      return;
    }
    try {
      await db.setIncome(user.id, newMonthStr, parsed);
      setNewMonthStr('');
      setNewMonthAmount('');
      setShowAddMonthIncome(false);
      loadData();
    } catch (err) {
      console.error(err);
      setError('Failed to add new month income.');
    }
  };

  // Category Budget Handlers
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
      setError('Failed to save category budget.');
    }
  };

  const handleDeleteCategoryBudget = async (categoryId: string) => {
    if (!budget) return;
    try {
      await db.deleteCategoryBudget(user.id, budget.id, categoryId);
      loadData();
    } catch (err) {
      console.error(err);
      setError('Failed to delete category budget.');
    }
  };

  // Copy budget from previous month
  const handleCopyFromPreviousMonth = async () => {
    setError('');
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

      setSuccessMessage(`Budget successfully copied from ${formatMonthLabel(prevMonthStr)}!`);
      setTimeout(() => setSuccessMessage(''), 4000);
      loadData();
    } catch (err) {
      console.error(err);
      setError('Failed to copy budget from previous month.');
    }
  };

  // Calculations
  const overallLimit = budget ? budget.total_amount : 0;
  const totalSpent = transactions.filter(t => t.type !== 'income').reduce((sum, tx) => sum + tx.amount, 0);
  const remaining = Math.max(0, overallLimit - totalSpent);
  const usedPct = overallLimit > 0 ? Math.round((totalSpent / overallLimit) * 100) : 0;

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
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Plan your spending pipeline: Income → Budget → Spending → Remaining.
          </p>
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

          {/* Popover */}
          {showCalendarPicker && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowCalendarPicker(false)}
              />

              <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150 select-none">
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
                        className={`py-2 px-1 rounded-xl text-xs font-semibold flex flex-col items-center justify-center transition-all cursor-pointer ${isSelected
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

      {successMessage && (
        <div className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Main Budget Structure Card: Income -> Budget -> Spending -> Remaining */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs flex flex-col gap-6">

        {/* Card Header Label */}
        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
          <span className="font-display font-extrabold text-sm text-slate-800">
            {formatMonthLabel(selectedMonth)}
          </span>
          <button
            onClick={() => setShowIncomeHistoryModal(true)}
            className="text-xs text-violet-600 hover:text-violet-700 font-bold flex items-center gap-1 hover:underline cursor-pointer"
          >
            <span>Income History</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Top Row: Monthly Income & Monthly Budget */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

          {/* Monthly Income Tile */}
          <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-4 flex flex-col justify-between gap-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Monthly Income</span>
              {!editingIncome && (
                <button
                  onClick={() => setEditingIncome(true)}
                  className="text-xs text-violet-600 hover:text-violet-700 font-bold flex items-center gap-0.5 hover:underline cursor-pointer"
                >
                  ✎ Edit
                </button>
              )}
            </div>

            {editingIncome ? (
              <div className="flex items-center gap-2 mt-1">
                <div className="relative flex-1">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-display text-xs font-bold">
                    {user.currency}
                  </span>
                  <input
                    type="number"
                    value={incomeInput}
                    onChange={(e) => setIncomeInput(e.target.value)}
                    className="w-full pl-6 pr-2 py-1 bg-white border border-slate-200 rounded-lg text-sm font-extrabold font-display text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                    placeholder="e.g. 10000"
                    autoFocus
                  />
                </div>
                <button
                  onClick={handleSaveIncome}
                  className="p-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setEditingIncome(false);
                    setIncomeInput(income ? income.amount.toString() : '');
                  }}
                  className="p-1.5 border border-slate-200 text-slate-400 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="text-2xl font-extrabold text-slate-900 font-display mt-1">
                {income ? `${user.currency}${income.amount.toLocaleString('en-IN')}` : `${user.currency}0`}
              </div>
            )}
          </div>

          {/* Monthly Budget Tile */}
          <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-4 flex flex-col justify-between gap-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Monthly Budget</span>
              {!editingOverallBudget && (
                <button
                  onClick={() => setEditingOverallBudget(true)}
                  className="text-xs text-violet-600 hover:text-violet-700 font-bold flex items-center gap-0.5 hover:underline cursor-pointer"
                >
                  ✎ Edit
                </button>
              )}
            </div>

            {editingOverallBudget ? (
              <div className="flex items-center gap-2 mt-1">
                <div className="relative flex-1">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-display text-xs font-bold">
                    {user.currency}
                  </span>
                  <input
                    type="number"
                    value={overallBudgetInput}
                    onChange={(e) => setOverallBudgetInput(e.target.value)}
                    className="w-full pl-6 pr-2 py-1 bg-white border border-slate-200 rounded-lg text-sm font-extrabold font-display text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                    placeholder="e.g. 8000"
                    autoFocus
                  />
                </div>
                <button
                  onClick={handleSaveOverallBudget}
                  className="p-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setEditingOverallBudget(false);
                    setOverallBudgetInput(budget ? budget.total_amount.toString() : '');
                  }}
                  className="p-1.5 border border-slate-200 text-slate-400 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="text-2xl font-extrabold text-slate-900 font-display mt-1">
                {budget ? `${user.currency}${budget.total_amount.toLocaleString('en-IN')}` : 'Not set'}
              </div>
            )}
          </div>

        </div>

        {/* Divider */}
        <hr className="border-slate-100" />

        {/* Bottom Row: Spending & Remaining */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Spending</span>
            <div className="text-2xl font-extrabold text-slate-900 font-display mt-1">
              {user.currency}{totalSpent.toLocaleString('en-IN')}
            </div>
          </div>

          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Remaining</span>
            <div className="text-2xl font-extrabold text-emerald-600 font-display mt-1">
              {user.currency}{remaining.toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        {/* Progress Bar & Percentage */}
        <div className="space-y-2 pt-1">
          <div className="h-3.5 w-full bg-slate-100 rounded-full overflow-hidden p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-500 ${usedPct > 100
                ? 'bg-rose-500'
                : usedPct > 90
                  ? 'bg-amber-500'
                  : 'bg-violet-600'
                }`}
              style={{ width: `${Math.min(100, usedPct)}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-xs font-bold text-slate-500">
            <span>{totalSpent.toLocaleString('en-IN')} / {overallLimit > 0 ? overallLimit.toLocaleString('en-IN') : '0'}</span>
            <span className="font-display text-slate-700">{usedPct}%</span>
          </div>
        </div>

      </div>

      {/* Setup Budget Helper Card (If no budget set) */}
      {!budget && (
        <div className="bg-white border border-dashed border-violet-200/80 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0 border border-violet-100/80">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-slate-900 text-sm">
                Setup Budget for {formatMonthLabel(selectedMonth)}
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Establish your spending limit to keep your monthly finances on track.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={handleCopyFromPreviousMonth}
              className="px-3.5 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer select-none"
            >
              <Copy className="w-3.5 h-3.5 text-slate-400" />
              <span>Copy Previous Month</span>
            </button>
            <button
              onClick={() => {
                setOverallBudgetInput('8000');
                setEditingOverallBudget(true);
              }}
              className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl px-4 py-2 text-xs font-bold shadow-md shadow-violet-100 flex items-center gap-1 active:scale-98 transition-all cursor-pointer select-none"
            >
              + Set Budget
            </button>
          </div>
        </div>
      )}

      {/* Category Budgets Section */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display font-semibold text-slate-800 text-sm">Category Budgets</h3>
            <p className="text-[10px] text-slate-400 font-semibold ">Set individual category monthly limits</p>
          </div>

          {/* {budget && (
            <button
              onClick={handleCopyFromPreviousMonth}
              className="text-xs text-violet-600 hover:text-violet-700 font-bold flex items-center gap-1.5 cursor-pointer hover:underline"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Allocations</span>
            </button>
          )} */}
        </div>

        {!budget ? (
          <div className="py-8 text-center text-xs text-slate-400 font-semibold">
            Please configure your monthly budget above to enable category budgets.
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
                  className={`p-4 rounded-2xl border transition-all ${catBudget
                    ? 'border-slate-100 bg-slate-50/10'
                    : 'border-dashed border-slate-200 hover:border-violet-300 bg-white'
                    }`}
                >
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

                    {isEditing ? (
                      <div className="flex items-center gap-1.5 animate-in slide-in-from-right-1 duration-150">
                        <div className="relative w-28">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 font-display text-[10px] font-semibold">
                            {user.currency}
                          </span>
                          <input
                            type="number"
                            value={categoryLimitInput}
                            onChange={(e) => setCategoryLimitInput(e.target.value)}
                            className="w-full pl-5 pr-1 py-1 bg-white border border-slate-200/70 rounded-lg text-xs font-semibold font-display text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
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
                          title="Edit limit"
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

                  {catBudget && (
                    <div className="mt-3.5 space-y-1">
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(100, percent)}%`,
                            backgroundColor: cat.color
                          }}
                        />
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

      {/* Income History Modal / Drawer */}
      {showIncomeHistoryModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">

            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-display">Income History</h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Historical earnings log by month.</p>
              </div>
              <button
                onClick={() => {
                  setShowIncomeHistoryModal(false);
                  setEditingHistoryMonth(null);
                  setShowAddMonthIncome(false);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Add Month Trigger */}
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Monthly Records</span>
              <button
                onClick={() => setShowAddMonthIncome(!showAddMonthIncome)}
                className="text-xs text-violet-600 hover:text-violet-700 font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                {showAddMonthIncome ? 'Cancel' : 'Add Month'}
              </button>
            </div>

            {/* Add New Month Form */}
            {showAddMonthIncome && (
              <form onSubmit={handleCreateNewMonthIncome} className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Month</label>
                    <input
                      type="month"
                      value={newMonthStr}
                      onChange={(e) => setNewMonthStr(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Income ({user.currency})</label>
                    <input
                      type="number"
                      value={newMonthAmount}
                      onChange={(e) => setNewMonthAmount(e.target.value)}
                      placeholder="e.g. 10000"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800"
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                  >
                    Save Entry
                  </button>
                </div>
              </form>
            )}

            {/* Income History List */}
            <div className="max-h-64 overflow-y-auto divide-y divide-slate-50 pr-1">
              {incomeList.length > 0 ? (
                incomeList.map((inc) => {
                  const isEditingThis = editingHistoryMonth === inc.month;
                  return (
                    <div key={inc.month} className="flex justify-between items-center py-3">
                      <div>
                        <span className="text-xs font-bold text-slate-800">{formatMonthLabel(inc.month)}</span>
                        {inc.month === selectedMonth && (
                          <span className="ml-2 text-[9px] font-bold text-violet-600 bg-violet-50 border border-violet-100 px-1.5 py-0.5 rounded-md">
                            Selected
                          </span>
                        )}
                      </div>

                      {isEditingThis ? (
                        <div className="flex items-center gap-1.5">
                          <div className="relative w-24">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 font-display text-[10px] font-bold">
                              {user.currency}
                            </span>
                            <input
                              type="number"
                              value={historyAmountInput}
                              onChange={(e) => setHistoryAmountInput(e.target.value)}
                              className="w-full pl-5 pr-1 py-1 bg-white border border-slate-200 rounded-md text-xs font-bold focus:outline-none"
                              autoFocus
                            />
                          </div>
                          <button
                            onClick={() => handleSaveHistoryEntry(inc.month)}
                            className="p-1 bg-emerald-500 text-white rounded-md cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingHistoryMonth(null);
                              setHistoryAmountInput('');
                            }}
                            className="p-1 border border-slate-200 text-slate-400 rounded-md cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-4">
                          <span className="text-xs font-extrabold text-slate-900 font-display">
                            {user.currency}{inc.amount.toLocaleString('en-IN')}
                          </span>
                          <button
                            onClick={() => {
                              setEditingHistoryMonth(inc.month);
                              setHistoryAmountInput(inc.amount.toString());
                            }}
                            className="text-xs text-violet-600 hover:text-violet-700 font-bold hover:underline cursor-pointer"
                          >
                            Edit
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="py-6 text-center text-xs text-slate-400 font-medium">
                  No historical income records found.
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowIncomeHistoryModal(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
