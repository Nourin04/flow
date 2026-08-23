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
  Pizza,
  Car,
  Home,
  ShoppingBag,
  GraduationCap,
  Gift,
  Sparkles,
  HelpCircle
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
  const [txToDelete, setTxToDelete] = useState<string | null>(null); // Transaction ID being confirmed for delete
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const availableMonths = [
    { value: '2026-08', label: 'August 2026' },
    { value: '2026-09', label: 'September 2026' },
    { value: '2026-10', label: 'October 2026' },
  ];

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

  // Filtered transactions calculation
  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = tx.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory ? tx.category_id === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  const totalSpent = filteredTransactions.reduce((sum, tx) => sum + tx.amount, 0);

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

  // Helper date formatter
  const formatDateHeader = (dateStr: string) => {
    const today = '2026-08-23'; // Locked current time anchor
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
          <h2 className="text-xl font-bold text-slate-900 font-display">Expenses</h2>
          <p className="text-xs text-slate-400 font-medium">
            {user.currency}{totalSpent.toLocaleString('en-IN')} spent in {
              availableMonths.find(m => m.value === selectedMonth)?.label.split(' ')[0]
            }
          </p>
        </div>

        {/* Month selector & Add expense button */}
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
            onClick={() => {
              setTxToEdit(null);
              setIsModalOpen(true);
            }}
            className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl px-4 py-2 text-xs font-semibold shadow-md shadow-violet-100 flex items-center gap-1.5 active:scale-98 transition-all cursor-pointer select-none"
          >
            <span className="text-sm">+</span> Add Expense
          </button>
        </div>
      </div>

      {/* Filters row */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
        
        {/* Search */}
        <div className="relative sm:col-span-6">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by description..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-150 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-violet-500 focus:bg-white transition-all font-medium"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Filter */}
        <div className="relative sm:col-span-4">
          <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-150 rounded-xl text-xs text-slate-700 focus:outline-hidden focus:border-violet-500 focus:bg-white transition-all appearance-none cursor-pointer font-semibold"
          >
            <option value="">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Reset Buttons */}
        <div className="sm:col-span-2 flex justify-end">
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('');
            }}
            disabled={!searchQuery && !selectedCategory}
            className="w-full text-center text-xs font-semibold py-2 px-4 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition-all select-none"
          >
            Clear Filters
          </button>
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

                  return (
                    <div 
                      key={tx.id} 
                      className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 transition-colors ${
                        isConfirmingDelete ? 'bg-rose-50/20' : 'hover:bg-slate-50/40'
                      }`}
                    >
                      {/* Left: Info */}
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-9 h-9 rounded-xl flex items-center justify-center border text-sm flex-shrink-0" 
                          style={{ backgroundColor: `${cat?.color}10`, borderColor: `${cat?.color}20` }}
                        >
                          <IconComponent className="w-4 h-4" style={{ color: cat?.color }} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">{tx.description}</p>
                          <span 
                            className="inline-flex items-center text-[9px] font-bold px-2 py-0.5 rounded-full mt-1 border"
                            style={{ 
                              color: cat?.color, 
                              backgroundColor: `${cat?.color}08`, 
                              borderColor: `${cat?.color}15` 
                            }}
                          >
                            {cat?.name || 'Uncategorized'}
                          </span>
                        </div>
                      </div>

                      {/* Right: Amount & Actions */}
                      <div className="flex items-center justify-between sm:justify-end gap-6">
                        <p className="text-sm font-extrabold text-slate-800 font-display">
                          -{user.currency}{tx.amount.toLocaleString('en-IN')}
                        </p>

                        {/* Inline deletion confirm prompt */}
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
                              className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-all"
                              title="Edit transaction"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setTxToDelete(tx.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
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
      />
    </div>
  );
};
