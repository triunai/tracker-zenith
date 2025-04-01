import { supabase } from '../supabase/supabase';
import {
  Expense,
  ExpenseItem,
  ExpenseCategory,
  CreateExpenseRequest,
  CreateExpenseItemRequest,
  ExpenseWithTotal
} from '@/interfaces/expense-interface';

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
    let query = supabase
      .from('expense')
      .select(`
        *,
        payment_method:payment_methods(*),
        expense_items:expense_item(
          *,
          category:expense_category(*)
        )
      `)
      .eq('user_id', userId)
      .eq('isdeleted', false)
      .order('date', { ascending: false });
    
    // Apply filters if provided
    if (options?.startDate) {
      query = query.gte('date', options.startDate);
    }
    
    if (options?.endDate) {
      query = query.lte('date', options.endDate);
    }
    
    // Apply pagination if provided
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    
    if (options?.limit && options?.offset) {
      query = query.range(options.offset, options.offset + options.limit - 1);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data || [];
  },
  
  // Get recent expenses for a user
  getRecent: async (userId: string, limit: number = 5): Promise<Expense[]> => {
    const { data, error } = await supabase
      .from('expense')
      .select(`
        *,
        payment_method:payment_methods(*),
        expense_items:expense_item(
          *,
          category:expense_category(*)
        )
      `)
      .eq('user_id', userId)
      .eq('isdeleted', false)
      .order('date', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data || [];
  },
  
  // Get a single expense by ID
  getById: async (id: number): Promise<Expense | null> => {
    const { data, error } = await supabase
      .from('expense')
      .select(`
        *,
        payment_method:payment_methods(*),
        expense_items:expense_item(
          *,
          category:expense_category(*)
        )
      `)
      .eq('id', id)
      .eq('isdeleted', false)
      .single();
    
    if (error) throw error;
    return data;
  },
  
  // Create new expense with items
  create: async (expense: CreateExpenseRequest): Promise<Expense> => {
    try {
      // First create the expense
      const { data: expenseData, error: expenseError } = await supabase
        .from('expense')
        .insert([{
          user_id: expense.user_id,
          date: expense.date,
          description: expense.description,
          payment_method_id: expense.payment_method_id
        }])
        .select()
        .single();
      
      if (expenseError) throw expenseError;
      
      // Then create the expense items
      const expenseItems = expense.expense_items.map(item => ({
        expense_id: expenseData.id,
        category_id: item.category_id,
        amount: item.amount,
        description: item.description
      }));
      
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
        // First delete existing items
        const { error: deleteError } = await supabase
          .from('expense_item')
          .update({ isdeleted: true })
          .eq('expense_id', id);
          
        if (deleteError) throw deleteError;
        
        // Then add new items
        const newExpenseItems = expenseItems.map(item => ({
          expense_id: id,
          category_id: item.category_id,
          amount: item.amount,
          description: item.description
        }));
        
        const { error: itemsError } = await supabase
          .from('expense_item')
          .insert(newExpenseItems);
        
        if (itemsError) throw itemsError;
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
  }
}; 