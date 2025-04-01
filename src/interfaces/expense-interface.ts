// src/types/expense.ts

import { PaymentMethod } from "./payment-method-interface";

/**
 * Interface for expense category data
 */
export interface ExpenseCategory {
  id: number;
  name: string;
  description: string;
  created_by?: string; // UUID
  created_at: string;
  updated_by?: string; // UUID
  updated_at?: string;
  isdeleted: boolean;
}



/**
 * Interface for expense data (main transaction)
 */
export interface Expense {
  id: number;
  user_id: string; // UUID
  date: string;
  description?: string;
  payment_method_id?: number;
  created_by?: string; // UUID
  created_at: string;
  updated_by?: string; // UUID
  updated_at?: string;
  isdeleted: boolean;
  transaction_type?: 'expense' | 'income';
  
  // For joined queries (optional)
  payment_method?: PaymentMethod;
  expense_items?: ExpenseItem[];
}

/**
 * Interface for expense item data (line items)
 */
export interface ExpenseItem {
  id: number;
  expense_id: number;
  category_id: number;
  income_category_id?: number; // Added for income transactions
  amount: number;
  description?: string;
  created_by?: string; // UUID
  created_at: string;
  updated_by?: string; // UUID
  updated_at?: string;
  isdeleted: boolean;
  
  // For joined queries (optional)
  category?: ExpenseCategory;
}

/**
 * Interface for creating a new expense
 * Omits auto-generated fields
 */
export interface CreateExpenseRequest {
  user_id: string;
  date: string;
  description?: string;
  payment_method_id?: number;
  expense_items: CreateExpenseItemRequest[];
  transaction_type?: 'expense' | 'income';
}

/**
 * Interface for creating a new expense item
 * Omits auto-generated fields and the expense_id (handled by the parent)
 */
export interface CreateExpenseItemRequest {
  category_id: number;
  amount: number;
  description?: string;
}

/**
 * Interface for the expense with total amount calculated
 */
export interface ExpenseWithTotal extends Expense {
  total_amount: number;
}