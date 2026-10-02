// @vitest-environment node
import { vi, it, expect, beforeEach, describe } from 'vitest';
import { parseUPISMS } from '../../../app/src/lib/parseUPISMS';
import { parsedSMSToTransaction } from '../../../app/src/lib/mappers';
import { localDate, isValidDate } from '../../../app/src/lib/dates';
import { getInsights } from '../../../app/src/lib/insights';
import { saveTransaction, loadTransactions, fromExpense } from '../../../app/src/services/transactions';
import { loadCategories } from '../../../app/src/services/categories';
import { useStore } from '../../../app/src/store/useStore';

const database = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock('../../../app/src/auth/supabase', () => ({ supabase: database }));
const categoryId = '00000000-0000-4000-8000-000000000003';
const expense = {
  id: '00000000-0000-4000-8000-000000000001', user_id: 'user-a', category_id: categoryId, amount: '250',
  description: 'Lunch', date: '2026-10-02', status: 'confirmed', payment_mode: 'Cash', balance_after: '0',
  created_at: '2026-10-02T08:00:00Z', updated_at: '2026-10-02T08:00:00Z',
};
const income = { ...expense, id: '00000000-0000-4000-8000-000000000002', source: 'Salary', amount: '45000', payment_mode: 'Bank transfer' };
const queries: Record<string, any> = {};
const draft = () => ({ ...parsedSMSToTransaction(parseUPISMS('Rs.250 paid to Cafe on 2-Oct-2026'), 'user-a'), categoryId, paymentMode: 'Cash' as const, status: 'confirmed' as const });
function makeQuery(data: any) {
  return {
    select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(), delete: vi.fn().mockReturnThis(), upsert: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: Array.isArray(data) ? data[0] : data, error: null }),
    then: (resolve: any, reject: any) => Promise.resolve({ data, error: null }).then(resolve, reject),
  };
}
beforeEach(() => {
  database.from.mockReset();
  queries.expenses = makeQuery([expense]);
  queries.incomes = makeQuery([income]);
  queries.expense_categories = makeQuery([{ id: categoryId, name: 'Food', icon: 'F', color: '#123456' }]);
  database.from.mockImplementation((table: string) => queries[table]);
  useStore.setState({ userId: 'user-a', transactions: [], categories: [] });
});

