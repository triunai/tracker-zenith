import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient, useQueries } from '@tanstack/react-query';
import Layout from '@/components/Layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Edit, Plus, AlertTriangle, Trash } from 'lucide-react';
import { Progress } from '@/components/ui/progress.tsx';
import { PeriodEnum } from '@/interfaces/enums/PeriodEnum';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';
import { budgetApi } from '@/lib/api/budgetApi';
import { CreateBudgetRequest, UpdateBudgetRequest, Budget } from '@/interfaces/budget-interface';
import { useToast } from '@/components/ui/use-toast.ts';
import BudgetForm from '@/components/Budgets/BudgetForm';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog.tsx';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog.tsx';
import BudgetTracker from '@/components/Budgets/BudgetTracker';
import { useDashboard } from '@/context/DashboardContext';
import { supabase } from '@/lib/supabase/supabase';

const BudgetPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodEnum>(PeriodEnum.MONTHLY);
  const [isNewBudgetOpen, setIsNewBudgetOpen] = useState(false);
  const [debug, setDebug] = useState<string>("");
  const [budgetToDelete, setBudgetToDelete] = useState<number | null>(null);
  const [budgetToEdit, setBudgetToEdit] = useState<Budget | null>(null);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeBudget, setActiveBudget] = useState<number | null>(null);
  
  const { userId } = useDashboard();
  
  // Fetch ALL budgets for the user, remove dependency on selectedPeriod
  const { data: budgetsData = [], isLoading: budgetsLoading, error: budgetsError } = useQuery<Budget[]>({ // Explicit type
    queryKey: ['budgets', userId], // Remove selectedPeriod from the key
    queryFn: async () => {
      try {
        if (!userId) {
          console.warn('No userId available, cannot fetch budgets');
          setDebug(`Warning: No userId available, cannot fetch budgets`);
          return [];
        }
        
        console.log(`Fetching ALL budgets for user ${userId}`);
        // Call a function that gets ALL budgets, e.g., budgetApi.getAllByUser(userId)
        // Assuming budgetApi.getByPeriod was specific, we need a general fetch function
        // If budgetApi.getByPeriod(userId, null) works, use that, otherwise adapt budgetApi
        const result = await budgetApi.getAllByUser(userId); // *** ASSUMPTION: budgetApi.getAllByUser exists ***
        console.log(`Fetch result:`, result);
        setDebug(`Successfully fetched ${result.length} total budgets`);
        return result;
      } catch (err) {
        console.error(`Error fetching all budgets:`, err);
        setDebug(`Error: ${err.message}`);
        throw err;
      }
    },
    enabled: !!userId,
  });

  // Sort/Group budgets after fetching
  const sortedBudgets = useMemo(() => {
    if (!budgetsData) return [];
    // Define the desired order
    const periodOrder = [PeriodEnum.DAILY, PeriodEnum.WEEKLY, PeriodEnum.MONTHLY, PeriodEnum.QUARTERLY, PeriodEnum.YEARLY];
    return [...budgetsData].sort((a, b) => {
      const periodAIndex = periodOrder.indexOf(a.period);
      const periodBIndex = periodOrder.indexOf(b.period);
      // Sort primarily by period order
      if (periodAIndex !== periodBIndex) {
        return periodAIndex - periodBIndex;
      }
      // Optionally, sort by amount or name within the same period
      return a.name.localeCompare(b.name);
    });
  }, [budgetsData]);
  
  // Sync isLoading state with budgetsLoading from useQuery
  useEffect(() => {
    console.log(`Budget loading state changed: isLoading=${budgetsLoading}`);
    setIsLoading(budgetsLoading);
    
    // If there's an error, update the error state
    if (budgetsError) {
      console.error('Budget loading error:', budgetsError);
      setError(budgetsError.message);
      setDebug(`Error loading budgets: ${budgetsError.message}`);
    }
  }, [budgetsLoading, budgetsError]);
  
  // Use the sorted budgets instead of raw budgetsData for rendering
  useEffect(() => {
    if (!budgetsLoading && sortedBudgets) {
      console.log('Setting budgets state with sorted data...');
      setBudgets(sortedBudgets);
    }
  }, [sortedBudgets, budgetsLoading]);
  
  // Debug state changes
  useEffect(() => {
    console.log(`Local budgets state changed: ${budgets.length} budgets, isLoading=${isLoading}`);
  }, [budgets, isLoading]);
  
  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['expenseCategories'],
    queryFn: budgetApi.getCategories,
  });
  
  // Get date range for the current period
  const getDateRangeForBudgets = () => {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1); // First day of current month
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Last day of current month
    
    // Format for API
    const formatDate = (date: Date) => {
      return date.toISOString();
    };
    
    return {
      startDate: formatDate(startDate),
      endDate: formatDate(endDate)
    };
  };
  
  // Get date range once for all queries
  const { startDate, endDate } = getDateRangeForBudgets();
  
  // Fetch spending data for each budget with date filter
  const spendingQueries = useQueries({
    // Use sortedBudgets here so queries match the displayed order
    queries: sortedBudgets.map(budget => ({
      queryKey: ['budgetSpending', budget.id, startDate, endDate],
      queryFn: () => budgetApi.getBudgetSpendingByDate ?
        budgetApi.getBudgetSpendingByDate(budget.id, startDate, endDate) :
        budgetApi.getBudgetSpending(budget.id) // Fallback to old method if new one not available
    }))
  });

  // Fetch category spending data for each budget with date filter
  const categorySpendingQueries = useQueries({
    // Use sortedBudgets here so queries match the displayed order
    queries: sortedBudgets.map(budget => ({
      queryKey: ['budgetCategorySpending', budget.id, startDate, endDate],
      queryFn: () => budgetApi.getBudgetCategorySpendingByDate ?
        budgetApi.getBudgetCategorySpendingByDate(budget.id, startDate, endDate) :
        budgetApi.getBudgetCategorySpending(budget.id) // Fallback to old method if new one not available
    }))
  });
  
  // Create budget mutation
  const createBudget = useMutation({
    mutationFn: (newBudget: CreateBudgetRequest) => budgetApi.create(newBudget),
    onSuccess: (data) => {
      console.log('Budget created successfully, invalidating queries:', data);
      
      // --- Invalidate relevant queries ---
      queryClient.invalidateQueries({ queryKey: ['budgets'] }); // Invalidate the main budget list
      // Invalidate spending data as new budget might affect category spending overall
      queryClient.invalidateQueries({ queryKey: ['budgetSpending'] });
      queryClient.invalidateQueries({ queryKey: ['budgetCategorySpending'] });
       // Invalidate dashboard summary if it includes budget info
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      
      // Force a fresh fetch of all budget data might be too aggressive, let invalidate handle it
      // queryClient.resetQueries({ queryKey: ['budgets'] });
      
      setIsNewBudgetOpen(false);
      toast({
        title: "Success!",
        description: "Budget has been created successfully.",
      });
    },
    onError: (error) => {
      console.error('Failed to create budget:', error);
      toast({
        title: "Error",
        description: `Failed to create budget: ${error.message}`,
        variant: "destructive",
      });
      setDebug(`Error creating budget: ${error.message}`);
    }
  });
  
  // Update budget mutation
  const updateBudget = useMutation({
    mutationFn: async (updatedBudgetData: { id: number; data: UpdateBudgetRequest }) => {
      // Replace placeholder with actual API call
      console.log(`Calling budgetApi.update for budget ID: ${updatedBudgetData.id}`);
      return await budgetApi.update(updatedBudgetData.id, updatedBudgetData.data);
      // --- Placeholder logic removed ---
      // console.log(`Placeholder: Would update budget ${updatedBudgetData.id} with data:`, updatedBudgetData.data);
      // await new Promise(resolve => setTimeout(resolve, 500));
      // return { ...updatedBudgetData.data, id: updatedBudgetData.id };
      // --- End of removed placeholder ---
    },
    onSuccess: (data) => { // data here is the updated Budget returned by budgetApi.update
      console.log('Budget updated successfully via API, invalidating queries:', data);
      queryClient.invalidateQueries({ queryKey: ['budgets'] }); // Invalidate list
      queryClient.invalidateQueries({ queryKey: ['budgetSpending', data.id] }); // Invalidate specific spending
      queryClient.invalidateQueries({ queryKey: ['budgetCategorySpending', data.id] }); // Invalidate specific category spending
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] }); // Invalidate dashboard if needed

      setIsNewBudgetOpen(false); // Close the dialog
      setBudgetToEdit(null); // Clear editing state
      toast({
        title: "Success!",
        description: "Budget has been updated successfully.",
      });
    },
    onError: (error: Error, variables) => {
      console.error(`Failed to update budget ${variables.id} via API:`, error);
      toast({
        title: "Error",
        description: `Failed to update budget: ${error.message}`,
        variant: "destructive",
      });
      setDebug(`Error updating budget ${variables.id}: ${error.message}`);
    }
  });
  
  // Delete budget mutation
  const deleteBudget = useMutation({
    mutationFn: (budgetId: number) => budgetApi.delete(budgetId),
    onSuccess: (_, deletedBudgetId) => {
      console.log(`Budget ${deletedBudgetId} deleted successfully, invalidating queries`);
      
      // Immediately update local state to remove the deleted budget (optional, invalidateQueries handles refetch)
      // setBudgets(prevBudgets => prevBudgets.filter(budget => budget.id !== deletedBudgetId));
      
      // --- Invalidate relevant queries ---
      queryClient.invalidateQueries({ queryKey: ['budgets'] }); // Invalidate the main budget list
       // Invalidate specific budget spending data for the deleted budget
      queryClient.invalidateQueries({ queryKey: ['budgetSpending', deletedBudgetId] });
      queryClient.invalidateQueries({ queryKey: ['budgetCategorySpending', deletedBudgetId] });
      // Invalidate broader spending queries just in case
      queryClient.invalidateQueries({ queryKey: ['budgetSpending'] });
      queryClient.invalidateQueries({ queryKey: ['budgetCategorySpending'] });
      // Invalidate dashboard summary if it includes budget info
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      
      toast({
        title: "Success!",
        description: "Budget has been deleted successfully.",
      });
    },
    onError: (error) => {
      console.error('Failed to delete budget:', error);
      toast({
        title: "Error",
        description: `Failed to delete budget: ${error.message}`,
        variant: "destructive",
      });
      setDebug(`Error deleting budget: ${error.message}`);
    }
  });
  
  const confirmDelete = () => {
    if (budgetToDelete) {
      deleteBudget.mutate(budgetToDelete);
      setBudgetToDelete(null);
    }
  };
  
  const cancelDelete = () => {
    setBudgetToDelete(null);
  };
  
  // Updated handler for form submission
  const handleMainPageBudgetSubmit = (formData: any) => { // formData comes from BudgetFormValues
    console.log('MAIN PAGE handleBudgetSubmit called with form data:', formData);
    console.log('Current budgetToEdit state:', budgetToEdit);

    try {
      if (!userId) {
        throw new Error("User ID is missing. Cannot proceed.");
      }

      if (budgetToEdit) {
        // --- UPDATE LOGIC ---
        console.log(`Preparing to UPDATE budget ID: ${budgetToEdit.id}`);

        // Construct the update request payload
        // Note: We are not allowing category changes in this implementation
        const updatePayload: UpdateBudgetRequest = {
          // user_id is usually not needed for update, but depends on your API/RPC
          name: budgetToEdit.name, // Keep original name (or derive if category changes were allowed)
          amount: formData.amount,
          period: formData.period,
          // start_date/end_date might need updating depending on requirements
          // categories are NOT updated here as the form disables category change
        };

        console.log('Updating budget with payload:', updatePayload);
        updateBudget.mutate({ id: budgetToEdit.id, data: updatePayload });

      } else {
        // --- CREATE LOGIC ---
        console.log("Preparing to CREATE new budget");
        
        // Ensure categoryId exists before creating
        if (!formData.categoryId) {
            throw new Error("Category is required to create a budget.");
        }

        const newBudget: CreateBudgetRequest = {
          user_id: userId,
          name: `${formData.categoryName || 'New'} Budget`, // Use category name from form data
          amount: formData.amount,
          period: formData.period,
          start_date: new Date().toISOString(), // Keep default start date
          categories: [
            {
              category_id: formData.categoryId,
              alert_threshold: formData.amount * 0.8 // Keep 80% threshold
            }
          ]
        };

        console.log('Creating budget with data:', newBudget);
        createBudget.mutate(newBudget);
      }

    } catch (error: any) { // Catch specific errors
      console.error('Error in handleMainPageBudgetSubmit:', error);
      toast({
        title: "Submission Error",
        description: `Failed to process budget: ${error.message}`,
        variant: "destructive",
      });
      setDebug(`Error submitting budget: ${error.message}`);
    }
  };
  
  const handleDeleteBudget = (budgetId: number) => {
    setBudgetToDelete(budgetId);
  };
  
  // Handler to set the budget for editing and open the form
  const handleEditBudget = (budget: Budget) => {
    console.log("Editing budget:", budget);
    setBudgetToEdit(budget);
    setIsNewBudgetOpen(true); // Open the existing form dialog
  };

  // Handler for clicking the "Create New Budget" button
  const handleOpenCreateForm = () => {
    setBudgetToEdit(null); // Ensure we are not editing when creating
    setIsNewBudgetOpen(true);
  };
  
  const periods = Object.values(PeriodEnum);

  // Set up budget form event listener
  useEffect(() => {
    const handleOpenBudgetFormEvent = (event: any) => {
      console.log('Opening budget form from event:', event.detail);
      setIsNewBudgetOpen(true);
    };

    // Add event listener
    document.addEventListener('openBudgetForm', handleOpenBudgetFormEvent);

    // Clean up
    return () => {
      document.removeEventListener('openBudgetForm', handleOpenBudgetFormEvent);
    };
  }, []);

  // Ensure we refresh data when userId changes
  useEffect(() => {
    if (userId) {
      console.log(`UserId changed to ${userId}, refreshing budget data...`);
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    }
  }, [userId, queryClient]);
  
  // Use React Query's direct states more reliably
  useEffect(() => {
    // If we're not loading and have data, make sure our component state is updated
    if (!budgetsLoading && budgetsData) {
      setBudgets(budgetsData); // Still set raw data here
      setIsLoading(false);
    }
    
    // If we are loading, make sure our component shows loading state
    if (budgetsLoading) {
      setIsLoading(true);
    }
  }, [budgetsLoading, budgetsData]); // Depend on raw data

  return (
    <Layout>
      <div className="container mx-auto space-y-6">
        {/* Alert Dialog for Delete Confirmation */}
        <AlertDialog open={budgetToDelete !== null} onOpenChange={(open) => {
          if (!open) setBudgetToDelete(null);
        }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete this budget. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={cancelDelete}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-red-500 hover:bg-red-600">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Budgets</h1>
            <p className="text-muted-foreground mt-1">
              Manage your budgets and spending goals
            </p>
          </div>
          <Button 
            className="gap-2" 
            onClick={handleOpenCreateForm}
          >
            <Plus className="h-4 w-4" />
            Create New Budget
          </Button>
        </div>

        {/* Period Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Budget Overview(dont click no work)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              {periods.map((period) => (
                <Button
                  key={period}
                  size="sm"
                  variant={selectedPeriod === period ? 'default' : 'outline'}
                  onClick={() => setSelectedPeriod(period)}
                  className="capitalize"
                >
                  {period.toLowerCase()}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Budget Tracker Component */}
        <BudgetTracker 
          onDelete={handleDeleteBudget}
          onSubmit={handleMainPageBudgetSubmit}
        />

        {/* Detailed Budget Grid - Using index.tsx structure with API data */}
        <Card>
          <CardHeader>
            <CardTitle>All Budgets (Sorted by Period)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-8 gap-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <div>Loading budgets...</div>
                  <div className="text-xs text-muted-foreground">
                    {userId ? `User ID: ${userId.substring(0, 8)}...` : 'No user ID available'}
                  </div>
                </div>
              ) : error ? (
                <div className="text-center py-8 text-destructive">
                  <div>Error loading budgets</div>
                  <div className="text-sm mt-2">{error}</div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-4"
                    onClick={() => {
                      queryClient.invalidateQueries({ queryKey: ['budgets'] });
                      setDebug("Manually refreshing budgets query...");
                    }}
                  >
                    Retry
                  </Button>
                </div>
              ) : sortedBudgets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No budgets found. Create a new budget to get started.
                </div>
              ) : (
                <>
                  {/* Desktop View - Table */}
                  <div className="hidden md:block">
                    <div className="rounded-md border">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="h-12 px-4 text-left align-middle font-medium">Category</th>
                            <th className="h-12 px-4 text-left align-middle font-medium">Period</th>
                            <th className="h-12 px-4 text-right align-middle font-medium">Budget</th>
                            <th className="h-12 px-4 text-right align-middle font-medium">Spent</th>
                            <th className="h-12 px-4 text-right align-middle font-medium">Remaining</th>
                            <th className="h-12 px-4 align-middle font-medium">Progress</th>
                            <th className="h-12 px-4 align-middle font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortedBudgets.map((budget, index) => {
                            // Get first category for simplicity
                            const budgetCategory = budget.budget_categories?.[0];
                            const category = budgetCategory?.category;
                            
                            // Get actual spending from the API - safely check if query exists first
                            const spendingQuery = spendingQueries[index];
                            const spent = spendingQuery && spendingQuery.data ? Number(spendingQuery.data) : 0;
                            const percentage = budget.amount > 0 ? Math.round((spent / Number(budget.amount)) * 100) : 0;
                            const remaining = Number(budget.amount) - spent;
                            
                            // Determine status-based styling
                            const getProgressColor = () => {
                              if (percentage >= 100) return 'bg-finance-expense';
                              if (percentage >= 80) return 'bg-orange-400';
                              if (percentage >= 60) return 'bg-yellow-400';
                              return 'bg-finance-income';
                            };
                            
                            return (
                              <tr key={budget.id} className="border-b">
                                <td className="p-4">
                                  <div className="flex items-center gap-2">
                                    <div 
                                      className="w-3 h-3 rounded-full"
                                      style={{ backgroundColor: '#' + Math.floor(Math.random()*16777215).toString(16) }}
                                    />
                                    <span>{category?.name || budget.name}</span>
                                  </div>
                                </td>
                                <td className="p-4 capitalize">{budget.period.toLowerCase()}</td>
                                <td className="p-4 text-right">{formatCurrency(Number(budget.amount))}</td>
                                <td className="p-4 text-right text-destructive">{formatCurrency(spent)}</td>
                                <td className="p-4 text-right">{formatCurrency(remaining)}</td>
                                <td className="p-4">
                                  <div className="flex items-center gap-2">
                                    <Progress 
                                      value={percentage} 
                                      className={cn("h-2 flex-1", getProgressColor())}
                                    />
                                    <span className="text-sm">{percentage}%</span>
                                  </div>
                                </td>
                                <td className="p-4">
                                  <div className="flex items-center gap-1">
                                    {/* Edit Button */}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                                      onClick={() => handleEditBudget(budget)}
                                    >
                                      <span className="sr-only">Edit</span>
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    {/* Delete Button */}
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                      onClick={() => handleDeleteBudget(budget.id)}
                                    >
                                      <span className="sr-only">Delete</span>
                                      <Trash className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Mobile View - Cards */}
                  <div className="grid gap-4 md:hidden">
                    {sortedBudgets.map((budget, index) => {
                      // Get first category
                      const budgetCategory = budget.budget_categories?.[0];
                      const category = budgetCategory?.category;
                      
                      // Get actual spending - safely check if query exists first
                      const spendingQuery = spendingQueries[index];
                      const spent = spendingQuery && spendingQuery.data ? Number(spendingQuery.data) : 0;
                      const percentage = budget.amount > 0 ? Math.round((spent / Number(budget.amount)) * 100) : 0;
                      const remaining = Number(budget.amount) - spent;
                      
                      // Determine status-based styling - DEFINE IT HERE FOR MOBILE VIEW TOO
                      const getProgressColor = () => {
                        if (percentage >= 100) return 'bg-finance-expense';
                        if (percentage >= 80) return 'bg-orange-400';
                        if (percentage >= 60) return 'bg-yellow-400';
                        return 'bg-finance-income';
                      };

                      return (
                        <Card key={budget.id}>
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                             <CardTitle className="text-sm font-medium flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: '#' + Math.floor(Math.random()*16777215).toString(16) }}
                              />
                              {category?.name || budget.name}
                            </CardTitle>
                             <span className="text-xs text-muted-foreground capitalize">{budget.period.toLowerCase()}</span>
                          </CardHeader>
                          <CardContent>
                            <div className="text-lg font-bold">{formatCurrency(Number(budget.amount))}</div>
                            <div className="text-xs text-muted-foreground">
                              Spent: <span className="font-medium text-destructive">{formatCurrency(spent)}</span> ({percentage}%)
                            </div>
                            <Progress value={percentage} className={cn("h-2 mt-2", getProgressColor())} />
                            <div className="text-xs text-muted-foreground mt-1">
                              Remaining: {formatCurrency(remaining)}
                            </div>
                            <div className="flex justify-end gap-1 mt-2">
                              {/* Edit Button */}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                                onClick={() => handleEditBudget(budget)}
                              >
                                <span className="sr-only">Edit</span>
                                <Edit className="h-4 w-4" />
                              </Button>
                              {/* Delete Button */}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleDeleteBudget(budget.id)}
                              >
                                <span className="sr-only">Delete</span>
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Budget Form Dialog */}
        <BudgetForm 
          open={isNewBudgetOpen} 
          onOpenChange={(isOpen) => {
            setIsNewBudgetOpen(isOpen);
            // Clear budgetToEdit when closing the dialog UNLESS it's kept open
            if (!isOpen) {
              setBudgetToEdit(null);
            }
          }}
          onSubmit={handleMainPageBudgetSubmit}
          initialData={budgetToEdit}
          categories={categories}
        />

        {/* Debug Output */}
        {debug && (
          <pre className="mt-4 p-4 bg-muted rounded-md text-xs overflow-x-auto">
            <code>{debug}</code>
          </pre>
        )}
      </div>
    </Layout>
  );
};

export default BudgetPage;