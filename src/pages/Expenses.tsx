import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/db';
import type { Transaction, Category } from '../lib/types';
import { ExpenseModal } from '../components/ExpenseModal';
import { 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  X,
  ChevronDown,
  Settings as SettingsIcon,
  Plus,
  Pizza,
  Car,
  Home,
  ShoppingBag,
  GraduationCap,
  Gift,
  Sparkles,
  HelpCircle,
  Tag
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
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#8B5CF6');
  const [newCatIcon, setNewCatIcon] = useState('Sparkles');
  const [categoryMessage, setCategoryMessage] = useState('');
  const [categoryError, setCategoryError] = useState('');

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'expense' | 'income'>('all');
  const [modalInitialType, setModalInitialType] = useState<'expense' | 'income'>('expense');

  const availableMonths = [
    { value: '2026-08', label: 'August 2026' },
    { value: '2026-09', label: 'September 2026' },
    { value: '2026-10', label: 'October 2026' },
  ];

  const availableIcons = ['Pizza', 'Car', 'Home', 'ShoppingBag', 'GraduationCap', 'Gift', 'Sparkles', 'HelpCircle'];

  const loadData = async () => {
    if (!user) return;
    const cats = await db.getCategories(user.id);
    setCategories(cats);
    const txs = await db.getTransactions(user.id, selectedMonth);
    setTransactions(txs);
  };

  useEffect(() => {
    loadData();
  }, [user, selectedMonth]);

  if (!user) return null;

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
      alert('Failed to delete transaction');
    }
  };

  // Category Manager Handlers
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setCategoryError('');
    setCategoryMessage('');

    if (!newCatName.trim()) {
      setCategoryError('Category name is required.');
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
      setCategoryMessage('Category added successfully.');
      setTimeout(() => setCategoryMessage(''), 3000);
      loadData();
    } catch (err) {
      console.error(err);
      setCategoryError('Failed to create category.');
    }
  };

  const handleToggleCategory = async (catId: string, currentActive: boolean) => {
    try {
      await db.updateCategory(user.id, catId, { is_active: !currentActive });
      loadData();
    } catch (err) {
      console.error(err);
      setCategoryError('Failed to toggle category.');
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

  const formatDateHeader = (dateStr: string) => {
    const today = '2026-08-23';
    const yesterday = '2026-08-22';
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-display">Transactions</h2>
          <div className="flex items-center gap-3 text-xs font-medium mt-0.5">
            <span className="text-rose-600 font-semibold">
              Spent: {user.currency}{totalSpent.toLocaleString('en-IN')}
            </span>
            {totalIncomeGained > 0 && (
              <span className="text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md">
                Gained: +{user.currency}{totalIncomeGained.toLocaleString('en-IN')}
              </span>
            )}
          </div>
        </div>

        {/* Month selector & Action Buttons */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-white border border-slate-200/90 rounded-xl px-4 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-500/20 appearance-none pr-8 cursor-pointer"
            >
              {availableMonths.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

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
      </div>

      {/* Transaction List */}
      <div className="flex flex-col gap-6">
        {sortedDates.length > 0 ? (
          sortedDates.map(dateStr => (
            <div key={dateStr} className="space-y-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">
                {formatDateHeader(dateStr)}
              </h3>
              
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
          ))
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
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-violet-600" />
                <h3 className="text-base font-bold text-slate-900 font-display">Manage Categories</h3>
              </div>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {categoryMessage && (
              <div className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-xl p-2.5">
                {categoryMessage}
              </div>
            )}
            {categoryError && (
              <div className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl p-2.5">
                {categoryError}
              </div>
            )}

            {/* Quick Add Custom Category */}
            <form onSubmit={handleAddCategory} className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Add Custom Category</span>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Category Name</label>
                  <input
                    type="text"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="e.g. Subscriptions"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden font-medium"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Icon & Color</label>
                  <div className="flex gap-1.5">
                    <div className="relative flex-1">
                      <select
                        value={newCatIcon}
                        onChange={(e) => setNewCatIcon(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none appearance-none pr-6 cursor-pointer"
                      >
                        {availableIcons.map(icon => (
                          <option key={icon} value={icon}>{icon}</option>
                        ))}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
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
                  className="w-full bg-violet-600 hover:bg-violet-700 text-white rounded-lg py-1.5 text-xs font-bold shadow-xs flex items-center justify-center gap-1 cursor-pointer select-none"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Category
                </button>
              </div>
            </form>

            {/* List and toggle existing categories */}
            <div className="max-h-60 overflow-y-auto space-y-2 pr-1 divide-y divide-slate-50">
              {categories.map((cat) => {
                const IconComponent = getCategoryIcon(cat.icon);
                return (
                  <div key={cat.id} className="flex justify-between items-center py-2">
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

                    <button
                      onClick={() => handleToggleCategory(cat.id, cat.is_active)}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-md cursor-pointer select-none border transition-colors ${
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

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
