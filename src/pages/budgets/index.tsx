import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient, useQueries } from '@tanstack/react-query';
import Layout from '@/components/Layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/card';
import { Button } from '@/components/UI/button';
import { Plus, AlertTriangle, Trash } from 'lucide-react';
import { Progress } from '@/components/UI/progress';
import { PeriodEnum } from '@/interfaces/enums/PeriodEnum';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';
import { budgetApi } from '@/lib/api/budgetApi';
import { CreateBudgetRequest, Budget } from '@/interfaces/budget-interface';
import { useToast } from '@/components/UI/use-toast';
import BudgetForm from '@/components/Budgets/BudgetForm';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/UI/dialog';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/UI/alert-dialog';
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
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeBudget, setActiveBudget] = useState<number | null>(null);
  
  const { userId } = useDashboard();
  
  // Fetch budgets for the selected period
  const { data: budgetsData = [], isLoading: budgetsLoading, error: budgetsError } = useQuery({
    queryKey: ['budgets', selectedPeriod, userId],
    queryFn: async () => {
      try {
        // Ensure we have a valid userId
        if (!userId) {
          console.warn('No userId available, cannot fetch budgets');
          setDebug(`Warning: No userId available, cannot fetch budgets`);
          return [];
        }
        
        console.log(`Fetching budgets for period ${selectedPeriod} and user ${userId}`);
        const result = await budgetApi.getByPeriod(userId, selectedPeriod);
        console.log(`Fetch result:`, result);
        setDebug(`Successfully fetched ${result.length} budgets for period ${selectedPeriod}`);
        return result;
      } catch (err) {
        console.error(`Error fetching budgets:`, err);
        setDebug(`Error: ${err.message}`);
        throw err;
      }
    },
    enabled: !!userId, // Only enable the query if userId is available
  });
  
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
  
  // Sync budgets state with budgetsData
  useEffect(() => {
    if (budgetsData) {
      console.log(`Budget data updated: ${budgetsData.length} budgets available`);
      if (!budgetsLoading) {
        console.log('Setting budgets state with data from query');
        setBudgets(budgetsData);
      }
    }
  }, [budgetsData, budgetsLoading]);
  
  // Debug state changes
  useEffect(() => {
    console.log(`Local budgets state changed: ${budgets.length} budgets, isLoading=${isLoading}`);
  }, [budgets, isLoading]);
  
  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['expenseCategories'],
    queryFn: budgetApi.getCategories,
  });
  
  // Fetch spending data for each budget
  const spendingQueries = useQueries({
    queries: budgetsData.map(budget => ({
      queryKey: ['budgetSpending', budget.id],
      queryFn: () => budgetApi.getBudgetSpending(budget.id),
    }))
  });

  // Fetch category spending data for each budget
  const categorySpendingQueries = useQueries({
    queries: budgetsData.map(budget => ({
      queryKey: ['budgetCategorySpending', budget.id],
      queryFn: () => budgetApi.getBudgetCategorySpending(budget.id),
    }))
  });
  
  // Create budget mutation
  const createBudget = useMutation({
    mutationFn: (newBudget: CreateBudgetRequest) => budgetApi.create(newBudget),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      setIsNewBudgetOpen(false);
      toast({
        title: "Success!",
        description: "Budget has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create budget: ${error.message}`,
        variant: "destructive",
      });
      setDebug(`Error creating budget: ${error.message}`);
    }
  });
  
  // Delete budget mutation
  const deleteBudget = useMutation({
    mutationFn: (budgetId: number) => budgetApi.delete(budgetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast({
        title: "Success!",
        description: "Budget has been deleted successfully.",
      });
    },
    onError: (error) => {
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
  
  // Create a more robust handler to debug issues
  const handleMainPageBudgetSubmit = (formData: any) => {
    console.log('MAIN PAGE handleBudgetSubmit called:', formData);
    
    try {
      // Make sure we have a user ID
      if (!userId) {
        console.error('Missing userId, cannot create budget');
        toast({
          title: "Error",
          description: "You must be logged in to create a budget",
          variant: "destructive",
        });
        return;
      }
      
      const newBudget: CreateBudgetRequest = {
        user_id: userId,
        name: `${formData.categoryName || 'New'} Budget`,
        amount: formData.amount,
        period: formData.period,
        start_date: new Date().toISOString(),
        categories: [
          {
            category_id: formData.categoryId,
            alert_threshold: formData.amount * 0.8 // 80% alert threshold
          }
        ]
      };
      
      console.log('Creating budget with data:', newBudget);
      
      // Create the budget using the mutation
      createBudget.mutate(newBudget);
    } catch (error) {
      console.error('Error creating budget:', error);
      toast({
        title: "Error",
        description: `Failed to create budget: ${error.message}`,
        variant: "destructive",
      });
    }
  };
  
  const handleDeleteBudget = (budgetId: number) => {
    setBudgetToDelete(budgetId);
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
      setBudgets(budgetsData);
      setIsLoading(false);
    }
    
    // If we are loading, make sure our component shows loading state
    if (budgetsLoading) {
      setIsLoading(true);
    }
  }, [budgetsLoading, budgetsData]);

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
            onClick={() => setIsNewBudgetOpen(true)}
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
            <CardTitle>Budget Details</CardTitle>
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
              ) : budgets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No budgets found for this period. Create a new budget to get started.
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
                            <th className="h-12 px-4 text-right align-middle font-medium">Budget</th>
                            <th className="h-12 px-4 text-right align-middle font-medium">Spent</th>
                            <th className="h-12 px-4 text-right align-middle font-medium">Remaining</th>
                            <th className="h-12 px-4 align-middle font-medium">Progress</th>
                            <th className="h-12 px-4 align-middle font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {budgets.map((budget, index) => {
                            // Get first category for simplicity
                            const budgetCategory = budget.budget_categories?.[0];
                            const category = budgetCategory?.category;
                            
                            // Get actual spending from the API
                            const spent = Number(spendingQueries[index].data || 0);
                            const percentage = Math.round((spent / Number(budget.amount)) * 100);
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
                                    <span>{category?.name}</span>
                                  </div>
                                </td>
                                <td className="p-4 text-right">{formatCurrency(Number(budget.amount))}</td>
                                <td className="p-4 text-right">{formatCurrency(spent)}</td>
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
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => handleDeleteBudget(budget.id)}
                                  >
                                    <span className="sr-only">Delete</span>
                                    <Trash className="h-4 w-4" />
                                  </Button>
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
                    {budgets.map((budget, index) => {
                      // Get first category
                      const budgetCategory = budget.budget_categories?.[0];
                      const category = budgetCategory?.category;
                      
                      // Get actual spending
                      const spent = Number(spendingQueries[index].data || 0);
                      const percentage = Math.round((spent / Number(budget.amount)) * 100);
                      const remaining = Number(budget.amount) - spent;
                      
                      return (
                        <div key={budget.id} className="rounded-md border p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: '#' + Math.floor(Math.random()*16777215).toString(16) }}
                              />
                              <span className="font-medium">{category?.name}</span>
                            </div>
                            <div className="flex items-center">
                              <span className="text-sm font-medium mr-2">{budget.name}</span>
                              {percentage >= 90 && (
                                <div className="text-finance-expense" title="Budget almost exceeded">
                                  <AlertTriangle className="h-4 w-4" />
                                </div>
                              )}
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
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>
                                Spent: <span className="font-medium">{formatCurrency(spent)}</span>
                              </span>
                              <span>
                                Budget: <span className="font-medium">{formatCurrency(Number(budget.amount))}</span>
                              </span>
                            </div>
                            
                            <Progress 
                              value={percentage} 
                              className={cn("h-2", percentage >= 100 ? "bg-finance-expense" : 
                                             percentage >= 80 ? "bg-orange-400" : 
                                             percentage >= 60 ? "bg-yellow-400" : "bg-finance-income")}
                            />
                            
                            <div className="text-right text-sm text-muted-foreground">
                              Remaining: <span className="font-medium">{formatCurrency(remaining)}</span>
                            </div>
                          </div>
                        </div>
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
          onOpenChange={setIsNewBudgetOpen}
          onSubmit={handleMainPageBudgetSubmit}
        />


      </div>
    </Layout>
  );
};

export default BudgetPage;