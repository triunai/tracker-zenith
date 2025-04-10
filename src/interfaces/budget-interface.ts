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
 * Interface for updating an existing budget
 * Contains only the fields that can be updated.
 * Note: Currently, category changes are not supported via this interface.
 *       Name is included but might not be directly editable in the form.
 */
export interface UpdateBudgetRequest {
  name?: string; // Optional, as it might not always be updated
  amount?: number; // Optional
  period?: PeriodEnum; // Optional
  start_date?: string; // Optional, if needed
  end_date?: string; // Optional, if needed
  // We are NOT including categories here as we decided not to allow category changes during edit
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