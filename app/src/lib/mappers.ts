import { ParsedSMS, Transaction } from '../types/transaction';

function generateId(): string {
  return (
    Date.now().toString(36) +
    Math.random().toString(36).substring(2, 10) +
    Math.random().toString(36).substring(2, 6)
  );
}

export function parsedSMSToTransaction(parsed: ParsedSMS, userId: string): Transaction {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    userId,
    type: parsed.isCredit ? 'income' : 'expense',
    amount: parsed.amount,
    categoryId: null,
    description: parsed.merchant,
    date: parsed.date,
    time: null,
    transactionType: parsed.transactionType,
    upiRefNumber: parsed.referenceNumber,
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
