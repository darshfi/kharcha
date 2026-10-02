import { describe, it, expect } from 'vitest';
import { toDbExpense, toDbIncome, toDbCategory, toDbBudget } from './mappers';

describe('partial updates', () => {
  it('editing a description cannot reset an expense amount, type, status or date', () => {
    expect(toDbExpense({ description: 'Corrected' }, 'user', true)).toEqual({ description: 'Corrected' });
  });
  it('editing the source cannot reset income amount or date', () => {
    expect(toDbIncome({ source: 'Refund' }, 'user', true)).toEqual({ source: 'Refund' });
  });
  it('editing a category cannot unarchive or reorder it', () => {
    expect(toDbCategory({ name: 'Dining' }, 'user', true)).toEqual({ name: 'Dining' });
  });
  it('editing a budget cannot change its month, threshold or spend', () => {
    expect(toDbBudget({ monthlyLimit: 800, currentSpend: 0 }, 'user', true)).toEqual({ monthly_limit: 800 });
  });
  it('can clear optional fields with explicit nulls', () => {
    expect(toDbExpense({ categoryId: null, merchantName: null }, 'user', true)).toEqual({ category_id: null, merchant_name: null });
  });
  it('converts only supplied dates and times', () => {
    expect(toDbExpense({ date: '02/10/2026', time: '9:30' }, 'user', true)).toEqual({ date: '2026-10-02', time: '09:30:00' });
  });
});
