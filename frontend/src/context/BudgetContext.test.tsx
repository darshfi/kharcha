import { act, renderHook, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { BudgetProvider, useBudgets } from './BudgetContext';
import { currentMonthYear } from '../lib/mappers';

const mocks = vi.hoisted(() => ({ from: vi.fn(), expenses: [], user: { id: 'test-user' } }));
vi.mock('../services/supabase', () => ({ supabase: { from: mocks.from } }));
vi.mock('./AuthContext', () => ({ useAuth: () => ({ user: mocks.user }) }));
vi.mock('./ExpenseContext', () => ({ useExpenses: () => ({ expenses: mocks.expenses }) }));

const row = {
  id: 'budget-1', category_id: 'food', monthly_limit: '500', current_spend: '200',
  alert_threshold: '0.3', month_year: currentMonthYear(), expense_categories: { name: 'Food' },
  created_at: '2026-10-02', updated_at: '2026-10-02',
};
let query: any;
beforeEach(() => {
  mocks.from.mockReset();
  query = {
    select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(), update: vi.fn().mockReturnThis(), delete: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: row, error: null }),
    then: (resolve: any, reject: any) => Promise.resolve({ data: [row], error: null }).then(resolve, reject),
  };
  mocks.from.mockReturnValue(query);
});

describe('Budgets', () => {
  it('loads numeric amounts and category names for the current month only', async () => {
    const { result } = renderHook(useBudgets, { wrapper: BudgetProvider });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.budgets[0]).toMatchObject({ categoryName: 'Food', monthlyLimit: 500, currentSpend: 200 });
    expect(query.eq).toHaveBeenCalledWith('user_id', 'test-user');
    expect(query.eq).toHaveBeenCalledWith('month_year', currentMonthYear());
  });
  it('updates only the supplied limit and preserves the joined category name', async () => {
    const { result } = renderHook(useBudgets, { wrapper: BudgetProvider });
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { await result.current.updateBudget('budget-1', { monthlyLimit: 600 }); });
    expect(query.update).toHaveBeenCalledWith({ monthly_limit: 600 });
    expect(result.current.budgets[0].categoryName).toBe('Food');
  });
  it('uses the budget-specific alert threshold', async () => {
    const { result } = renderHook(useBudgets, { wrapper: BudgetProvider });
    await waitFor(() => expect(result.current.loading).toBe(false));
    const alerts = await result.current.getBudgetAlerts();
    expect(alerts).toHaveLength(1);
    expect(alerts[0].percentage).toBe(40);
  });
});
