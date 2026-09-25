import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './AuthContext';
import { toDbIncome, fromDbIncome } from '../lib/mappers';

interface Income {
  id: string;
  amount: number;
  source: string;
  paymentMode: string;
  date: string;
  referenceNumber?: string;
  createdAt: string;
  updatedAt: string;
}

interface IncomeContextType {
  incomes: Income[];
  loading: boolean;
  fetchIncomes: () => Promise<void>;
  addIncome: (income: Partial<Income> & Pick<Income, 'amount' | 'source' | 'paymentMode' | 'date'>) => Promise<void>;
  updateIncome: (id: string, income: Partial<Income>) => Promise<void>;
  deleteIncome: (id: string) => Promise<void>;
}

const IncomeContext = createContext<IncomeContextType | undefined>(undefined);

export const IncomeProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchIncomes = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('incomes')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;
      setIncomes((data ?? []).map(fromDbIncome));
    } catch (error) {
      console.error('Error fetching incomes:', error);
    } finally {
      setLoading(false);
    }
  };

  const addIncome = async (income: Partial<Income> & Pick<Income, 'amount' | 'source' | 'paymentMode' | 'date'>) => {
    if (!user) throw new Error('Not authenticated');
    try {
      const { data, error } = await supabase
        .from('incomes')
        .insert([toDbIncome(income, user.id)])
        .select()
        .single();

      if (error) throw error;
      setIncomes(prev => [fromDbIncome(data), ...prev]);
    } catch (error) {
      console.error('Error adding income:', error);
      throw error;
    }
  };

  const updateIncome = async (id: string, income: Partial<Income>) => {
    if (!user) throw new Error('Not authenticated');
    try {
      const { id: _id, createdAt: _c, updatedAt: _u, ...changes } = income;
      const payload: Record<string, unknown> = { ...toDbIncome(changes, user.id) };
      delete payload.id;
      delete payload.user_id;
      delete payload.created_at;
      delete payload.updated_at;

      const { data, error } = await supabase
        .from('incomes')
        .update(payload)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      setIncomes(prev => prev.map(inc => (inc.id === id ? fromDbIncome(data) : inc)));
    } catch (error) {
      console.error('Error updating income:', error);
      throw error;
    }
  };

  const deleteIncome = async (id: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('incomes')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      setIncomes(prev => prev.filter(inc => inc.id !== id));
    } catch (error) {
      console.error('Error deleting income:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (user) {
      fetchIncomes();
    } else {
      setIncomes([]);
      setLoading(false);
    }
  }, [user]);

  return (
    <IncomeContext.Provider value={{ incomes, loading, fetchIncomes, addIncome, updateIncome, deleteIncome }}>
      {children}
    </IncomeContext.Provider>
  );
};

export const useIncomes = () => {
  const context = useContext(IncomeContext);
  if (!context) {
    throw new Error('useIncomes must be used within an IncomeProvider');
  }
  return context;
};
