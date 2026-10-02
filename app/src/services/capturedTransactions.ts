import { supabase } from '../auth/supabase';
import { useStore } from '../store/useStore';
import { fromExpense, fromIncome } from './transactions';

const key = (row: { id: string; type: string }) => `${row.type}:${row.id}`;

/** Append newly committed captures without replacing concurrent edits or restoring deletions. */
export async function refreshCapturedTransactions(userId: string): Promise<void> {
  const snapshot = useStore.getState();
  if (snapshot.userId !== userId) return;
  const known = new Set(snapshot.transactions.map(key));
  const [expenses, incomes] = await Promise.all([
    supabase.from('expenses').select('*').eq('user_id', userId).not('capture_event_id', 'is', null),
    supabase.from('incomes').select('*').eq('user_id', userId).not('capture_event_id', 'is', null),
  ]);
  if (expenses.error) throw expenses.error;
  if (incomes.error) throw incomes.error;
  const rows = [...(expenses.data ?? []).map(fromExpense), ...(incomes.data ?? []).map(fromIncome)];
  useStore.setState(state => {
    if (state.userId !== userId) return state;
    const current = new Set(state.transactions.map(key));
    const added = rows.filter(row => row.userId === userId && !known.has(key(row)) && !current.has(key(row)));
    return added.length ? { transactions: [...added, ...state.transactions] } : state;
  });
}
