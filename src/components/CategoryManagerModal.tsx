import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/db';
import { errorMessage } from '../lib/errors';
import type { Category } from '../lib/types';
import { CATEGORY_ICON_NAMES, CATEGORY_COLORS, getCategoryIcon } from '../lib/categoryIcons';
import { Tag, X, Plus, Lock, Check, Palette } from 'lucide-react';

type CategoryType = 'expense' | 'income' | 'both';
type ListFilter = 'all' | 'expense' | 'income';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  /** Called after a category is created or changed so the parent can reload. */
  onChanged: () => void | Promise<void>;
}

const TYPE_LABEL: Record<CategoryType, string> = { expense: 'Expense', income: 'Income', both: 'Both' };
const TYPE_BADGE: Record<CategoryType, string> = {
  expense: 'text-rose-600 bg-rose-50 border-rose-100',
  income: 'text-emerald-700 bg-emerald-50 border-emerald-100',
  both: 'text-slate-600 bg-slate-50 border-slate-200',
};

/** Matches a category against the list filter ("both" shows under either tab). */
const matchesFilter = (cat: Category, filter: ListFilter) =>
  filter === 'all' || (cat.type ?? 'both') === filter || (cat.type ?? 'both') === 'both';

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({ isOpen, onClose, categories, onChanged }) => {
  const { user } = useAuth();

  const [name, setName] = useState('');
  const [type, setType] = useState<CategoryType>('expense');
  const [icon, setIcon] = useState('Sparkles');
  const [color, setColor] = useState(CATEGORY_COLORS[0]);
  const [filter, setFilter] = useState<ListFilter>('all');
  const [isSaving, setIsSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen || !user) return null;

  const trimmed = name.trim();
  const isDuplicate = categories.some(c => c.name.trim().toLowerCase() === trimmed.toLowerCase());
  const PreviewIcon = getCategoryIcon(icon);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (!trimmed) return setError('Give your category a name.');
    if (isDuplicate) return setError(`A category called “${trimmed}” already exists.`);

    setIsSaving(true);
    try {
      await db.addCategory(user.id, { name: trimmed, icon, color, type, is_active: true });
      await onChanged();
      setName('');
      setMessage(`“${trimmed}” added.`);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error(err);
      setError(errorMessage(err, 'Failed to create category.'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = async (cat: Category) => {
    setError('');
    setTogglingId(cat.id);
    try {
      await db.updateCategory(user.id, cat.id, { is_active: !cat.is_active });
      await onChanged();
    } catch (err) {
      console.error(err);
      setError(errorMessage(err, 'Failed to update category.'));
    } finally {
      setTogglingId(null);
    }
  };

  const visible = categories.filter(c => matchesFilter(c, filter));
  const own = visible.filter(c => c.user_id !== null);
  const defaults = visible.filter(c => c.user_id === null);
  const countFor = (f: ListFilter) => categories.filter(c => matchesFilter(c, f)).length;

  const renderRow = (cat: Category) => {
    const Icon = getCategoryIcon(cat.icon);
    const catType = (cat.type ?? 'both') as CategoryType;
    const isDefault = cat.user_id === null;
    return (
      <div
        key={cat.id}
        className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl transition-colors hover:bg-slate-50 ${cat.is_active ? '' : 'opacity-55'}`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center border shrink-0"
            style={{ backgroundColor: `${cat.color}14`, borderColor: `${cat.color}33` }}
          >
            <Icon className="w-4 h-4" style={{ color: cat.color }} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-800 truncate">{cat.name}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`text-[9px] font-bold px-1.5 py-px rounded-md border ${TYPE_BADGE[catType]}`}>
                {TYPE_LABEL[catType]}
              </span>
              {!cat.is_active && <span className="text-[9px] font-semibold text-slate-400">Hidden from forms</span>}
            </div>
          </div>
        </div>

        {isDefault ? (
          <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 shrink-0" title="Default categories are shared and always on">
            <Lock className="w-3 h-3" /> Always on
          </span>
        ) : (
          <button
            type="button"
            role="switch"
            aria-checked={cat.is_active}
            aria-label={`${cat.is_active ? 'Hide' : 'Show'} ${cat.name}`}
            disabled={togglingId === cat.id}
            onClick={() => handleToggle(cat)}
            className={`relative w-9 h-5 rounded-full transition-colors shrink-0 cursor-pointer disabled:opacity-50 ${
              cat.is_active ? 'bg-violet-600' : 'bg-slate-200'
            }`}
            title={cat.is_active ? 'Active — click to hide from forms' : 'Hidden — click to show in forms'}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                cat.is_active ? 'translate-x-4' : ''
              }`}
            />
          </button>
        )}
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="category-manager-title"
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h3 id="category-manager-title" className="text-base font-bold text-slate-900 font-display">Manage Categories</h3>
              <p className="text-[11px] text-slate-400 font-medium">Create your own categories and choose which ones appear in forms.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* ---------- Create ---------- */}
          <form onSubmit={handleAdd} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">New category</span>
              {/* Live preview */}
              <div className="flex items-center gap-2 bg-white border border-slate-100 rounded-xl pl-1.5 pr-2.5 py-1 shadow-xs max-w-[60%]">
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center border shrink-0"
                  style={{ backgroundColor: `${color}14`, borderColor: `${color}33` }}
                >
                  <PreviewIcon className="w-3.5 h-3.5" style={{ color }} />
                </div>
                <span className={`text-xs font-bold truncate ${trimmed ? 'text-slate-800' : 'text-slate-300'}`}>
                  {trimmed || 'Preview'}
                </span>
                <span className={`text-[9px] font-bold px-1.5 py-px rounded-md border shrink-0 ${TYPE_BADGE[type]}`}>{TYPE_LABEL[type]}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
              <label className="space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-500">Name</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setError(''); }}
                  placeholder="e.g. Subscriptions, Rent, Pet care"
                  maxLength={40}
                  className={`w-full px-3 py-2 bg-white border rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all ${
                    trimmed && isDuplicate ? 'border-rose-300' : 'border-slate-200'
                  }`}
                />
              </label>
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-500">Used for</span>
                <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                  {(['expense', 'income', 'both'] as CategoryType[]).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                        type === t ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {t === 'expense' ? 'Expenses' : t === 'income' ? 'Income' : 'Both'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Icon grid */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-500">Icon</span>
              <div className="grid grid-cols-8 sm:grid-cols-11 gap-1.5">
                {CATEGORY_ICON_NAMES.map(iconName => {
                  const Icon = getCategoryIcon(iconName);
                  const selected = icon === iconName;
                  return (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => setIcon(iconName)}
                      title={iconName}
                      aria-label={iconName}
                      aria-pressed={selected}
                      className={`aspect-square rounded-lg flex items-center justify-center border transition-all cursor-pointer ${
                        selected ? 'border-transparent ring-2 ring-offset-1' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700'
                      }`}
                      style={selected ? { backgroundColor: `${color}1f`, color, ['--tw-ring-color' as string]: color } : undefined}
                    >
                      <Icon className="w-4 h-4" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Colour swatches */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-500">Colour</span>
              <div className="flex flex-wrap items-center gap-2">
                {CATEGORY_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    aria-label={`Colour ${c}`}
                    aria-pressed={color.toLowerCase() === c.toLowerCase()}
                    className="w-7 h-7 rounded-full flex items-center justify-center ring-offset-2 transition-transform hover:scale-110 cursor-pointer"
                    style={{ backgroundColor: c, boxShadow: color.toLowerCase() === c.toLowerCase() ? `0 0 0 2px #fff, 0 0 0 4px ${c}` : undefined }}
                  >
                    {color.toLowerCase() === c.toLowerCase() && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                  </button>
                ))}
                {/* Custom colour */}
                <label
                  className="relative w-7 h-7 rounded-full border border-dashed border-slate-300 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:border-slate-400 cursor-pointer"
                  title="Custom colour"
                  style={!CATEGORY_COLORS.some(c => c.toLowerCase() === color.toLowerCase()) ? { backgroundColor: color, borderStyle: 'solid', borderColor: color } : undefined}
                >
                  <Palette className={`w-3.5 h-3.5 ${!CATEGORY_COLORS.some(c => c.toLowerCase() === color.toLowerCase()) ? 'text-white' : ''}`} />
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    aria-label="Custom colour"
                  />
                </label>
              </div>
            </div>

            {(error || message) && (
              <p className={`text-xs font-semibold ${error ? 'text-rose-600' : 'text-emerald-600'}`}>{error || message}</p>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!trimmed || isDuplicate || isSaving}
                className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl px-4 py-2 text-xs font-bold shadow-md shadow-violet-100 flex items-center gap-1.5 active:scale-98 transition-all cursor-pointer disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed"
              >
                <Plus className="w-3.5 h-3.5" /> {isSaving ? 'Adding…' : 'Add category'}
              </button>
            </div>
          </form>

          {/* ---------- List ---------- */}
          <div className="space-y-3">
            <div className="flex items-center bg-slate-100 p-1 rounded-xl w-fit">
              {(['all', 'expense', 'income'] as ListFilter[]).map(f => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    filter === f ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {f === 'all' ? 'All' : f === 'expense' ? 'Expense' : 'Income'} ({countFor(f)})
                </button>
              ))}
            </div>

            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1">Your categories</p>
              {own.length > 0 ? (
                <div className="space-y-0.5">{own.map(renderRow)}</div>
              ) : (
                <p className="text-xs text-slate-400 font-medium px-3 py-3">
                  You haven't created any {filter === 'all' ? '' : `${filter} `}categories yet.
                </p>
              )}
            </div>

            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1">Default</p>
              <div className="space-y-0.5">{defaults.map(renderRow)}</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
