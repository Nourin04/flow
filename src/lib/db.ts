import type { Profile, MonthlyIncome, Transaction, Category, Budget, CategoryBudget, SavingsGoal } from './types';
import { supabase, isSupabaseConfigured } from './supabase';

// Helper to check if a string is a valid UUID
const isValidUUID = (id?: string | null): boolean => {
  if (!id) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
};

let isSeedingCategories = false;

// Default categories
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

const STORAGE_KEYS = {
  PROFILE: 'flow_profile',
  INCOME: 'flow_income',
  TRANSACTIONS: 'flow_transactions',
  CATEGORIES: 'flow_categories',
  BUDGETS: 'flow_budgets',
  CATEGORY_BUDGETS: 'flow_category_budgets',
  GOALS: 'flow_goals',
  IS_INITIALIZED: 'flow_initialized'
};

// Seed Data helper for local storage fallback
function seedData() {
  if (typeof window === 'undefined') return;
  if (localStorage.getItem(STORAGE_KEYS.IS_INITIALIZED)) {
    return;
  }

  const userId = 'noureen-user-id';

  // Seed Profile
  const profile: Profile = {
    id: userId,
    name: 'Noureen',
    email: 'noureen@example.com',
    currency: '₹',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));

  // Seed Categories
  const categories: Category[] = DEFAULT_CATEGORIES.map((cat, idx) => ({
    ...cat,
    id: `cat-${idx + 1}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }));
  localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));

  const getCatId = (name: string) => categories.find(c => c.name === name)?.id || categories[categories.length - 1].id;

  // Seed Monthly Income
  const incomes: MonthlyIncome[] = [
    {
      id: 'inc-1',
      user_id: userId,
      month: '2026-08',
      amount: 12000,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];
  localStorage.setItem(STORAGE_KEYS.INCOME, JSON.stringify(incomes));

  // Seed Budgets
  const budgets: Budget[] = [
    {
      id: 'b-1',
      user_id: userId,
      month: '2026-08',
      total_amount: 8000,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];
  localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets));

  // Seed Category Budgets
  const catBudgets: CategoryBudget[] = [
    {
      id: 'cb-1',
      user_id: userId,
      budget_id: 'b-1',
      category_id: getCatId('Food & Dining'),
      amount: 1500,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'cb-2',
      user_id: userId,
      budget_id: 'b-1',
      category_id: getCatId('Transportation'),
      amount: 1000,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];
  localStorage.setItem(STORAGE_KEYS.CATEGORY_BUDGETS, JSON.stringify(catBudgets));

  // Seed Transactions
  const todayStr = '2026-08-23';
  const yesterdayStr = '2026-08-22';

  const transactions: Transaction[] = [
    {
      id: 't-1',
      user_id: userId,
      amount: 120,
      description: 'Lunch',
      category_id: getCatId('Food & Dining'),
      transaction_date: todayStr,
      created_at: `${todayStr}T13:20:00Z`,
      updated_at: `${todayStr}T13:20:00Z`
    },
    {
      id: 't-2',
      user_id: userId,
      amount: 180,
      description: 'Uber Ride',
      category_id: getCatId('Transportation'),
      transaction_date: todayStr,
      created_at: `${todayStr}T10:30:00Z`,
      updated_at: `${todayStr}T10:30:00Z`
    },
    {
      id: 't-3',
      user_id: userId,
      amount: 450,
      description: 'Skincare',
      category_id: getCatId('Personal Care'),
      transaction_date: yesterdayStr,
      created_at: `${yesterdayStr}T19:45:00Z`,
      updated_at: `${yesterdayStr}T19:45:00Z`
    }
  ];
  localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));

  // Seed Savings Goals
  const goals: SavingsGoal[] = [
    {
      id: 'g-1',
      user_id: userId,
      name: 'Emergency Fund',
      target_amount: 50000,
      current_amount: 7720,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];
  localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
  localStorage.setItem(STORAGE_KEYS.IS_INITIALIZED, 'true');
}

if (typeof window !== 'undefined') {
  seedData();
}

export const db = {
  // 1. Profiles
  async getProfile(userId: string): Promise<Profile | null> {
    if (isSupabaseConfigured && supabase && isValidUUID(userId)) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
        if (!error && data) return data as Profile;
      } catch (err) {
        console.warn('Supabase profile fetch error:', err);
      }
    }
    // Fallback to localStorage
    const localData = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (!localData) return null;
    const profile: Profile = JSON.parse(localData);
    return profile.id === userId ? profile : null;
  },

  async updateProfile(profile: Partial<Profile> & { id: string }): Promise<Profile> {
    if (isSupabaseConfigured && supabase && isValidUUID(profile.id)) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .upsert({
            id: profile.id,
            name: profile.name,
            email: profile.email,
            currency: profile.currency,
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
        if (!error && data) return data as Profile;
      } catch (err) {
        console.warn('Supabase profile update error:', err);
      }
    }
    // Fallback to localStorage
    const data = localStorage.getItem(STORAGE_KEYS.PROFILE);
    let current: Profile = data ? JSON.parse(data) : {
      id: profile.id,
      name: '',
      email: '',
      currency: '₹',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    current = {
      ...current,
      ...profile,
      updated_at: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(current));
    return current;
  },

  // 2. Income
  async getIncome(userId: string, month: string): Promise<MonthlyIncome | null> {
    if (isSupabaseConfigured && supabase && isValidUUID(userId)) {
      try {
        const { data, error } = await supabase
          .from('monthly_incomes')
          .select('*')
          .eq('user_id', userId)
          .eq('month', month)
          .maybeSingle();
        if (!error && data) {
          return {
            id: data.id,
            user_id: data.user_id,
            month: data.month,
            amount: Number(data.amount),
            created_at: data.created_at,
            updated_at: data.updated_at
          };
        }
      } catch (err) {
        console.warn('Supabase getIncome error:', err);
      }
    }
    const incomes = this.getAllIncome(userId);
    return incomes.find(i => i.month === month) || null;
  },

  getAllIncome(userId: string): MonthlyIncome[] {
    const data = localStorage.getItem(STORAGE_KEYS.INCOME);
    if (!data) return [];
    const incomes: MonthlyIncome[] = JSON.parse(data);
    return incomes.filter(i => i.user_id === userId);
  },

  async setIncome(userId: string, month: string, amount: number): Promise<MonthlyIncome> {
    if (isSupabaseConfigured && supabase && isValidUUID(userId)) {
      try {
        const { data, error } = await supabase
          .from('monthly_incomes')
          .upsert(
            {
              user_id: userId,
              month,
              amount,
              updated_at: new Date().toISOString()
            },
            { onConflict: 'user_id,month' }
          )
          .select()
          .single();
        if (!error && data) {
          return {
            id: data.id,
            user_id: data.user_id,
            month: data.month,
            amount: Number(data.amount),
            created_at: data.created_at,
            updated_at: data.updated_at
          };
        }
      } catch (err) {
        console.warn('Supabase setIncome error:', err);
      }
    }
    // Fallback to localStorage
    const data = localStorage.getItem(STORAGE_KEYS.INCOME);
    let incomes: MonthlyIncome[] = data ? JSON.parse(data) : [];
    const idx = incomes.findIndex(i => i.user_id === userId && i.month === month);
    const nowStr = new Date().toISOString();

    if (idx >= 0) {
      incomes[idx] = {
        ...incomes[idx],
        amount,
        updated_at: nowStr
      };
      localStorage.setItem(STORAGE_KEYS.INCOME, JSON.stringify(incomes));
      return incomes[idx];
    } else {
      const newIncome: MonthlyIncome = {
        id: `inc-${Date.now()}`,
        user_id: userId,
        month,
        amount,
        created_at: nowStr,
        updated_at: nowStr
      };
      incomes.push(newIncome);
      localStorage.setItem(STORAGE_KEYS.INCOME, JSON.stringify(incomes));
      return newIncome;
    }
  },

  // 3. Transactions
  async getTransactions(userId: string, month?: string): Promise<Transaction[]> {
    if (isSupabaseConfigured && supabase && isValidUUID(userId)) {
      try {
        let query = supabase
          .from('transactions')
          .select('*')
          .eq('user_id', userId)
          .order('date', { ascending: false });

        if (month) {
          const startDate = `${month}-01`;
          const [y, m] = month.split('-').map(Number);
          const nextMonthDate = new Date(y, m, 1).toISOString().split('T')[0];
          query = query.gte('date', startDate).lt('date', nextMonthDate);
        }

        const { data, error } = await query;
        if (!error && data) {
          return data.map((t: any) => ({
            id: t.id,
            user_id: t.user_id,
            amount: Number(t.amount),
            description: t.title || t.description || '',
            category_id: t.category_id,
            transaction_date: t.date || t.transaction_date || '',
            type: t.type || 'expense',
            created_at: t.created_at,
            updated_at: t.updated_at
          }));
        }
      } catch (err) {
        console.warn('Supabase getTransactions error:', err);
      }
    }
    // Fallback to localStorage
    const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (!data) return [];
    let transactions: Transaction[] = JSON.parse(data);
    transactions = transactions.filter(t => t.user_id === userId);

    if (month) {
      transactions = transactions.filter(t => t.transaction_date.startsWith(month));
    }
    return transactions.sort((a, b) => {
      const dateCompare = b.transaction_date.localeCompare(a.transaction_date);
      if (dateCompare !== 0) return dateCompare;
      return b.created_at.localeCompare(a.created_at);
    });
  },

  async addTransaction(userId: string, transaction: Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Transaction> {
    const txType = transaction.type || 'expense';
    if (isSupabaseConfigured && supabase && isValidUUID(userId)) {
      try {
        const catIdValid = isValidUUID(transaction.category_id) ? transaction.category_id : null;
        const { data, error } = await supabase
          .from('transactions')
          .insert({
            user_id: userId,
            amount: transaction.amount,
            type: txType,
            title: transaction.description,
            category_id: catIdValid,
            date: transaction.transaction_date
          })
          .select()
          .single();

        if (!error && data) {
          return {
            id: data.id,
            user_id: data.user_id,
            amount: Number(data.amount),
            description: data.title || transaction.description,
            category_id: data.category_id || transaction.category_id,
            transaction_date: data.date || transaction.transaction_date,
            type: data.type || txType,
            created_at: data.created_at,
            updated_at: data.updated_at
          };
        } else if (error) {
          console.warn('Supabase insert transaction returned error:', error);
        }
      } catch (err) {
        console.warn('Supabase addTransaction error:', err);
      }
    }
    // Fallback to localStorage
    const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    const transactions: Transaction[] = data ? JSON.parse(data) : [];
    const nowStr = new Date().toISOString();
    const newTx: Transaction = {
      ...transaction,
      type: txType,
      id: `t-${Date.now()}`,
      user_id: userId,
      created_at: nowStr,
      updated_at: nowStr
    };
    transactions.push(newTx);
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    return newTx;
  },

  async updateTransaction(userId: string, transactionId: string, updates: Partial<Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>>): Promise<Transaction> {
    if (isSupabaseConfigured && supabase && isValidUUID(userId) && isValidUUID(transactionId)) {
      try {
        const payload: any = { updated_at: new Date().toISOString() };
        if (updates.amount !== undefined) payload.amount = updates.amount;
        if (updates.description !== undefined) payload.title = updates.description;
        if (updates.category_id !== undefined) payload.category_id = isValidUUID(updates.category_id) ? updates.category_id : null;
        if (updates.transaction_date !== undefined) payload.date = updates.transaction_date;
        if (updates.type !== undefined) payload.type = updates.type;

        const { data, error } = await supabase
          .from('transactions')
          .update(payload)
          .eq('id', transactionId)
          .eq('user_id', userId)
          .select()
          .single();

        if (!error && data) {
          return {
            id: data.id,
            user_id: data.user_id,
            amount: Number(data.amount),
            description: data.title || updates.description || '',
            category_id: data.category_id || updates.category_id || '',
            transaction_date: data.date || updates.transaction_date || '',
            type: data.type || updates.type || 'expense',
            created_at: data.created_at,
            updated_at: data.updated_at
          };
        }
      } catch (err) {
        console.warn('Supabase updateTransaction error:', err);
      }
    }
    // Fallback to localStorage
    const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (!data) throw new Error('Transaction not found');
    const transactions: Transaction[] = JSON.parse(data);
    const idx = transactions.findIndex(t => t.id === transactionId && t.user_id === userId);
    if (idx === -1) throw new Error('Transaction not found');

    transactions[idx] = {
      ...transactions[idx],
      ...updates,
      updated_at: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    return transactions[idx];
  },

  async deleteTransaction(userId: string, transactionId: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase && isValidUUID(userId) && isValidUUID(transactionId)) {
      try {
        const { error } = await supabase
          .from('transactions')
          .delete()
          .eq('id', transactionId)
          .eq('user_id', userId);
        if (!error) return true;
      } catch (err) {
        console.warn('Supabase deleteTransaction error:', err);
      }
    }
    // Fallback to localStorage
    const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (!data) return false;
    const transactions: Transaction[] = JSON.parse(data);
    const initialLength = transactions.length;
    const filtered = transactions.filter(t => !(t.id === transactionId && t.user_id === userId));
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(filtered));
    return filtered.length < initialLength;
  },

  // 4. Categories
  async getCategories(userId: string): Promise<Category[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const query = isValidUUID(userId) 
          ? supabase.from('categories').select('*').or(`user_id.is.null,user_id.eq.${userId}`).order('created_at', { ascending: true })
          : supabase.from('categories').select('*').is('user_id', null).order('created_at', { ascending: true });

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          // Deduplicate by category name to prevent redundant categories in UI
          const uniqueCats: Category[] = [];
          const seenNames = new Set<string>();
          for (const item of data) {
            const cat = item as Category;
            if (!seenNames.has(cat.name)) {
              seenNames.add(cat.name);
              uniqueCats.push(cat);
            }
          }
          return uniqueCats;
        }

        // Auto-seed default categories in Supabase ONLY if no categories exist at all
        if (!error && (!data || data.length === 0) && !isSeedingCategories) {
          isSeedingCategories = true;
          try {
            const seedRows = DEFAULT_CATEGORIES.map(cat => ({
              name: cat.name,
              icon: cat.icon,
              color: cat.color,
              is_default: true,
              is_active: true,
              user_id: null
            }));
            const { data: inserted } = await supabase.from('categories').insert(seedRows).select();
            if (inserted && inserted.length > 0) {
              return inserted as Category[];
            }
          } finally {
            isSeedingCategories = false;
          }
        }
      } catch (err) {
        console.warn('Supabase getCategories error:', err);
      }
    }
    // Fallback to localStorage
    const data = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (!data) return [];
    const categories: Category[] = JSON.parse(data);
    const uniqueLocal: Category[] = [];
    const seenLocal = new Set<string>();
    for (const c of categories) {
      if ((c.user_id === null || c.user_id === userId) && !seenLocal.has(c.name)) {
        seenLocal.add(c.name);
        uniqueLocal.push(c);
      }
    }
    return uniqueLocal;
  },

  async addCategory(userId: string, category: Omit<Category, 'id' | 'user_id' | 'is_default' | 'created_at' | 'updated_at'>): Promise<Category> {
    if (isSupabaseConfigured && supabase && isValidUUID(userId)) {
      try {
        const { data, error } = await supabase
          .from('categories')
          .insert({
            user_id: userId,
            name: category.name,
            icon: category.icon,
            color: category.color,
            is_default: false,
            is_active: category.is_active ?? true
          })
          .select()
          .single();
        if (!error && data) return data as Category;
      } catch (err) {
        console.warn('Supabase addCategory error:', err);
      }
    }
    // Fallback to localStorage
    const data = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    const categories: Category[] = data ? JSON.parse(data) : [];
    const nowStr = new Date().toISOString();
    const newCat: Category = {
      ...category,
      id: `cat-${Date.now()}`,
      user_id: userId,
      is_default: false,
      created_at: nowStr,
      updated_at: nowStr
    };
    categories.push(newCat);
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    return newCat;
  },

  async updateCategory(userId: string, categoryId: string, updates: Partial<Omit<Category, 'id' | 'user_id' | 'created_at' | 'updated_at'>>): Promise<Category> {
    if (isSupabaseConfigured && supabase && isValidUUID(categoryId)) {
      try {
        const { data, error } = await supabase
          .from('categories')
          .update({
            ...updates,
            updated_at: new Date().toISOString()
          })
          .eq('id', categoryId)
          .select()
          .single();
        if (!error && data) return data as Category;
      } catch (err) {
        console.warn('Supabase updateCategory error:', err);
      }
    }
    // Fallback to localStorage
    const data = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (!data) throw new Error('Category not found');
    const categories: Category[] = JSON.parse(data);
    const idx = categories.findIndex(c => c.id === categoryId && (c.user_id === userId || c.user_id === null));
    if (idx === -1) throw new Error('Category not found');

    categories[idx] = {
      ...categories[idx],
      ...updates,
      updated_at: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    return categories[idx];
  },

  // 5. Budgets
  async getBudget(userId: string, month: string): Promise<Budget | null> {
    if (isSupabaseConfigured && supabase && isValidUUID(userId)) {
      try {
        const { data, error } = await supabase
          .from('budgets')
          .select('*')
          .eq('user_id', userId)
          .eq('month', month)
          .maybeSingle();
        if (!error && data) {
          return {
            id: data.id,
            user_id: data.user_id,
            month: data.month,
            total_amount: Number(data.total_amount),
            created_at: data.created_at,
            updated_at: data.updated_at
          };
        }
      } catch (err) {
        console.warn('Supabase getBudget error:', err);
      }
    }
    const data = localStorage.getItem(STORAGE_KEYS.BUDGETS);
    if (!data) return null;
    const budgets: Budget[] = JSON.parse(data);
    return budgets.find(b => b.user_id === userId && b.month === month) || null;
  },

  async setBudget(userId: string, month: string, totalAmount: number): Promise<Budget> {
    if (isSupabaseConfigured && supabase && isValidUUID(userId)) {
      try {
        const { data, error } = await supabase
          .from('budgets')
          .upsert(
            {
              user_id: userId,
              month,
              total_amount: totalAmount,
              updated_at: new Date().toISOString()
            },
            { onConflict: 'user_id,month' }
          )
          .select()
          .single();
        if (!error && data) {
          return {
            id: data.id,
            user_id: data.user_id,
            month: data.month,
            total_amount: Number(data.total_amount),
            created_at: data.created_at,
            updated_at: data.updated_at
          };
        }
      } catch (err) {
        console.warn('Supabase setBudget error:', err);
      }
    }
    // Fallback to localStorage
    const data = localStorage.getItem(STORAGE_KEYS.BUDGETS);
    let budgets: Budget[] = data ? JSON.parse(data) : [];
    const idx = budgets.findIndex(b => b.user_id === userId && b.month === month);
    const nowStr = new Date().toISOString();

    if (idx >= 0) {
      budgets[idx] = {
        ...budgets[idx],
        total_amount: totalAmount,
        updated_at: nowStr
      };
      localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets));
      return budgets[idx];
    } else {
      const newBudget: Budget = {
        id: `b-${Date.now()}`,
        user_id: userId,
        month,
        total_amount: totalAmount,
        created_at: nowStr,
        updated_at: nowStr
      };
      budgets.push(newBudget);
      localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets));
      return newBudget;
    }
  },

  // 6. Category Budgets
  async getCategoryBudgets(userId: string, budgetId: string): Promise<CategoryBudget[]> {
    if (isSupabaseConfigured && supabase && isValidUUID(userId) && isValidUUID(budgetId)) {
      try {
        const { data, error } = await supabase
          .from('category_budgets')
          .select('*')
          .eq('user_id', userId)
          .eq('budget_id', budgetId);
        if (!error && data) {
          return data.map((cb: any) => ({
            id: cb.id,
            user_id: cb.user_id,
            budget_id: cb.budget_id,
            category_id: cb.category_id,
            amount: Number(cb.amount),
            created_at: cb.created_at,
            updated_at: cb.updated_at
          }));
        }
      } catch (err) {
        console.warn('Supabase getCategoryBudgets error:', err);
      }
    }
    const data = localStorage.getItem(STORAGE_KEYS.CATEGORY_BUDGETS);
    if (!data) return [];
    const catBudgets: CategoryBudget[] = JSON.parse(data);
    return catBudgets.filter(cb => cb.user_id === userId && cb.budget_id === budgetId);
  },

  async setCategoryBudget(userId: string, budgetId: string, categoryId: string, amount: number): Promise<CategoryBudget> {
    if (isSupabaseConfigured && supabase && isValidUUID(userId) && isValidUUID(budgetId) && isValidUUID(categoryId)) {
      try {
        const { data, error } = await supabase
          .from('category_budgets')
          .upsert(
            {
              user_id: userId,
              budget_id: budgetId,
              category_id: categoryId,
              amount,
              updated_at: new Date().toISOString()
            }
          )
          .select()
          .single();
        if (!error && data) {
          return {
            id: data.id,
            user_id: data.user_id,
            budget_id: data.budget_id,
            category_id: data.category_id,
            amount: Number(data.amount),
            created_at: data.created_at,
            updated_at: data.updated_at
          };
        }
      } catch (err) {
        console.warn('Supabase setCategoryBudget error:', err);
      }
    }
    // Fallback to localStorage
    const data = localStorage.getItem(STORAGE_KEYS.CATEGORY_BUDGETS);
    let catBudgets: CategoryBudget[] = data ? JSON.parse(data) : [];
    const idx = catBudgets.findIndex(cb => cb.user_id === userId && cb.budget_id === budgetId && cb.category_id === categoryId);
    const nowStr = new Date().toISOString();

    if (idx >= 0) {
      catBudgets[idx] = {
        ...catBudgets[idx],
        amount,
        updated_at: nowStr
      };
      localStorage.setItem(STORAGE_KEYS.CATEGORY_BUDGETS, JSON.stringify(catBudgets));
      return catBudgets[idx];
    } else {
      const newCatBudget: CategoryBudget = {
        id: `cb-${Date.now()}`,
        user_id: userId,
        budget_id: budgetId,
        category_id: categoryId,
        amount,
        created_at: nowStr,
        updated_at: nowStr
      };
      catBudgets.push(newCatBudget);
      localStorage.setItem(STORAGE_KEYS.CATEGORY_BUDGETS, JSON.stringify(catBudgets));
      return newCatBudget;
    }
  },

  async deleteCategoryBudget(userId: string, budgetId: string, categoryId: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase && isValidUUID(userId) && isValidUUID(budgetId) && isValidUUID(categoryId)) {
      try {
        const { error } = await supabase
          .from('category_budgets')
          .delete()
          .eq('user_id', userId)
          .eq('budget_id', budgetId)
          .eq('category_id', categoryId);
        if (!error) return true;
      } catch (err) {
        console.warn('Supabase deleteCategoryBudget error:', err);
      }
    }
    // Fallback to localStorage
    const data = localStorage.getItem(STORAGE_KEYS.CATEGORY_BUDGETS);
    if (!data) return false;
    const catBudgets: CategoryBudget[] = JSON.parse(data);
    const initialLength = catBudgets.length;
    const filtered = catBudgets.filter(cb => !(cb.user_id === userId && cb.budget_id === budgetId && cb.category_id === categoryId));
    localStorage.setItem(STORAGE_KEYS.CATEGORY_BUDGETS, JSON.stringify(filtered));
    return filtered.length < initialLength;
  },

  // 7. Savings Goals
  async getSavingsGoals(userId: string): Promise<SavingsGoal[]> {
    if (isSupabaseConfigured && supabase && isValidUUID(userId)) {
      try {
        const { data, error } = await supabase
          .from('savings_goals')
          .select('*')
          .eq('user_id', userId);
        if (!error && data) {
          return data.map((g: any) => ({
            id: g.id,
            user_id: g.user_id,
            name: g.title || g.name || '',
            target_amount: Number(g.target_amount),
            current_amount: Number(g.current_amount),
            created_at: g.created_at,
            updated_at: g.updated_at
          }));
        }
      } catch (err) {
        console.warn('Supabase getSavingsGoals error:', err);
      }
    }
    // Fallback to localStorage
    const data = localStorage.getItem(STORAGE_KEYS.GOALS);
    if (!data) return [];
    const goals: SavingsGoal[] = JSON.parse(data);
    return goals.filter(g => g.user_id === userId);
  },

  async addSavingsGoal(userId: string, goal: Omit<SavingsGoal, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<SavingsGoal> {
    if (isSupabaseConfigured && supabase && isValidUUID(userId)) {
      try {
        const { data, error } = await supabase
          .from('savings_goals')
          .insert({
            user_id: userId,
            title: goal.name,
            target_amount: goal.target_amount,
            current_amount: goal.current_amount
          })
          .select()
          .single();
        if (!error && data) {
          return {
            id: data.id,
            user_id: data.user_id,
            name: data.title || goal.name,
            target_amount: Number(data.target_amount),
            current_amount: Number(data.current_amount),
            created_at: data.created_at,
            updated_at: data.updated_at
          };
        }
      } catch (err) {
        console.warn('Supabase addSavingsGoal error:', err);
      }
    }
    // Fallback to localStorage
    const data = localStorage.getItem(STORAGE_KEYS.GOALS);
    const goals: SavingsGoal[] = data ? JSON.parse(data) : [];
    const nowStr = new Date().toISOString();
    const newGoal: SavingsGoal = {
      ...goal,
      id: `g-${Date.now()}`,
      user_id: userId,
      created_at: nowStr,
      updated_at: nowStr
    };
    goals.push(newGoal);
    localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
    return newGoal;
  },

  async updateSavingsGoal(userId: string, goalId: string, updates: Partial<Omit<SavingsGoal, 'id' | 'user_id' | 'created_at' | 'updated_at'>>): Promise<SavingsGoal> {
    if (isSupabaseConfigured && supabase && isValidUUID(userId) && isValidUUID(goalId)) {
      try {
        const payload: any = { updated_at: new Date().toISOString() };
        if (updates.name !== undefined) payload.title = updates.name;
        if (updates.target_amount !== undefined) payload.target_amount = updates.target_amount;
        if (updates.current_amount !== undefined) payload.current_amount = updates.current_amount;

        const { data, error } = await supabase
          .from('savings_goals')
          .update(payload)
          .eq('id', goalId)
          .eq('user_id', userId)
          .select()
          .single();
        if (!error && data) {
          return {
            id: data.id,
            user_id: data.user_id,
            name: data.title || updates.name || '',
            target_amount: Number(data.target_amount),
            current_amount: Number(data.current_amount),
            created_at: data.created_at,
            updated_at: data.updated_at
          };
        }
      } catch (err) {
        console.warn('Supabase updateSavingsGoal error:', err);
      }
    }
    // Fallback to localStorage
    const data = localStorage.getItem(STORAGE_KEYS.GOALS);
    if (!data) throw new Error('Goal not found');
    const goals: SavingsGoal[] = JSON.parse(data);
    const idx = goals.findIndex(g => g.id === goalId && g.user_id === userId);
    if (idx === -1) throw new Error('Goal not found');

    goals[idx] = {
      ...goals[idx],
      ...updates,
      updated_at: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
    return goals[idx];
  },

  async deleteSavingsGoal(userId: string, goalId: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase && isValidUUID(userId) && isValidUUID(goalId)) {
      try {
        const { error } = await supabase
          .from('savings_goals')
          .delete()
          .eq('id', goalId)
          .eq('user_id', userId);
        if (!error) return true;
      } catch (err) {
        console.warn('Supabase deleteSavingsGoal error:', err);
      }
    }
    // Fallback to localStorage
    const data = localStorage.getItem(STORAGE_KEYS.GOALS);
    if (!data) return false;
    const goals: SavingsGoal[] = JSON.parse(data);
    const initialLength = goals.length;
    const filtered = goals.filter(g => !(g.id === goalId && g.user_id === userId));
    localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(filtered));
    return filtered.length < initialLength;
  }
};
