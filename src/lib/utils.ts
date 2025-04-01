import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { PaymentMethod } from "@/interfaces/payment-method-interface"
import { Expense } from "@/interfaces/expense-interface"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency: 'MYR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

// Helper function to get payment method name
export function getPaymentMethodName(method: PaymentMethod | number): string {
  if (typeof method === 'number') {
    // These should ideally come from the database
    switch (method) {
      case 1: return 'Cash';
      case 2: return 'Credit Card';
      case 3: return 'QR Code Payment';
      case 4: return 'eWallet';
      case 5: return 'Bank Transfer';
      case 6: return 'DuitNow';
      default: return 'Unknown';
    }
  }
  
  // If method is a PaymentMethod object
  return method.method_name || 'Unknown';
}
