import { useStore } from '../store/useStore';
import { loadTransactions } from './transactions';

const key = (row: { id: string; type: string }) => `${row.type}:${row.id}`;

/** Append newly committed captures without replacing concurrent edits or restoring deletions. */
export async function refreshCapturedTransactions(userId: string): Promise<void> {
  const snapshot = useStore.getState();
  if (snapshot.userId !== userId) return;
  const known = new Set(snapshot.transactions.map(key));
  const rows = await loadTransactions(userId, { capturedOnly: true });
  useStore.setState(state => {
    if (state.userId !== userId) return state;
    const current = new Set(state.transactions.map(key));
    const added = rows.filter(row => row.userId === userId && !known.has(key(row)) && !current.has(key(row)));
    return added.length ? { transactions: [...added, ...state.transactions] } : state;
  });
}
