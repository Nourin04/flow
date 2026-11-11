import React, { useState, useEffect, useCallback } from 'react';
import { LoadError } from './LoadError';
import { errorMessage } from '../lib/errors';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/db';
import type { Transaction, MonthlyIncome, SavingsGoal } from '../lib/types';
import { Sparkles, Calendar, Award, Star, Compass } from 'lucide-react';
import { Skeleton } from './Skeleton';

export const JourneyTimeline: React.FC = () => {
  const { user } = useAuth();
  const [allIncomes, setAllIncomes] = useState<MonthlyIncome[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [allGoals, setAllGoals] = useState<SavingsGoal[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const [loadError, setLoadError] = useState('');

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const [txs, goals, incomes] = await Promise.all([
        db.getTransactions(user.id),
        db.getSavingsGoals(user.id),
        db.getAllIncome(user.id),
      ]);
      setAllIncomes(incomes);
      setAllTransactions(txs);
      setAllGoals(goals);
      setLoadError('');
    } catch (err) {
      console.error(err);
      setLoadError(errorMessage(err, 'Failed to load your financial journey.'));
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!user) return null;

  if (!isLoading && loadError) {
    return <LoadError message={loadError} onRetry={loadData} />;
  }

  if (isLoading) {
    return (
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-3.5 w-36" />
          <Skeleton className="h-2.5 w-56" />
        </div>
        <Skeleton className="h-20 w-full rounded-xl" />
        <div className="space-y-4">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="w-8 h-8 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="h-2.5 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Global calculations
  // Income = monthly base income + every "money gained" transaction; spending excludes income.
  const totalIncomeAllTime =
    allIncomes.reduce((sum, i) => sum + i.amount, 0) +
    allTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalSpentAllTime = allTransactions.filter(t => t.type !== 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalSavedAllTime = Math.max(0, totalIncomeAllTime - totalSpentAllTime);
  const monthsCount = allIncomes.length;

  // Generate milestone events dynamically
  interface Milestone {
    date: string;
    title: string;
    description: string;
    icon: any;
    color: string;
    badgeValue?: string;
  }

  const milestones: Milestone[] = [];

  // 1. Seed milestones based on incomes
  const sortedIncomes = [...allIncomes].sort((a, b) => a.month.localeCompare(b.month));
  sortedIncomes.forEach((inc, idx) => {
    const [y, m] = inc.month.split('-');
    const dateObj = new Date(parseInt(y), parseInt(m) - 1, 1);
    const monthLabel = dateObj.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

    if (idx === 0) {
      milestones.push({
        date: inc.month,
        title: `First Earning Month 🌱`,
        description: `Your journey with Flow started here! First stipend/income received.`,
        icon: Calendar,
        color: 'text-emerald-500 bg-emerald-50 border-emerald-100',
        badgeValue: `${user.currency}${inc.amount.toLocaleString('en-IN')}`
      });
    } else {
      // Check if there was an income growth
      const prevInc = sortedIncomes[idx - 1];
      const isGrowth = inc.amount > prevInc.amount;

      milestones.push({
        date: inc.month,
        title: isGrowth ? `Income Increase! 📈` : `Monthly Earning Month`,
        description: isGrowth
          ? `Your monthly income grew from ${user.currency}${prevInc.amount.toLocaleString('en-IN')} to ${user.currency}${inc.amount.toLocaleString('en-IN')}. Transition to higher earnings!`
          : `Tracked earnings for ${monthLabel}.`,
        icon: isGrowth ? Sparkles : Compass,
        color: isGrowth ? 'text-violet-500 bg-violet-50 border-violet-100' : 'text-slate-500 bg-slate-50 border-slate-100',
        badgeValue: `${user.currency}${inc.amount.toLocaleString('en-IN')}`
      });
    }
  });

  // 2. Savings milestone check
  if (totalSavedAllTime >= 10000) {
    milestones.push({
      date: 'alltime',
      title: 'Savings Milestone Complete! 🏆',
      description: `You've crossed ${user.currency}10,000 in total lifetime savings! High financial awareness.`,
      icon: Award,
      color: 'text-amber-500 bg-amber-50 border-amber-100',
      badgeValue: `Saved ${user.currency}${totalSavedAllTime.toLocaleString('en-IN')}`
    });
  }

  // 3. Completed Goals milestones
  allGoals.forEach(g => {
    if (g.current_amount >= g.target_amount) {
      milestones.push({
        date: 'goal',
        title: `Goal Achieved: ${g.name} 🎯`,
        description: `Fully funded your savings goal of ${user.currency}${g.target_amount.toLocaleString('en-IN')}. Outstanding dedication!`,
        icon: Star,
        color: 'text-pink-500 bg-pink-50 border-pink-100',
        badgeValue: 'Completed'
      });
    }
  });

  // Sort milestones
  // We place custom all-time milestones at the top, followed by month keys descending
  const sortedMilestones = milestones.sort((a, b) => {
    if (a.date === 'goal' || a.date === 'alltime') return -1;
    if (b.date === 'goal' || b.date === 'alltime') return 1;
    return b.date.localeCompare(a.date);
  });

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-6">

      <div>
        <h3 className="font-display font-semibold text-slate-800 text-sm">Financial Journey</h3>
        <p className="text-[10px] text-slate-400 font-semibold mt-0.5 ">A look back at your stipend to salary milestones</p>
      </div>

      {/* Stats counter row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/50 p-4 rounded-xl border border-slate-100/50 text-center font-display">
        <div>
          <p className="text-[9px] text-slate-400 font-bold uppercase">Total Income</p>
          <p className="text-sm font-extrabold text-slate-800 mt-0.5">{user.currency}{totalIncomeAllTime.toLocaleString('en-IN')}</p>
        </div>
        <div>
          <p className="text-[9px] text-slate-400 font-bold uppercase">Total Spent</p>
          <p className="text-sm font-extrabold text-rose-500 mt-0.5">-{user.currency}{totalSpentAllTime.toLocaleString('en-IN')}</p>
        </div>
        <div>
          <p className="text-[9px] text-slate-400 font-bold uppercase">Total Saved</p>
          <p className="text-sm font-extrabold text-emerald-600 mt-0.5">{user.currency}{totalSavedAllTime.toLocaleString('en-IN')}</p>
        </div>
        <div>
          <p className="text-[9px] text-slate-400 font-bold uppercase">Months Tracked</p>
          <p className="text-sm font-extrabold text-slate-800 mt-0.5">{monthsCount} months</p>
        </div>
      </div>

      {/* Timeline items list */}
      <div className="relative border-l border-slate-100 pl-6 ml-3 space-y-6 pt-2">
        {sortedMilestones.map((m, idx) => {
          const Icon = m.icon;
          return (
            <div key={idx} className="relative animate-in slide-in-from-left-2 duration-200">

              {/* Timeline marker */}
              <span className={`absolute -left-[35px] top-0 w-5.5 h-5.5 rounded-full border flex items-center justify-center ${m.color}`}>
                <Icon className="w-3 h-3" />
              </span>

              {/* Card info */}
              <div className="bg-slate-50/30 hover:bg-slate-50/50 border border-slate-100 p-4 rounded-xl flex justify-between items-start gap-4 transition-colors">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 leading-tight">{m.title}</h4>
                  <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">{m.description}</p>
                </div>
                {m.badgeValue && (
                  <span className="text-[9px] font-extrabold bg-white border border-slate-100 px-2 py-0.5 rounded-md text-slate-700 font-display">
                    {m.badgeValue}
                  </span>
                )}
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
