
export type FormErrors = {
  date?: string;
  category?: string;
  paymentMethod?: string;
  description?: string;
  amount?: string;
  quantity?: string;
};

export interface TransactionData {
  date: Date;
  category: string;
  paymentMethod: string;
  description: string;
  amount: number;
  quantity: number;
}
