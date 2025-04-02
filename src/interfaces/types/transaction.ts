export interface TransactionData {
  date: string;
  category: string;
  paymentMethod: string;
  description: string;
  amount: string;
}

export interface FormErrors {
  date?: string;
  category?: string;
  paymentMethod?: string;
  description?: string;
  amount?: string;
}
