import { ExpenseItem, Expense } from '@/interfaces/expense-interface';
import { PaymentMethod } from '@/interfaces/payment-method-interface';
import { supabase } from '../supabase/supabase';

/**
 * Groups expense items by their parent expense ID
 */
export const groupItemsByExpenseId = (expenseItems: ExpenseItem[] | null): Record<number, ExpenseItem[]> => {
  return (expenseItems || []).reduce((acc, item) => {
    if (!acc[item.expense_id]) {
      acc[item.expense_id] = [];
    }
    // Ensure the category property exists for income items where category_id might be null
    if (item.income_category_id && !item.category) {
      // If this is an income item without a category reference
      console.log('Income item without category reference detected, providing placeholder');
    }
    acc[item.expense_id].push(item);
    return acc;
  }, {} as Record<number, ExpenseItem[]>);
};

/**
 * Groups payment methods by their ID for quick lookup
 */
export const groupPaymentMethodsById = (paymentMethods: PaymentMethod[] | null): Record<number, PaymentMethod> => {
  return (paymentMethods || []).reduce((acc, pm) => {
    acc[pm.id] = pm;
    return acc;
  }, {} as Record<number, PaymentMethod>);
};

/**
 * Combines expenses with their related items and payment methods
 */
export const combineExpensesWithItems = (
  expenses: Expense[],
  itemsByExpenseId: Record<number, ExpenseItem[]>,
  paymentMethodsById: Record<number, PaymentMethod>
): Expense[] => {
  return expenses.map(expense => {
    // Get items for this expense
    const items = itemsByExpenseId[expense.id] || [];
    
    // Ensure transaction_type is set (for compatibility with existing UI)
    const enhancedExpense = {
      ...expense,
      transaction_type: expense.transaction_type || 
        (items.some(item => item.income_category_id) ? 'income' : 'expense'),
      expense_items: items,
      payment_method: expense.payment_method_id ? paymentMethodsById[expense.payment_method_id] : null
    };
    
    // Add debug information
    if (items && items.length > 0) {
      const firstItem = items[0];
      console.log(`Enhanced expense ID ${expense.id}: type=${enhancedExpense.transaction_type}, ` +
        `has items=${items.length}, ` + 
        `first item category_id=${firstItem.category_id}, ` +
        `income_category_id=${firstItem.income_category_id}`);
    }
    
    return enhancedExpense;
  });
};

/**
 * Count the total number of expense items in an array of expenses
 */
export const countTotalItems = (expenses: Expense[]): number => {
  let itemCount = 0;
  expenses.forEach(expense => {
    if (expense.expense_items) {
      itemCount += expense.expense_items.length;
    }
  });
  return itemCount;
};

/**
 * Builds a base expense query with common filters
 */
export const buildBaseExpenseQuery = (
  userId: string,
  options?: {
    startDate?: string | Date;
    endDate?: string | Date;
    limit?: number;
    offset?: number;
  }
) => {
  let query = supabase
    .from('expense')
    .select('*')
    .eq('user_id', userId)
    .eq('isdeleted', false)
    .order('date', { ascending: false });
  
  // Apply date filters if provided, with improved date handling
  if (options?.startDate) {
    console.log(`Using start date filter: ${typeof options.startDate === 'string' ? options.startDate : options.startDate.toISOString()}`);
    
    // Ensure we always use the date string and compare the exact date part
    const startDateStr = typeof options.startDate === 'string' 
      ? options.startDate
      : options.startDate.toISOString();
    
    // Use .gte with the formatted date
    query = query.gte('date', startDateStr);
    console.log(`Date filter applied: date >= ${startDateStr} (${new Date(startDateStr).toLocaleString()})`);
    
    // Log for debugging date-related issues
    console.log(`Current system time for comparison: ${new Date().toISOString()} (${new Date().toLocaleString()})`);
  }
  
  if (options?.endDate) {
    console.log(`Using end date filter: ${typeof options.endDate === 'string' ? options.endDate : options.endDate.toISOString()}`);
    
    // Ensure we always use the date string and compare the exact date part
    const endDateStr = typeof options.endDate === 'string'
      ? options.endDate
      : options.endDate.toISOString();
    
    // Use .lte with the formatted date
    query = query.lte('date', endDateStr);
    console.log(`Date filter applied: date <= ${endDateStr} (${new Date(endDateStr).toLocaleString()})`);
  }
  
  // Apply pagination if provided
  if (options?.limit) {
    query = query.limit(options.limit);
  }
  
  if (options?.limit && options?.offset) {
    query = query.range(options.offset, options.offset + options.limit - 1);
  }
  
  return query;
};

/**
 * Fetches expense items for the given expense IDs
 */
export const fetchExpenseItems = async (expenseIds: number[]) => {
  const { data: expenseItems, error: itemsError } = await supabase
    .from('expense_item')
    .select(`
      *,
      category:expense_category(*)
    `)
    .in('expense_id', expenseIds)
    .eq('isdeleted', false);
    
  if (itemsError) {
    return handleSupabaseError(itemsError, "fetching expense items");
  }
  
  return expenseItems;
};

/**
 * Fetches all payment methods
 */
export const fetchPaymentMethods = async () => {
  const { data: paymentMethods, error: pmError } = await supabase
    .from('payment_methods')
    .select('*')
    .eq('isdeleted', false);
  
  if (pmError) {
    return handleSupabaseError(pmError, "fetching payment methods");
  }
  
  return paymentMethods;
};

