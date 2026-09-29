export type TransactionType = 'manual' | 'upi';

export type PaymentMode =
  | 'UPI'
  | 'Cash'
  | 'Bank transfer'
  | 'Cheque'
  | 'Card / wallet'
  | 'Other';

export interface ParsedSMS {
  amount: number;
  merchant: string;
  date: string;
  referenceNumber: string;
  transactionType: TransactionType;
  isCredit: boolean;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'expense' | 'income';
  amount: number;
  categoryId: string | null;
  description: string;
  date: string;
  time: string | null;
  transactionType: TransactionType;
  upiRefNumber: string | null;
  merchantName: string | null;
  receiptUrl: string | null;
  balanceAfter: number | null;
  status: 'pending' | 'confirmed';
  isRecurring: boolean;
  recurringFrequency: 'daily' | 'weekly' | 'monthly' | 'yearly' | null;
  paymentMode: PaymentMode | null;
  createdAt: string;
  updatedAt: string;
}
