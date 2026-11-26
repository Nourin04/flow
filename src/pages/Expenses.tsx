import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/db';
import type { Transaction, Category } from '../lib/types';
import { ExpenseModal } from '../components/ExpenseModal';
import { CategoryManagerModal } from '../components/CategoryManagerModal';
import { getCategoryIcon } from '../lib/categoryIcons';
import { MonthPicker } from '../components/MonthPicker';
import { ListSkeleton, Skeleton } from '../components/Skeleton';
import { LoadError } from '../components/LoadError';
import { errorMessage } from '../lib/errors';
import { 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  X,
  ChevronDown,
  Settings as SettingsIcon,
} from 'lucide-react';

interface ExpensesProps {
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
}

export const Expenses: React.FC<ExpensesProps> = ({ selectedMonth, setSelectedMonth }) => {
  const { user } = useAuth();
  
  // Data states
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  // UI states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [txToEdit, setTxToEdit] = useState<Transaction | null>(null);
  const [txToDelete, setTxToDelete] = useState<string | null>(null);
  
  // Category Management Modal state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'expense' | 'income'>('all');
  const [modalInitialType, setModalInitialType] = useState<'expense' | 'income'>('expense');

  // isLoading is derived: true until data for the currently selected month has arrived.
  // Refreshes after edits keep the old data on screen instead of flashing skeletons.
  const [loadedMonth, setLoadedMonth] = useState<string | null>(null);
  const [loadError, setLoadError] = useState('');
  const requestIdRef = useRef(0);
  const isLoading = loadedMonth !== selectedMonth;

  const loadData = useCallback(async () => {
    if (!user) return;
    const requestId = ++requestIdRef.current;
    try {
      const [cats, txs] = await Promise.all([
        db.getCategories(user.id),
        db.getTransactions(user.id, selectedMonth),
      ]);
      // Ignore stale responses if the month changed while this request was in flight
      if (requestId !== requestIdRef.current) return;
      setCategories(cats);
      setTransactions(txs);
      setLoadError('');
    } catch (err) {
      console.error(err);
      if (requestId === requestIdRef.current) setLoadError(errorMessage(err, 'Failed to load transactions.'));
    } finally {
      if (requestId === requestIdRef.current) setLoadedMonth(selectedMonth);
    }
  }, [user, selectedMonth]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!user) return null;

  const closeCategoryModal = () => setIsCategoryModalOpen(false);

  const handleEdit = (tx: Transaction) => {
    setTxToEdit(tx);
    setModalInitialType(tx.type || 'expense');
    setIsModalOpen(true);
  };

  const handleDeleteConfirm = async (txId: string) => {
    try {
      await db.deleteTransaction(user.id, txId);
      setTxToDelete(null);
      loadData();
    } catch (err) {
      console.error(err);
      setTxToDelete(null);
      setLoadError(errorMessage(err, 'Failed to delete transaction.'));
    }
  };

  // Calculations
  const totalSpent = transactions.filter(t => t.type !== 'income').reduce((sum, tx) => sum + tx.amount, 0);
  const totalIncomeGained = transactions.filter(t => t.type === 'income').reduce((sum, tx) => sum + tx.amount, 0);

  // Filtered transactions calculation
  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = tx.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory ? tx.category_id === selectedCategory : true;
    const matchesType = typeFilter === 'all' ? true : (tx.type || 'expense') === typeFilter;
    return matchesSearch && matchesCategory && matchesType;
  });

  // Totals for the active filters (shown only while a filter is applied)
  const isFiltered = !!searchQuery.trim() || !!selectedCategory || typeFilter !== 'all';
  const filteredSpentTxs = filteredTransactions.filter(t => t.type !== 'income');
  const filteredGainedTxs = filteredTransactions.filter(t => t.type === 'income');
  const filteredSpent = filteredSpentTxs.reduce((sum, t) => sum + t.amount, 0);
  const filteredGained = filteredGainedTxs.reduce((sum, t) => sum + t.amount, 0);
  const filterLabels = [
    typeFilter === 'expense' ? 'Expenses' : typeFilter === 'income' ? 'Income gained' : null,
    selectedCategory ? categories.find(c => c.id === selectedCategory)?.name ?? null : null,
    searchQuery.trim() ? `“${searchQuery.trim()}”` : null,
  ].filter(Boolean) as string[];

  // Group filtered transactions by transaction_date
  const groupedTxs: { [dateStr: string]: Transaction[] } = {};
  filteredTransactions.forEach(tx => {
    if (!groupedTxs[tx.transaction_date]) {
      groupedTxs[tx.transaction_date] = [];
    }
    groupedTxs[tx.transaction_date].push(tx);
  });

  // Sort dates descending
  const sortedDates = Object.keys(groupedTxs).sort((a, b) => b.localeCompare(a));

  const toLocalDateKey = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const formatDateHeader = (dateStr: string) => {
    const now = new Date();
    const today = toLocalDateKey(now);
    const yesterday = toLocalDateKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));
    if (dateStr === today) return 'Today';
    if (dateStr === yesterday) return 'Yesterday';

    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC'
    });
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-display">Transactions</h2>
          <div className="flex items-center gap-3 text-xs font-medium mt-0.5">
            {isLoading ? (
              <Skeleton className="h-3.5 w-24" />
            ) : (
            <span className="text-rose-600 font-semibold">
              Spent: {user.currency}{totalSpent.toLocaleString('en-IN')}
            </span>
            )}
            {!isLoading && totalIncomeGained > 0 && (
              <span className="text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md">
                Gained: +{user.currency}{totalIncomeGained.toLocaleString('en-IN')}
              </span>
            )}
          </div>
        </div>

        {/* Month selector & Action Buttons */}
        <div className="flex items-center gap-2">
          <MonthPicker selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth} />

          <button
            onClick={() => {
              setTxToEdit(null);
              setModalInitialType('income');
              setIsModalOpen(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-3.5 py-2 text-xs font-semibold shadow-md shadow-emerald-100 flex items-center gap-1.5 active:scale-98 transition-all cursor-pointer select-none"
          >
            <span className="text-sm">+</span> Add Money Gained
          </button>

          <button
            onClick={() => {
              setTxToEdit(null);
              setModalInitialType('expense');
              setIsModalOpen(true);
            }}
            className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl px-3.5 py-2 text-xs font-semibold shadow-md shadow-violet-100 flex items-center gap-1.5 active:scale-98 transition-all cursor-pointer select-none"
          >
            <span className="text-sm">+</span> Add Expense
          </button>
        </div>
      </div>

      {loadError && <LoadError message={loadError} onRetry={loadData} />}

      {/* Filters row */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs flex flex-col gap-3">
        
        {/* Type Filter Pills & Search row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Segmented Type Filter */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                typeFilter === 'all' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All ({transactions.length})
            </button>
            <button
              onClick={() => setTypeFilter('expense')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                typeFilter === 'expense' ? 'bg-white text-violet-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Expenses ({transactions.filter(t => t.type !== 'income').length})
            </button>
            <button
              onClick={() => setTypeFilter('income')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                typeFilter === 'income' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Income Gained ({transactions.filter(t => t.type === 'income').length})
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => setIsCategoryModalOpen(true)}
              className="p-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all select-none cursor-pointer"
              title="Manage Categories"
            >
              <SettingsIcon className="w-3.5 h-3.5 text-slate-500" />
              <span>Categories</span>
            </button>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('');
                setTypeFilter('all');
              }}
              disabled={!searchQuery && !selectedCategory && typeFilter === 'all'}
              className="text-xs font-semibold py-2 px-3 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition-all select-none cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Search & Category Filter dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by description..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200/70 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 focus:bg-white transition-all font-medium"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div className="relative">
            <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={selectedCategory}
              onChange={(e) => {
                if (e.target.value === '__MANAGE__') {
                  setIsCategoryModalOpen(true);
                } else {
                  setSelectedCategory(e.target.value);
                }
              }}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200/70 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 focus:bg-white transition-all appearance-none cursor-pointer font-semibold"
            >
              <option value="">All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
              <option value="__MANAGE__">⚙ Manage Categories...</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Totals for the current filters */}
        {isFiltered && !isLoading && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl bg-violet-50/50 border border-violet-100/70 px-3.5 py-2.5 animate-in fade-in duration-150">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-slate-600">
                <span className="font-bold text-slate-800">{filteredTransactions.length}</span> of {transactions.length} transactions
                {filterLabels.length > 0 && (
                  <span className="text-slate-400"> · {filterLabels.join(' · ')}</span>
                )}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
              {filteredSpentTxs.length > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white text-rose-600 border border-rose-100">
                  Spent <span className="font-extrabold font-display">{user.currency}{filteredSpent.toLocaleString('en-IN')}</span>
                  <span className="text-rose-400">· {filteredSpentTxs.length}</span>
                </span>
              )}
              {filteredGainedTxs.length > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white text-emerald-700 border border-emerald-100">
                  Gained <span className="font-extrabold font-display">+{user.currency}{filteredGained.toLocaleString('en-IN')}</span>
                  <span className="text-emerald-500">· {filteredGainedTxs.length}</span>
                </span>
              )}
              {filteredSpentTxs.length > 0 && filteredGainedTxs.length > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white text-slate-700 border border-slate-200">
                  Net <span className={`font-extrabold font-display ${filteredGained - filteredSpent >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                    {filteredGained - filteredSpent >= 0 ? '+' : '−'}{user.currency}{Math.abs(filteredGained - filteredSpent).toLocaleString('en-IN')}
                  </span>
                </span>
              )}
              {filteredTransactions.length === 0 && (
                <span className="text-slate-400">Nothing matches — total {user.currency}0</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Transaction List */}
      <div className="flex flex-col gap-6">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-3 w-32 mx-2" />
            <ListSkeleton rows={5} />
          </div>
        ) : sortedDates.length > 0 ? (
          sortedDates.map(dateStr => {
            // Day summary — based on the entries shown under this date (respects active filters)
            const dayTxs = groupedTxs[dateStr];
            const daySpentTxs = dayTxs.filter(t => t.type !== 'income');
            const dayGainedTxs = dayTxs.filter(t => t.type === 'income');
            const daySpent = daySpentTxs.reduce((sum, t) => sum + t.amount, 0);
            const dayGained = dayGainedTxs.reduce((sum, t) => sum + t.amount, 0);

            return (
            <div key={dateStr} className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {formatDateHeader(dateStr)}
                </h3>
                <div className="flex items-center gap-1.5 text-[10px] font-semibold">
                  {daySpentTxs.length > 0 && (
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 text-rose-600 border border-rose-100"
                      title={`${daySpentTxs.length} ${daySpentTxs.length === 1 ? 'expense' : 'expenses'} on this day`}
                    >
                      Spent <span className="font-extrabold font-display">{user.currency}{daySpent.toLocaleString('en-IN')}</span>
                      <span className="text-rose-400">· {daySpentTxs.length}</span>
                    </span>
                  )}
                  {dayGainedTxs.length > 0 && (
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100"
                      title={`${dayGainedTxs.length} income ${dayGainedTxs.length === 1 ? 'entry' : 'entries'} on this day`}
                    >
                      Gained <span className="font-extrabold font-display">+{user.currency}{dayGained.toLocaleString('en-IN')}</span>
                      <span className="text-emerald-500">· {dayGainedTxs.length}</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-xs divide-y divide-slate-50">
                {groupedTxs[dateStr].map(tx => {
                  const cat = categories.find(c => c.id === tx.category_id);
                  const IconComponent = getCategoryIcon(cat?.icon || 'HelpCircle');
                  const isConfirmingDelete = txToDelete === tx.id;
                  const isIncomeTx = tx.type === 'income';

                  return (
                    <div 
                      key={tx.id} 
                      className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 transition-colors ${
                        isConfirmingDelete ? 'bg-rose-50/20' : 'hover:bg-slate-50/40'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-9 h-9 rounded-xl flex items-center justify-center border text-sm flex-shrink-0" 
                          style={{ 
                            backgroundColor: isIncomeTx ? '#f0fdf4' : `${cat?.color}10`, 
                            borderColor: isIncomeTx ? '#bbf7d0' : `${cat?.color}20` 
                          }}
                        >
                          <IconComponent className="w-4 h-4" style={{ color: isIncomeTx ? '#16a34a' : cat?.color }} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">{tx.description}</p>
                          <span 
                            className="inline-flex items-center text-[9px] font-bold px-2 py-0.5 rounded-full mt-1 border"
                            style={{ 
                              color: isIncomeTx ? '#15803d' : cat?.color, 
                              backgroundColor: isIncomeTx ? '#f0fdf4' : `${cat?.color}08`, 
                              borderColor: isIncomeTx ? '#dcfce7' : `${cat?.color}15` 
                            }}
                          >
                            {cat?.name || (isIncomeTx ? 'Income' : 'Uncategorized')}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-6">
                        <p className={`text-sm font-extrabold font-display ${isIncomeTx ? 'text-emerald-600' : 'text-slate-800'}`}>
                          {isIncomeTx ? `+${user.currency}${tx.amount.toLocaleString('en-IN')}` : `-${user.currency}${tx.amount.toLocaleString('en-IN')}`}
                        </p>

                        {isConfirmingDelete ? (
                          <div className="flex items-center gap-2 animate-in slide-in-from-right-2 duration-150">
                            <span className="text-[10px] font-semibold text-rose-500 mr-1">Delete?</span>
                            <button
                              onClick={() => handleDeleteConfirm(tx.id)}
                              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-semibold select-none cursor-pointer"
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => setTxToDelete(null)}
                              className="px-2.5 py-1 border border-slate-200 text-slate-500 hover:bg-slate-100 rounded-lg text-[10px] font-semibold select-none cursor-pointer"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 opacity-0 hover:opacity-100 focus-within:opacity-100 sm:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleEdit(tx)}
                              className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-all cursor-pointer"
                              title="Edit transaction"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setTxToDelete(tx.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                              title="Delete transaction"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>
            );
          })
        ) : (
          <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center shadow-xs flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-700">No transactions found</p>
              <p className="text-[10px] text-slate-400 mt-1 font-medium">Try resetting your search query or choosing a different category filter.</p>
            </div>
          </div>
        )}
      </div>

      {/* Expense Edit Modal Wrapper */}
      <ExpenseModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setTxToEdit(null);
        }}
        onSave={loadData}
        transactionToEdit={txToEdit}
        initialType={modalInitialType}
      />

      {/* Category Manager Modal */}
      <CategoryManagerModal
        isOpen={isCategoryModalOpen}
        onClose={closeCategoryModal}
        categories={categories}
        onChanged={loadData}
      />

    </div>
  );
};
