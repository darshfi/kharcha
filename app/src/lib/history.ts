import { Transaction } from '../types/transaction';
import { Category } from '../data/categories';

export interface HistoryFilters {
  year: string; month: string; query: string; category: string; sort: 'newest' | 'category';
}
export const allHistoryFilters: HistoryFilters = { year: '', month: '', query: '', category: '', sort: 'newest' };
export function categoryLabel(txn: Transaction, categories: Category[]): string {
  return txn.type === 'income' ? 'Income' : categories.find(c => c.id === txn.categoryId)?.name ?? 'Uncategorized';
}
export function historyYears(transactions: Transaction[]): string[] {
  return [...new Set(transactions.map(t => t.date.slice(0, 4)))].sort().reverse();
}
export function filterHistory(transactions: Transaction[], categories: Category[], filters: HistoryFilters): Transaction[] {
  const query = filters.query.trim().toLocaleLowerCase();
  return transactions.filter(t =>
    (!filters.year || t.date.slice(0, 4) === filters.year) &&
    (!filters.month || t.date.slice(5, 7) === filters.month) &&
    (!filters.category || (filters.category === 'income' ? t.type === 'income' :
      filters.category === 'uncategorized' ? t.type === 'expense' && !categories.some(c => c.id === t.categoryId) : t.type === 'expense' && t.categoryId === filters.category)) &&
    (!query || [t.merchantName, t.description, categoryLabel(t, categories), t.upiRefNumber].join(' ').toLocaleLowerCase().includes(query))
  ).sort((a, b) => (filters.sort === 'category' ? categoryLabel(a, categories).localeCompare(categoryLabel(b, categories)) : 0)
    || b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id));
}
export function groupHistory(transactions: Transaction[]) {
  const groups = new Map<string, Transaction[]>();
  for (const txn of transactions) {
    const key = txn.date.slice(0, 7);
    const rows = groups.get(key);
    if (rows) rows.push(txn); else groups.set(key, [txn]);
  }
  return [...groups].sort(([a], [b]) => b.localeCompare(a)).map(([key, data]) => ({ key,
    title: new Date(Number(key.slice(0, 4)), Number(key.slice(5, 7)) - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }), data }));
}
