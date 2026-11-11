-- ====================================================================
-- SUPABASE SCHEMA FOR MFLOW (Personal Finance & Expense Tracker)
-- Run this script in your Supabase SQL Editor (Dashboard -> SQL Editor)
-- Safe to re-run: every statement is idempotent, so it also upgrades an
-- existing database to the latest structure.
-- ====================================================================

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    currency TEXT DEFAULT '₹',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" 
    ON public.profiles FOR SELECT 
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
    ON public.profiles FOR INSERT 
    WITH CHECK (auth.uid() = id);

-- Trigger to automatically create a profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, currency)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'name', 'User'), 
    new.email,
    '₹'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 2. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    color TEXT NOT NULL,
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    type VARCHAR(10) NOT NULL DEFAULT 'both' CHECK (type IN ('expense', 'income', 'both')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Upgrade older databases that were created before the type column existed
ALTER TABLE public.categories
    ADD COLUMN IF NOT EXISTS type VARCHAR(10) NOT NULL DEFAULT 'both'
    CHECK (type IN ('expense', 'income', 'both'));

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Default categories (user_id IS NULL) are shared by everyone, so they are READ-ONLY.
-- Users may only create / change / delete their own categories.
DROP POLICY IF EXISTS "Users can access default or own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can read default or own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can insert own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can update own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can delete own categories" ON public.categories;

CREATE POLICY "Users can read default or own categories"
    ON public.categories FOR SELECT
    USING (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Users can insert own categories"
    ON public.categories FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories"
    ON public.categories FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories"
    ON public.categories FOR DELETE
    USING (auth.uid() = user_id);

-- Seed the shared default categories (the app can no longer insert them itself).
INSERT INTO public.categories (user_id, name, icon, color, is_default, is_active, type)
SELECT NULL, d.name, d.icon, d.color, true, true, d.type
FROM (VALUES
    ('Food & Dining',           'Pizza',         '#EC4899', 'expense'),
    ('Transportation',          'Car',           '#3B82F6', 'expense'),
    ('Home',                    'Home',          '#EF4444', 'expense'),
    ('Shopping',                'ShoppingBag',   '#F59E0B', 'expense'),
    ('Personal Care',           'Sparkles',      '#8B5CF6', 'expense'),
    ('Education / Learning',    'GraduationCap', '#10B981', 'expense'),
    ('Gifts',                   'Gift',          '#F43F5E', 'expense'),
    ('Other',                   'HelpCircle',    '#6B7280', 'expense'),
    ('Freelance & Side Income', 'Sparkles',      '#10B981', 'income'),
    ('Bonus & Rewards',         'Gift',          '#06B6D4', 'income'),
    ('Investments & Returns',   'GraduationCap', '#8B5CF6', 'income'),
    ('Other Income',            'ShoppingBag',   '#14B8A6', 'income')
) AS d(name, icon, color, type)
WHERE NOT EXISTS (
    SELECT 1 FROM public.categories c WHERE c.user_id IS NULL AND c.name = d.name
);

-- Backfill the type on default categories seeded before the column existed
UPDATE public.categories SET type = 'income'
WHERE user_id IS NULL
  AND name IN ('Freelance & Side Income', 'Bonus & Rewards', 'Investments & Returns', 'Other Income');
UPDATE public.categories SET type = 'expense'
WHERE user_id IS NULL
  AND name IN ('Food & Dining', 'Transportation', 'Home', 'Shopping', 'Personal Care', 'Education / Learning', 'Gifts', 'Other');

-- Re-activate any default category a user may have switched off for everyone
-- (possible under the old, overly broad policy).
UPDATE public.categories SET is_active = true WHERE user_id IS NULL AND is_active = false;


-- 3. MONTHLY INCOMES TABLE
CREATE TABLE IF NOT EXISTS public.monthly_incomes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    month VARCHAR(7) NOT NULL, -- Format: YYYY-MM
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, month)
);

ALTER TABLE public.monthly_incomes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own monthly incomes" ON public.monthly_incomes;

CREATE POLICY "Users can manage own monthly incomes" 
    ON public.monthly_incomes FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);


-- 4. BUDGETS TABLE
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    month VARCHAR(7) NOT NULL, -- Format: YYYY-MM
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, month)
);

ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own budgets" ON public.budgets;

CREATE POLICY "Users can manage own budgets" 
    ON public.budgets FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);


-- 5. CATEGORY BUDGETS TABLE
CREATE TABLE IF NOT EXISTS public.category_budgets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    budget_id UUID NOT NULL REFERENCES public.budgets(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- One limit per category per budget. Older databases may contain duplicates
-- (every edit used to insert a new row), so keep only the newest before adding the constraint.
DELETE FROM public.category_budgets cb
USING public.category_budgets newer
WHERE cb.budget_id = newer.budget_id
  AND cb.category_id = newer.category_id
  AND (cb.updated_at, cb.id) < (newer.updated_at, newer.id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'category_budgets_budget_category_key'
  ) THEN
    ALTER TABLE public.category_budgets
      ADD CONSTRAINT category_budgets_budget_category_key UNIQUE (budget_id, category_id);
  END IF;
END $$;

ALTER TABLE public.category_budgets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own category budgets" ON public.category_budgets;

CREATE POLICY "Users can manage own category budgets" 
    ON public.category_budgets FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);


-- 6. TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    amount NUMERIC(12, 2) NOT NULL,
    type VARCHAR(10) NOT NULL DEFAULT 'expense' CHECK (type IN ('income', 'expense')),
    title TEXT NOT NULL,
    date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own transactions" ON public.transactions;

CREATE POLICY "Users can manage own transactions" 
    ON public.transactions FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);


-- 7. SAVINGS GOALS TABLE
CREATE TABLE IF NOT EXISTS public.savings_goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    target_amount NUMERIC(12, 2) NOT NULL,
    current_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    target_date DATE,
    icon TEXT,
    color TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own savings goals" ON public.savings_goals;

CREATE POLICY "Users can manage own savings goals" 
    ON public.savings_goals FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
