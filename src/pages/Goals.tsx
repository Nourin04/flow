import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/db';
import type { SavingsGoal } from '../lib/types';
import { GoalModal } from '../components/GoalModal';
import { JourneyTimeline } from '../components/JourneyTimeline';
import { 
  Target, 
  Plus, 
  Edit2, 
  Trash2, 
  Sparkles
} from 'lucide-react';

export const Goals: React.FC = () => {
  const { user } = useAuth();
  
  // Data states
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  
  // UI states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [goalToEdit, setGoalToEdit] = useState<SavingsGoal | null>(null);
  const [goalToDelete, setGoalToDelete] = useState<string | null>(null);

  const loadData = async () => {
    if (!user) return;
    const data = await db.getSavingsGoals(user.id);
    setGoals(data);
  };

  useEffect(() => {
    loadData();
  }, [user]);

  if (!user) return null;

  const handleEdit = (goal: SavingsGoal) => {
    setGoalToEdit(goal);
    setIsModalOpen(true);
  };

  const handleDeleteConfirm = async (goalId: string) => {
    try {
      await db.deleteSavingsGoal(user.id, goalId);
      setGoalToDelete(null);
      loadData();
    } catch (err) {
      console.error(err);
      alert('Failed to delete savings goal');
    }
  };

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-300">
      
      {/* Segment 1: Goals */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 font-display">Savings Goals</h2>
            <p className="text-xs text-slate-400 font-medium">Keep track of your milestones and build strong savings habits.</p>
          </div>
          
          <button
            onClick={() => {
              setGoalToEdit(null);
              setIsModalOpen(true);
            }}
            className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl px-4 py-2 text-xs font-semibold shadow-md shadow-violet-100 flex items-center gap-1.5 active:scale-98 transition-all cursor-pointer select-none"
          >
            <Plus className="w-4 h-4" /> Create Goal
          </button>
        </div>

        {/* Goals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.length > 0 ? (
            goals.map(goal => {
              const percent = goal.target_amount > 0 
                ? Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100)) 
                : 0;
              const isConfirmingDelete = goalToDelete === goal.id;

              return (
                <div 
                  key={goal.id} 
                  className={`bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex flex-col justify-between min-h-[160px] relative overflow-hidden transition-colors ${
                    isConfirmingDelete ? 'bg-rose-50/10' : ''
                  }`}
                >
                  <div>
                    {/* Title & Actions */}
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center border border-violet-100 flex-shrink-0">
                          <Target className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-800 leading-tight">{goal.name}</h3>
                          <p className="text-[9px] text-slate-400 font-semibold uppercase mt-0.5 tracking-wider">Savings Goal</p>
                        </div>
                      </div>

                      {/* Controls */}
                      {isConfirmingDelete ? (
                        <div className="flex items-center gap-1.5 z-10 animate-in slide-in-from-right-1 duration-150">
                          <span className="text-[9px] font-bold text-rose-500 mr-0.5">Delete?</span>
                          <button
                            onClick={() => handleDeleteConfirm(goal.id)}
                            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[9px] font-semibold cursor-pointer"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setGoalToDelete(null)}
                            className="px-2.5 py-1 border border-slate-200 text-slate-500 rounded-lg text-[9px] font-semibold cursor-pointer"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 opacity-0 hover:opacity-100 focus-within:opacity-100 sm:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEdit(goal)}
                            className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-all"
                            title="Edit goal"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setGoalToDelete(goal.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                            title="Delete goal"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Financial details */}
                    <div className="mt-4 flex items-baseline gap-2">
                      <span className="text-2xl font-extrabold text-slate-800 font-display">
                        {user.currency}{goal.current_amount.toLocaleString('en-IN')}
                      </span>
                      <span className="text-slate-400 text-xs font-semibold">
                        / {user.currency}{goal.target_amount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-4 space-y-1.5">
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-violet-600 transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-semibold text-slate-400">
                      <span>{percent}% Completed</span>
                      {percent === 100 && (
                        <span className="text-emerald-500 font-bold flex items-center gap-0.5">
                          <Sparkles className="w-3 h-3" /> Fully Funded!
                        </span>
                      )}
                    </div>
                  </div>

                </div>
              );
            })
          ) : (
            <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center shadow-xs flex flex-col items-center justify-center gap-3 col-span-2">
              <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-700">No savings goals created</p>
                <p className="text-[10px] text-slate-400 mt-1 font-medium">Create a goal to start putting aside money for milestones or emergency needs.</p>
              </div>
              <button
                onClick={() => {
                  setGoalToEdit(null);
                  setIsModalOpen(true);
                }}
                className="mt-1 bg-violet-600 hover:bg-violet-700 text-white rounded-xl px-4 py-2 text-xs font-semibold shadow-md active:scale-98 transition-all"
              >
                + Create First Goal
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Segment 2: Financial Journey Timeline */}
      <JourneyTimeline />

      {/* Goal Modal Wrapper */}
      <GoalModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setGoalToEdit(null);
        }}
        onSave={loadData}
        goalToEdit={goalToEdit}
      />
    </div>
  );
};
