import { PeriodEnum } from "./enums/PeriodEnum";
import { ExpenseCategory } from "./expense-interface";

/**
 * Interface for budget data
 */
export interface Budget {
  id: number;
  user_id: string; // UUID
  name: string;
  amount: number;
  period: PeriodEnum;
  start_date?: string; // Date stored as string
  end_date?: string; // Date stored as string
  created_by?: string; // UUID
  created_at: string;
  updated_by?: string; // UUID
  updated_at?: string;
  isdeleted: boolean;
  
  // For joined queries (optional)
  budget_categories?: BudgetCategory[];
}

/**
 * Interface for budget-category junction table
 */
export interface BudgetCategory {
  budget_id: number;
  category_id: number;
  alert_threshold?: number;
  created_by?: string; // UUID
  created_at: string;
  updated_by?: string; // UUID
  updated_at?: string;
  isdeleted: boolean;
  
  // For joined queries (optional)
  category?: ExpenseCategory;
}

/**
 * Interface for creating a new budget
 * Omits auto-generated fields
 */
export interface CreateBudgetRequest {
  user_id: string;
  name: string;
  amount: number;
  period: PeriodEnum;
  start_date?: string;
  end_date?: string;
  categories: {
    category_id: number;
    alert_threshold?: number;
  }[];
}

/**
 * Interface for budget with spending data
 */
export interface BudgetWithSpending extends Budget {
  spent: number;
  remaining: number;
  percentage: number;
  categories: {
    id: number;
    name: string;
    spent: number;
    percentage: number;
  }[];
}