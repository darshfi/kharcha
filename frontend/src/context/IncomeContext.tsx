import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './AuthContext';

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
  addIncome: (income: Omit<Income, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
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
      setIncomes(data);
    } catch (error) {
      console.error('Error fetching incomes:', error);
    } finally {
      setLoading(false);
    }
  };

  const addIncome = async (income: Omit<Income, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('incomes')
        .insert([{ ...income, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      setIncomes(prev => [data, ...prev]);
    } catch (error) {
      console.error('Error adding income:', error);
      throw error;
    }
  };

  const updateIncome = async (id: string, income: Partial<Income>) => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('incomes')
        .update({ ...income, updatedAt: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      setIncomes(prev => prev.map(inc => inc.id === id ? data : inc));
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
    }
  }, [user]);

  if (loading) {
    return <div>Loading incomes...</div>;
  }

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