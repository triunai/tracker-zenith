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
import { PostgrestResponse, PostgrestError } from '@supabase/supabase-js';

// Constants for timeouts
const TIMEOUT_DEFAULT = 8000; // Default timeout of 8 seconds
const TIMEOUT_LONG = 12000;   // Longer timeout for complex operations

// Type to help with the Supabase query responses
interface SupabaseResponse<T> {
  data: T | null;
  error: PostgrestError | null;
  [key: string]: any; // For any other properties that might be in the response
}

// Helper function to add timeouts to promises
const withTimeout = async <T>(
  promise: Promise<PostgrestResponse<T>> | any, 
  timeoutMs = TIMEOUT_DEFAULT, 
  errorMessage = 'Operation timed out'
): Promise<SupabaseResponse<T>> => {
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

  try {
    // Return the first promise to settle (either the operation or the timeout)
    const result = await Promise.race([actualPromise, timeoutPromise]);
    // For Supabase responses, ensure we return the original object structure
    return result as SupabaseResponse<T>;
  } catch (error) {
    console.error(`Timeout error in withTimeout: ${errorMessage}`, error);
    throw error;
  }
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
    console.log(`💡 DIAGNOSTIC API: expenseApi.getAllByUser start - user ${userId} with options:`, {
      ...options,
      startDate: options?.startDate,
      endDate: options?.endDate,
      current_time: new Date().toISOString()
    });
    
    try {
      // Use the helper function to build our base query
      console.log(`💡 DIAGNOSTIC API: About to call buildBaseExpenseQuery with:`, {
        userId,
        options,
        startDateType: options?.startDate ? typeof options.startDate : 'undefined',
        endDateType: options?.endDate ? typeof options.endDate : 'undefined'
      });
      
      // SPECIAL DEBUG: Try to directly fetch expense ID 52 to see if it exists
      console.log("🔍 TARGETED DEBUG: Directly checking if expense ID 52 exists...");
      const { data: targetExpense, error: targetError } = await supabase
        .from('expense')
        .select('*, expense_items(*)')
        .eq('id', 52)
        .single();
        
      if (targetError) {
        console.warn("🔍 TARGETED DEBUG: Error fetching expense ID 52:", targetError.message);
      } else if (targetExpense) {
        console.log("🔍 TARGETED DEBUG: Found expense ID 52 directly:", {
          id: targetExpense.id,
          user_id: targetExpense.user_id,
          date: targetExpense.date,
          formattedDate: new Date(targetExpense.date).toLocaleString(),
          payment_method_id: targetExpense.payment_method_id,
          itemCount: targetExpense.expense_items?.length || 0,
          wouldMatchCurrentUser: targetExpense.user_id === userId,
          dateCheck: options?.startDate && options?.endDate ? {
            startDate: options.startDate,
            endDate: options.endDate,
            expenseDate: targetExpense.date,
            isInRange: new Date(targetExpense.date) >= new Date(options.startDate) && 
                       new Date(targetExpense.date) <= new Date(options.endDate)
          } : 'No date filters provided'
        });
      } else {
        console.warn("🔍 TARGETED DEBUG: Expense ID 52 NOT FOUND in database!");
      }
      
      const expenseQuery = buildBaseExpenseQuery(userId, options);
      
      console.log(`💡 DIAGNOSTIC API: Query built, about to execute it`);
      
      // Get the expense records with timeout protection
      const { data: expenses, error: expenseError } = await withTimeout<Expense[]>(
        expenseQuery,
        TIMEOUT_DEFAULT,
        'Fetching expenses timed out'
      );
      
      console.log(`💡 DIAGNOSTIC API: Query executed, result status:`, {
        success: !expenseError,
        errorMessage: expenseError?.message,
        resultCount: expenses?.length || 0
      });
      
      if (expenseError) {
        console.error('💡 DIAGNOSTIC API: Error fetching expenses:', expenseError);
        return handleSupabaseError(expenseError, "fetching expenses");
      }
      
      if (!expenses || expenses.length === 0) {
        console.log(`💡 DIAGNOSTIC API: No expenses found for user: ${userId} with filters:`, {
          startDate: options?.startDate,
          endDate: options?.endDate
        });
        return [];
      }
      
      // TARGETED DEBUG: Check if expense ID 52 is in the results from the normal query
      const hasTarget = expenses.some(e => e.id === 52);
      console.log(`🔍 TARGETED DEBUG: Expense ID 52 ${hasTarget ? 'IS' : 'IS NOT'} in the query results`);
      if (!hasTarget && targetExpense) {
        console.warn("🔍 TARGETED DEBUG: Expense ID 52 exists but was filtered out by the query. Likely reasons:", {
          differentUserId: targetExpense.user_id !== userId,
          outsideDateRange: options?.startDate && options?.endDate ? 
            !(new Date(targetExpense.date) >= new Date(options.startDate) && 
              new Date(targetExpense.date) <= new Date(options.endDate)) : 
            false,
          isDeleted: targetExpense.isdeleted === true
        });
      }
      
      console.log(`💡 DIAGNOSTIC API: Found ${expenses.length} raw expenses before loading relations`);
      if (expenses.length > 0) {
        // Log the date range of the first few expenses
        expenses.slice(0, 3).forEach((expense, i) => {
          console.log(`💡 DIAGNOSTIC API: Expense[${i}] ID=${expense.id}, date=${expense.date}, formatted=${new Date(expense.date).toLocaleString()}`);
        });
      }
      
      // Load expenses with their related items and payment methods
      console.time('💡 DIAGNOSTIC API: loadExpensesWithRelations duration');
      const result = await loadExpensesWithRelations(expenses);
      console.timeEnd('💡 DIAGNOSTIC API: loadExpensesWithRelations duration');
      
      // Log how many expense items we found
      const itemCount = countTotalItems(result);
      console.log(`💡 DIAGNOSTIC API: Found ${result.length} expenses with ${itemCount} total expense items`);
      
      // Check if any expenses have no items
      const expensesWithNoItems = result.filter(e => !e.expense_items || e.expense_items.length === 0);
      if (expensesWithNoItems.length > 0) {
        console.warn(`💡 DIAGNOSTIC API: Found ${expensesWithNoItems.length} expenses with no items!`);
        expensesWithNoItems.forEach((e, i) => {
          if (i < 3) { // Just log the first 3 to avoid console spam
            console.warn(`💡 DIAGNOSTIC API: Expense with no items: ID=${e.id}, date=${e.date}, type=${e.transaction_type}`);
          }
        });
      }
      
      // Log transaction types distribution
      const expenseCount = result.filter(e => e.transaction_type === 'expense').length;
      const incomeCount = result.filter(e => e.transaction_type === 'income').length;
      const unknownCount = result.filter(e => !e.transaction_type).length;
      
      console.log(`💡 DIAGNOSTIC API: Transaction type distribution:`, {
        expense: expenseCount,
        income: incomeCount,
        unknown: unknownCount,
        total: result.length
      });
      
      return result;
    } catch (error) {
      console.error(`💡 DIAGNOSTIC API: Error in getAllByUser:`, error);
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
      const { data: expenses, error: expenseError } = await withTimeout<Expense[]>(
        expenseQuery,
        TIMEOUT_DEFAULT,
        'Fetching recent expenses timed out'
      );
      
      if (expenseError) {
        return handleSupabaseError(expenseError, "fetching recent expenses");
      }
      
      if (!expenses) return [];
      
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
      
      const { data: expense, error: expenseError } = await withTimeout<Expense>(
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
      
      const { data: expenseData, error: expenseError } = await withTimeout<Expense>(
        expensePromise,
        TIMEOUT_DEFAULT,
        'Creating expense record timed out'
      );
      
      if (expenseError) {
        return handleSupabaseError(expenseError, "creating expense");
      }
      
      if (!expenseData) {
        throw new Error("Failed to create expense - no data returned");
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
      
      const { error: itemsError } = await withTimeout<ExpenseItem[]>(
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
      
      const { error: expenseError } = await withTimeout<Expense>(
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
      
      const { error } = await withTimeout<{ isdeleted: boolean }>(
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
      
      const { error } = await withTimeout<ExpenseItem>(
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
      
      const { error } = await withTimeout<ExpenseItem>(
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
      
      const { error } = await withTimeout<{ isdeleted: boolean }>(
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
      
      const { data, error } = await withTimeout<ExpenseCategory[]>(
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
      
      type CategorySummary = {category_id: number, category_name: string, total: number};
      
      const { data, error } = await withTimeout<CategorySummary[]>(
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
      
      type PaymentMethodSummary = {payment_method_id: number, method_name: string, total: number};
      
      const { data, error } = await withTimeout<PaymentMethodSummary[]>(
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
      
      const { data, error } = await withTimeout<number>(
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
      
      const { data, error } = await withTimeout<PaymentMethod[]>(
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