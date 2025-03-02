
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { PaymentMethod, categories, expenses } from '@/lib/mockData';
import { Expense } from '@/lib/mockData';

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

// Get the most recent expenses, limited by count
export function getRecentExpenses(count: number): Expense[] {
  // Sort expenses by date (most recent first) and limit by count
  return [...expenses]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, count);
}

// Re-export items from mockData that are needed in components
export { PaymentMethod, categories, getPaymentMethodName } from '@/lib/mockData';
