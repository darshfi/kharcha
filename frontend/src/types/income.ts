export interface Income {
  id: string;
  amount: number;
  source: string;
  paymentMode: string;
  date: string;
  referenceNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IncomeFormData {
  amount: number;
  source: string;
  paymentMode: string;
  date: string;
  referenceNumber?: string;
}