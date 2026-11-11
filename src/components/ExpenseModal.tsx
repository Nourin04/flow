import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/db';
import type { Category, Transaction } from '../lib/types';
import { X, ChevronDown, ArrowDownRight, ArrowUpRight } from 'lucide-react';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  transactionToEdit?: Transaction | null;
  initialType?: 'expense' | 'income';
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  transactionToEdit,
  initialType = 'expense'
}) => {
  const { user } = useAuth();
  const [txType, setTxType] = useState<'expense' | 'income'>(initialType);
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [transactionDate, setTransactionDate] = useState<string>('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Default to today's date in local YYYY-MM-DD
  const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    if (user) {
      db.getCategories(user.id)
        .then(setCategories)
        .catch(err => {
          console.error(err);
          setError(err instanceof Error ? err.message : 'Failed to load categories.');
        });
    }
  }, [user, isOpen]);

  useEffect(() => {
    if (transactionToEdit) {
      setTxType(transactionToEdit.type || 'expense');
      setAmount(transactionToEdit.amount.toString());
      setDescription(transactionToEdit.description);
      setCategoryId(transactionToEdit.category_id || '');
      setTransactionDate(transactionToEdit.transaction_date);
    } else {
      setTxType(initialType);
      setAmount('');
      setDescription('');
      setCategoryId('');
      setTransactionDate(getTodayString());
    }
    setError('');
  }, [transactionToEdit, initialType, isOpen]);

  if (!isOpen || !user) return null;

  // Filter categories based on transaction type if category has a type specified
  // Hide inactive categories — but keep the one already on a transaction being edited.
  const filteredCategories = categories.filter(cat => {
    if (!cat.is_active && cat.id !== categoryId) return false;
    if (!cat.type || cat.type === 'both') return true;
    return cat.type === txType;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Amount must be a positive number');
      return;
    }
    if (!description.trim()) {
      setError('Description is required');
      return;
    }
    if (!categoryId) {
      setError('Please select a category');
      return;
    }
    if (!transactionDate) {
      setError('Date is required');
      return;
    }

    setIsSubmitting(true);
    try {
      if (transactionToEdit) {
        await db.updateTransaction(user.id, transactionToEdit.id, {
          amount: parsedAmount,
          description: description.trim(),
          category_id: categoryId,
          transaction_date: transactionDate,
          type: txType
        });
      } else {
        await db.addTransaction(user.id, {
          amount: parsedAmount,
          description: description.trim(),
          category_id: categoryId,
          transaction_date: transactionDate,
          type: txType
        });
      }
      onSave();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : `Failed to save ${txType === 'income' ? 'income' : 'expense'}. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isIncome = txType === 'income';

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      {/* Modal Card */}
      <div className="bg-white rounded-2xl w-full max-w-md border border-slate-100 shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-display font-semibold text-slate-800 text-base">
            {transactionToEdit 
              ? (isIncome ? 'Edit Income Entry' : 'Edit Expense')
              : (isIncome ? 'Add Money Gained' : 'Add Expense')
            }
          </h3>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          {error && (
            <div className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl p-3">
              {error}
            </div>
          )}

          {/* Type Switcher Segmented Control */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setTxType('expense');
                setCategoryId('');
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                !isIncome 
                  ? 'bg-white text-violet-700 shadow-xs' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <ArrowDownRight className="w-3.5 h-3.5 text-rose-500" />
              Expense (Spent)
            </button>
            <button
              type="button"
              onClick={() => {
                setTxType('income');
                setCategoryId('');
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                isIncome 
                  ? 'bg-white text-emerald-700 shadow-xs' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
              Income (Gained)
            </button>
          </div>

          {/* Amount field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500">Amount ({user.currency})</label>
            <div className="relative">
              <span className={`absolute left-4 top-1/2 -translate-y-1/2 font-display font-medium text-lg ${isIncome ? 'text-emerald-500' : 'text-slate-400'}`}>
                {isIncome ? `+ ${user.currency}` : user.currency}
              </span>
              <input
                type="number"
                step="any"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className={`w-full ${isIncome ? 'pl-14' : 'pl-9'} pr-4 py-2.5 bg-slate-50 border border-slate-200/70 rounded-xl font-display font-medium text-slate-800 text-lg focus:outline-none focus:ring-2 focus:bg-white transition-all ${
                  isIncome ? 'focus:ring-emerald-500/20 focus:border-emerald-500' : 'focus:ring-violet-500/20 focus:border-violet-500'
                }`}
                required
                autoFocus
              />
            </div>
          </div>

          {/* Description field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={isIncome ? "e.g. Freelance design, Birthday gift, Investment dividend" : "e.g. Lunch with team, Uber ride"}
              className={`w-full px-4 py-2.5 bg-slate-50 border border-slate-200/70 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:bg-white transition-all ${
                isIncome ? 'focus:ring-emerald-500/20 focus:border-emerald-500' : 'focus:ring-violet-500/20 focus:border-violet-500'
              }`}
              required
            />
          </div>

          {/* Category Dropdown */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500">Category</label>
            <div className="relative">
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className={`w-full px-3 py-2.5 bg-slate-50 border border-slate-200/70 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:bg-white transition-all appearance-none cursor-pointer pr-9 ${
                  isIncome ? 'focus:ring-emerald-500/20 focus:border-emerald-500' : 'focus:ring-violet-500/20 focus:border-violet-500'
                }`}
                required
              >
                <option value="" disabled>Select a category</option>
                {filteredCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Date Picker */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500">Date</label>
            <input
              type="date"
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
              className={`w-full px-4 py-2.5 bg-slate-50 border border-slate-200/70 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:bg-white transition-all cursor-pointer ${
                isIncome ? 'focus:ring-emerald-500/20 focus:border-emerald-500' : 'focus:ring-violet-500/20 focus:border-violet-500'
              }`}
              required
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 active:scale-98 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex-1 py-2.5 text-white rounded-xl text-sm font-semibold shadow-md active:scale-98 disabled:opacity-50 transition-all cursor-pointer ${
                isIncome 
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100' 
                  : 'bg-violet-600 hover:bg-violet-700 shadow-violet-100'
              }`}
            >
              {isSubmitting 
                ? 'Saving...' 
                : transactionToEdit 
                  ? 'Save Changes' 
                  : (isIncome ? 'Add Money Gained' : 'Add Expense')
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
