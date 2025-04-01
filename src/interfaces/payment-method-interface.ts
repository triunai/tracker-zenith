/**
 * Interface for payment methods data
 */
export interface PaymentMethod {
  id: number;
  method_name: string;
  created_by?: string; // UUID
  created_at: string;
  updated_by?: string; // UUID
  updated_at?: string;
  isdeleted: boolean;
}

/**
 * Interface for creating a new payment method
 * Omits auto-generated fields
 */
export interface CreatePaymentMethodRequest {
  method_name: string;
}

/**
 * Enum for payment methods
 */
export enum PaymentMethodEnum {
  Cash = 1,
  CreditCard = 2,
  QRCodePayment = 3,
  EWallet = 4,
  BankTransfer = 5,
  DuitNow = 6
} 