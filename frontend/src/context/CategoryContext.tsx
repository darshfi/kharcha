import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './AuthContext';

interface Category {
  id: string;
  name: string;
  icon: string; // emoji or icon name
  color: string; // hex color code
  isCustom: boolean;
  isArchived: boolean;
  orderIndex: number;
  createdAt: string;
}

interface CategoryContextType {
  categories: Category[];
  loading: boolean;
  fetchCategories: () => Promise<void>;
  addCategory: (category: Omit<Category, 'id' | 'createdAt'>) => Promise<void>;
  updateCategory: (id: string, category: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  archiveCategory: (id: string) => Promise<void>;
}

const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

export const CategoryProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchCategories = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('expense_categories')
        .select('*')
        .eq('user_id', user.id)
        .order('order_index', { ascending: true });

      if (error) throw error;
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const addCategory = async (category: Omit<Category, 'id' | 'createdAt'>) => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('expense_categories')
        .insert([{ ...category, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      setCategories(prev => [data, ...prev]);
    } catch (error) {
      console.error('Error adding category:', error);
      throw error;
    }
  };

  const updateCategory = async (id: string, category: Partial<Category>) => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('expense_categories')
        .update({ ...category, updatedAt: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      setCategories(prev => prev.map(cat => cat.id === id ? data : cat));
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  };

  const deleteCategory = async (id: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('expense_categories')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      setCategories(prev => prev.filter(cat => cat.id !== id));
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  };

  const archiveCategory = async (id: string) => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('expense_categories')
        .update({ is_archived: true, updatedAt: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      setCategories(prev => prev.map(cat => cat.id === id ? data : cat));
    } catch (error) {
      console.error('Error archiving category:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (user) {
      fetchCategories();
    } else {
      setCategories([]);
    }
  }, [user]);

  if (loading) {
    return <div>Loading categories...</div>;
  }

  return (
    <CategoryContext.Provider value={{ categories, loading, fetchCategories, addCategory, updateCategory, deleteCategory, archiveCategory }}>
      {children}
    </CategoryContext.Provider>
  );
};

export const useCategories = () => {
  const context = useContext(CategoryContext);
  if (!context) {
    throw new Error('useCategories must be used within a CategoryProvider');
  }
  return context;
};