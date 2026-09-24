import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './AuthContext';

interface Budget {
  id: string;
  categoryId: string;
  monthlyLimit: number;
  currentSpend: number;
  categoryName?: string;
  createdAt: string;
  updatedAt: string;
}

interface BudgetContextType {
  budgets: Budget[];
  loading: boolean;
  fetchBudgets: () => Promise<void>;
  addBudget: (budget: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateBudget: (id: string, budget: Partial<Budget>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  getBudgetAlerts: () => Promise<Array<{ id: string; categoryId: string; categoryName: string; monthlyLimit: number; currentSpend: number; percentage: number; }>>;
}

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

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
        .select(`
          *,
          expense_categories!inner (
            name
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      // Transform data to include categoryName
      const transformedData = data.map((budget: any) => ({
        ...budget,
        categoryName: budget.expense_categories?.name
      }));

      setBudgets(transformedData);
    } catch (error) {
      console.error('Error fetching budgets:', error);
    } finally {
      setLoading(false);
    }
  };

  const addBudget = async (budget: Omit<Budget, 'id' | 'createdAt' | 'updatedAt' | 'currentSpend'>) => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('budgets')
        .insert([{ ...budget, user_id: user.id, currentSpend: 0 }])
        .select()
        .single();

      if (error) throw error;
      setBudgets(prev => [data, ...prev]);
    } catch (error) {
      console.error('Error adding budget:', error);
      throw error;
    }
  };

  const updateBudget = async (id: string, budget: Partial<Budget>) => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('budgets')
        .update({ ...budget, updatedAt: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      setBudgets(prev => prev.map(b => b.id === id ? data : b));
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
        .select(`
          *,
          expense_categories!inner (
            name
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      // Calculate percentage and return alerts for budgets over 80%
      const alerts = data
        .map((budget: any) => {
          const percentage = (budget.currentSpend / budget.monthlyLimit) * 100;
          return {
            id: budget.id,
            categoryId: budget.categoryId,
            categoryName: budget.expense_categories?.name || 'Unknown',
            monthlyLimit: budget.monthlyLimit,
            currentSpend: budget.currentSpend,
            percentage: Math.round(percentage * 10) / 10 // Round to 1 decimal place
          };
        })
        .filter(alert => alert.percentage >= 80); // Only return alerts for 80% or over

      return alerts;
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
    }
  }, [user]);

  if (loading) {
    return <div>Loading budgets...</div>;
  }

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