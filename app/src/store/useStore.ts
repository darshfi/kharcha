import { create } from 'zustand';
import { Transaction, PaymentMode } from '../types/transaction';
import { Category, DEFAULT_CATEGORIES } from '../data/categories';

interface AppState {
  transactions: Transaction[];
  categories: Category[];
  addTransaction: (t: Transaction) => void;
  deleteTransaction: (id: string) => void;
  addCategory: (c: Category) => void;
  deleteCategory: (id: string) => void;
  clearAll: () => void;
}

export const useStore = create<AppState>((set) => ({
  transactions: [],
  categories: DEFAULT_CATEGORIES,

  addTransaction: (t) =>
    set((state) => ({
      transactions: [t, ...state.transactions],
    })),

  deleteTransaction: (id) =>
    set((state) => ({
      transactions: state.transactions.filter((t) => t.id !== id),
    })),

  addCategory: (c) =>
    set((state) => ({
      categories: [...state.categories, c],
    })),

  deleteCategory: (id) =>
    set((state) => {
      const cat = state.categories.find((c) => c.id === id);
      if (cat?.name === 'Others') return state;
      const others = state.categories.find((c) => c.name === 'Others');
      return {
        categories: state.categories.filter((c) => c.id !== id),
        transactions: state.transactions.map((t) =>
          t.categoryId === id && others ? { ...t, categoryId: others.id } : t
        ),
      };
    }),

  clearAll: () => set({ transactions: [] }),
}));
