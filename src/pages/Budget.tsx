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
}

export const Budget: React.FC<BudgetProps> = ({ selectedMonth }) => {
  const { user } = useAuth();
  
  // Data states
  const [budget, setBudget] = useState<BudgetType | null>(null);
  const [categoryBudgets, setCategoryBudgets] = useState<CategoryBudget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Editing states
  const [editingOverall, setEditingOverall] = useState(false);
  const [overallLimitInput, setOverallLimitInput] = useState('');
  const [editingCategoryBudgetId, setEditingCategoryBudgetId] = useState<string | null>(null); // Category ID being edited
  const [categoryLimitInput, setCategoryLimitInput] = useState('');
  const [error, setError] = useState('');

  const loadData = async () => {
    if (!user) return;
    
    // Load categories
    const cats = await db.getCategories(user.id);
    setCategories(cats);

    // Load overall budget
    const bgt = await db.getBudget(user.id, selectedMonth);
    setBudget(bgt);
    if (bgt) {
      setOverallLimitInput(bgt.total_amount.toString());
      // Load category budgets
      const cb = await db.getCategoryBudgets(user.id, bgt.id);
      setCategoryBudgets(cb);
    } else {
      setOverallLimitInput('');
      setCategoryBudgets([]);
    }

    // Load transactions
    const txs = await db.getTransactions(user.id, selectedMonth);
    setTransactions(txs);
  };

  useEffect(() => {
    loadData();
  }, [user, selectedMonth]);

  if (!user) return null;

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
      
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 font-display">Budget</h2>
        <p className="text-xs text-slate-400 font-medium">Control your monthly spending pace and category limits.</p>
      </div>

      {error && (
        <div className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl p-3">
          {error}
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
              <p className="text-[10px] text-slate-400 font-semibold uppercase">This month</p>
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
                    className="w-full pl-7 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold font-display text-slate-800 focus:outline-hidden focus:border-violet-500 focus:bg-white"
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
                  className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-all"
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

          <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
            <span>{formatVal(totalSpent)} Spent</span>
            <span>{formatVal(overallRemaining)} Remaining</span>
          </div>
        </div>

      </div>

      {/* Row 2: Category Budgets Settings */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-4">
        <div>
          <h3 className="font-display font-semibold text-slate-800 text-sm">Category Budgets</h3>
          <p className="text-[10px] text-slate-400 font-semibold mt-0.5 uppercase">Set individual category monthly limits</p>
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
                        className="w-8.5 h-8.5 rounded-xl flex items-center justify-center border text-xs" 
                        style={{ backgroundColor: `${cat.color}10`, borderColor: `${cat.color}20` }}
                      >
                        <IconComponent className="w-4.5 h-4.5" style={{ color: cat.color }} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800 leading-tight">{cat.name}</p>
                        {catBudget && (
                          <p className="text-[9px] text-slate-400 font-semibold mt-0.5 leading-none">
                            {formatVal(catSpent)} spent
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Budget Actions / Forms */}
                    {isEditing ? (
                      <div className="flex items-center gap-1.5 animate-in slide-in-from-right-1 duration-150">
                        <div className="relative w-20">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 font-display text-[10px] font-semibold">
                            {user.currency}
                          </span>
                          <input
                            type="number"
                            value={categoryLimitInput}
                            onChange={(e) => setCategoryLimitInput(e.target.value)}
                            className="w-full pl-5 pr-1 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold font-display text-slate-800 focus:outline-hidden focus:border-violet-500"
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
                          {formatVal(catBudget.amount)}
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
                          title="Remove budget"
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
                        <Plus className="w-3.5 h-3.5" /> Set Budget
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

// Formatted value wrapper
const formatVal = (val: number) => {
  return `₹${val.toLocaleString('en-IN')}`;
};
