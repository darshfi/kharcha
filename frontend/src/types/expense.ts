export interface Expense {
  id: string;
  amount: number;
  description: string;
  categoryId: string;
  date: string;
  time?: string;
  transactionType: 'manual' | 'upi';
  upiRefNumber?: string;
  merchantName?: string;
  receiptUrl?: string;
  balanceAfter?: number;
  status: 'pending' | 'confirmed';
  isRecurring: boolean;
  recurringFrequency?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseFormData {
  amount: number;
  description: string;
  categoryId: string;
  date: string;
  time?: string;
  transactionType?: 'manual' | 'upi';
  upiRefNumber?: string;
  merchantName?: string;
  receiptUrl?: string;
  balanceAfter?: number;
  isRecurring?: boolean;
  recurringFrequency?: string;
}

export interface SMSParseResult {
  amount: number;
  merchant: string;
  date: string;
  referenceNumber: string;
  transactionType: 'upi';
  categoryId: string;
  isCredit: boolean;
}