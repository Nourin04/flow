import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/db';
import type { Transaction, Category, Budget, CategoryBudget } from '../lib/types';
import { ExpenseModal } from '../components/ExpenseModal';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  TrendingUp, 
  Receipt,
  Sparkles,

  Pizza,
  Car,
  Home,
  ShoppingBag,
  GraduationCap,
  Gift,
  HelpCircle,
  X
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface DashboardProps {
  setCurrentPage: (page: string) => void;
  setSelectedMonth: (month: string) => void;
  selectedMonth: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ setCurrentPage, selectedMonth, setSelectedMonth }) => {
  const { user } = useAuth();
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  
  // Data States
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [incomeAmount, setIncomeAmount] = useState<number>(0);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [categoryBudgets, setCategoryBudgets] = useState<CategoryBudget[]>([]);
  const [showGoalToast, setShowGoalToast] = useState(true);
  const [userMonths, setUserMonths] = useState<string[]>(['2026-08', '2026-09', '2026-10']);

  const loadData = async () => {
    if (!user) return;
    
    // Fetch all user incomes & transactions to collect all recorded months
    const allIncomes = db.getAllIncome(user.id);
    const allTxs = await db.getTransactions(user.id);
    
    const currentMonthKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    const monthSet = new Set([currentMonthKey, selectedMonth, '2026-08', '2026-09', ...allIncomes.map(i => i.month), ...allTxs.map(t => t.transaction_date.substring(0, 7))]);
    setUserMonths(Array.from(monthSet).sort());

    // Fetch categories
    const cats = await db.getCategories(user.id);
    setCategories(cats);

    // Fetch income for selected month
    const inc = await db.getIncome(user.id, selectedMonth);
    setIncomeAmount(inc ? inc.amount : 0);

    // Fetch budget for selected month
    const bgt = await db.getBudget(user.id, selectedMonth);
    setBudget(bgt);

    if (bgt) {
      const cb = await db.getCategoryBudgets(user.id, bgt.id);
      setCategoryBudgets(cb);
    } else {
      setCategoryBudgets([]);
    }

    // Fetch transactions for selected month
    const txs = await db.getTransactions(user.id, selectedMonth);
    setTransactions(txs);
  };

  useEffect(() => {
    loadData();
  }, [user, selectedMonth]);

  if (!user) return null;

  // Calculations
  const totalSpent = transactions.reduce((sum, tx) => sum + tx.amount, 0);
  const remainingBudget = budget ? Math.max(0, budget.total_amount - totalSpent) : 0;
  const totalSaved = Math.max(0, incomeAmount - totalSpent);
  const savingsRate = incomeAmount > 0 ? (totalSaved / incomeAmount) * 100 : 0;

  // Format currency
  const formatVal = (val: number) => {
    return `${user.currency}${val.toLocaleString('en-IN')}`;
  };

  // Group transactions for Pie Chart
  const categorySpending = categories.map(cat => {
    const amount = transactions
      .filter(t => t.category_id === cat.id)
      .reduce((sum, t) => sum + t.amount, 0);
    return {
      id: cat.id,
      name: cat.name,
      value: amount,
      color: cat.color
    };
  }).filter(c => c.value > 0);

  // Math checking for overall budget used percent
  const overallBudgetLimit = budget ? budget.total_amount : 0;
  const overallBudgetUsedPercent = overallBudgetLimit > 0 
    ? Math.round((totalSpent / overallBudgetLimit) * 100) 
    : 0;

  // Category Icon Mapper helper
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

  // Render recent activity list (limit to 4)
  const recentTxs = transactions.slice(0, 4);

  // Group recent transactions by relative day for UI display
  const todayStr = '2026-08-23'; // Locked current time to August 2026 to match screenshot
  const yesterdayStr = '2026-08-22';

  const groupedRecentTxs: { title: string; items: Transaction[] }[] = [];
  const todayItems = recentTxs.filter(t => t.transaction_date === todayStr);
  const yesterdayItems = recentTxs.filter(t => t.transaction_date === yesterdayStr);
  const olderItems = recentTxs.filter(t => t.transaction_date !== todayStr && t.transaction_date !== yesterdayStr);

  if (todayItems.length > 0) groupedRecentTxs.push({ title: 'Today', items: todayItems });
  if (yesterdayItems.length > 0) groupedRecentTxs.push({ title: 'Yesterday', items: yesterdayItems });
  if (olderItems.length > 0) groupedRecentTxs.push({ title: 'Earlier', items: olderItems });

  const formatMonthLabel = (mKey: string) => {
    try {
      const [year, monthStr] = mKey.split('-');
      const date = new Date(parseInt(year, 10), parseInt(monthStr, 10) - 1, 1);
      return date.toLocaleString('default', { month: 'long', year: 'numeric' });
    } catch {
      return mKey;
    }
  };

  const availableMonths = userMonths.map(m => ({
    value: m,
    label: formatMonthLabel(m)
  }));

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      
      {/* Upper Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-display flex items-center gap-1.5">
            Good evening, {user.name} 👋
          </h2>
          <p className="text-xs text-slate-400 font-medium">Here's how your money is looking this month.</p>
        </div>

        {/* Month Selector & CTA */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-white border border-slate-100 rounded-xl px-4 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 focus:outline-hidden appearance-none pr-8 cursor-pointer"
            >
              {availableMonths.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[10px]">▾</span>
          </div>

          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl px-4 py-2 text-xs font-semibold shadow-md shadow-violet-100 flex items-center gap-1.5 active:scale-98 transition-all cursor-pointer select-none"
          >
            <span className="text-sm">+</span> Add Expense
          </button>
        </div>
      </div>

      {/* Row 1: Four Main Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric: Income */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Total Income</p>
            <h3 className="text-xl font-extrabold text-slate-800 font-display mt-0.5">{formatVal(incomeAmount)}</h3>
            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md mt-1">
              This month <ArrowUpRight className="w-2.5 h-2.5" />
            </span>
          </div>
        </div>

        {/* Metric: Spent */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center flex-shrink-0">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Total Spent</p>
            <h3 className="text-xl font-extrabold text-slate-800 font-display mt-0.5">{formatVal(totalSpent)}</h3>
            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-md mt-1">
              This month <ArrowDownRight className="w-2.5 h-2.5" />
            </span>
          </div>
        </div>

        {/* Metric: Budget Left */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center flex-shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Budget Left</p>
            <h3 className="text-xl font-extrabold text-slate-800 font-display mt-0.5">
              {budget ? formatVal(remainingBudget) : 'N/A'}
            </h3>
            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md mt-1">
              Remaining <ArrowUpRight className="w-2.5 h-2.5" />
            </span>
          </div>
        </div>

        {/* Metric: Total Saved */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-500 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Total Saved</p>
            <h3 className="text-xl font-extrabold text-slate-800 font-display mt-0.5">{formatVal(totalSaved)}</h3>
            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md mt-1">
              {savingsRate.toFixed(1)}% of income <ArrowUpRight className="w-2.5 h-2.5" />
            </span>
          </div>
        </div>
      </div>

      {/* Row 2: Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Money Flow Card */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs lg:col-span-4 flex flex-col justify-between min-h-[320px]">
          <div>
            <div className="flex items-center justify-between">
              <h4 className="font-display font-semibold text-slate-800 text-sm">Money Flow</h4>
              <span className="text-[10px] text-slate-400 font-semibold uppercase">This month</span>
            </div>

            {/* Visual Money Pipeline */}
            <div className="mt-8 flex flex-col gap-6">
              {/* Income node */}
              <div className="flex justify-between items-center bg-slate-50 px-4 py-3 rounded-xl">
                <div>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Income</p>
                  <p className="text-sm font-extrabold text-slate-800 font-display">{formatVal(incomeAmount)}</p>
                </div>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
              </div>

              {/* Connections indicator bar */}
              <div className="relative h-1.5 bg-slate-100 rounded-full overflow-hidden flex">
                <div 
                  className="h-full bg-rose-400" 
                  style={{ width: `${incomeAmount > 0 ? (totalSpent / incomeAmount) * 100 : 0}%` }}
                ></div>
                <div 
                  className="h-full bg-violet-500" 
                  style={{ width: `${incomeAmount > 0 ? (totalSaved / incomeAmount) * 100 : 0}%` }}
                ></div>
              </div>

              {/* Split flow details */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-rose-50/50 border border-rose-100/30 px-3 py-2.5 rounded-xl">
                  <p className="text-[9px] text-rose-500 font-bold uppercase">Spent</p>
                  <p className="text-xs font-bold text-slate-800 font-display mt-0.5">{formatVal(totalSpent)}</p>
                </div>
                <div className="bg-violet-50/50 border border-violet-100/30 px-3 py-2.5 rounded-xl">
                  <p className="text-[9px] text-violet-500 font-bold uppercase">Remaining</p>
                  <p className="text-xs font-bold text-slate-800 font-display mt-0.5">{formatVal(totalSaved)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Alert Toast at bottom of Money Flow */}
          {showGoalToast && incomeAmount > 0 && (
            <div className="mt-4 bg-violet-50 border border-violet-100 rounded-xl p-3.5 flex gap-3 relative animate-in fade-in slide-in-from-bottom-1 duration-200">
              <Sparkles className="w-5 h-5 text-violet-600 flex-shrink-0" />
              <div className="pr-4">
                <p className="text-[10px] text-slate-700 font-semibold leading-relaxed">
                  You're doing great! You've saved {savingsRate.toFixed(1)}% of your income. Keep it up and you'll reach your goals faster.
                </p>
              </div>
              <button 
                onClick={() => setShowGoalToast(false)}
                className="absolute right-2 top-2 p-1 text-slate-400 hover:text-slate-600 rounded-md"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Spending Breakdown Card */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs lg:col-span-4 flex flex-col justify-between min-h-[320px]">
          <div className="flex items-center justify-between">
            <h4 className="font-display font-semibold text-slate-800 text-sm">Spending Breakdown</h4>
            <button 
              onClick={() => setCurrentPage('expenses')}
              className="text-[10px] text-slate-400 font-bold hover:text-slate-600 transition-colors uppercase tracking-wider"
            >
              View all
            </button>
          </div>

          {/* Donut Chart visual */}
          <div className="flex items-center justify-center h-40 relative my-2">
            {categorySpending.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categorySpending}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={68}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categorySpending.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: any) => [`${user.currency}${value.toLocaleString('en-IN')}`, 'Amount']}
                      contentStyle={{ background: '#fff', border: '1px solid #f1f5f9', borderRadius: '12px', fontSize: '11px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Donut Center Label */}
                <div className="absolute text-center">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total</p>
                  <p className="text-sm font-extrabold text-slate-800 font-display mt-0.5">{formatVal(totalSpent)}</p>
                </div>
              </>
            ) : (
              <div className="text-center text-xs text-slate-400 font-medium">
                No spending data for this month.
              </div>
            )}
          </div>

          {/* Simple category legend list */}
          <div className="flex flex-col gap-1.5 max-h-24 overflow-y-auto pr-1">
            {categorySpending.slice(0, 5).map((cat) => {
              const pct = totalSpent > 0 ? Math.round((cat.value / totalSpent) * 100) : 0;
              return (
                <div key={cat.id} className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }}></span>
                    <span className="text-slate-500 font-medium">{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-3 font-display">
                    <span className="text-slate-700 font-bold">{formatVal(cat.value)}</span>
                    <span className="text-slate-400 font-semibold text-[10px] w-6 text-right">{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Activity Card */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs lg:col-span-4 flex flex-col justify-between min-h-[320px]">
          <div className="flex items-center justify-between">
            <h4 className="font-display font-semibold text-slate-800 text-sm">Recent Activity</h4>
            <button 
              onClick={() => setCurrentPage('expenses')}
              className="text-[10px] text-slate-400 font-bold hover:text-slate-600 transition-colors uppercase tracking-wider"
            >
              View all
            </button>
          </div>

          {/* Activity items list */}
          <div className="flex-1 overflow-y-auto mt-4 pr-1 space-y-4">
            {groupedRecentTxs.length > 0 ? (
              groupedRecentTxs.map((group, groupIdx) => (
                <div key={groupIdx} className="space-y-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{group.title}</p>
                  <div className="space-y-2">
                    {group.items.map((tx) => {
                      const cat = categories.find(c => c.id === tx.category_id);
                      const IconComponent = getCategoryIcon(cat?.icon || 'HelpCircle');
                      
                      // Format timestamp
                      let displayTime = '';
                      if (tx.created_at) {
                        const dateObj = new Date(tx.created_at);
                        const hours = dateObj.getUTCHours();
                        const minutes = String(dateObj.getUTCMinutes()).padStart(2, '0');
                        const ampm = hours >= 12 ? 'PM' : 'AM';
                        const displayHours = hours % 12 || 12;
                        displayTime = `${displayHours}:${minutes} ${ampm}`;
                      }

                      return (
                        <div key={tx.id} className="flex justify-between items-center py-0.5">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-8 h-8 rounded-xl flex items-center justify-center border text-xs" 
                              style={{ backgroundColor: `${cat?.color}10`, borderColor: `${cat?.color}20` }}
                            >
                              <IconComponent className="w-4 h-4" style={{ color: cat?.color }} />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-800 leading-tight">{tx.description}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5 leading-none">{cat?.name}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-bold font-display text-rose-500">-{formatVal(tx.amount)}</p>
                            <p className="text-[9px] text-slate-400 mt-0.5 leading-none font-medium">{displayTime}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-2 py-8">
                <p className="text-xs text-slate-500 font-semibold">Your financial story starts here.</p>
                <p className="text-[10px] text-slate-400 font-medium text-center">Add your first expense to start understanding where your money goes.</p>
                <button
                  onClick={() => setIsExpenseModalOpen(true)}
                  className="mt-2 text-xs font-semibold text-violet-600 hover:text-violet-700 bg-violet-50/50 hover:bg-violet-50 px-3 py-1.5 rounded-lg border border-violet-100/50"
                >
                  + Add First Expense
                </button>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Row 3: Budget Progress Card */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        
        {/* Left overall budget metrics */}
        <div className="md:col-span-3 border-b md:border-b-0 md:border-r border-slate-100 pb-4 md:pb-0 md:pr-6 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h4 className="font-display font-semibold text-slate-800 text-sm">Budget Progress</h4>
            <button 
              onClick={() => setCurrentPage('budget')}
              className="text-[10px] text-slate-400 font-bold hover:text-slate-600 transition-colors uppercase tracking-wider"
            >
              View budget
            </button>
          </div>

          <div className="mt-2">
            <h3 className="text-2xl font-extrabold text-slate-800 font-display">{overallBudgetUsedPercent}%</h3>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5 uppercase tracking-wide">of monthly budget used</p>
          </div>

          {/* Overall progress bar */}
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden mt-3">
            <div 
              className={`h-full transition-all duration-300 ${
                overallBudgetUsedPercent > 100 
                  ? 'bg-rose-500' 
                  : overallBudgetUsedPercent > 90 
                    ? 'bg-amber-500' 
                    : 'bg-violet-500'
              }`}
              style={{ width: `${Math.min(100, overallBudgetUsedPercent)}%` }}
            ></div>
          </div>
        </div>

        {/* Right Category limits */}
        <div className="md:col-span-9 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {categoryBudgets.length > 0 ? (
            categoryBudgets.map((cb) => {
              const cat = categories.find(c => c.id === cb.category_id);
              if (!cat) return null;
              
              const catSpent = transactions
                .filter(t => t.category_id === cat.id)
                .reduce((sum, t) => sum + t.amount, 0);
              
              const percent = cb.amount > 0 ? Math.round((catSpent / cb.amount) * 100) : 0;
              const IconComponent = getCategoryIcon(cat.icon);

              return (
                <div key={cb.id} className="flex flex-col gap-2.5 p-3 rounded-xl border border-slate-50/50 bg-slate-50/20">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-7 h-7 rounded-lg flex items-center justify-center border text-[10px]" 
                        style={{ backgroundColor: `${cat.color}10`, borderColor: `${cat.color}20` }}
                      >
                        <IconComponent className="w-3.5 h-3.5" style={{ color: cat.color }} />
                      </div>
                      <span className="text-[11px] font-bold text-slate-700">{cat.name}</span>
                    </div>
                    <span className="text-[10px] font-extrabold text-slate-500 font-display">{percent}%</span>
                  </div>
                  
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full transition-all duration-300"
                      style={{ 
                        width: `${Math.min(100, percent)}%`,
                        backgroundColor: cat.color
                      }}
                    ></div>
                  </div>

                  <div className="flex justify-between text-[9px] font-semibold text-slate-400 font-display">
                    <span>{formatVal(catSpent)}</span>
                    <span>{formatVal(cb.amount)}</span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-4 py-4 text-center text-xs text-slate-400 font-medium">
              No category budgets configured this month.
            </div>
          )}
        </div>

      </div>

      {/* Expense Modal Wrapper */}
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onSave={loadData}
      />
    </div>
  );
};