describe('mobile persistence', () => {
  it('lets the database assign a UUID and retains the expense payment mode', async () => {
    const saved = await saveTransaction({ ...draft(), id: 'muqw7j0bjy0iik0s12mq' });
    expect(queries.expenses.insert.mock.calls[0][0]).not.toHaveProperty('id');
    expect(queries.expenses.insert.mock.calls[0][0]).toMatchObject({ payment_mode: 'Cash', status: 'confirmed' });
    expect(saved.id).toBe(expense.id);
    expect(saved.paymentMode).toBe('Cash');
  });
  it('saves income to its own table with a source and payment mode', async () => {
    const saved = await saveTransaction({ ...draft(), id: 'muqw7j0bjy0iik0s12mq', type: 'income', description: 'Salary', paymentMode: 'Bank transfer' });
    expect(queries.incomes.insert).toHaveBeenCalledWith(expect.objectContaining({ source: 'Salary', payment_mode: 'Bank transfer' }));
    expect(queries.expenses.insert).not.toHaveBeenCalled();
    expect(queries.incomes.insert.mock.calls[0][0]).not.toHaveProperty('id');
    expect(saved.type).toBe('income');
  });
  it('reloads expenses and income together without changing their types', async () => {
    const saved = await loadTransactions('user-a');
    expect(saved.map(row => row.type).sort()).toEqual(['expense', 'income']);
    expect(saved.find(row => row.type === 'income')?.amount).toBe(45000);
    expect(saved.find(row => row.type === 'expense')?.paymentMode).toBe('Cash');
  });
  it('reports fetch failures rather than showing an empty ledger', async () => {
    queries.expenses.then = (resolve: any) => Promise.resolve({ data: null, error: new Error('Offline') }).then(resolve);
    await expect(loadTransactions('user-a')).rejects.toThrow('Offline');
  });
  it('does not add a transaction when the database rejects its save', async () => {
    queries.expenses.single.mockResolvedValue({ data: null, error: new Error('Write rejected') });
    await expect(useStore.getState().addTransaction(draft())).rejects.toThrow('Write rejected');
    expect(useStore.getState().transactions).toEqual([]);
  });
  it('does not leak an in-flight save into a different account', async () => {
    let finish!: (value: any) => void;
    queries.expenses.single.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    const saving = useStore.getState().addTransaction(draft());
    useStore.getState().setUserId('user-b');
    finish({ data: expense, error: null });
    await saving;
    expect(useStore.getState().transactions).toEqual([]);
  });
  it('rejects duplicate imported references', async () => {
    const txn = { ...draft(), upiRefNumber: '123456789012' };
    useStore.getState().setTransactions([txn]);
    await expect(useStore.getState().addTransaction(txn)).rejects.toThrow('already been imported');
    expect(queries.expenses.insert).not.toHaveBeenCalled();
  });
  it('deletes income from the income table', async () => {
    const txn = { ...draft(), id: income.id, type: 'income' as const };
    useStore.getState().setTransactions([txn]);
    await useStore.getState().deleteTransaction(txn.id);
    expect(queries.incomes.delete).toHaveBeenCalled();
    expect(queries.expenses.delete).not.toHaveBeenCalled();
    expect(useStore.getState().transactions).toEqual([]);
  });
  it('keeps a transaction visible when deletion fails', async () => {
    const txn = { ...draft(), id: expense.id };
    useStore.getState().setTransactions([txn]);
    queries.expenses.then = (resolve: any) => Promise.resolve({ data: null, error: new Error('Delete rejected') }).then(resolve);
    await expect(useStore.getState().deleteTransaction(txn.id)).rejects.toThrow('Delete rejected');
    expect(useStore.getState().transactions).toEqual([txn]);
  });
  it('clears both tables before clearing the ledger', async () => {
    useStore.getState().setTransactions([draft()]);
    await useStore.getState().clearAll();
    expect(queries.expenses.delete).toHaveBeenCalled();
    expect(queries.incomes.delete).toHaveBeenCalled();
    expect(useStore.getState().transactions).toEqual([]);
  });
  it('reloads remaining data when bulk deletion partly fails', async () => {
    const query = makeQuery([income]);
    let deleted = false;
    query.delete.mockImplementation(() => { deleted = true; return query; });
    query.then = (resolve: any) => Promise.resolve(deleted ? { data: null, error: new Error('Delete rejected') } : { data: [income], error: null }).then(resolve);
    database.from.mockImplementation((table: string) => table === 'incomes' && !deleted ? query : queries[table]);
    await expect(useStore.getState().clearAll()).rejects.toThrow('Delete rejected');
    expect(useStore.getState().transactions).toHaveLength(2);
  });
  it('creates categories with persisted IDs rather than local placeholder IDs', async () => {
    await useStore.getState().addCategory({ name: 'Food', symbol: 'F', color: '#123456' });
    expect(queries.expense_categories.insert.mock.calls[0][0]).not.toHaveProperty('id');
    expect(useStore.getState().categories[0].id).toBe(categoryId);
  });
  it('uses the saved category UUID when adding its expense', async () => {
    await useStore.getState().addCategory({ name: 'Food', symbol: 'F', color: '#123456' });
    await useStore.getState().addTransaction({ ...draft(), categoryId: useStore.getState().categories[0].id });
    expect(queries.expenses.insert).toHaveBeenCalledWith(expect.objectContaining({ category_id: categoryId }));
    expect(useStore.getState().transactions[0].id).toBe(expense.id);
  });
  it('rejects a stale local category before writing or updating the ledger', async () => {
    await expect(useStore.getState().addTransaction({ ...draft(), categoryId: 'cat-1790941352234' }))
      .rejects.toThrow('Reload the app');
    expect(queries.expenses.insert).not.toHaveBeenCalled();
    expect(useStore.getState().transactions).toEqual([]);
  });
  it('keeps failed categories out of local state', async () => {
    queries.expense_categories.single.mockResolvedValue({ data: null, error: new Error('Write rejected') });
    await expect(useStore.getState().addCategory({ name: 'Food', symbol: 'F', color: '#123456' }))
      .rejects.toThrow('Write rejected');
    expect(useStore.getState().categories).toEqual([]);
  });
  it('does not fall back to invalid category IDs on a load failure', async () => {
    queries.expense_categories.then = (resolve: any) => Promise.resolve({ data: null, error: new Error('Offline') }).then(resolve);
    await expect(loadCategories('user-a')).rejects.toThrow('Offline');
  });
  it('clears both categories and transactions on account change', () => {
    useStore.setState({ transactions: [draft()], categories: [{ id: categoryId, name: 'Food', symbol: 'F', color: '#123456' }] });
    useStore.getState().setUserId(null);
    expect(useStore.getState().categories).toEqual([]);
    expect(useStore.getState().transactions).toEqual([]);
  });
});

