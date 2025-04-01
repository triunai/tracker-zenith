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
    console.log("Fetching expenses for user:", userId);
    
    // First get all expenses matching our criteria
    let expenseQuery = supabase
      .from('expense')
      .select('*')
      .eq('user_id', userId)
      .eq('isdeleted', false)
      .order('date', { ascending: false });
    
    // Apply date filters if provided
    if (options?.startDate) {
      expenseQuery = expenseQuery.gte('date', options.startDate);
    }
    
    if (options?.endDate) {
      expenseQuery = expenseQuery.lte('date', options.endDate);
    }
    
    // Apply pagination if provided
    if (options?.limit) {
      expenseQuery = expenseQuery.limit(options.limit);
    }
    
    if (options?.limit && options?.offset) {
      expenseQuery = expenseQuery.range(options.offset, options.offset + options.limit - 1);
    }
    
    // Get the expense records
    const { data: expenses, error: expenseError } = await expenseQuery;
    
    if (expenseError) {
      console.error("Error fetching expenses:", expenseError);
      throw expenseError;
    }
    
    if (!expenses || expenses.length === 0) {
      return [];
    }
    
    // Now fetch all expense items for these expenses in a separate query
    const expenseIds = expenses.map(e => e.id);
    
    const { data: expenseItems, error: itemsError } = await supabase
      .from('expense_item')
      .select(`
        *,
        category:expense_category(*)
      `)
      .in('expense_id', expenseIds)
      .eq('isdeleted', false);
      
    if (itemsError) {
      console.error("Error fetching expense items:", itemsError);
      throw itemsError;
    }
    
    // Fetch payment methods for these expenses
    const { data: paymentMethods, error: pmError } = await supabase
      .from('payment_methods')
      .select('*');
    
    if (pmError) {
      console.error("Error fetching payment methods:", pmError);
      throw pmError;
    }
    
    // Group expense items by expense_id
    const itemsByExpenseId = (expenseItems || []).reduce((acc, item) => {
      if (!acc[item.expense_id]) {
        acc[item.expense_id] = [];
      }
      acc[item.expense_id].push(item);
      return acc;
    }, {} as Record<number, any[]>);
    
    // Group payment methods by id
    const paymentMethodsById = (paymentMethods || []).reduce((acc, pm) => {
      acc[pm.id] = pm;
      return acc;
    }, {} as Record<number, any>);
    
    // Combine expenses with their items and payment methods
    const result = expenses.map(expense => {
      return {
        ...expense,
        expense_items: itemsByExpenseId[expense.id] || [],
        payment_method: expense.payment_method_id ? paymentMethodsById[expense.payment_method_id] : null
      };
    });
    
    // Log how many expense items we found
    let itemCount = 0;
    result.forEach(expense => {
      if (expense.expense_items) {
        itemCount += expense.expense_items.length;
      }
    });
    
    console.log(`Found ${result.length} expenses with ${itemCount} total expense items`);
    
    return result;
  },
  
  // Get recent expenses for a user
  getRecent: async (userId: string, limit: number = 5): Promise<Expense[]> => {
    // First get expense records
    const { data: expenses, error: expenseError } = await supabase
      .from('expense')
      .select('*')
      .eq('user_id', userId)
      .eq('isdeleted', false)
      .order('date', { ascending: false })
      .limit(limit);
    
    if (expenseError) {
      console.error("Error fetching recent expenses:", expenseError);
      throw expenseError;
    }
    
    if (!expenses || expenses.length === 0) {
      return [];
    }
    
    // Now fetch all expense items for these expenses
    const expenseIds = expenses.map(e => e.id);
    
    const { data: expenseItems, error: itemsError } = await supabase
      .from('expense_item')
      .select(`
        *,
        category:expense_category(*)
      `)
      .in('expense_id', expenseIds)
      .eq('isdeleted', false);
      
    if (itemsError) {
      console.error("Error fetching expense items:", itemsError);
      throw itemsError;
    }
    
    // Fetch payment methods
    const { data: paymentMethods, error: pmError } = await supabase
      .from('payment_methods')
      .select('*');
    
    if (pmError) {
      console.error("Error fetching payment methods:", pmError);
      throw pmError;
    }
    
    // Group expense items by expense_id
    const itemsByExpenseId = (expenseItems || []).reduce((acc, item) => {
      if (!acc[item.expense_id]) {
        acc[item.expense_id] = [];
      }
      acc[item.expense_id].push(item);
      return acc;
    }, {} as Record<number, any[]>);
    
    // Group payment methods by id
    const paymentMethodsById = (paymentMethods || []).reduce((acc, pm) => {
      acc[pm.id] = pm;
      return acc;
    }, {} as Record<number, any>);
    
    // Combine expenses with their items and payment methods
    const result = expenses.map(expense => {
      return {
        ...expense,
        expense_items: itemsByExpenseId[expense.id] || [],
        payment_method: expense.payment_method_id ? paymentMethodsById[expense.payment_method_id] : null
      };
    });
    
    return result;
  },
  
  // Get a single expense by ID
  getById: async (id: number): Promise<Expense | null> => {
    // First get the expense record
    const { data: expense, error: expenseError } = await supabase
      .from('expense')
      .select('*')
      .eq('id', id)
      .eq('isdeleted', false)
      .single();
    
    if (expenseError) {
      console.error("Error fetching expense:", expenseError);
      throw expenseError;
    }
    
    if (!expense) {
      return null;
    }
    
    // Now fetch the expense items for this expense
    const { data: expenseItems, error: itemsError } = await supabase
      .from('expense_item')
      .select(`
        *,
        category:expense_category(*)
      `)
      .eq('expense_id', id)
      .eq('isdeleted', false);
      
    if (itemsError) {
      console.error("Error fetching expense items:", itemsError);
      throw itemsError;
    }
    
    // Fetch the payment method if needed
    let paymentMethod = null;
    if (expense.payment_method_id) {
      const { data: pm, error: pmError } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('id', expense.payment_method_id)
        .single();
        
      if (pmError) {
        console.error("Error fetching payment method:", pmError);
        // Don't throw here - we can proceed without payment method info
      } else {
        paymentMethod = pm;
      }
    }
    
    // Combine everything
    const result = {
      ...expense,
      expense_items: expenseItems || [],
      payment_method: paymentMethod
    };
    
    return result;
  },
  
  // Create new expense with items
  create: async (expense: CreateExpenseRequest): Promise<Expense> => {
    try {
      console.log("Creating new transaction:", expense);
      
      // First create the expense
      const { data: expenseData, error: expenseError } = await supabase
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
      
      if (expenseError) throw expenseError;
      
      // Then create the expense items
      const expenseItems = expense.expense_items.map(item => {
        // Handle income transactions differently
        if (expense.transaction_type === 'income') {
          return {
            expense_id: expenseData.id,
            category_id: null, // For income, use null for category_id
            income_category_id: (item as any).income_category_id, // Use income_category_id for income
            amount: item.amount,
            description: item.description
          };
        }
        
        // Regular expense item
        return {
          expense_id: expenseData.id,
          category_id: item.category_id,
          amount: item.amount,
          description: item.description
        };
      });
      
      console.log("Creating expense items:", expenseItems);
      
      const { error: itemsError } = await supabase
        .from('expense_item')
        .insert(expenseItems);
      
      if (itemsError) throw itemsError;
      
      // Return the created expense with items
      return await expenseApi.getById(expenseData.id) as Expense;
    } catch (error) {
      console.error("Error creating expense:", error);
      throw error;
    }
  },
  
  // Update expense
  update: async (id: number, expense: Partial<Expense>): Promise<Expense> => {
    // We need to handle expense_items separately
    const expenseItems = expense.expense_items;
    const { expense_items, ...expenseData } = expense;
    
    try {
      // Update the expense
      const { error: expenseError } = await supabase
        .from('expense')
        .update(expenseData)
        .eq('id', id);
      
      if (expenseError) throw expenseError;
      
      // If expense items are provided, update them
      if (expenseItems && expenseItems.length > 0) {
        // First fetch existing non-deleted expense items for this expense
        const { data: existingItems, error: fetchError } = await supabase
          .from('expense_item')
          .select('id')
          .eq('expense_id', id)
          .eq('isdeleted', false);
          
        if (fetchError) throw fetchError;
        
        // If we have existing items, update the first one instead of deleting and creating new
        if (existingItems && existingItems.length > 0) {
          const firstItemId = existingItems[0].id;
          const firstNewItem = expenseItems[0];
          
          // Update the existing item with new data
          const { error: updateItemError } = await supabase
            .from('expense_item')
            .update({
              category_id: firstNewItem.category_id,
              amount: firstNewItem.amount,
              description: firstNewItem.description,
              income_category_id: (firstNewItem as any).income_category_id
            })
            .eq('id', firstItemId);
            
          if (updateItemError) throw updateItemError;
          
          // If there are more new items than existing ones, add them
          if (expenseItems.length > existingItems.length) {
            const additionalItems = expenseItems.slice(existingItems.length).map(item => ({
              expense_id: id,
              category_id: item.category_id,
              amount: item.amount,
              description: item.description,
              income_category_id: (item as any).income_category_id
            }));
            
            const { error: addItemsError } = await supabase
              .from('expense_item')
              .insert(additionalItems);
              
            if (addItemsError) throw addItemsError;
          }
          
          // If there are more existing items than new ones, mark the extra ones as deleted
          if (existingItems.length > expenseItems.length) {
            const extraItemIds = existingItems.slice(expenseItems.length).map(item => item.id);
            
            const { error: deleteExtraError } = await supabase
              .from('expense_item')
              .update({ isdeleted: true })
              .in('id', extraItemIds);
              
            if (deleteExtraError) throw deleteExtraError;
          }
        } else {
          // No existing items found (unusual case), so insert new ones
          const newExpenseItems = expenseItems.map(item => ({
            expense_id: id,
            category_id: item.category_id,
            amount: item.amount,
            description: item.description,
            income_category_id: (item as any).income_category_id
          }));
          
          const { error: itemsError } = await supabase
            .from('expense_item')
            .insert(newExpenseItems);
          
          if (itemsError) throw itemsError;
        }
      }
      
      // Return the updated expense with items
      return await expenseApi.getById(id) as Expense;
    } catch (error) {
      console.error("Error updating expense:", error);
      throw error;
    }
  },
  
  // Delete expense (soft delete)
  delete: async (id: number): Promise<void> => {
    const { error } = await supabase
      .from('expense')
      .update({ isdeleted: true })
      .eq('id', id);
    
    if (error) throw error;
  },
  
  // Add a new expense item to an existing expense
  addExpenseItem: async (expenseId: number, item: CreateExpenseItemRequest): Promise<void> => {
    const { error } = await supabase
      .from('expense_item')
      .insert([{
        expense_id: expenseId,
        category_id: item.category_id,
        amount: item.amount,
        description: item.description
      }]);
    
    if (error) throw error;
  },
  
  // Update an expense item
  updateExpenseItem: async (id: number, item: Partial<ExpenseItem>): Promise<void> => {
    const { error } = await supabase
      .from('expense_item')
      .update(item)
      .eq('id', id);
    
    if (error) throw error;
  },
  
  // Delete an expense item (soft delete)
  deleteExpenseItem: async (id: number): Promise<void> => {
    const { error } = await supabase
      .from('expense_item')
      .update({ isdeleted: true })
      .eq('id', id);
    
    if (error) throw error;
  },
  
  // Get expense categories
  getCategories: async (): Promise<ExpenseCategory[]> => {
    const { data, error } = await supabase
      .from('expense_category')
      .select('*')
      .eq('isdeleted', false)
      .order('name');
    
    if (error) throw error;
    return data || [];
  },
  
  // Get expense summary by category for a time period
  getSummaryByCategory: async (
    userId: string, 
    startDate: string, 
    endDate: string
  ): Promise<{category_id: number, category_name: string, total: number}[]> => {
    const { data, error } = await supabase.rpc('get_expense_summary_by_category', {
      p_user_id: userId,
      p_start_date: startDate,
      p_end_date: endDate
    });
    
    if (error) throw error;
    return data || [];
  },
  
  // Get expense summary by payment method for a time period
  getSummaryByPaymentMethod: async (
    userId: string, 
    startDate: string, 
    endDate: string
  ): Promise<{payment_method_id: number, method_name: string, total: number}[]> => {
    const { data, error } = await supabase.rpc('get_expense_summary_by_payment_method', {
      p_user_id: userId,
      p_start_date: startDate,
      p_end_date: endDate
    });
    
    if (error) throw error;
    return data || [];
  },
  
  // Get total expenses for a time period
  getTotalExpenses: async (
    userId: string, 
    startDate: string, 
    endDate: string
  ): Promise<number> => {
    const { data, error } = await supabase.rpc('get_total_expenses', {
      p_user_id: userId,
      p_start_date: startDate,
      p_end_date: endDate
    });
    
    if (error) throw error;
    return data || 0;
  },
  
  // Subscribe to real-time expense updates
  subscribeToExpenses: (
    userId: string, 
    callback: (payload: any) => void
  ) => {
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
    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('isdeleted', false)
      .order('method_name');
    
    if (error) throw error;
    return data || [];
  }
}; 