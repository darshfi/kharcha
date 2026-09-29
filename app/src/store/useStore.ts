import { create } from 'zustand';
import { Transaction, PaymentMode } from '../types/transaction';
import { Category, DEFAULT_CATEGORIES } from '../data/categories';
import { saveTransaction, deleteTransaction as deleteTransactionFromSupabase } from '../services/transactions';

interface AppState {
  transactions: Transaction[];
  categories: Category[];
  userId: string | null;
  setUserId: (id: string | null) => void;
  setTransactions: (txns: Transaction[]) => void;
  setCategories: (categories: Category[]) => void;
  addTransaction: (t: Transaction) => void;
  deleteTransaction: (id: string) => void;
  addCategory: (c: Category) => void;
  deleteCategory: (id: string) => void;
  clearAll: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  transactions: [],
  categories: DEFAULT_CATEGORIES,
  userId: null,

  setUserId: (id) => set({ userId: id }),

  setTransactions: (txns) => set({ transactions: txns }),

  setCategories: (cats) => set({ categories: cats }),

  addTransaction: (t) => {
    set((state) => ({
      transactions: [t, ...state.transactions],
    }));
    const { userId } = get();
    if (userId) {
      saveTransaction(t);
    }
  },

  deleteTransaction: (id) => {
    set((state) => ({
      transactions: state.transactions.filter((t) => t.id !== id),
    }));
    const { userId } = get();
    if (userId) {
      deleteTransactionFromSupabase(id, userId);
    }
  },

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
