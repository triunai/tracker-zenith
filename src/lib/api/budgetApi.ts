import { supabase } from '../supabase/supabase';
import { 
  Budget, 
  BudgetCategory, 
  CreateBudgetRequest,
  UpdateBudgetRequest
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
    // Convert period to lowercase to match database values
    const periodLowercase = period.toLowerCase();
    
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
      .eq('period', periodLowercase)
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
    try {
      // Initial data validation and logging
      console.log("BUDGET DEBUG [STEP 1]: Starting budget creation with data:", {
        user_id: budget.user_id,
        name: budget.name,
        amount: budget.amount,
        period: budget.period,
        categories: budget.categories.map(c => ({
          category_id: c.category_id,
          alert_threshold: c.alert_threshold
        }))
      });

      // Check UUID format
      const isValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(budget.user_id);
      console.log(`BUDGET DEBUG [STEP 2]: User ID format check - ${budget.user_id} is ${isValidUuid ? 'valid' : 'INVALID'} UUID`);

      // Validate category IDs exist
      try {
        console.log(`BUDGET DEBUG [STEP 3]: Validating ${budget.categories.length} category IDs...`);
        const categoryIds = budget.categories.map(c => c.category_id);
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('expense_category')
          .select('id')
          .in('id', categoryIds);
        
        if (categoriesError) {
          console.error(`BUDGET DEBUG [STEP 3 ERROR]: Category validation failed: ${categoriesError.message}`);
        } else {
          const foundIds = categoriesData?.map(c => c.id) || [];
          const missingIds = categoryIds.filter(id => !foundIds.includes(id));
          if (missingIds.length > 0) {
            console.error(`BUDGET DEBUG [STEP 3 ERROR]: Categories not found: ${missingIds.join(', ')}`);
          } else {
            console.log(`BUDGET DEBUG [STEP 3 SUCCESS]: All categories exist in database`);
          }
        }
      } catch (e) {
        console.error(`BUDGET DEBUG [STEP 3 EXCEPTION]: ${e.message}`);
      }

      // Verify user exists (foreign key check)
      try {
        console.log(`BUDGET DEBUG [STEP 4]: Verifying user exists - ${budget.user_id}`);
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(budget.user_id);
        
        if (userError) {
          console.error(`BUDGET DEBUG [STEP 4 ERROR]: User validation failed: ${userError.message}`);
        } else if (!userData?.user) {
          console.error(`BUDGET DEBUG [STEP 4 ERROR]: User not found: ${budget.user_id}`);
        } else {
          console.log(`BUDGET DEBUG [STEP 4 SUCCESS]: User exists in auth.users`);
        }
      } catch (e) {
        console.error(`BUDGET DEBUG [STEP 4 EXCEPTION]: ${e.message}`);
        // Continue anyway since we want to see other errors
      }

      // Fix date format - PostgreSQL date type expects YYYY-MM-DD format, not ISO string
      const formattedStartDate = budget.start_date ? new Date(budget.start_date).toISOString().split('T')[0] : null;
      const formattedEndDate = budget.end_date ? new Date(budget.end_date).toISOString().split('T')[0] : null;
      
      console.log(`BUDGET DEBUG [STEP 5]: Formatted dates for PostgreSQL:`, {
        original_start: budget.start_date,
        formatted_start: formattedStartDate,
        original_end: budget.end_date,
        formatted_end: formattedEndDate
      });

      // First create the budget with raw query to see exact error
      console.log(`BUDGET DEBUG [STEP 6]: Inserting budget record`);
      const budgetInsertData = {
        user_id: budget.user_id,
        name: budget.name,
        amount: budget.amount,
        period: budget.period,
        start_date: formattedStartDate,
        end_date: formattedEndDate
      };
      
      console.log(`BUDGET DEBUG [STEP 6 DATA]:`, budgetInsertData);
      
      const { data: budgetData, error: budgetError } = await supabase
        .from('budget')
        .insert([budgetInsertData])
        .select()
        .single();
      
      if (budgetError) {
        console.error(`BUDGET DEBUG [STEP 6 ERROR]: Budget insertion failed:`, {
          code: budgetError.code,
          message: budgetError.message,
          details: budgetError.details,
          hint: budgetError.hint
        });
        throw budgetError;
      }
      
      console.log(`BUDGET DEBUG [STEP 6 SUCCESS]: Budget record created:`, budgetData);
      
      // Then create the budget categories
      const budgetCategories = budget.categories.map(cat => ({
        budget_id: budgetData.id,
        category_id: cat.category_id,
        alert_threshold: cat.alert_threshold
      }));
      
      console.log(`BUDGET DEBUG [STEP 7]: Inserting ${budgetCategories.length} budget categories:`, budgetCategories);
      
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('budget_category')
        .insert(budgetCategories)
        .select();
      
      if (categoriesError) {
        console.error(`BUDGET DEBUG [STEP 7 ERROR]: Budget categories insertion failed:`, {
          code: categoriesError.code,
          message: categoriesError.message,
          details: categoriesError.details,
          hint: categoriesError.hint
        });
        
        // This is critical - if categories fail, we should clean up the budget to avoid orphaned records
        console.log(`BUDGET DEBUG [STEP 7 CLEANUP]: Removing orphaned budget record ID ${budgetData.id}`);
        const { error: cleanupError } = await supabase
          .from('budget')
          .delete()
          .eq('id', budgetData.id);
          
        if (cleanupError) {
          console.error(`BUDGET DEBUG [STEP 7 CLEANUP ERROR]: Failed to remove orphaned budget:`, cleanupError);
        }
        
        throw categoriesError;
      }
      
      console.log(`BUDGET DEBUG [STEP 7 SUCCESS]: Budget categories created:`, categoriesData);
      
      // Verify the budget can be retrieved (final check)
      console.log(`BUDGET DEBUG [STEP 8]: Final verification - fetching budget ID ${budgetData.id}`);
      const result = await budgetApi.getById(budgetData.id) as Budget;
      
      if (!result) {
        console.error(`BUDGET DEBUG [STEP 8 ERROR]: Budget verification failed - could not retrieve budget`);
        throw new Error('Budget creation verification failed');
      }
      
      console.log(`BUDGET DEBUG [STEP 8 SUCCESS]: Budget verified and retrievable:`, {
        id: result.id,
        name: result.name,
        categories_count: result.budget_categories?.length || 0
      });
      
      return result;
    } catch (error) {
      console.error(`BUDGET DEBUG [FATAL ERROR]: Budget creation failed:`, error);
      throw error;
    }
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
  
  // Update existing budget
  update: async (budgetId: number, payload: UpdateBudgetRequest): Promise<Budget> => {
    console.log(`BUDGET API: Updating budget ${budgetId} with payload:`, payload);

    // Prepare parameters for the RPC call, prefixing with 'p_' is a common convention
    const rpcParams: any = { // Use any temporarily for easier key deletion
      p_budget_id: budgetId,
      p_name: payload.name,
      p_amount: payload.amount,
      p_period: payload.period,
      // Add p_start_date and p_end_date if they are included in the payload and need formatting
      // p_start_date: payload.start_date ? new Date(payload.start_date).toISOString().split('T')[0] : null,
      // p_end_date: payload.end_date ? new Date(payload.end_date).toISOString().split('T')[0] : null,
    };

    // Remove undefined fields from params, as RPC might expect all params or handle nulls
    Object.keys(rpcParams).forEach(key => rpcParams[key] === undefined && delete rpcParams[key]);

    console.log(`BUDGET API: Calling RPC 'update_budget' with params:`, rpcParams);

    const { data, error } = await supabase.rpc('update_budget', rpcParams);

    if (error) {
      console.error(`BUDGET API: Error updating budget ${budgetId}:`, error);
      throw error; // Re-throw the error to be caught by useMutation's onError
    }

    console.log(`BUDGET API: Budget ${budgetId} updated successfully. RPC Response:`, data);

    // Assuming the RPC function returns the updated budget record or relevant data.
    // If it doesn't return the full budget, we might need to fetch it again or adjust expectations.
    // For now, let's assume it returns enough information or we might need to adjust the return type.
    // If the RPC returns nothing on success, we might return the payload merged with ID.
    // If the RPC returns a specific structure, adjust the return value accordingly.
    // Let's assume for now it returns the updated budget row(s) and we take the first one if needed.
    // If the RPC is designed to return a single updated row, this should be fine.
    const updatedBudget = Array.isArray(data) ? data[0] : data; // Handle if RPC returns array

     if (!updatedBudget) {
        // If RPC returns nothing meaningful on success, fetch the updated budget
        console.warn(`BUDGET API: RPC 'update_budget' did not return data. Fetching updated budget ID: ${budgetId}`);
        const fetchedBudget = await budgetApi.getById(budgetId);
        if (!fetchedBudget) {
             throw new Error(`Failed to fetch budget ${budgetId} after update.`);
        }
        return fetchedBudget;
     }

    // Cast the result to Budget type if necessary and structure matches
    return updatedBudget as Budget;
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
  },
  
  // Calculate budget spending with date filter
  getBudgetSpendingByDate: async (budgetId: number, startDate: string, endDate: string): Promise<number> => {
    console.log(`Calling calculate_budget_spending_by_date for budget ${budgetId} from ${startDate} to ${endDate}`);
    
    const { data, error } = await supabase.rpc('calculate_budget_spending_by_date', {
      budget_id: budgetId,
      p_start_date: startDate,
      p_end_date: endDate
    });
    
    if (error) {
      console.error(`Error in getBudgetSpendingByDate:`, error);
      throw error;
    }
    
    console.log(`Budget spending by date result: ${data}`);
    return data || 0;
  },
  
  // Get budget spending breakdown by category
  getBudgetCategorySpending: async (budgetId: number): Promise<{category_name: string, category_id: number, total_spent: number}[]> => {
    const { data, error } = await supabase.rpc('get_budget_category_spending', {
      budget_id: budgetId
    });
    
    if (error) throw error;
    return data || [];
  },
  
  // Get budget spending breakdown by category with date filter
  getBudgetCategorySpendingByDate: async (budgetId: number, startDate: string, endDate: string): Promise<{category_name: string, category_id: number, total_spent: number, budget_amount: number, percentage: number}[]> => {
    console.log(`Calling get_budget_category_spending_by_date for budget ${budgetId} from ${startDate} to ${endDate}`);
    
    const { data, error } = await supabase.rpc('get_budget_category_spending_by_date', {
      budget_id: budgetId,
      p_start_date: startDate,
      p_end_date: endDate
    });
    
    if (error) {
      console.error(`Error in getBudgetCategorySpendingByDate:`, error);
      throw error;
    }
    
    console.log(`Category spending by date result:`, data);
    return data || [];
  },
  
  // Add a debug function to test direct DB access
  // This bypasses all the validation for testing
  testDirectCreation: async (userId: string): Promise<any> => {
    console.log("TEST DIRECT CREATION: Starting simple DB test with user_id:", userId);
    
    try {
      // Try the simplest possible insertion
      const simpleData = {
        user_id: userId,
        name: "SIMPLE TEST " + Date.now(),
        amount: 100,
        period: "monthly",
        start_date: new Date().toISOString().split('T')[0]
      };
      
      console.log("TEST DIRECT CREATION: Simple insert data:", simpleData);
      
      const { data, error } = await supabase
        .from('budget')
        .insert([simpleData])
        .select();
      
      if (error) {
        console.error("TEST DIRECT CREATION: Insert error:", error);
        return { success: false, error };
      }
      
      console.log("TEST DIRECT CREATION: Success:", data);
      return { success: true, data };
    } catch (e) {
      console.error("TEST DIRECT CREATION: Exception:", e);
      return { success: false, error: e };
    }
  }
};