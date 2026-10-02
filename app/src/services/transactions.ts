import { supabase } from '../auth/supabase';
import { isValidDate } from '../lib/dates';
import { Transaction } from '../types/transaction';

export function fromExpense(row: any): Transaction {
  return {
    id: row.id, userId: row.user_id, type: 'expense', amount: Number(row.amount),
    categoryId: row.category_id ?? null, description: row.description ?? '',
    date: row.date, time: row.time ?? null, transactionType: row.transaction_type ?? 'manual',
    upiRefNumber: row.upi_ref_number ?? null, merchantName: row.merchant_name ?? null,
    receiptUrl: row.receipt_url ?? null,
    balanceAfter: row.balance_after == null ? null : Number(row.balance_after),
    status: row.status ?? 'confirmed', isRecurring: row.is_recurring ?? false,
    recurringFrequency: row.recurring_frequency ?? null, paymentMode: row.payment_mode ?? null,
    createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

export function fromIncome(row: any): Transaction {
  return {
    id: row.id, userId: row.user_id, type: 'income', amount: Number(row.amount),
    categoryId: null, description: row.source ?? '', date: row.date, time: null,
    transactionType: row.payment_mode === 'UPI' && row.reference_number ? 'upi' : 'manual',
    upiRefNumber: row.reference_number ?? null, merchantName: null, receiptUrl: null,
    balanceAfter: null, status: 'confirmed', isRecurring: false, recurringFrequency: null,
    paymentMode: row.payment_mode ?? 'Other', createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

export async function loadTransactions(userId: string): Promise<Transaction[]> {
  const [expenses, incomes] = await Promise.all([
    supabase.from('expenses').select('*').eq('user_id', userId).order('date', { ascending: false }),
    supabase.from('incomes').select('*').eq('user_id', userId).order('date', { ascending: false }),
  ]);
  if (expenses.error) throw expenses.error;
  if (incomes.error) throw incomes.error;
  return [...(expenses.data ?? []).map(fromExpense), ...(incomes.data ?? []).map(fromIncome)]
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
}

export async function saveTransaction(txn: Transaction): Promise<Transaction> {
  if (txn.type === 'expense' && txn.categoryId !== null &&
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(txn.categoryId)) {
    throw new Error('This category has not been synced. Reload the app and choose the category again.');
  }
  // Omit the draft ID: both tables generate UUID primary keys.
  const payload: Record<string, unknown> = txn.type === 'income' ? {
    user_id: txn.userId, amount: txn.amount, source: txn.description,
    payment_mode: txn.paymentMode ?? 'Other', date: txn.date, reference_number: txn.upiRefNumber,
  } : {
    user_id: txn.userId, category_id: txn.categoryId, amount: txn.amount,
    payment_mode: txn.paymentMode ?? 'Other',
    description: txn.description, date: txn.date, time: txn.time,
    transaction_type: txn.transactionType, upi_ref_number: txn.upiRefNumber,
    merchant_name: txn.merchantName, receipt_url: txn.receiptUrl, balance_after: txn.balanceAfter,
    status: txn.status, is_recurring: txn.isRecurring, recurring_frequency: txn.recurringFrequency,
  };
  const { data, error } = await supabase.from(txn.type === 'income' ? 'incomes' : 'expenses')
    .insert(payload).select().single();
  if (error) throw error;
  return txn.type === 'income' ? fromIncome(data) : fromExpense(data);
}

export async function deleteTransaction(txn: Transaction): Promise<void> {
  const { error } = await supabase.from(txn.type === 'income' ? 'incomes' : 'expenses')
    .delete().eq('id', txn.id).eq('user_id', txn.userId);
  if (error) throw error;
}

export async function deleteAllTransactions(userId: string): Promise<void> {
  const results = await Promise.all([
    supabase.from('expenses').delete().eq('user_id', userId),
    supabase.from('incomes').delete().eq('user_id', userId),
  ]);
  for (const result of results) if (result.error) throw result.error;
}

/** Editable values only. Import/reference metadata and table identity remain intact. */
export type TransactionEdit = Partial<Pick<Transaction, 'amount' | 'description' | 'categoryId' | 'paymentMode' | 'date'>>;
export async function updateTransaction(txn: Transaction, patch: TransactionEdit): Promise<Transaction> {
  if (patch.amount !== undefined && (!Number.isFinite(patch.amount) || patch.amount <= 0)) throw new Error('Enter an amount greater than zero.');
  if (patch.date !== undefined && !isValidDate(patch.date)) throw new Error('Choose a valid date.');
  if (txn.type === 'income' && patch.description !== undefined && !patch.description.trim()) throw new Error('Enter the income source.');
  if (txn.type === 'expense' && patch.categoryId != null && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(patch.categoryId)) throw new Error('Choose a synced category.');
  const payload: Record<string, unknown> = {};
  if (patch.amount !== undefined) payload.amount = patch.amount;
  if (patch.description !== undefined) payload[txn.type === 'income' ? 'source' : 'description'] = patch.description;
  if (patch.categoryId !== undefined && txn.type === 'expense') payload.category_id = patch.categoryId;
  if (patch.paymentMode !== undefined) payload.payment_mode = patch.paymentMode;
  if (patch.date !== undefined) payload.date = patch.date;
  if (!Object.keys(payload).length) return txn;
  const { data, error } = await supabase.from(txn.type === 'income' ? 'incomes' : 'expenses')
    .update(payload).eq('id', txn.id).eq('user_id', txn.userId).select().single();
  if (error) throw error;
  return txn.type === 'income' ? fromIncome(data) : fromExpense(data);
}
