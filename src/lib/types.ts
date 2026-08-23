export interface Profile {
  id: string;
  name: string;
  email: string;
  currency: string; // e.g. "₹" or "$"
  created_at: string;
  updated_at: string;
}

export interface MonthlyIncome {
  id: string;
  user_id: string;
  month: string; // YYYY-MM
  amount: number;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  description: string;
  category_id: string;
  transaction_date: string; // YYYY-MM-DD
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  user_id: string | null; // null for default global categories
  name: string;
  icon: string; // Lucide icon name
  color: string; // HEX color or CSS Tailwind color class prefix
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  month: string; // YYYY-MM
  total_amount: number;
  created_at: string;
  updated_at: string;
}

export interface CategoryBudget {
  id: string;
  user_id: string;
  budget_id: string;
  category_id: string;
  amount: number;
  created_at: string;
  updated_at: string;
}

export interface SavingsGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  created_at: string;
  updated_at: string;
}
