import { supabase } from '../auth/supabase';
import { Transaction } from '../types/transaction';

export async function loadTransactions(userId: string): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (error) return [];

  return (data || []).map((row: any) => ({
    id: row.id,
    userId: row.user_id,
    type: row.status === 'income' ? 'income' as const : 'expense' as const,
    amount: Number(row.amount),
    categoryId: row.category_id,
    description: row.description || '',
    date: row.date,
    time: row.time,
    transactionType: row.transaction_type || 'manual',
    upiRefNumber: row.upi_ref_number,
    merchantName: row.merchant_name,
    receiptUrl: row.receipt_url,
    balanceAfter: row.balance_after ? Number(row.balance_after) : null,
    status: row.status || 'confirmed',
    isRecurring: row.is_recurring || false,
    recurringFrequency: row.recurring_frequency,
    paymentMode: null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function saveTransaction(txn: Transaction): Promise<void> {
  const { error } = await supabase.from('expenses').insert({
    id: txn.id,
    user_id: txn.userId,
    category_id: txn.categoryId,
    amount: txn.amount,
    description: txn.description,
    date: txn.date,
    time: txn.time,
    transaction_type: txn.transactionType,
    upi_ref_number: txn.upiRefNumber,
    merchant_name: txn.merchantName,
    receipt_url: txn.receiptUrl,
    balance_after: txn.balanceAfter,
    status: txn.type === 'income' ? 'confirmed' : txn.status,
    is_recurring: txn.isRecurring,
    recurring_frequency: txn.recurringFrequency,
  });

  if (error) console.error('Failed to save transaction:', error);
}

export async function deleteTransaction(id: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) console.error('Failed to delete transaction:', error);
}
