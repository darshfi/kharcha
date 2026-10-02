import { create } from 'zustand';
import { Transaction } from '../types/transaction';
import { Category } from '../data/categories';
import { saveTransaction, loadTransactions, deleteTransaction as removeTransaction, deleteAllTransactions } from '../services/transactions';
import { saveCategory, removeCategory } from '../services/categories';

interface AppState {
  transactions: Transaction[];
  categories: Category[];
  userId: string | null;
  setUserId: (id: string | null) => void;
  setTransactions: (txns: Transaction[]) => void;
  setCategories: (categories: Category[]) => void;
  addTransaction: (t: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addCategory: (c: Omit<Category, 'id'>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  transactions: [], categories: [], userId: null,
  setUserId: (id) => set((state) => state.userId === id ? state : { userId: id, transactions: [], categories: [] }),
  setTransactions: (transactions) => set({ transactions }),
  setCategories: (categories) => set({ categories }),

  addTransaction: async (txn) => {
    const { userId, transactions } = get();
    if (!userId || txn.userId !== userId) throw new Error('Please sign in again.');
    if (txn.upiRefNumber && transactions.some((row) => row.upiRefNumber === txn.upiRefNumber)) {
      throw new Error('This transaction has already been imported.');
    }
    const saved = await saveTransaction(txn);
    if (get().userId === userId) set((state) => ({ transactions: [saved, ...state.transactions] }));
  },

  deleteTransaction: async (id) => {
    const { userId, transactions } = get();
    const txn = transactions.find((row) => row.id === id);
    if (!userId || !txn || txn.userId !== userId) throw new Error('Transaction unavailable.');
    await removeTransaction(txn);
    if (get().userId === userId) set((state) => ({ transactions: state.transactions.filter((row) => row.id !== id) }));
  },

  addCategory: async (category) => {
    const { userId } = get();
    if (!userId) throw new Error('Please sign in again.');
    const saved = await saveCategory(category, userId);
    if (get().userId === userId) set((state) => ({ categories: [...state.categories, saved] }));
  },

  deleteCategory: async (id) => {
    const { userId, categories } = get();
    if (!userId) throw new Error('Please sign in again.');
    if (categories.find((category) => category.id === id)?.name === 'Others') return;
    await removeCategory(id, userId);
    if (get().userId === userId) set((state) => ({
      categories: state.categories.filter((category) => category.id !== id),
      transactions: state.transactions.map((txn) => txn.categoryId === id ? { ...txn, categoryId: null } : txn),
    }));
  },

  clearAll: async () => {
    const { userId } = get();
    if (!userId) throw new Error('Please sign in again.');
    try {
      await deleteAllTransactions(userId);
      if (get().userId === userId) set({ transactions: [] });
    } catch (error) {
      const remaining = await loadTransactions(userId);
      if (get().userId === userId) set({ transactions: remaining });
      throw error;
    }
  },
}));
