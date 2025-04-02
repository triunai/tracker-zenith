import { supabase } from '../supabase/supabase';
import {
  Expense,
  ExpenseItem,
  ExpenseCategory,
  CreateExpenseRequest,
  CreateExpenseItemRequest,
  ExpenseWithTotal
} from '@/interfaces/expense-interface';
import { PaymentMethod } from '@/interfaces/payment-method-interface';
import { 
  groupItemsByExpenseId, 
  groupPaymentMethodsById, 
  combineExpensesWithItems, 
  countTotalItems,
  buildBaseExpenseQuery,
  handleSupabaseError,
  loadExpensesWithRelations,
  fetchExpenseItems,
  fetchPaymentMethods,
  createExpenseItemFromRequest,
  updateExpenseItems
} from '../utils/expense-helpers';

// Constants for timeouts
const TIMEOUT_DEFAULT = 8000; // Default timeout of 8 seconds
const TIMEOUT_LONG = 12000;   // Longer timeout for complex operations

// Helper function to add timeouts to promises
const withTimeout = async <T>(
  promise: Promise<T> | any, 
  timeoutMs = TIMEOUT_DEFAULT, 
  errorMessage = 'Operation timed out'
): Promise<T> => {
  // Handle PostgrestBuilder objects by wrapping them in Promise.resolve
  const actualPromise = typeof promise.then === 'function' 
    ? promise
    : Promise.resolve(promise).then(result => result);
  
  const timeoutPromise = new Promise<never>((_, reject) => {
    const id = setTimeout(() => {
      clearTimeout(id);
      reject(new Error(`${errorMessage} after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  return Promise.race([actualPromise, timeoutPromise]);
};

// Helper function for consistent timestamp logging
const logWithTimestamp = (message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  if (data) {
    console.log(`[${timestamp}] ${message}`, data);
  } else {
    console.log(`[${timestamp}] ${message}`);
  }
};

export const expenseApi = {
  // Get all expenses for a user with pagination and filters
  getAllByUser: async (
    userId: string, 
    options?: {
      limit?: number;
      offset?: number;
      startDate?: string;
      endDate?: string;
      categoryId?: number;
      paymentMethodId?: number;
    }
  ): Promise<Expense[]> => {
    logWithTimestamp(`[expenseApi:getAllByUser] Fetching expenses for user: ${userId}`);
    
    try {
      // Use the helper function to build our base query
      const expenseQuery = buildBaseExpenseQuery(userId, options);
      
      // Get the expense records with timeout protection
      const { data: expenses, error: expenseError } = await withTimeout(
        expenseQuery,
        TIMEOUT_DEFAULT,
        'Fetching expenses timed out'
      );
      
      if (expenseError) {
        return handleSupabaseError(expenseError, "fetching expenses");
      }
      
      if (!expenses || expenses.length === 0) {
        logWithTimestamp(`[expenseApi:getAllByUser] No expenses found for user: ${userId}`);
        return [];
      }
      
      // Load expenses with their related items and payment methods
      const result = await loadExpensesWithRelations(expenses);
      
      // Log how many expense items we found
      const itemCount = countTotalItems(result);
      logWithTimestamp(`[expenseApi:getAllByUser] Found ${result.length} expenses with ${itemCount} total expense items`);
      
      return result;
    } catch (error) {
      console.error(`[expenseApi:getAllByUser] Error fetching expenses:`, error);
      throw error;
    }
  },
  
  // Get recent expenses for a user
  getRecent: async (userId: string, limit: number = 5): Promise<Expense[]> => {
    logWithTimestamp(`[expenseApi:getRecent] Fetching ${limit} recent expenses for user: ${userId}`);
    
    try {
      // Use the helper function to build a query with a limit
      const expenseQuery = buildBaseExpenseQuery(userId, { limit });
      
      // Get expense records with timeout protection
      const { data: expenses, error: expenseError } = await withTimeout(
        expenseQuery,
        TIMEOUT_DEFAULT,
        'Fetching recent expenses timed out'
      );
      
      if (expenseError) {
        return handleSupabaseError(expenseError, "fetching recent expenses");
      }
      
      // Load related data
      const result = await loadExpensesWithRelations(expenses);
      logWithTimestamp(`[expenseApi:getRecent] Retrieved ${result.length} recent expenses`);
      return result;
    } catch (error) {
      console.error(`[expenseApi:getRecent] Error fetching recent expenses:`, error);
      throw error;
    }
  },
  
  // Get a single expense by ID
  getById: async (id: number): Promise<Expense | null> => {
    logWithTimestamp(`[expenseApi:getById] Fetching expense ID: ${id}`);
    
    try {
      // First get the expense record with timeout protection
      const expensePromise = supabase
        .from('expense')
        .select('*')
        .eq('id', id)
        .eq('isdeleted', false)
        .single();
      
      const { data: expense, error: expenseError } = await withTimeout(
        expensePromise,
        TIMEOUT_DEFAULT,
        `Fetching expense ID ${id} timed out`
      );
      
      if (expenseError) {
        return handleSupabaseError(expenseError, `fetching expense ID ${id}`);
      }
      
      if (!expense) {
        logWithTimestamp(`[expenseApi:getById] Expense ID ${id} not found`);
        return null;
      }
      
      // Use the load helper with a single expense
      const [expenseWithRelations] = await loadExpensesWithRelations([expense]);
      logWithTimestamp(`[expenseApi:getById] Successfully retrieved expense ID ${id}`);
      return expenseWithRelations;
    } catch (error) {
      console.error(`[expenseApi:getById] Error fetching expense ID ${id}:`, error);
      throw error;
    }
  },
  
  // Create new expense with items
  create: async (expense: CreateExpenseRequest): Promise<Expense> => {
    logWithTimestamp(`[expenseApi:create] Creating new transaction`, expense);
    
    try {
      // First create the expense with timeout protection
      const expensePromise = supabase
        .from('expense')
        .insert([{
          user_id: expense.user_id,
          date: expense.date,
          description: expense.description,
          payment_method_id: expense.payment_method_id,
          transaction_type: expense.transaction_type || 'expense'
        }])
        .select()
        .single();
      
      const { data: expenseData, error: expenseError } = await withTimeout(
        expensePromise,
        TIMEOUT_DEFAULT,
        'Creating expense record timed out'
      );
      
      if (expenseError) {
        return handleSupabaseError(expenseError, "creating expense");
      }
      
      // Then create the expense items with timeout protection
      const isIncome = expense.transaction_type === 'income';
      const expenseItems = expense.expense_items.map(item => 
        createExpenseItemFromRequest(expenseData.id, item, isIncome)
      );
      
      logWithTimestamp(`[expenseApi:create] Creating expense items for ID ${expenseData.id}`, expenseItems);
      
      const itemsPromise = supabase
        .from('expense_item')
        .insert(expenseItems);
      
      const { error: itemsError } = await withTimeout(
        itemsPromise,
        TIMEOUT_DEFAULT,
        'Creating expense items timed out'
      );
      
      if (itemsError) {
        return handleSupabaseError(itemsError, "creating expense items");
      }
      
      // Return the created expense with items
      logWithTimestamp(`[expenseApi:create] Successfully created expense ID ${expenseData.id}`);
      return await expenseApi.getById(expenseData.id) as Expense;
    } catch (error) {
      console.error("[expenseApi:create] Error creating expense:", error);
      throw error;
    }
  },
  
  // Update expense
  update: async (id: number, expense: Partial<Expense>): Promise<Expense> => {
    // We need to handle expense_items separately
    const expenseItems = expense.expense_items;
    const { expense_items, ...expenseData } = expense;
    
    logWithTimestamp(`[expenseApi:update] Updating expense ID ${id}`, expenseData);
    
    try {
      // Update the expense with timeout protection
      const updatePromise = supabase
        .from('expense')
        .update(expenseData)
        .eq('id', id);
      
      const { error: expenseError } = await withTimeout(
        updatePromise,
        TIMEOUT_DEFAULT,
        `Updating expense ID ${id} timed out`
      );
      
      if (expenseError) {
        return handleSupabaseError(expenseError, "updating expense");
      }
      
      // If expense items are provided, update them
      if (expenseItems && expenseItems.length > 0) {
        const isIncome = expense.transaction_type === 'income';
        logWithTimestamp(`[expenseApi:update] Expense ${id} is ${isIncome ? 'income' : 'expense'} type, updating items`);
        await updateExpenseItems(id, expenseItems, isIncome);
      }
      
      // Short delay to ensure updates have propagated (this helps with UI refresh)
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Return the updated expense with items
      logWithTimestamp(`[expenseApi:update] Successfully updated expense ID ${id}`);
      return await expenseApi.getById(id) as Expense;
    } catch (error) {
      console.error(`[expenseApi:update] Error updating expense ID ${id}:`, error);
      throw error;
    }
  },
  
  // Delete expense (soft delete)
  delete: async (id: number): Promise<void> => {
    logWithTimestamp(`[expenseApi:delete] Soft deleting expense ID ${id}`);
    
    try {
      const deletePromise = supabase
        .from('expense')
        .update({ isdeleted: true })
        .eq('id', id);
      
      const { error } = await withTimeout(
        deletePromise,
        TIMEOUT_DEFAULT,
        `Deleting expense ID ${id} timed out`
      );
      
      if (error) {
        handleSupabaseError(error, `deleting expense ID ${id}`);
      }
      
      logWithTimestamp(`[expenseApi:delete] Successfully deleted expense ID ${id}`);
    } catch (error) {
      console.error(`[expenseApi:delete] Error deleting expense ID ${id}:`, error);
      throw error;
    }
  },
  
  // Add a new expense item to an existing expense
  addExpenseItem: async (expenseId: number, item: CreateExpenseItemRequest): Promise<void> => {
    logWithTimestamp(`[expenseApi:addExpenseItem] Adding item to expense ID ${expenseId}`, item);
    
    try {
      const expenseItem = createExpenseItemFromRequest(expenseId, item);
      
      const addItemPromise = supabase
        .from('expense_item')
        .insert([expenseItem]);
      
      const { error } = await withTimeout(
        addItemPromise,
        TIMEOUT_DEFAULT,
        `Adding item to expense ID ${expenseId} timed out`
      );
      
      if (error) {
        handleSupabaseError(error, `adding expense item to ID ${expenseId}`);
      }
      
      logWithTimestamp(`[expenseApi:addExpenseItem] Successfully added item to expense ID ${expenseId}`);
    } catch (error) {
      console.error(`[expenseApi:addExpenseItem] Error adding item to expense ID ${expenseId}:`, error);
      throw error;
    }
  },
  
  // Update an expense item
  updateExpenseItem: async (id: number, item: Partial<ExpenseItem>): Promise<void> => {
    logWithTimestamp(`[expenseApi:updateExpenseItem] Updating expense item ID ${id}`, item);
    
    try {
      const updateItemPromise = supabase
        .from('expense_item')
        .update(item)
        .eq('id', id);
      
      const { error } = await withTimeout(
        updateItemPromise,
        TIMEOUT_DEFAULT,
        `Updating expense item ID ${id} timed out`
      );
      
      if (error) {
        handleSupabaseError(error, `updating expense item ID ${id}`);
      }
      
      logWithTimestamp(`[expenseApi:updateExpenseItem] Successfully updated expense item ID ${id}`);
    } catch (error) {
      console.error(`[expenseApi:updateExpenseItem] Error updating expense item ID ${id}:`, error);
      throw error;
    }
  },
  
  // Delete an expense item (soft delete)
  deleteExpenseItem: async (id: number): Promise<void> => {
    logWithTimestamp(`[expenseApi:deleteExpenseItem] Soft deleting expense item ID ${id}`);
    
    try {
      const deleteItemPromise = supabase
        .from('expense_item')
        .update({ isdeleted: true })
        .eq('id', id);
      
      const { error } = await withTimeout(
        deleteItemPromise,
        TIMEOUT_DEFAULT,
        `Deleting expense item ID ${id} timed out`
      );
      
      if (error) {
        handleSupabaseError(error, `deleting expense item ID ${id}`);
      }
      
      logWithTimestamp(`[expenseApi:deleteExpenseItem] Successfully deleted expense item ID ${id}`);
    } catch (error) {
      console.error(`[expenseApi:deleteExpenseItem] Error deleting expense item ID ${id}:`, error);
      throw error;
    }
  },
  
  // Get expense categories
  getCategories: async (): Promise<ExpenseCategory[]> => {
    logWithTimestamp(`[expenseApi:getCategories] Fetching expense categories`);
    
    try {
      const categoriesPromise = supabase
        .from('expense_category')
        .select('*')
        .eq('isdeleted', false)
        .order('name');
      
      const { data, error } = await withTimeout(
        categoriesPromise,
        TIMEOUT_DEFAULT,
        'Fetching expense categories timed out'
      );
      
      if (error) {
        return handleSupabaseError(error, "fetching expense categories");
      }
      
      logWithTimestamp(`[expenseApi:getCategories] Retrieved ${data?.length || 0} expense categories`);
      return data || [];
    } catch (error) {
      console.error(`[expenseApi:getCategories] Error fetching expense categories:`, error);
      throw error;
    }
  },
  
  // Get expense summary by category for a time period
  getSummaryByCategory: async (
    userId: string, 
    startDate: string, 
    endDate: string
  ): Promise<{category_id: number, category_name: string, total: number}[]> => {
    logWithTimestamp(`[expenseApi:getSummaryByCategory] Fetching category summary for user ${userId} from ${startDate} to ${endDate}`);
    
    try {
      const summaryPromise = supabase.rpc('get_expense_summary_by_category', {
        p_user_id: userId,
        p_start_date: startDate,
        p_end_date: endDate
      });
      
      const { data, error } = await withTimeout(
        summaryPromise,
        TIMEOUT_LONG, // Use longer timeout for aggregate RPC functions
        'Fetching expense summary by category timed out'
      );
      
      if (error) {
        return handleSupabaseError(error, "fetching expense summary by category");
      }
      
      logWithTimestamp(`[expenseApi:getSummaryByCategory] Retrieved summary for ${data?.length || 0} categories`);
      return data || [];
    } catch (error) {
      console.error(`[expenseApi:getSummaryByCategory] Error fetching category summary:`, error);
      throw error;
    }
  },
  
  // Get expense summary by payment method for a time period
  getSummaryByPaymentMethod: async (
    userId: string, 
    startDate: string, 
    endDate: string
  ): Promise<{payment_method_id: number, method_name: string, total: number}[]> => {
    logWithTimestamp(`[expenseApi:getSummaryByPaymentMethod] Fetching payment method summary for user ${userId} from ${startDate} to ${endDate}`);
    
    try {
      const summaryPromise = supabase.rpc('get_expense_summary_by_payment_method', {
        p_user_id: userId,
        p_start_date: startDate,
        p_end_date: endDate
      });
      
      const { data, error } = await withTimeout(
        summaryPromise,
        TIMEOUT_LONG, // Use longer timeout for aggregate RPC functions
        'Fetching expense summary by payment method timed out'
      );
      
      if (error) {
        return handleSupabaseError(error, "fetching expense summary by payment method");
      }
      
      logWithTimestamp(`[expenseApi:getSummaryByPaymentMethod] Retrieved summary for ${data?.length || 0} payment methods`);
      return data || [];
    } catch (error) {
      console.error(`[expenseApi:getSummaryByPaymentMethod] Error fetching payment method summary:`, error);
      throw error;
    }
  },
  
  // Get total expenses for a time period
  getTotalExpenses: async (
    userId: string, 
    startDate: string, 
    endDate: string
  ): Promise<number> => {
    logWithTimestamp(`[expenseApi:getTotalExpenses] Calculating total expenses for user ${userId} from ${startDate} to ${endDate}`);
    
    try {
      const totalPromise = supabase.rpc('get_total_expenses', {
        p_user_id: userId,
        p_start_date: startDate,
        p_end_date: endDate
      });
      
      const { data, error } = await withTimeout(
        totalPromise,
        TIMEOUT_DEFAULT,
        'Calculating total expenses timed out'
      );
      
      if (error) {
        return handleSupabaseError(error, "fetching total expenses");
      }
      
      logWithTimestamp(`[expenseApi:getTotalExpenses] Total expenses: ${data || 0}`);
      return data || 0;
    } catch (error) {
      console.error(`[expenseApi:getTotalExpenses] Error calculating total expenses:`, error);
      throw error;
    }
  },
  
  // Subscribe to real-time expense updates
  subscribeToExpenses: (
    userId: string, 
    callback: (payload: any) => void
  ) => {
    logWithTimestamp(`[expenseApi:subscribeToExpenses] Setting up realtime subscription for user ${userId}`);
    
    return supabase
      .channel('expense-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'expense',
        filter: `user_id=eq.${userId}`
      }, callback)
      .subscribe();
  },
  
  // Get payment methods
  getPaymentMethods: async (): Promise<PaymentMethod[]> => {
    logWithTimestamp(`[expenseApi:getPaymentMethods] Fetching payment methods`);
    
    try {
      const methodsPromise = supabase
        .from('payment_methods')
        .select('*')
        .eq('isdeleted', false)
        .order('method_name');
      
      const { data, error } = await withTimeout(
        methodsPromise,
        TIMEOUT_DEFAULT,
        'Fetching payment methods timed out'
      );
      
      if (error) {
        return handleSupabaseError(error, "fetching payment methods");
      }
      
      logWithTimestamp(`[expenseApi:getPaymentMethods] Retrieved ${data?.length || 0} payment methods`);
      return data || [];
    } catch (error) {
      console.error(`[expenseApi:getPaymentMethods] Error fetching payment methods:`, error);
      throw error;
    }
  }
}; 