describe('dates, parsing and summaries', () => {
  it('shows zero balance and daily average for an empty ledger', () => {
    const result = getInsights([], [], new Date(2026, 9, 2));
    expect(result.totalBalance).toBe(0);
    expect(result.avgExpensePerDay).toBe(0);
  });
  it('includes earlier months in balance while keeping monthly metrics separate', () => {
    const rows = [
      { ...draft(), type: 'income' as const, date: '2026-09-01', amount: 1000.50 },
      { ...draft(), date: '2026-09-10', amount: 200 },
      { ...draft(), date: '2026-10-02', amount: 100.25 },
      { ...draft(), type: 'income' as const, date: '2026-10-02', amount: 300 },
      { ...draft(), type: 'income' as const, status: 'pending' as const, amount: 5000 },
      { ...draft(), status: 'pending' as const, amount: 7000 },
    ];
    const result = getInsights(rows, [], new Date(2026, 9, 2));
    expect(result.totalBalance).toBe(1000.25);
    expect(result.totalSpent).toBe(100.25);
    expect(result.totalIncome).toBe(300);
    expect(result.avgExpensePerDay).toBe(50.125);
  });
  it('allows negative balances when expenses exceed income', () => {
    expect(getInsights([{ ...draft(), amount: 250 }], []).totalBalance).toBe(-250);
  });
  it('keeps numeric bank dates, amounts, merchants and references', () => {
    const parsed = parseUPISMS('Rs.250.00 debited on 24-09-26 to VPA swiggy@icici (UPI Ref No 426812345678)');
    expect(parsed).toMatchObject({ amount: 250, date: '2026-09-24', merchant: 'swiggy', referenceNumber: '426812345678', isCredit: false });
  });
  it('does not save the NOT_FOUND reference placeholder', () => {
    expect(draft().upiRefNumber).toBeNull();
  });
  it('preserves a zero bank balance', () => {
    expect(fromExpense({ ...expense, balance_after: 0 }).balanceAfter).toBe(0);
  });
  it('rejects impossible calendar dates', () => {
    expect(isValidDate('2026-02-30')).toBe(false);
    expect(isValidDate('2026-13-01')).toBe(false);
    expect(isValidDate('2026-10-02')).toBe(true);
  });
  it('keeps local midnight in the correct day and month', () => {
    const now = new Date(2026, 9, 1, 0, 30);
    const rows = [{ ...draft(), date: '2026-10-01', amount: 300 }];
    const result = getInsights(rows, [], now);
    expect(localDate(now)).toBe('2026-10-01');
    expect(result.monthDays[0].key).toBe('2026-10-01');
    expect(result.monthDays[0].value).toBe(300);
    expect(result.totalSpent).toBe(300);
  });
  it('uses elapsed days for the daily average and seven days for weekly totals', () => {
    const rows = [{ ...draft(), date: '2026-10-01', amount: 200 }, { ...draft(), date: '2026-10-10', amount: 300 }];
    const result = getInsights(rows, [], new Date(2026, 9, 10, 12));
    expect(result.totalSpent).toBe(500);
    expect(result.weekSpent).toBe(300);
    expect(result.avgExpensePerDay).toBe(50);
  });
  it('keeps unconfirmed transactions out of spending totals', () => {
    const rows = [{ ...draft(), date: '2026-10-02', status: 'pending' as const }];
    expect(getInsights(rows, [], new Date(2026, 9, 2)).totalSpent).toBe(0);
  });
});
