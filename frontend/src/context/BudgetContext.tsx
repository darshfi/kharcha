import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './AuthContext';
import { toDbBudget, fromDbBudget } from '../lib/mappers';

interface Budget {
  id: string;
  categoryId: string;
  monthlyLimit: number;
  alertThreshold: number;
  monthYear: string;
  currentSpend: number;
  categoryName?: string;
  createdAt: string;
  updatedAt: string;
}

interface BudgetContextType {
  budgets: Budget[];
  loading: boolean;
  fetchBudgets: () => Promise<void>;
  addBudget: (budget: Partial<Budget> & Pick<Budget, 'categoryId' | 'monthlyLimit'>) => Promise<void>;
  updateBudget: (id: string, budget: Partial<Budget>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  getBudgetAlerts: () => Promise<
    Array<{ id: string; categoryId: string; categoryName: string; monthlyLimit: number; currentSpend: number; percentage: number }>
  >;
}

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

/** `expense_categories!inner(name)` — the FK is budgets.category_id → categories.id. */
const BUDGET_SELECT = `*, expense_categories!inner(name)`;

export const BudgetProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchBudgets = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('budgets')
        .select(BUDGET_SELECT)
        .eq('user_id', user.id);

      if (error) throw error;
      setBudgets((data ?? []).map(fromDbBudget));
    } catch (error) {
      console.error('Error fetching budgets:', error);
    } finally {
      setLoading(false);
    }
  };

  const addBudget = async (budget: Partial<Budget> & Pick<Budget, 'categoryId' | 'monthlyLimit'>) => {
    if (!user) throw new Error('Not authenticated');
    try {
      const { data, error } = await supabase
        .from('budgets')
        .insert([{ ...toDbBudget({ ...budget, currentSpend: 0 }, user.id), user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      setBudgets(prev => [fromDbBudget(data), ...prev]);
    } catch (error) {
      console.error('Error adding budget:', error);
      throw error;
    }
  };

  const updateBudget = async (id: string, budget: Partial<Budget>) => {
    if (!user) throw new Error('Not authenticated');
    try {
      const { id: _id, createdAt: _c, updatedAt: _u, categoryName: _n, ...changes } = budget;
      const payload: Record<string, unknown> = { ...toDbBudget(changes, user.id) };
      delete payload.id;
      delete payload.user_id;
      delete payload.created_at;
      delete payload.updated_at;

      // current_spend is maintained by the calculate_budget_spend() trigger —
      // never let the client write it.
      delete payload.current_spend;

      const { data, error } = await supabase
        .from('budgets')
        .update(payload)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      setBudgets(prev => prev.map(b => (b.id === id ? fromDbBudget(data) : b)));
    } catch (error) {
      console.error('Error updating budget:', error);
      throw error;
    }
  };

  const deleteBudget = async (id: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      setBudgets(prev => prev.filter(b => b.id !== id));
    } catch (error) {
      console.error('Error deleting budget:', error);
      throw error;
    }
  };

  const getBudgetAlerts = async () => {
    if (!user) return [];
    try {
      const { data, error } = await supabase
        .from('budgets')
        .select(BUDGET_SELECT)
        .eq('user_id', user.id);

      if (error) throw error;

      return (data ?? [])
        .map(fromDbBudget)
        .map(b => ({
          id: b.id,
          categoryId: b.categoryId,
          categoryName: b.categoryName ?? 'Unknown',
          monthlyLimit: b.monthlyLimit,
          currentSpend: b.currentSpend,
          // Compare against the row's own alert_threshold (0.80 by default),
          // not a hardcoded 80.
          percentage: Math.round(((b.currentSpend / b.monthlyLimit) * 100) * 10) / 10,
          threshold: b.alertThreshold * 100,
        }))
        .filter(a => a.percentage >= a.threshold);
    } catch (error) {
      console.error('Error getting budget alerts:', error);
      return [];
    }
  };

  useEffect(() => {
    if (user) {
      fetchBudgets();
    } else {
      setBudgets([]);
      setLoading(false);
    }
  }, [user]);

  return (
    <BudgetContext.Provider value={{ budgets, loading, fetchBudgets, addBudget, updateBudget, deleteBudget, getBudgetAlerts }}>
      {children}
    </BudgetContext.Provider>
  );
};

export const useBudgets = () => {
  const context = useContext(BudgetContext);
  if (!context) {
    throw new Error('useBudgets must be used within a BudgetProvider');
  }
  return context;
};
