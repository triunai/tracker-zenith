import { supabase } from '../supabase/supabase';
import { 
  Budget, 
  BudgetCategory, 
  CreateBudgetRequest 
} from '@/interfaces/budget-interface';
import { ExpenseCategory } from '@/interfaces/expense-interface';

export const budgetApi = {
  // Get all budgets for a user
  getAllByUser: async (userId: string): Promise<Budget[]> => {
    const { data, error } = await supabase
      .from('budget')
      .select(`
        *,
        budget_categories:budget_category(
          *,
          category:expense_category(*)
        )
      `)
      .eq('user_id', userId)
      .eq('isdeleted', false)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },
  
  // Get budgets by period
  getByPeriod: async (userId: string, period: string): Promise<Budget[]> => {
    const { data, error } = await supabase
      .from('budget')
      .select(`
        *,
        budget_categories:budget_category(
          *,
          category:expense_category(*)
        )
      `)
      .eq('user_id', userId)
      .eq('period', period)
      .eq('isdeleted', false)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },
  
  // Get budget by ID with categories
  getById: async (id: number): Promise<Budget | null> => {
    const { data, error } = await supabase
      .from('budget')
      .select(`
        *,
        budget_categories:budget_category(
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
  
  // Create new budget with categories
  create: async (budget: CreateBudgetRequest): Promise<Budget> => {
    // Start a transaction using RPC (Remote Procedure Call)
    // This ensures both the budget and its categories are created atomically
    const { data, error } = await supabase.rpc('create_budget_with_categories', {
      budget_data: {
        user_id: budget.user_id,
        name: budget.name,
        amount: budget.amount,
        period: budget.period,
        start_date: budget.start_date,
        end_date: budget.end_date
      },
      categories_data: budget.categories
    });

    if (error) throw error;
    return data;
  },
  
  // If you don't have an RPC function, here's an alternative way to create a budget
  createWithCategoriesManually: async (budget: CreateBudgetRequest): Promise<Budget> => {
    // First create the budget
    const { data: budgetData, error: budgetError } = await supabase
      .from('budget')
      .insert([{
        user_id: budget.user_id,
        name: budget.name,
        amount: budget.amount,
        period: budget.period,
        start_date: budget.start_date,
        end_date: budget.end_date
      }])
      .select()
      .single();
    
    if (budgetError) throw budgetError;
    
    // Then create the budget categories
    const budgetCategories = budget.categories.map(cat => ({
      budget_id: budgetData.id,
      category_id: cat.category_id,
      alert_threshold: cat.alert_threshold
    }));
    
    const { error: categoriesError } = await supabase
      .from('budget_category')
      .insert(budgetCategories);
    
    if (categoriesError) throw categoriesError;
    
    // Return the created budget with categories
    return await budgetApi.getById(budgetData.id) as Budget;
  },
  
  // Update budget
  update: async (id: number, budget: Partial<Budget>): Promise<Budget> => {
    const { data, error } = await supabase
      .from('budget')
      .update(budget)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  // Add a category to a budget
  addCategory: async (budgetId: number, categoryId: number, alertThreshold?: number): Promise<void> => {
    const { error } = await supabase
      .from('budget_category')
      .insert([{
        budget_id: budgetId,
        category_id: categoryId,
        alert_threshold: alertThreshold
      }]);
    
    if (error) throw error;
  },
  
  // Remove a category from a budget
  removeCategory: async (budgetId: number, categoryId: number): Promise<void> => {
    const { error } = await supabase
      .from('budget_category')
      .delete()
      .eq('budget_id', budgetId)
      .eq('category_id', categoryId);
    
    if (error) throw error;
  },
  
  // Update a budget category alert threshold
  updateCategoryThreshold: async (budgetId: number, categoryId: number, alertThreshold: number): Promise<void> => {
    const { error } = await supabase
      .from('budget_category')
      .update({ alert_threshold: alertThreshold })
      .eq('budget_id', budgetId)
      .eq('category_id', categoryId);
    
    if (error) throw error;
  },
  
  // Delete budget (soft delete)
  delete: async (id: number): Promise<void> => {
    const { error } = await supabase
      .from('budget')
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
  
  // Calculate budget spending
  getBudgetSpending: async (budgetId: number): Promise<number> => {
    // You'd need to create an RPC function for this in Supabase
    // that calculates the total spending for a budget across its categories
    // and within its time period
    const { data, error } = await supabase.rpc('calculate_budget_spending', {
      budget_id: budgetId
    });
    
    if (error) throw error;
    return data || 0;
  }
};