import { beforeEach, describe, expect, it, vi } from 'vitest';
import { allHistoryFilters, categoryLabel, filterHistory, groupHistory, historyYears } from '../../../app/src/lib/history';
import type { Transaction } from '../../../app/src/types/transaction';

const db = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock('../../../app/src/auth/supabase', () => ({ supabase: db }));
vi.mock('../../../app/src/services/categories', () => ({ saveCategory: vi.fn(), removeCategory: vi.fn() }));
import { updateTransaction } from '../../../app/src/services/transactions';
import { useStore } from '../../../app/src/store/useStore';

const foodId = '00000000-0000-4000-8000-000000000001';
const categories = [{ id: foodId, name: 'Food', symbol: 'F', color: '#fff' }];
function transaction(overrides: Partial<Transaction> = {}): Transaction {
  return { id: 'expense-a', userId: 'user-a', type: 'expense', amount: 20, categoryId: foodId, description: 'Tea', date: '2026-02-02', time: '13:30', transactionType: 'upi', upiRefNumber: 'REF123', merchantName: 'Cafe', receiptUrl: 'receipt', balanceAfter: 500, status: 'confirmed', isRecurring: true, recurringFrequency: 'monthly', paymentMode: 'UPI', createdAt: '2026-02-02T10:00:00Z', updatedAt: '2026-02-02T10:00:00Z', ...overrides };
}
function row(t: Transaction) {
  return { id: t.id, user_id: t.userId, amount: t.amount, category_id: t.categoryId, description: t.description, source: t.description, date: t.date, time: t.time, transaction_type: t.transactionType, upi_ref_number: t.upiRefNumber, reference_number: t.upiRefNumber, merchant_name: t.merchantName, receipt_url: t.receiptUrl, balance_after: t.balanceAfter, status: t.status, is_recurring: t.isRecurring, recurring_frequency: t.recurringFrequency, payment_mode: t.paymentMode, created_at: t.createdAt, updated_at: t.updatedAt };
}
function mockUpdate(result: unknown) {
  const chain = { update: vi.fn(), eq: vi.fn(), select: vi.fn(), single: vi.fn() };
  chain.update.mockReturnValue(chain); chain.eq.mockReturnValue(chain); chain.select.mockReturnValue(chain); chain.single.mockReturnValue(result);
  db.from.mockReturnValue(chain);
  return chain;
}
beforeEach(() => { vi.clearAllMocks(); useStore.setState({ userId: 'user-a', transactions: [], categories }); });
describe('transaction history', () => {
  const rows = [transaction(), transaction({ id: 'income-b', type: 'income', categoryId: null, description: 'Salary', date: '2025-02-03' }), transaction({ id: 'expense-c', date: '2026-03-01', description: 'Lunch' })];
  it('filters year and month independently and defaults newest first', () => {
    expect(filterHistory(rows, categories, allHistoryFilters).map(t => t.id)).toEqual(['expense-c', 'expense-a', 'income-b']);
    expect(filterHistory(rows, categories, { ...allHistoryFilters, year: '2026', month: '02' }).map(t => t.id)).toEqual(['expense-a']);
    expect(filterHistory(rows, categories, { ...allHistoryFilters, month: '02' })).toHaveLength(2);
    expect(historyYears(rows)).toEqual(['2026', '2025']);
  });
  it('searches merchant, source, category and reference without case sensitivity', () => {
    for (const query of ['cAfE', 'REF123', 'Food']) expect(filterHistory([rows[0]], categories, { ...allHistoryFilters, query })).toHaveLength(1);
    expect(filterHistory(rows, categories, { ...allHistoryFilters, query: 'salary' })[0].type).toBe('income');
    expect(filterHistory(rows, categories, { ...allHistoryFilters, query: ' Income ' })[0].type).toBe('income');
  });
  it('keeps income discoverable and category ties stable by date', () => {
    expect(filterHistory(rows, categories, { ...allHistoryFilters, category: 'income' })).toHaveLength(1);
    expect(filterHistory(rows, categories, { ...allHistoryFilters, category: foodId, sort: 'category' }).map(t => t.id)).toEqual(['expense-c', 'expense-a']);
    expect(categoryLabel(transaction({ categoryId: 'deleted' }), categories)).toBe('Uncategorized');
    expect(filterHistory([transaction({ categoryId: 'deleted' })], categories, { ...allHistoryFilters, category: 'uncategorized' })).toHaveLength(1);
  });
  it('groups months, handles empty and never mutates input', () => {
    expect(groupHistory(filterHistory(rows, categories, allHistoryFilters)).map(s => s.key)).toEqual(['2026-03', '2026-02', '2025-02']);
    expect(groupHistory([])).toEqual([]);
    expect(filterHistory(rows, categories, { ...allHistoryFilters, query: 'missing' })).toEqual([]);
    expect(rows[0].id).toBe('expense-a');
  });
});
describe('transaction editing persistence', () => {
  it('updates only editable fields with user and id scope and preserves import metadata', async () => {
    const original = transaction(); const updated = { ...original, amount: 40, description: 'Dinner' };
    const chain = mockUpdate(Promise.resolve({ data: row(updated), error: null }));
    const saved = await updateTransaction(original, { amount: 40, description: 'Dinner' });
    expect(db.from).toHaveBeenCalledWith('expenses');
    expect(chain.update).toHaveBeenCalledWith({ amount: 40, description: 'Dinner' });
    expect(chain.eq.mock.calls).toEqual([['id', original.id], ['user_id', original.userId]]);
    for (const key of ['upiRefNumber', 'merchantName', 'receiptUrl', 'time', 'balanceAfter', 'status', 'isRecurring', 'recurringFrequency', 'createdAt', 'type'] as const) expect(saved[key]).toEqual(original[key]);
  });
  it('writes income source to its own table, without category or metadata changes', async () => {
    const original = transaction({ id: 'income', type: 'income', categoryId: null });
    const chain = mockUpdate(Promise.resolve({ data: row({ ...original, description: 'Bonus' }), error: null }));
    const result = await updateTransaction(original, { description: 'Bonus', categoryId: foodId });
    expect(db.from).toHaveBeenCalledWith('incomes'); expect(chain.update).toHaveBeenCalledWith({ source: 'Bonus' });
    expect(result.type).toBe('income'); expect(result.upiRefNumber).toBe(original.upiRefNumber);
  });
  it('keeps local data unchanged on failed edit', async () => {
    const original = transaction(); useStore.setState({ transactions: [original] });
    mockUpdate(Promise.resolve({ data: null, error: new Error('Network failed') }));
    await expect(useStore.getState().updateTransaction(original.id, original.type, { amount: 40 })).rejects.toThrow('Network failed');
    expect(useStore.getState().transactions).toEqual([original]);
  });
  it('awaits returned data and discards responses after an account switch', async () => {
    const original = transaction(); useStore.setState({ transactions: [original] });
    let finish!: (value: unknown) => void;
    mockUpdate(new Promise(resolve => { finish = resolve; }));
    const pending = useStore.getState().updateTransaction(original.id, original.type, { amount: 40 });
    expect(useStore.getState().transactions[0].amount).toBe(20);
    useStore.getState().setUserId('user-b');
    finish({ data: row({ ...original, amount: 40 }), error: null }); await pending;
    expect(useStore.getState().transactions).toEqual([]);
    await expect(useStore.getState().updateTransaction(original.id, original.type, { amount: 60 })).rejects.toThrow('unavailable');
  });
  it('applies successful income changes and rejects invalid edits before writing', async () => {
    const original = transaction({ type: 'income', categoryId: null }); useStore.setState({ transactions: [original] });
    mockUpdate(Promise.resolve({ data: row({ ...original, amount: 100 }), error: null }));
    await useStore.getState().updateTransaction(original.id, original.type, { amount: 100 });
    expect(useStore.getState().transactions[0].amount).toBe(100);
    db.from.mockClear();
    await expect(updateTransaction(original, { amount: -2 })).rejects.toThrow('greater than zero');
    await expect(updateTransaction(original, { date: '2026-02-30' })).rejects.toThrow('valid date');
    await expect(updateTransaction(original, { description: ' ' })).rejects.toThrow('source');
    expect(db.from).not.toHaveBeenCalled();
  });
});
