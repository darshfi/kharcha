import { Transaction } from '../types/transaction';
import { Category } from '../data/categories';
import { localDate } from './dates';

export function getInsights(transactions: Transaction[], categories: Category[], now = new Date()) {
  const confirmed = transactions.filter(txn => txn.status === 'confirmed');
  const totalBalance = confirmed.reduce((sum, txn) => sum + (txn.type === 'income' ? txn.amount : -txn.amount), 0);
  const ym = localDate(now).slice(0, 7);
  const monthExpenses = confirmed.filter(txn => txn.date.startsWith(ym) && txn.type === 'expense');
  const monthIncome = confirmed.filter(txn => txn.date.startsWith(ym) && txn.type === 'income');
  const totalSpent = monthExpenses.reduce((sum, txn) => sum + txn.amount, 0);
  const totalIncome = monthIncome.reduce((sum, txn) => sum + txn.amount, 0);
  const totals = new Map<string, number>();
  monthExpenses.forEach(txn => totals.set(txn.categoryId ?? '', (totals.get(txn.categoryId ?? '') ?? 0) + txn.amount));
  const categoryRows = [...totals.entries()].sort((a, b) => b[1] - a[1])
    .map(([id, amount]) => ({ id, amount, category: categories.find(category => category.id === id) }));
  const modes = new Map<string, number>();
  monthIncome.forEach(txn => modes.set(txn.paymentMode ?? 'Other', (modes.get(txn.paymentMode ?? 'Other') ?? 0) + txn.amount));
  const modeRows = [...modes.entries()].sort((a, b) => b[1] - a[1]);
  const chartDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6 + index);
    const key = localDate(date);
    const rows = confirmed.filter(txn => txn.date === key);
    return {
      key, label: date.toLocaleDateString('en-IN', { weekday: 'short' }).slice(0, 2),
      expense: rows.filter(txn => txn.type === 'expense').reduce((sum, txn) => sum + txn.amount, 0),
      income: rows.filter(txn => txn.type === 'income').reduce((sum, txn) => sum + txn.amount, 0),
    };
  });
  const days = chartDays.map(day => ({ ...day, value: day.expense }));
  const monthDays = Array.from({ length: new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() }, (_, index) => {
    const key = localDate(new Date(now.getFullYear(), now.getMonth(), index + 1));
    return { key, label: String(index + 1), value: monthExpenses.filter(txn => txn.date === key).reduce((sum, txn) => sum + txn.amount, 0) };
  });
  return {
    totalBalance, totalSpent, totalIncome, categoryRows, modeRows, days, chartDays, monthDays,
    weekSpent: days.reduce((sum, day) => sum + day.value, 0),
    maxDay: Math.max(1, ...days.map(day => day.value)),
    maxMonthDay: Math.max(1, ...monthDays.map(day => day.value)),
    maxValue: Math.max(1, ...chartDays.flatMap(day => [day.expense, day.income])),
    avgExpensePerDay: totalSpent / now.getDate(),
    avgExpensePerCategory: categoryRows.length ? totalSpent / categoryRows.length : 0,
    biggest: monthExpenses.reduce<Transaction | null>((max, txn) => !max || txn.amount > max.amount ? txn : max, null),
  };
}
