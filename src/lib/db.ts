import type { Profile, MonthlyIncome, Transaction, Category, Budget, CategoryBudget, SavingsGoal } from './types';

// Default categories
export const DEFAULT_CATEGORIES: Omit<Category, 'id' | 'created_at' | 'updated_at'>[] = [
  { name: 'Food & Dining', icon: 'Pizza', color: '#EC4899', is_default: true, is_active: true, user_id: null },
  { name: 'Transportation', icon: 'Car', color: '#3B82F6', is_default: true, is_active: true, user_id: null },
  { name: 'Home', icon: 'Home', color: '#EF4444', is_default: true, is_active: true, user_id: null },
  { name: 'Shopping', icon: 'ShoppingBag', color: '#F59E0B', is_default: true, is_active: true, user_id: null },
  { name: 'Personal Care', icon: 'Sparkles', color: '#8B5CF6', is_default: true, is_active: true, user_id: null },
  { name: 'Education / Learning', icon: 'GraduationCap', color: '#10B981', is_default: true, is_active: true, user_id: null },
  { name: 'Gifts', icon: 'Gift', color: '#F43F5E', is_default: true, is_active: true, user_id: null },
  { name: 'Other', icon: 'HelpCircle', color: '#6B7280', is_default: true, is_active: true, user_id: null },
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

// Seed Data helper
function seedData() {
  if (localStorage.getItem(STORAGE_KEYS.IS_INITIALIZED)) {
    return;
  }

  const userId = 'noureen-user-id';

  // 1. Seed Profile
  const profile: Profile = {
    id: userId,
    name: 'Noureen',
    email: 'noureen@example.com',
    currency: '₹',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));

  // 2. Seed Categories
  const categories: Category[] = DEFAULT_CATEGORIES.map((cat, idx) => ({
    ...cat,
    id: `cat-${idx + 1}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }));
  localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));

  // Find category IDs to associate with budgets and transactions
  const getCatId = (name: string) => categories.find(c => c.name === name)?.id || categories[categories.length - 1].id;

  // 3. Seed Monthly Income
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

  // 4. Seed Budgets
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

  // 5. Seed Category Budgets
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
    },
    {
      id: 'cb-3',
      user_id: userId,
      budget_id: 'b-1',
      category_id: getCatId('Shopping'),
      amount: 1000,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'cb-4',
      user_id: userId,
      budget_id: 'b-1',
      category_id: getCatId('Personal Care'),
      amount: 800,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];
  localStorage.setItem(STORAGE_KEYS.CATEGORY_BUDGETS, JSON.stringify(catBudgets));

  // 6. Seed Transactions (Expenses for August 2026)
  // Ensure we match:
  // Food & Dining: 1420
  // Transportation: 820
  // Shopping: 740
  // Personal Care: 600
  // Other: 700
  // Total: 4280

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
    },
    {
      id: 't-4',
      user_id: userId,
      amount: 320,
      description: 'Book',
      category_id: getCatId('Shopping'),
      transaction_date: yesterdayStr,
      created_at: `${yesterdayStr}T16:10:00Z`,
      updated_at: `${yesterdayStr}T16:10:00Z`
    },
    {
      id: 't-5',
      user_id: userId,
      amount: 1300,
      description: 'Groceries',
      category_id: getCatId('Food & Dining'),
      transaction_date: '2026-08-15',
      created_at: '2026-08-15T12:00:00Z',
      updated_at: '2026-08-15T12:00:00Z'
    },
    {
      id: 't-6',
      user_id: userId,
      amount: 640,
      description: 'Train Ticket',
      category_id: getCatId('Transportation'),
      transaction_date: '2026-08-10',
      created_at: '2026-08-10T09:00:00Z',
      updated_at: '2026-08-10T09:00:00Z'
    },
    {
      id: 't-7',
      user_id: userId,
      amount: 420,
      description: 'Clothes',
      category_id: getCatId('Shopping'),
      transaction_date: '2026-08-18',
      created_at: '2026-08-18T15:30:00Z',
      updated_at: '2026-08-18T15:30:00Z'
    },
    {
      id: 't-8',
      user_id: userId,
      amount: 150,
      description: 'Haircut',
      category_id: getCatId('Personal Care'),
      transaction_date: '2026-08-22',
      created_at: '2026-08-22T11:00:00Z',
      updated_at: '2026-08-22T11:00:00Z'
    },
    {
      id: 't-9',
      user_id: userId,
      amount: 700,
      description: 'Concert ticket',
      category_id: getCatId('Other'),
      transaction_date: '2026-08-12',
      created_at: '2026-08-12T20:00:00Z',
      updated_at: '2026-08-12T20:00:00Z'
    }
  ];
  localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));

  // 7. Seed Savings Goals
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

// Perform seed immediately on module import
if (typeof window !== 'undefined') {
  seedData();
}

// Database client abstraction
export const db = {
  // Profiles
  async getProfile(userId: string): Promise<Profile | null> {
    const data = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (!data) return null;
    const profile: Profile = JSON.parse(data);
    return profile.id === userId ? profile : null;
  },

  async updateProfile(profile: Partial<Profile> & { id: string }): Promise<Profile> {
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

  // Income
  async getIncome(userId: string, month: string): Promise<MonthlyIncome | null> {
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

  // Transactions
  async getTransactions(userId: string, month?: string): Promise<Transaction[]> {
    const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (!data) return [];
    let transactions: Transaction[] = JSON.parse(data);
    transactions = transactions.filter(t => t.user_id === userId);

    if (month) {
      // month is YYYY-MM
      transactions = transactions.filter(t => t.transaction_date.startsWith(month));
    }
    // Sort transactions by date descending, then created_at descending
    return transactions.sort((a, b) => {
      const dateCompare = b.transaction_date.localeCompare(a.transaction_date);
      if (dateCompare !== 0) return dateCompare;
      return b.created_at.localeCompare(a.created_at);
    });
  },

  async addTransaction(userId: string, transaction: Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Transaction> {
    const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    const transactions: Transaction[] = data ? JSON.parse(data) : [];
    const nowStr = new Date().toISOString();
    const newTx: Transaction = {
      ...transaction,
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
    const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (!data) return false;
    const transactions: Transaction[] = JSON.parse(data);
    const initialLength = transactions.length;
    const filtered = transactions.filter(t => !(t.id === transactionId && t.user_id === userId));
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(filtered));
    return filtered.length < initialLength;
  },

  // Categories
  async getCategories(userId: string): Promise<Category[]> {
    const data = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (!data) return [];
    const categories: Category[] = JSON.parse(data);
    return categories.filter(c => c.user_id === null || c.user_id === userId);
  },

  async addCategory(userId: string, category: Omit<Category, 'id' | 'user_id' | 'is_default' | 'created_at' | 'updated_at'>): Promise<Category> {
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

  // Budgets
  async getBudget(userId: string, month: string): Promise<Budget | null> {
    const data = localStorage.getItem(STORAGE_KEYS.BUDGETS);
    if (!data) return null;
    const budgets: Budget[] = JSON.parse(data);
    return budgets.find(b => b.user_id === userId && b.month === month) || null;
  },

  async setBudget(userId: string, month: string, totalAmount: number): Promise<Budget> {
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

  // Category Budgets
  async getCategoryBudgets(userId: string, budgetId: string): Promise<CategoryBudget[]> {
    const data = localStorage.getItem(STORAGE_KEYS.CATEGORY_BUDGETS);
    if (!data) return [];
    const catBudgets: CategoryBudget[] = JSON.parse(data);
    return catBudgets.filter(cb => cb.user_id === userId && cb.budget_id === budgetId);
  },

  async setCategoryBudget(userId: string, budgetId: string, categoryId: string, amount: number): Promise<CategoryBudget> {
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
    const data = localStorage.getItem(STORAGE_KEYS.CATEGORY_BUDGETS);
    if (!data) return false;
    const catBudgets: CategoryBudget[] = JSON.parse(data);
    const initialLength = catBudgets.length;
    const filtered = catBudgets.filter(cb => !(cb.user_id === userId && cb.budget_id === budgetId && cb.category_id === categoryId));
    localStorage.setItem(STORAGE_KEYS.CATEGORY_BUDGETS, JSON.stringify(filtered));
    return filtered.length < initialLength;
  },

  // Savings Goals
  async getSavingsGoals(userId: string): Promise<SavingsGoal[]> {
    const data = localStorage.getItem(STORAGE_KEYS.GOALS);
    if (!data) return [];
    const goals: SavingsGoal[] = JSON.parse(data);
    return goals.filter(g => g.user_id === userId);
  },

  async addSavingsGoal(userId: string, goal: Omit<SavingsGoal, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<SavingsGoal> {
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
    const data = localStorage.getItem(STORAGE_KEYS.GOALS);
    if (!data) return false;
    const goals: SavingsGoal[] = JSON.parse(data);
    const initialLength = goals.length;
    const filtered = goals.filter(g => !(g.id === goalId && g.user_id === userId));
    localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(filtered));
    return filtered.length < initialLength;
  }
};
