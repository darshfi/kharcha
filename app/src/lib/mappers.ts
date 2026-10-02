import { ParsedSMS, Transaction } from '../types/transaction';

export function parsedSMSToTransaction(parsed: ParsedSMS, userId: string): Transaction {
  const now = new Date().toISOString();
  return {
    // Supabase assigns the UUID when this draft is saved.
    id: '',
    userId,
    type: parsed.isCredit ? 'income' : 'expense',
    amount: parsed.amount,
    categoryId: null,
    description: parsed.merchant,
    date: parsed.date,
    time: null,
    transactionType: parsed.transactionType,
    upiRefNumber: parsed.referenceNumber === 'NOT_FOUND' ? null : parsed.referenceNumber,
    merchantName: parsed.merchant,
    receiptUrl: null,
    balanceAfter: null,
    status: 'pending',
    isRecurring: false,
    recurringFrequency: null,
    paymentMode: null,
    createdAt: now,
    updatedAt: now,
  };
}
