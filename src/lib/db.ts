import type { Profile, MonthlyIncome, Transaction, Category, Budget, CategoryBudget, SavingsGoal } from './types';
import { supabase, isSupabaseConfigured } from './supabase';

/*
 * Data layer.
 *
 * Two mutually exclusive modes:
 *  - Remote (Supabase configured + real Supabase user id): every read/write goes to
 *    Supabase. Errors are THROWN so the UI can show them — we never silently fall back
 *    to localStorage, because that made saved entries "vanish" (written locally, read remotely).
 *  - Local demo mode (no Supabase config): everything lives in localStorage.
 */

const isValidUUID = (id?: string | null): boolean =>
  !!id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

const isRemote = (userId: string) => isSupabaseConfigured && !!supabase && isValidUUID(userId);

// Non-null accessor for use inside isRemote() branches
const sb = () => supabase!;

const fail = (context: string, error: { message: string }): never => {
  throw new Error(`${context}: ${error.message}`);
};

// Supabase returns at most 1000 rows per request; page through larger result sets.
const PAGE_SIZE = 1000;

// Default categories (seeded globally in Supabase by supabase_schema.sql; locally by seedData)
export const DEFAULT_CATEGORIES: Omit<Category, 'id' | 'created_at' | 'updated_at'>[] = [
  { name: 'Food & Dining', icon: 'Pizza', color: '#EC4899', is_default: true, is_active: true, user_id: null, type: 'expense' },
  { name: 'Transportation', icon: 'Car', color: '#3B82F6', is_default: true, is_active: true, user_id: null, type: 'expense' },
  { name: 'Home', icon: 'Home', color: '#EF4444', is_default: true, is_active: true, user_id: null, type: 'expense' },
  { name: 'Shopping', icon: 'ShoppingBag', color: '#F59E0B', is_default: true, is_active: true, user_id: null, type: 'expense' },
  { name: 'Personal Care', icon: 'Sparkles', color: '#8B5CF6', is_default: true, is_active: true, user_id: null, type: 'expense' },
  { name: 'Education / Learning', icon: 'GraduationCap', color: '#10B981', is_default: true, is_active: true, user_id: null, type: 'expense' },
  { name: 'Gifts', icon: 'Gift', color: '#F43F5E', is_default: true, is_active: true, user_id: null, type: 'expense' },
  { name: 'Other', icon: 'HelpCircle', color: '#6B7280', is_default: true, is_active: true, user_id: null, type: 'expense' },
  { name: 'Freelance & Side Income', icon: 'Sparkles', color: '#10B981', is_default: true, is_active: true, user_id: null, type: 'income' },
  { name: 'Bonus & Rewards', icon: 'Gift', color: '#06B6D4', is_default: true, is_active: true, user_id: null, type: 'income' },
  { name: 'Investments & Returns', icon: 'GraduationCap', color: '#8B5CF6', is_default: true, is_active: true, user_id: null, type: 'income' },
  { name: 'Other Income', icon: 'ShoppingBag', color: '#14B8A6', is_default: true, is_active: true, user_id: null, type: 'income' },
];

export const STORAGE_KEYS = {
  PROFILE: 'flow_profile',
  INCOME: 'flow_income',
  TRANSACTIONS: 'flow_transactions',
  CATEGORIES: 'flow_categories',
  BUDGETS: 'flow_budgets',
  CATEGORY_BUDGETS: 'flow_category_budgets',
  GOALS: 'flow_goals',
  IS_INITIALIZED: 'flow_initialized',
  ALL_PROFILES: 'flow_all_profiles',
  ACTIVE_USER: 'flow_active_user_id',
};

// ---------- localStorage helpers ----------
function readLocal<T>(key: string): T[] {
  const raw = localStorage.getItem(key);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
}
function writeLocal<T>(key: string, rows: T[]) {
  localStorage.setItem(key, JSON.stringify(rows));
}
const nowIso = () => new Date().toISOString();
const localId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

