import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/db';
import type { SavingsGoal } from '../lib/types';
import { X } from 'lucide-react';

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  goalToEdit?: SavingsGoal | null;
}

export const GoalModal: React.FC<GoalModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  goalToEdit 
}) => {
  const { user } = useAuth();
  const [name, setName] = useState<string>('');
  const [targetAmount, setTargetAmount] = useState<string>('');
  const [currentAmount, setCurrentAmount] = useState<string>('0');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (goalToEdit) {
      setName(goalToEdit.name);
      setTargetAmount(goalToEdit.target_amount.toString());
      setCurrentAmount(goalToEdit.current_amount.toString());
    } else {
      setName('');
      setTargetAmount('');
      setCurrentAmount('0');
    }
    setError('');
  }, [goalToEdit, isOpen]);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsedTarget = parseFloat(targetAmount);
    const parsedCurrent = parseFloat(currentAmount);

    if (!name.trim()) {
      setError('Goal name is required');
      return;
    }
    if (isNaN(parsedTarget) || parsedTarget <= 0) {
      setError('Target amount must be a positive number');
      return;
    }
    if (isNaN(parsedCurrent) || parsedCurrent < 0) {
      setError('Current amount must be greater than or equal to 0');
      return;
    }
    if (parsedCurrent > parsedTarget) {
      setError('Current amount cannot exceed target amount');
      return;
    }

    setIsSubmitting(true);
    try {
      if (goalToEdit) {
        await db.updateSavingsGoal(user.id, goalToEdit.id, {
          name: name.trim(),
          target_amount: parsedTarget,
          current_amount: parsedCurrent
        });
      } else {
        await db.addSavingsGoal(user.id, {
          name: name.trim(),
          target_amount: parsedTarget,
          current_amount: parsedCurrent
        });
      }
      onSave();
      onClose();
    } catch (err) {
      console.error(err);
      setError('Failed to save savings goal. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-md border border-slate-100 shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-display font-semibold text-slate-800 text-base">
            {goalToEdit ? 'Edit Savings Goal' : 'Create Savings Goal'}
          </h3>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
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

          {/* Goal Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500">Goal Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Emergency Fund, New Laptop, Travel"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-violet-500 focus:bg-white transition-all"
              required
              autoFocus
            />
          </div>

          {/* Target Amount */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500">Target Amount ({user.currency})</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-display font-medium text-base">
                {user.currency}
              </span>
              <input
                type="number"
                step="any"
                inputMode="decimal"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                placeholder="50,000"
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl font-display font-semibold text-slate-800 text-sm focus:outline-hidden focus:border-violet-500 focus:bg-white transition-all"
                required
              />
            </div>
          </div>

          {/* Current Saved Amount */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500">Current Saved Amount ({user.currency})</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-display font-medium text-base">
                {user.currency}
              </span>
              <input
                type="number"
                step="any"
                inputMode="decimal"
                value={currentAmount}
                onChange={(e) => setCurrentAmount(e.target.value)}
                placeholder="0"
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl font-display font-semibold text-slate-800 text-sm focus:outline-hidden focus:border-violet-500 focus:bg-white transition-all"
                required
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 active:scale-98 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-violet-100 active:scale-98 disabled:opacity-50 transition-all"
            >
              {isSubmitting ? 'Saving...' : goalToEdit ? 'Save Changes' : 'Create Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
