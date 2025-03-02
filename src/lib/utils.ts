
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { PaymentMethod, categories } from '@/lib/mockData';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

// Re-export items from mockData that are needed in components
export { PaymentMethod, categories, getPaymentMethodName } from '@/lib/mockData';