/**
 * Hide duplicate *default* categories (same name) — these come from older seeding races
 * and legacy per-user copies. Custom categories are always kept, even if they share a
 * name with a default.
 */
function dedupeDefaults(categories: Category[]): Category[] {
  const seen = new Set<string>();
  return categories.filter(c => {
    if (!c.is_default) return true;
    if (seen.has(c.name)) return false;
    seen.add(c.name);
    return true;
  });
}

// ---------- Local demo seed ----------
export const DEMO_USER_ID = 'noureen-user-id';

function seedData() {
  if (typeof window === 'undefined' || isSupabaseConfigured) return;
  if (localStorage.getItem(STORAGE_KEYS.IS_INITIALIZED)) return;

  const userId = DEMO_USER_ID;
  const ts = nowIso();
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const month = `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
  const todayStr = `${month}-${pad(now.getDate())}`;
  const y = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  const yesterdayStr = `${y.getFullYear()}-${pad(y.getMonth() + 1)}-${pad(y.getDate())}`;

  localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify({
    id: userId, name: 'Noureen', email: 'noureen@example.com', currency: '₹', created_at: ts, updated_at: ts,
  } satisfies Profile));

  const categories: Category[] = DEFAULT_CATEGORIES.map((cat, idx) => ({
    ...cat, id: `cat-${idx + 1}`, created_at: ts, updated_at: ts,
  }));
  writeLocal(STORAGE_KEYS.CATEGORIES, categories);
  const catId = (name: string) => categories.find(c => c.name === name)!.id;

  writeLocal<MonthlyIncome>(STORAGE_KEYS.INCOME, [
    { id: 'inc-1', user_id: userId, month, amount: 12000, created_at: ts, updated_at: ts },
  ]);
  writeLocal<Budget>(STORAGE_KEYS.BUDGETS, [
    { id: 'b-1', user_id: userId, month, total_amount: 8000, created_at: ts, updated_at: ts },
  ]);
  writeLocal<CategoryBudget>(STORAGE_KEYS.CATEGORY_BUDGETS, [
    { id: 'cb-1', user_id: userId, budget_id: 'b-1', category_id: catId('Food & Dining'), amount: 1500, created_at: ts, updated_at: ts },
    { id: 'cb-2', user_id: userId, budget_id: 'b-1', category_id: catId('Transportation'), amount: 1000, created_at: ts, updated_at: ts },
  ]);
  writeLocal<Transaction>(STORAGE_KEYS.TRANSACTIONS, [
    { id: 't-1', user_id: userId, amount: 120, description: 'Lunch', category_id: catId('Food & Dining'), transaction_date: todayStr, type: 'expense', created_at: ts, updated_at: ts },
    { id: 't-2', user_id: userId, amount: 180, description: 'Uber Ride', category_id: catId('Transportation'), transaction_date: todayStr, type: 'expense', created_at: ts, updated_at: ts },
    { id: 't-3', user_id: userId, amount: 450, description: 'Skincare', category_id: catId('Personal Care'), transaction_date: yesterdayStr, type: 'expense', created_at: ts, updated_at: ts },
  ]);
  writeLocal<SavingsGoal>(STORAGE_KEYS.GOALS, [
    { id: 'g-1', user_id: userId, name: 'Emergency Fund', target_amount: 50000, current_amount: 7720, created_at: ts, updated_at: ts },
  ]);
  localStorage.setItem(STORAGE_KEYS.IS_INITIALIZED, 'true');
}

if (typeof window !== 'undefined') {
  seedData();
}

// ---------- Row mappers (Supabase column names differ from app types) ----------
/* eslint-disable @typescript-eslint/no-explicit-any */
const mapIncome = (d: any): MonthlyIncome => ({
  id: d.id, user_id: d.user_id, month: d.month, amount: Number(d.amount), created_at: d.created_at, updated_at: d.updated_at,
});
const mapTransaction = (t: any): Transaction => ({
  id: t.id,
  user_id: t.user_id,
  amount: Number(t.amount),
  description: t.title ?? '',
  category_id: t.category_id ?? '',
  transaction_date: t.date ?? '',
  type: t.type || 'expense',
  created_at: t.created_at,
  updated_at: t.updated_at,
});
const mapBudget = (d: any): Budget => ({
  id: d.id, user_id: d.user_id, month: d.month, total_amount: Number(d.total_amount), created_at: d.created_at, updated_at: d.updated_at,
});
const mapCategoryBudget = (cb: any): CategoryBudget => ({
  id: cb.id, user_id: cb.user_id, budget_id: cb.budget_id, category_id: cb.category_id, amount: Number(cb.amount), created_at: cb.created_at, updated_at: cb.updated_at,
});
const mapGoal = (g: any): SavingsGoal => ({
  id: g.id, user_id: g.user_id, name: g.title ?? '', target_amount: Number(g.target_amount), current_amount: Number(g.current_amount), created_at: g.created_at, updated_at: g.updated_at,
});
/* eslint-enable @typescript-eslint/no-explicit-any */

/** Exclusive upper bound for a YYYY-MM month, as YYYY-MM-DD (no timezone conversion). */
const nextMonthStart = (month: string) => {
  const [y, m] = month.split('-').map(Number);
  const nextY = m === 12 ? y + 1 : y;
  const nextM = m === 12 ? 1 : m + 1;
  return `${nextY}-${String(nextM).padStart(2, '0')}-01`;
};

export const db = {
  // 1. Profiles
  async getProfile(userId: string): Promise<Profile | null> {
    if (isRemote(userId)) {
      const { data, error } = await sb().from('profiles').select('*').eq('id', userId).maybeSingle();
      if (error) fail('Failed to load profile', error);
      return (data as Profile) ?? null;
    }
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
    const demo: Profile | null = raw ? JSON.parse(raw) : null;
    if (demo?.id === userId) return demo;
    const found = readLocal<Profile & { password_hash?: string; password?: string }>(STORAGE_KEYS.ALL_PROFILES).find(p => p.id === userId);
    if (!found) return null;
    const { password_hash: _h, password: _p, ...profile } = found;
    return profile;
  },

  async updateProfile(profile: Partial<Profile> & { id: string }): Promise<Profile> {
    if (isRemote(profile.id)) {
      const { data, error } = await sb()
        .from('profiles')
        .upsert({ id: profile.id, name: profile.name, email: profile.email, currency: profile.currency, updated_at: nowIso() })
        .select()
        .single();
      if (error) fail('Failed to update profile', error);
      return data as Profile;
    }
    // Local: demo profile lives in PROFILE, other local accounts in ALL_PROFILES
    if (profile.id === DEMO_USER_ID) {
      const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
      const current: Profile = raw ? JSON.parse(raw) : { id: profile.id, name: '', email: '', currency: '₹', created_at: nowIso(), updated_at: nowIso() };
      const updated = { ...current, ...profile, updated_at: nowIso() };
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(updated));
      return updated;
    }
    const all = readLocal<Profile & { password_hash?: string }>(STORAGE_KEYS.ALL_PROFILES);
    const idx = all.findIndex(p => p.id === profile.id);
    if (idx === -1) throw new Error('Profile not found');
    all[idx] = { ...all[idx], ...profile, updated_at: nowIso() };
    writeLocal(STORAGE_KEYS.ALL_PROFILES, all);
    const { password_hash: _h, ...clean } = all[idx];
    return clean;
  },

  // 2. Income
  async getIncome(userId: string, month: string): Promise<MonthlyIncome | null> {
    if (isRemote(userId)) {
      const { data, error } = await sb().from('monthly_incomes').select('*').eq('user_id', userId).eq('month', month).maybeSingle();
      if (error) fail('Failed to load income', error);
      return data ? mapIncome(data) : null;
    }
    return readLocal<MonthlyIncome>(STORAGE_KEYS.INCOME).find(i => i.user_id === userId && i.month === month) || null;
  },

  /** All monthly base-income entries for the user, newest month first. */
  async getAllIncome(userId: string): Promise<MonthlyIncome[]> {
    let rows: MonthlyIncome[];
    if (isRemote(userId)) {
      const { data, error } = await sb().from('monthly_incomes').select('*').eq('user_id', userId);
      if (error) fail('Failed to load income history', error);
      rows = (data ?? []).map(mapIncome);
    } else {
      rows = readLocal<MonthlyIncome>(STORAGE_KEYS.INCOME).filter(i => i.user_id === userId);
    }
    return rows.sort((a, b) => b.month.localeCompare(a.month));
  },

  async setIncome(userId: string, month: string, amount: number): Promise<MonthlyIncome> {
    if (isRemote(userId)) {
      const { data, error } = await sb()
        .from('monthly_incomes')
        .upsert({ user_id: userId, month, amount, updated_at: nowIso() }, { onConflict: 'user_id,month' })
        .select()
        .single();
      if (error) fail('Failed to save income', error);
      return mapIncome(data);
    }
    const incomes = readLocal<MonthlyIncome>(STORAGE_KEYS.INCOME);
    const idx = incomes.findIndex(i => i.user_id === userId && i.month === month);
    if (idx >= 0) {
      incomes[idx] = { ...incomes[idx], amount, updated_at: nowIso() };
      writeLocal(STORAGE_KEYS.INCOME, incomes);
      return incomes[idx];
    }
    const created: MonthlyIncome = { id: localId('inc'), user_id: userId, month, amount, created_at: nowIso(), updated_at: nowIso() };
    writeLocal(STORAGE_KEYS.INCOME, [...incomes, created]);
    return created;
  },

  // 3. Transactions
  async getTransactions(userId: string, month?: string): Promise<Transaction[]> {
    if (isRemote(userId)) {
      const all: Transaction[] = [];
      for (let from = 0; ; from += PAGE_SIZE) {
        let query = sb()
          .from('transactions')
          .select('*')
          .eq('user_id', userId)
          .order('date', { ascending: false })
          .order('created_at', { ascending: false })
          .range(from, from + PAGE_SIZE - 1);
        if (month) query = query.gte('date', `${month}-01`).lt('date', nextMonthStart(month));

        const { data, error } = await query;
        if (error) fail('Failed to load transactions', error);
        const page = (data ?? []).map(mapTransaction);
        all.push(...page);
        if (page.length < PAGE_SIZE) break;
      }
      return all;
    }
    return readLocal<Transaction>(STORAGE_KEYS.TRANSACTIONS)
      .filter(t => t.user_id === userId && (!month || t.transaction_date.startsWith(month)))
      .sort((a, b) => b.transaction_date.localeCompare(a.transaction_date) || b.created_at.localeCompare(a.created_at));
  },

  async addTransaction(userId: string, transaction: Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Transaction> {
    const txType = transaction.type || 'expense';
    if (isRemote(userId)) {
      const { data, error } = await sb()
        .from('transactions')
        .insert({
          user_id: userId,
          amount: transaction.amount,
          type: txType,
          title: transaction.description,
          category_id: isValidUUID(transaction.category_id) ? transaction.category_id : null,
          date: transaction.transaction_date,
        })
        .select()
        .single();
      if (error) fail('Failed to save transaction', error);
      return mapTransaction(data);
    }
    const created: Transaction = { ...transaction, type: txType, id: localId('t'), user_id: userId, created_at: nowIso(), updated_at: nowIso() };
    writeLocal(STORAGE_KEYS.TRANSACTIONS, [...readLocal<Transaction>(STORAGE_KEYS.TRANSACTIONS), created]);
    return created;
  },

  async updateTransaction(userId: string, transactionId: string, updates: Partial<Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>>): Promise<Transaction> {
    if (isRemote(userId)) {
      const payload: Record<string, unknown> = { updated_at: nowIso() };
      if (updates.amount !== undefined) payload.amount = updates.amount;
      if (updates.description !== undefined) payload.title = updates.description;
      if (updates.category_id !== undefined) payload.category_id = isValidUUID(updates.category_id) ? updates.category_id : null;
      if (updates.transaction_date !== undefined) payload.date = updates.transaction_date;
      if (updates.type !== undefined) payload.type = updates.type;

      const { data, error } = await sb().from('transactions').update(payload).eq('id', transactionId).eq('user_id', userId).select().single();
      if (error) fail('Failed to update transaction', error);
      return mapTransaction(data);
    }
    const txs = readLocal<Transaction>(STORAGE_KEYS.TRANSACTIONS);
    const idx = txs.findIndex(t => t.id === transactionId && t.user_id === userId);
    if (idx === -1) throw new Error('Transaction not found');
    txs[idx] = { ...txs[idx], ...updates, updated_at: nowIso() };
    writeLocal(STORAGE_KEYS.TRANSACTIONS, txs);
    return txs[idx];
  },

  async deleteTransaction(userId: string, transactionId: string): Promise<void> {
    if (isRemote(userId)) {
      const { error } = await sb().from('transactions').delete().eq('id', transactionId).eq('user_id', userId);
      if (error) fail('Failed to delete transaction', error);
      return;
    }
    writeLocal(STORAGE_KEYS.TRANSACTIONS, readLocal<Transaction>(STORAGE_KEYS.TRANSACTIONS).filter(t => !(t.id === transactionId && t.user_id === userId)));
  },

  // 4. Categories
  async getCategories(userId: string): Promise<Category[]> {
    if (isRemote(userId)) {
      const { data, error } = await sb()
        .from('categories')
        .select('*')
        .or(`user_id.is.null,user_id.eq.${userId}`)
        .order('created_at', { ascending: true });
      if (error) fail('Failed to load categories', error);
      return dedupeDefaults((data ?? []) as Category[]);
    }
    return dedupeDefaults(readLocal<Category>(STORAGE_KEYS.CATEGORIES).filter(c => c.user_id === null || c.user_id === userId));
  },

  async addCategory(userId: string, category: Omit<Category, 'id' | 'user_id' | 'is_default' | 'created_at' | 'updated_at'>): Promise<Category> {
    if (isRemote(userId)) {
      const { data, error } = await sb()
        .from('categories')
        .insert({
          user_id: userId,
          name: category.name,
          icon: category.icon,
          color: category.color,
          type: category.type ?? 'both',
          is_default: false,
          is_active: category.is_active ?? true,
        })
        .select()
        .single();
      if (error) fail('Failed to create category', error);
      return data as Category;
    }
    const created: Category = { ...category, type: category.type ?? 'both', id: localId('cat'), user_id: userId, is_default: false, created_at: nowIso(), updated_at: nowIso() };
    writeLocal(STORAGE_KEYS.CATEGORIES, [...readLocal<Category>(STORAGE_KEYS.CATEGORIES), created]);
    return created;
  },

  /** Only the user's own categories can be changed — default categories are shared by everyone. */
  async updateCategory(userId: string, categoryId: string, updates: Partial<Omit<Category, 'id' | 'user_id' | 'created_at' | 'updated_at'>>): Promise<Category> {
    if (isRemote(userId)) {
      const { data, error } = await sb()
        .from('categories')
        .update({ ...updates, updated_at: nowIso() })
        .eq('id', categoryId)
        .eq('user_id', userId)
        .select()
        .maybeSingle();
      if (error) fail('Failed to update category', error);
      if (!data) throw new Error('Default categories cannot be changed.');
      return data as Category;
    }
    const cats = readLocal<Category>(STORAGE_KEYS.CATEGORIES);
    const idx = cats.findIndex(c => c.id === categoryId && c.user_id === userId);
    if (idx === -1) throw new Error('Default categories cannot be changed.');
    cats[idx] = { ...cats[idx], ...updates, updated_at: nowIso() };
    writeLocal(STORAGE_KEYS.CATEGORIES, cats);
    return cats[idx];
  },

  // 5. Budgets
  async getBudget(userId: string, month: string): Promise<Budget | null> {
    if (isRemote(userId)) {
      const { data, error } = await sb().from('budgets').select('*').eq('user_id', userId).eq('month', month).maybeSingle();
      if (error) fail('Failed to load budget', error);
      return data ? mapBudget(data) : null;
    }
    return readLocal<Budget>(STORAGE_KEYS.BUDGETS).find(b => b.user_id === userId && b.month === month) || null;
  },

  async setBudget(userId: string, month: string, totalAmount: number): Promise<Budget> {
    if (isRemote(userId)) {
      const { data, error } = await sb()
        .from('budgets')
        .upsert({ user_id: userId, month, total_amount: totalAmount, updated_at: nowIso() }, { onConflict: 'user_id,month' })
        .select()
        .single();
      if (error) fail('Failed to save budget', error);
      return mapBudget(data);
    }
    const budgets = readLocal<Budget>(STORAGE_KEYS.BUDGETS);
    const idx = budgets.findIndex(b => b.user_id === userId && b.month === month);
    if (idx >= 0) {
      budgets[idx] = { ...budgets[idx], total_amount: totalAmount, updated_at: nowIso() };
      writeLocal(STORAGE_KEYS.BUDGETS, budgets);
      return budgets[idx];
    }
    const created: Budget = { id: localId('b'), user_id: userId, month, total_amount: totalAmount, created_at: nowIso(), updated_at: nowIso() };
    writeLocal(STORAGE_KEYS.BUDGETS, [...budgets, created]);
    return created;
  },

  // 6. Category Budgets
  async getCategoryBudgets(userId: string, budgetId: string): Promise<CategoryBudget[]> {
    if (isRemote(userId)) {
      const { data, error } = await sb().from('category_budgets').select('*').eq('user_id', userId).eq('budget_id', budgetId);
      if (error) fail('Failed to load category budgets', error);
      return (data ?? []).map(mapCategoryBudget);
    }
    return readLocal<CategoryBudget>(STORAGE_KEYS.CATEGORY_BUDGETS).filter(cb => cb.user_id === userId && cb.budget_id === budgetId);
  },

  async setCategoryBudget(userId: string, budgetId: string, categoryId: string, amount: number): Promise<CategoryBudget> {
    if (isRemote(userId)) {
      // onConflict relies on UNIQUE(budget_id, category_id) from supabase_schema.sql —
      // without it every save inserted a duplicate row.
      const { data, error } = await sb()
        .from('category_budgets')
        .upsert(
          { user_id: userId, budget_id: budgetId, category_id: categoryId, amount, updated_at: nowIso() },
          { onConflict: 'budget_id,category_id' }
        )
        .select()
        .single();
      if (error) fail('Failed to save category budget', error);
      return mapCategoryBudget(data);
    }
    const rows = readLocal<CategoryBudget>(STORAGE_KEYS.CATEGORY_BUDGETS);
    const idx = rows.findIndex(cb => cb.user_id === userId && cb.budget_id === budgetId && cb.category_id === categoryId);
    if (idx >= 0) {
      rows[idx] = { ...rows[idx], amount, updated_at: nowIso() };
      writeLocal(STORAGE_KEYS.CATEGORY_BUDGETS, rows);
      return rows[idx];
    }
    const created: CategoryBudget = { id: localId('cb'), user_id: userId, budget_id: budgetId, category_id: categoryId, amount, created_at: nowIso(), updated_at: nowIso() };
    writeLocal(STORAGE_KEYS.CATEGORY_BUDGETS, [...rows, created]);
    return created;
  },

  async deleteCategoryBudget(userId: string, budgetId: string, categoryId: string): Promise<void> {
    if (isRemote(userId)) {
      const { error } = await sb().from('category_budgets').delete().eq('user_id', userId).eq('budget_id', budgetId).eq('category_id', categoryId);
      if (error) fail('Failed to delete category budget', error);
      return;
    }
    writeLocal(
      STORAGE_KEYS.CATEGORY_BUDGETS,
      readLocal<CategoryBudget>(STORAGE_KEYS.CATEGORY_BUDGETS).filter(cb => !(cb.user_id === userId && cb.budget_id === budgetId && cb.category_id === categoryId))
    );
  },

  // 7. Savings Goals
  async getSavingsGoals(userId: string): Promise<SavingsGoal[]> {
    if (isRemote(userId)) {
      const { data, error } = await sb().from('savings_goals').select('*').eq('user_id', userId).order('created_at', { ascending: true });
      if (error) fail('Failed to load savings goals', error);
      return (data ?? []).map(mapGoal);
    }
    return readLocal<SavingsGoal>(STORAGE_KEYS.GOALS).filter(g => g.user_id === userId);
  },

  async addSavingsGoal(userId: string, goal: Omit<SavingsGoal, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<SavingsGoal> {
    if (isRemote(userId)) {
      const { data, error } = await sb()
        .from('savings_goals')
        .insert({ user_id: userId, title: goal.name, target_amount: goal.target_amount, current_amount: goal.current_amount })
        .select()
        .single();
      if (error) fail('Failed to create savings goal', error);
      return mapGoal(data);
    }
    const created: SavingsGoal = { ...goal, id: localId('g'), user_id: userId, created_at: nowIso(), updated_at: nowIso() };
    writeLocal(STORAGE_KEYS.GOALS, [...readLocal<SavingsGoal>(STORAGE_KEYS.GOALS), created]);
    return created;
  },

  async updateSavingsGoal(userId: string, goalId: string, updates: Partial<Omit<SavingsGoal, 'id' | 'user_id' | 'created_at' | 'updated_at'>>): Promise<SavingsGoal> {
    if (isRemote(userId)) {
      const payload: Record<string, unknown> = { updated_at: nowIso() };
      if (updates.name !== undefined) payload.title = updates.name;
      if (updates.target_amount !== undefined) payload.target_amount = updates.target_amount;
      if (updates.current_amount !== undefined) payload.current_amount = updates.current_amount;
      const { data, error } = await sb().from('savings_goals').update(payload).eq('id', goalId).eq('user_id', userId).select().single();
      if (error) fail('Failed to update savings goal', error);
      return mapGoal(data);
    }
    const goals = readLocal<SavingsGoal>(STORAGE_KEYS.GOALS);
    const idx = goals.findIndex(g => g.id === goalId && g.user_id === userId);
    if (idx === -1) throw new Error('Goal not found');
    goals[idx] = { ...goals[idx], ...updates, updated_at: nowIso() };
    writeLocal(STORAGE_KEYS.GOALS, goals);
    return goals[idx];
  },

  async deleteSavingsGoal(userId: string, goalId: string): Promise<void> {
    if (isRemote(userId)) {
      const { error } = await sb().from('savings_goals').delete().eq('id', goalId).eq('user_id', userId);
      if (error) fail('Failed to delete savings goal', error);
      return;
    }
    writeLocal(STORAGE_KEYS.GOALS, readLocal<SavingsGoal>(STORAGE_KEYS.GOALS).filter(g => !(g.id === goalId && g.user_id === userId)));
  },
};