/**
 * Loads expenses with their related items and payment methods in a single operation
 */
export const loadExpensesWithRelations = async (expenses: Expense[]): Promise<Expense[]> => {
  if (!expenses || expenses.length === 0) {
    return [];
  }
  
  const expenseIds = expenses.map(e => e.id);
  
  // Fetch items and payment methods in parallel
  const [expenseItems, paymentMethods] = await Promise.all([
    fetchExpenseItems(expenseIds),
    fetchPaymentMethods()
  ]);
  
  // Group and combine
  const itemsByExpenseId = groupItemsByExpenseId(expenseItems);
  const paymentMethodsById = groupPaymentMethodsById(paymentMethods);
  
  return combineExpensesWithItems(expenses, itemsByExpenseId, paymentMethodsById);
};

// Error handling helpers
export const handleSupabaseError = (error: any, context: string): never => {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] Error ${context}:`, error);
  throw error;
};

/**
 * Creates an expense item record from a request object
 */
export const createExpenseItemFromRequest = (
  expenseId: number, 
  item: any, 
  isIncome: boolean = false
) => {
  console.log(`Creating expense item: expenseId=${expenseId}, isIncome=${isIncome}, item=`, item);
  
  // Handle income transactions differently
  if (isIncome) {
    return {
      expense_id: expenseId,
      category_id: null, // For income, use null for category_id
      income_category_id: item.income_category_id, // Use income_category_id for income
      amount: item.amount,
      description: item.description
    };
  }
  
  // Regular expense item
  return {
    expense_id: expenseId,
    category_id: item.category_id,
    amount: item.amount,
    description: item.description,
    income_category_id: null // Explicitly set to null for expense items
  };
};

/**
 * Handles updating expense items, matching existing ones when possible
 */
export const updateExpenseItems = async (
  expenseId: number, 
  newItems: any[],
  isIncome: boolean = false
): Promise<void> => {
  console.log(`Updating expense items for ID ${expenseId}, isIncome=${isIncome}, items:`, newItems);
  
  // First fetch existing non-deleted expense items for this expense
  const { data: existingItems, error: fetchError } = await supabase
    .from('expense_item')
    .select('id, category_id, income_category_id, amount, description')
    .eq('expense_id', expenseId)
    .eq('isdeleted', false);
    
  if (fetchError) {
    return handleSupabaseError(fetchError, "fetching existing expense items");
  }
  
  console.log(`Found ${existingItems?.length || 0} existing items for expense ID ${expenseId}`, existingItems);
  
  // If we have existing items, update the first one instead of deleting and creating new
  if (existingItems && existingItems.length > 0) {
    const firstItemId = existingItems[0].id;
    const firstNewItem = newItems[0];
    
    // Update the existing item with new data
    const updateData = isIncome 
      ? {
          category_id: null,
          income_category_id: firstNewItem.income_category_id,
          amount: firstNewItem.amount,
          description: firstNewItem.description
        }
      : {
          category_id: firstNewItem.category_id,
          income_category_id: null,
          amount: firstNewItem.amount,
          description: firstNewItem.description
        };
    
    console.log(`Updating item ID ${firstItemId} with data:`, updateData);
    
    const { error: updateItemError } = await supabase
      .from('expense_item')
      .update(updateData)
      .eq('id', firstItemId);
      
    if (updateItemError) {
      return handleSupabaseError(updateItemError, "updating expense item");
    }
    
    // If there are more new items than existing ones, add them
    if (newItems.length > existingItems.length) {
      const additionalItems = newItems.slice(existingItems.length).map(item => {
        return isIncome
          ? {
              expense_id: expenseId,
              category_id: null,
              income_category_id: item.income_category_id,
              amount: item.amount,
              description: item.description
            }
          : {
              expense_id: expenseId,
              category_id: item.category_id,
              income_category_id: null,
              amount: item.amount,
              description: item.description
            };
      });
      
      console.log(`Adding ${additionalItems.length} additional items:`, additionalItems);
      
      const { error: addItemsError } = await supabase
        .from('expense_item')
        .insert(additionalItems);
        
      if (addItemsError) {
        return handleSupabaseError(addItemsError, "adding additional expense items");
      }
    }
    
    // If there are more existing items than new ones, mark the extra ones as deleted
    if (existingItems.length > newItems.length) {
      const extraItemIds = existingItems.slice(newItems.length).map(item => item.id);
      
      console.log(`Marking ${extraItemIds.length} items as deleted:`, extraItemIds);
      
      const { error: deleteExtraError } = await supabase
        .from('expense_item')
        .update({ isdeleted: true })
        .in('id', extraItemIds);
        
      if (deleteExtraError) {
        return handleSupabaseError(deleteExtraError, "deleting extra expense items");
      }
    }
  } else {
    // No existing items found (unusual case), so insert new ones
    const newExpenseItems = newItems.map(item => {
      return isIncome
        ? {
            expense_id: expenseId,
            category_id: null,
            income_category_id: item.income_category_id,
            amount: item.amount,
            description: item.description
          }
        : {
            expense_id: expenseId,
            category_id: item.category_id,
            income_category_id: null,
            amount: item.amount,
            description: item.description
          };
    });
    
    console.log(`No existing items found, creating ${newExpenseItems.length} new items:`, newExpenseItems);
    
    const { error: itemsError } = await supabase
      .from('expense_item')
      .insert(newExpenseItems);
    
    if (itemsError) {
      return handleSupabaseError(itemsError, "inserting new expense items");
    }
  }
}; 