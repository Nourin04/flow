import {
  Pizza, Car, Home, ShoppingBag, GraduationCap, Gift, Sparkles, HelpCircle,
  Utensils, Coffee, Plane, Heart, Music, Film, Dumbbell, Smartphone, Wifi, Zap,
  Fuel, Bus, Shirt, Baby, PawPrint, Stethoscope, Briefcase, PiggyBank, Wallet,
  TrendingUp, Banknote, Gamepad2, BookOpen, Receipt,
  type LucideIcon,
} from 'lucide-react';

/**
 * Single source of truth for category icons. Categories store the icon by name;
 * every page resolves it through getCategoryIcon so newly added icons work everywhere.
 */
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  // Original set (used by the default categories — keep these names stable)
  Pizza, Car, Home, ShoppingBag, GraduationCap, Gift, Sparkles, HelpCircle,
  // Everyday spending
  Utensils, Coffee, Shirt, Receipt, Fuel, Bus, Plane,
  // Bills & tech
  Zap, Wifi, Smartphone,
  // Life & leisure
  Heart, Stethoscope, Dumbbell, Baby, PawPrint, Music, Film, Gamepad2, BookOpen,
  // Money & income
  Briefcase, Banknote, Wallet, PiggyBank, TrendingUp,
};

export const CATEGORY_ICON_NAMES = Object.keys(CATEGORY_ICONS);

export const getCategoryIcon = (iconName?: string | null): LucideIcon =>
  (iconName && CATEGORY_ICONS[iconName]) || HelpCircle;

/** Preset swatches for new categories. */
export const CATEGORY_COLORS = [
  '#8B5CF6', '#6366F1', '#3B82F6', '#06B6D4', '#14B8A6',
  '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#6B7280',
];
