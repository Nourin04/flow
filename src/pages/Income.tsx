import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/db';
import { errorMessage } from '../lib/errors';
import type { Transaction, Category, MonthlyIncome } from '../lib/types';
import { ExpenseModal } from '../components/ExpenseModal';
import { MonthPicker } from '../components/MonthPicker';
import { LoadError } from '../components/LoadError';
import { StatCardsSkeleton, PanelsSkeleton, ListSkeleton } from '../components/Skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  Briefcase,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Edit2,
  Trash2,
  Check,
  X,
  Plus,
  Pizza,
  Car,
  Home,
  ShoppingBag,
  GraduationCap,
  Gift,
  HelpCircle,
} from 'lucide-react';

interface IncomeProps {
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
}

// Chart series colors (validated pair: violet = salary, emerald = extra income)
const SALARY_COLOR = '#7c3aed';
const EXTRA_COLOR = '#10b981';

const monthLabel = (mKey: string, style: 'long' | 'short' = 'long') => {
  const [y, m] = mKey.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-IN', style === 'long'
    ? { month: 'long', year: 'numeric' }
    : { month: 'short', year: '2-digit' });
};

/** YYYY-MM shifted by `delta` months. */
const shiftMonth = (mKey: string, delta: number) => {
  const [y, m] = mKey.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const getCategoryIcon = (iconName?: string) => {
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

export const Income: React.FC<IncomeProps> = ({ selectedMonth, setSelectedMonth }) => {
  const { user } = useAuth();

  // Data — loaded once for all months; switching month is instant
  const [salaries, setSalaries] = useState<MonthlyIncome[]>([]);
  const [incomeTxs, setIncomeTxs] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Salary editing (top card)
  const [editingSalary, setEditingSalary] = useState(false);
  const [salaryInput, setSalaryInput] = useState('');

  // Salary history table editing
  const [editingMonth, setEditingMonth] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [showAddMonth, setShowAddMonth] = useState(false);
  const [newMonth, setNewMonth] = useState('');
  const [newAmount, setNewAmount] = useState('');

  // Extra income entries
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [txToEdit, setTxToEdit] = useState<Transaction | null>(null);
  const [txToDelete, setTxToDelete] = useState<string | null>(null);

  const [actionError, setActionError] = useState('');

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const [incomes, txs, cats] = await Promise.all([
        db.getAllIncome(user.id),
        db.getTransactions(user.id),
        db.getCategories(user.id),
      ]);
      setSalaries(incomes);
      setIncomeTxs(txs.filter(t => t.type === 'income'));
      setCategories(cats);
      setLoadError('');
    } catch (err) {
      console.error(err);
      setLoadError(errorMessage(err, 'Failed to load your income.'));
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!user) return null;

  const fmt = (v: number) => `${user.currency}${v.toLocaleString('en-IN')}`;

  // ----- Derived numbers -----
  const salaryFor = (mKey: string) => salaries.find(s => s.month === mKey)?.amount ?? 0;
  const extraFor = (mKey: string) =>
    incomeTxs.filter(t => t.transaction_date.startsWith(mKey)).reduce((sum, t) => sum + t.amount, 0);

  const salary = salaryFor(selectedMonth);
  const hasSalary = salaries.some(s => s.month === selectedMonth);
  const monthExtraTxs = incomeTxs.filter(t => t.transaction_date.startsWith(selectedMonth));
  const extra = extraFor(selectedMonth);
  const total = salary + extra;

  const prevMonth = shiftMonth(selectedMonth, -1);
  const prevTotal = salaryFor(prevMonth) + extraFor(prevMonth);
  const changePct = prevTotal > 0 ? ((total - prevTotal) / prevTotal) * 100 : null;

  // Last 12 months ending at the selected month
  const chartData = Array.from({ length: 12 }, (_, i) => {
    const mKey = shiftMonth(selectedMonth, i - 11);
    return { month: mKey, label: monthLabel(mKey, 'short'), salary: salaryFor(mKey), extra: extraFor(mKey) };
  });
  const hasChartData = chartData.some(d => d.salary > 0 || d.extra > 0);

  // ----- Actions -----
  const run = async (action: () => Promise<unknown>, fallback: string) => {
    setActionError('');
    try {
      await action();
      await loadData();
      return true;
    } catch (err) {
      console.error(err);
      setActionError(errorMessage(err, fallback));
      return false;
    }
  };

  const parseAmount = (raw: string) => {
    const n = parseFloat(raw);
    if (isNaN(n) || n < 0) {
      setActionError('Please enter a valid amount (0 or more).');
      return null;
    }
    return n;
  };

  const saveSalary = async () => {
    const amount = parseAmount(salaryInput);
    if (amount === null) return;
    if (await run(() => db.setIncome(user.id, selectedMonth, amount), 'Failed to save salary.')) {
      setEditingSalary(false);
    }
  };

  const saveHistoryRow = async (mKey: string) => {
    const amount = parseAmount(editAmount);
    if (amount === null) return;
    if (await run(() => db.setIncome(user.id, mKey, amount), 'Failed to update salary.')) {
      setEditingMonth(null);
    }
  };

  const addMonth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMonth) {
      setActionError('Please pick a month.');
      return;
    }
    const amount = parseAmount(newAmount);
    if (amount === null) return;
    if (await run(() => db.setIncome(user.id, newMonth, amount), 'Failed to add salary.')) {
      setShowAddMonth(false);
      setNewMonth('');
      setNewAmount('');
    }
  };

  const deleteExtra = async (txId: string) => {
    await run(() => db.deleteTransaction(user.id, txId), 'Failed to delete entry.');
    setTxToDelete(null);
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-display">Income</h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Your monthly salary and every bit of extra money you earn.</p>
        </div>
        <div className="flex items-center gap-2">
          <MonthPicker selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth} />
          <button
            onClick={() => { setTxToEdit(null); setIsModalOpen(true); }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-3.5 py-2 text-xs font-semibold shadow-md shadow-emerald-100 flex items-center gap-1.5 active:scale-98 transition-all cursor-pointer select-none"
          >
            <span className="text-sm">+</span> Add Money Gained
          </button>
        </div>
      </div>

      {loadError && <LoadError message={loadError} onRetry={loadData} />}
      {actionError && (
        <div className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl p-3 flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError('')} className="text-rose-400 hover:text-rose-600 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {isLoading ? (
        <>
          <StatCardsSkeleton count={3} />
          <PanelsSkeleton count={1} className="grid grid-cols-1" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ListSkeleton rows={4} />
            <ListSkeleton rows={4} />
          </div>
        </>
      ) : (
        <>
          {/* Row 1: Salary / Extra / Total */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Salary (editable) */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
                <Briefcase className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Salary</p>
                {editingSalary ? (
                  <div className="flex items-center gap-1.5 mt-1">
                    <input
                      type="number"
                      inputMode="decimal"
                      value={salaryInput}
                      onChange={(e) => setSalaryInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') saveSalary(); if (e.key === 'Escape') setEditingSalary(false); }}
                      autoFocus
                      className="w-full min-w-0 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                    />
                    <button onClick={saveSalary} className="p-1.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 cursor-pointer" title="Save">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setEditingSalary(false)} className="p-1.5 border border-slate-200 text-slate-500 rounded-lg hover:bg-slate-50 cursor-pointer" title="Cancel">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mt-0.5">
                      <h3 className="text-xl font-extrabold text-slate-800 font-display">{fmt(salary)}</h3>
                      <button
                        onClick={() => { setSalaryInput(hasSalary ? String(salary) : ''); setEditingSalary(true); }}
                        className="p-1 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-md cursor-pointer"
                        title={hasSalary ? 'Edit salary' : 'Set salary'}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-[10px] font-semibold text-slate-400 mt-1">
                      {hasSalary ? monthLabel(selectedMonth) : 'Not set for this month'}
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Extra income */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Extra Income</p>
                <h3 className="text-xl font-extrabold text-slate-800 font-display mt-0.5">{fmt(extra)}</h3>
                <p className="text-[10px] font-semibold text-slate-400 mt-1">
                  {monthExtraTxs.length} {monthExtraTxs.length === 1 ? 'entry' : 'entries'} this month
                </p>
              </div>
            </div>

            {/* Total */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Total Income</p>
                <h3 className="text-xl font-extrabold text-slate-800 font-display mt-0.5">{fmt(total)}</h3>
                {changePct === null ? (
                  <p className="text-[10px] font-semibold text-slate-400 mt-1">No income last month to compare</p>
                ) : (
                  <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md mt-1 ${
                    changePct >= 0 ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'
                  }`}>
                    {changePct >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {changePct >= 0 ? '+' : ''}{changePct.toFixed(1)}% vs {monthLabel(prevMonth, 'short')}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Row 2: 12-month chart */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="font-display font-semibold text-slate-800 text-sm">Income over the last 12 months</h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Up to {monthLabel(selectedMonth)}</p>
              </div>
              {/* Legend */}
              <div className="flex items-center gap-4 text-[11px] font-semibold text-slate-600">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: SALARY_COLOR }} />Salary</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: EXTRA_COLOR }} />Extra income</span>
              </div>
            </div>

            <div className="h-64">
              {hasChartData ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                    <YAxis
                      tick={{ fontSize: 10, fill: '#94a3b8' }}
                      axisLine={false}
                      tickLine={false}
                      width={48}
                      tickFormatter={(v: number) => v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)}
                    />
                    <Tooltip
                      cursor={{ fill: '#f8fafc' }}
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0].payload as (typeof chartData)[number];
                        return (
                          <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-3 py-2 text-[11px] space-y-1">
                            <p className="font-bold text-slate-800">{monthLabel(d.month)}</p>
                            <p className="flex items-center gap-1.5 text-slate-600">
                              <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: SALARY_COLOR }} />Salary: <b className="text-slate-800">{fmt(d.salary)}</b>
                            </p>
                            <p className="flex items-center gap-1.5 text-slate-600">
                              <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: EXTRA_COLOR }} />Extra: <b className="text-slate-800">{fmt(d.extra)}</b>
                            </p>
                            <p className="pt-1 border-t border-slate-100 text-slate-600">Total: <b className="text-slate-900">{fmt(d.salary + d.extra)}</b></p>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="salary" stackId="income" fill={SALARY_COLOR} stroke="#ffffff" strokeWidth={2} maxBarSize={28} />
                    <Bar dataKey="extra" stackId="income" fill={EXTRA_COLOR} stroke="#ffffff" strokeWidth={2} maxBarSize={28} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400 font-medium">
                  No income recorded in these 12 months yet. Set your salary above to get started.
                </div>
              )}
            </div>
          </div>

          {/* Row 3: Salary history + Extra income list */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Salary history */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display font-semibold text-slate-800 text-sm">Salary by month</h3>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Click the pencil to correct any month</p>
                </div>
                <button
                  onClick={() => setShowAddMonth(v => !v)}
                  className="text-xs font-bold text-violet-600 hover:text-violet-700 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add month
                </button>
              </div>

              {showAddMonth && (
                <form onSubmit={addMonth} className="flex flex-wrap items-end gap-2 bg-slate-50 border border-slate-100 rounded-xl p-3">
                  <label className="flex flex-col gap-1 text-[10px] font-bold text-slate-500 uppercase">
                    Month
                    <input
                      type="month"
                      value={newMonth}
                      onChange={(e) => setNewMonth(e.target.value)}
                      className="px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 normal-case"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-[10px] font-bold text-slate-500 uppercase flex-1 min-w-[100px]">
                    Salary ({user.currency})
                    <input
                      type="number"
                      inputMode="decimal"
                      value={newAmount}
                      onChange={(e) => setNewAmount(e.target.value)}
                      placeholder="0"
                      className="px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
                    />
                  </label>
                  <button type="submit" className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-bold cursor-pointer">
                    Save
                  </button>
                </form>
              )}

              {salaries.length > 0 ? (
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                      <th className="py-2">Month</th>
                      <th className="py-2 text-right">Salary</th>
                      <th className="py-2 text-right">Change</th>
                      <th className="py-2 w-16"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {salaries.map((s, idx) => {
                      // salaries are newest first, so the previous month in the list is idx + 1
                      const older = salaries[idx + 1];
                      const diff = older ? s.amount - older.amount : 0;
                      const isEditing = editingMonth === s.month;
                      return (
                        <tr key={s.id} className={s.month === selectedMonth ? 'bg-violet-50/40' : ''}>
                          <td className="py-2.5 font-semibold text-slate-600">{monthLabel(s.month)}</td>
                          <td className="py-2.5 text-right font-display font-extrabold text-slate-800">
                            {isEditing ? (
                              <input
                                type="number"
                                inputMode="decimal"
                                value={editAmount}
                                onChange={(e) => setEditAmount(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') saveHistoryRow(s.month); if (e.key === 'Escape') setEditingMonth(null); }}
                                autoFocus
                                className="w-24 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-right"
                              />
                            ) : fmt(s.amount)}
                          </td>
                          <td className={`py-2.5 text-right font-semibold ${diff > 0 ? 'text-emerald-600' : diff < 0 ? 'text-rose-500' : 'text-slate-300'}`}>
                            {older && diff !== 0 ? `${diff > 0 ? '+' : '−'}${fmt(Math.abs(diff))}` : '—'}
                          </td>
                          <td className="py-2.5 text-right">
                            {isEditing ? (
                              <div className="flex justify-end gap-1">
                                <button onClick={() => saveHistoryRow(s.month)} className="p-1 text-violet-600 hover:bg-violet-50 rounded-md cursor-pointer" title="Save"><Check className="w-3.5 h-3.5" /></button>
                                <button onClick={() => setEditingMonth(null)} className="p-1 text-slate-400 hover:bg-slate-100 rounded-md cursor-pointer" title="Cancel"><X className="w-3.5 h-3.5" /></button>
                              </div>
                            ) : (
                              <button
                                onClick={() => { setEditingMonth(s.month); setEditAmount(String(s.amount)); }}
                                className="p-1 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-md cursor-pointer"
                                title="Edit"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="text-center text-xs text-slate-400 font-medium py-10">
                  No salary recorded yet. Use “Add month” or the pencil on the Salary card.
                </div>
              )}
            </div>

            {/* Extra income this month */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex flex-col gap-4">
              <div>
                <h3 className="font-display font-semibold text-slate-800 text-sm">Extra income in {monthLabel(selectedMonth)}</h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Freelance, bonuses, gifts, returns — anything on top of salary</p>
              </div>

              {monthExtraTxs.length > 0 ? (
                <div className="divide-y divide-slate-50">
                  {monthExtraTxs.map(tx => {
                    const cat = categories.find(c => c.id === tx.category_id);
                    const Icon = getCategoryIcon(cat?.icon);
                    const confirming = txToDelete === tx.id;
                    return (
                      <div key={tx.id} className="flex items-center justify-between gap-3 py-2.5">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center border bg-emerald-50 border-emerald-100 shrink-0">
                            <Icon className="w-4 h-4 text-emerald-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-800 truncate">{tx.description}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {cat?.name || 'Income'} · {new Date(`${tx.transaction_date}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs font-bold font-display text-emerald-600">+{fmt(tx.amount)}</span>
                          {confirming ? (
                            <>
                              <button onClick={() => deleteExtra(tx.id)} className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-[10px] font-semibold cursor-pointer">Delete</button>
                              <button onClick={() => setTxToDelete(null)} className="px-2 py-0.5 border border-slate-200 text-slate-500 rounded-md text-[10px] font-semibold cursor-pointer">Keep</button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => { setTxToEdit(tx); setIsModalOpen(true); }}
                                className="p-1 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-md cursor-pointer"
                                title="Edit"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setTxToDelete(tx.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md cursor-pointer"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                  <p className="text-xs text-slate-400 font-medium">No extra income this month.</p>
                  <button
                    onClick={() => { setTxToEdit(null); setIsModalOpen(true); }}
                    className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50/70 hover:bg-emerald-100/80 px-3 py-1.5 rounded-lg border border-emerald-100 cursor-pointer"
                  >
                    + Add Money Gained
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <ExpenseModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setTxToEdit(null); }}
        onSave={loadData}
        transactionToEdit={txToEdit}
        initialType="income"
      />
    </div>
  );
};
