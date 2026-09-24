import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './AuthContext';

interface Expense {
  id: string;
  amount: number;
  description: string;
  categoryId: string;
  date: string;
  time?: string;
  transactionType: 'manual' | 'upi';
  upiRefNumber?: string;
  merchantName?: string;
  receiptUrl?: string;
  balanceAfter?: number;
  status: 'pending' | 'confirmed';
  isRecurring: boolean;
  recurringFrequency?: string;
  createdAt: string;
  updatedAt: string;
}

interface ExpenseContextType {
  expenses: Expense[];
  loading: boolean;
  fetchExpenses: () => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateExpense: (id: string, expense: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
}

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

export const ExpenseProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchExpenses = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;
      setExpenses(data);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const addExpense = async (expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('expenses')
        .insert([{ ...expense, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      setExpenses(prev => [data, ...prev]);
    } catch (error) {
      console.error('Error adding expense:', error);
      throw error;
    }
  };

  const updateExpense = async (id: string, expense: Partial<Expense>) => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('expenses')
        .update({ ...expense, updatedAt: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      setExpenses(prev => prev.map(exp => exp.id === id ? data : exp));
    } catch (error) {
      console.error('Error updating expense:', error);
      throw error;
    }
  };

  const deleteExpense = async (id: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      setExpenses(prev => prev.filter(exp => exp.id !== id));
    } catch (error) {
      console.error('Error deleting expense:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (user) {
      fetchExpenses();
    } else {
      setExpenses([]);
    }
  }, [user]);

  if (loading) {
    return <div>Loading expenses...</div>;
  }

  return (
    <ExpenseContext.Provider value={{ expenses, loading, fetchExpenses, addExpense, updateExpense, deleteExpense }}>
      {children}
    </ExpenseContext.Provider>
  );
};

export const useExpenses = () => {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error('useExpenses must be used within an ExpenseProvider');
  }
  return context;
};