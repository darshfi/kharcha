// @vitest-environment node
import { beforeEach, expect, it, vi } from 'vitest';
import { refreshCapturedTransactions } from '../../../app/src/services/capturedTransactions';
import { fromExpense } from '../../../app/src/services/transactions';
import { useStore } from '../../../app/src/store/useStore';

const database = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock('../../../app/src/auth/supabase', () => ({ supabase: database }));
const existing = { id: 'existing', user_id: 'user-a', amount: 100, description: 'Original', date: '2026-10-02', created_at: '', updated_at: '' };
const captured = { ...existing, id: 'captured', description: 'Captured payment' };
let resolveExpense: (value: any) => void;
beforeEach(() => {
  const query = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), not: vi.fn().mockReturnThis(),
    then: (resolve: any, reject: any) => new Promise(done => { resolveExpense = done; }).then(resolve, reject) };
  const incomeQuery = { ...query, then: (resolve: any) => Promise.resolve({ data: [], error: null }).then(resolve) };
  database.from.mockImplementation(table => table === 'expenses' ? query : incomeQuery);
  useStore.setState({ userId: 'user-a', transactions: [fromExpense(existing)], categories: [] });
});
it('appends captures without reverting an edit made while refreshing', async () => {
  const pending = refreshCapturedTransactions('user-a');
  await Promise.resolve();
  useStore.setState({ transactions: [{ ...fromExpense(existing), description: 'Edited' }] });
  resolveExpense({ data: [existing, captured], error: null });
  await pending;
  expect(useStore.getState().transactions.map(row => row.description)).toEqual(['Captured payment', 'Edited']);
});
it('does not restore a transaction deleted while refreshing', async () => {
  const pending = refreshCapturedTransactions('user-a');
  await Promise.resolve();
  useStore.setState({ transactions: [] });
  resolveExpense({ data: [existing, captured], error: null });
  await pending;
  expect(useStore.getState().transactions.map(row => row.id)).toEqual(['captured']);
});
it('does not apply an old account response to a new account', async () => {
  const pending = refreshCapturedTransactions('user-a');
  await Promise.resolve();
  useStore.getState().setUserId('user-b');
  resolveExpense({ data: [captured], error: null });
  await pending;
  expect(useStore.getState().transactions).toEqual([]);
});
it('keeps the ledger unchanged if a capture refresh fails', async () => {
  const pending = refreshCapturedTransactions('user-a');
  await Promise.resolve();
  resolveExpense({ data: null, error: new Error('Offline') });
  await expect(pending).rejects.toThrow('Offline');
  expect(useStore.getState().transactions[0].id).toBe('existing');
});
