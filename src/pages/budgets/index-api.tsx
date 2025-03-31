// src/pages/budgets/index-api.tsx
import { useState } from 'react';
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
import { CreateBudgetRequest } from '@/interfaces/budget-interface';
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

const BudgetPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodEnum>(PeriodEnum.MONTHLY);
  const [isNewBudgetOpen, setIsNewBudgetOpen] = useState(false);
  const [debug, setDebug] = useState<string>("");

  // Mock user ID - you'd get this from auth context in a real app
  const userId = "11111111-1111-1111-1111-111111111111";
  
  // Fetch budgets for the selected period
  const { data: budgets = [], isLoading, error } = useQuery({
    queryKey: ['budgets', selectedPeriod],
    queryFn: async () => {
      try {
        const result = await budgetApi.getByPeriod(userId, selectedPeriod);
        setDebug(`Successfully fetched ${result.length} budgets`);
        return result;
      } catch (err) {
        setDebug(`Error: ${err.message}`);
        throw err;
      }
    },
  });
  
  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['expenseCategories'],
    queryFn: budgetApi.getCategories,
  });
  
  // Fetch spending data for each budget
  const spendingQueries = useQueries({
    queries: budgets.map(budget => ({
      queryKey: ['budgetSpending', budget.id],
      queryFn: () => budgetApi.getBudgetSpending(budget.id),
    }))
  });

  // Fetch category spending data for each budget
  const categorySpendingQueries = useQueries({
    queries: budgets.map(budget => ({
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
  
  // Add a function to handle deletion:
  const [budgetToDelete, setBudgetToDelete] = useState<number | null>(null);
  
  const confirmDelete = () => {
    if (budgetToDelete) {
      deleteBudget.mutate(budgetToDelete);
      setBudgetToDelete(null);
    }
  };
  
  const cancelDelete = () => {
    setBudgetToDelete(null);
  };
  
  // Handle budget form submit
  const handleBudgetSubmit = (formData: any) => {
    const newBudget: CreateBudgetRequest = {
      user_id: userId,
      name: `${formData.categoryName || 'New'} Budget`,
      amount: formData.amount,
      period: formData.period.toLowerCase(), // Convert to lowercase to match DB
      start_date: new Date().toISOString(),
      categories: [
        {
          category_id: formData.categoryId,
          alert_threshold: formData.amount * 0.8 // 80% alert threshold
        }
      ]
    };
    
    setDebug(`Submitting budget: ${JSON.stringify(newBudget)}`);
    createBudget.mutate(newBudget);
  };
  
  const handleDeleteBudget = (budgetId: number) => {
    setBudgetToDelete(budgetId);
  };
  
  const periods = Object.values(PeriodEnum);

  return (
    <Layout>
      <div className="container mx-auto space-y-6">
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
            <CardTitle>Budget Overview</CardTitle>
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

        {/* Budget Tracker */}
        <Card>
          <CardHeader>
            <CardTitle>Budget Tracker</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">Loading budgets...</div>
            ) : budgets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No budgets found for this period. Create a new budget to get started.
              </div>
            ) : (
              <div className="space-y-4">
                {budgets.map((budget, index) => {
                  // Get first category for simplicity (in a real app, handle multiple categories)
                  const budgetCategory = budget.budget_categories?.[0];
                  const category = budgetCategory?.category;
                  
                  // Get actual spending from the API
                  const spendingQuery = spendingQueries[index];
                  const spent = spendingQuery.data || 0;
                  const percentage = Math.round((spent / budget.amount) * 100);
                  const remaining = budget.amount - spent;
                  
                  // Get category-specific spending
                  const categorySpendingQuery = categorySpendingQueries[index];
                  const categorySpending = categorySpendingQuery.data || [];
                  
                  // Determine status-based styling
                  const getProgressColor = () => {
                    if (percentage >= 100) return 'bg-finance-expense';
                    if (percentage >= 80) return 'bg-orange-400';
                    if (percentage >= 60) return 'bg-yellow-400';
                    return 'bg-finance-income';
                  };
                  
                  return (
                    <div 
                      key={budget.id} 
                      className={cn(
                        "p-4 rounded-lg border",
                        percentage >= 90 ? "animate-pulse" : ""
                      )}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          {category && (
                            <>
                              <div 
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: '#' + Math.floor(Math.random()*16777215).toString(16) }}
                              ></div>
                              <span className="font-medium">{category.name}</span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {budget.name}
                          </span>
                          {/* Show warning icon if budget is near limit */}
                          {percentage >= 90 && (
                            <div className="text-finance-expense" title="Budget almost exceeded">
                              <AlertTriangle className="h-4 w-4" />
                            </div>
                          )}
                          {/* Delete button is placed here */}
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
                            Budget: <span className="font-medium">{formatCurrency(budget.amount)}</span>
                          </span>
                        </div>
                        
                        <Progress 
                          value={percentage} 
                          className={cn("h-2", getProgressColor())}
                        />
                        
                        <div className="text-right text-sm text-muted-foreground">
                          Remaining: <span className="font-medium">{formatCurrency(remaining)}</span>
                        </div>
                        
                        {/* Show category breakdown if available */}
                        {categorySpending.length > 0 && (
                          <div className="mt-4">
                            <p className="text-sm font-medium mb-2">Category Breakdown:</p>
                            <div className="space-y-2">
                              {categorySpending.map(item => {
                                const catPercentage = Math.round((item.total_spent / budget.amount) * 100);
                                return (
                                  <div key={item.category_id} className="text-xs">
                                    <div className="flex justify-between mb-1">
                                      <span>{item.category_name}</span>
                                      <span>{formatCurrency(item.total_spent)} ({catPercentage}%)</span>
                                    </div>
                                    <Progress 
                                      value={catPercentage} 
                                      className="h-1" 
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Budget Form */}
        <BudgetForm 
          open={isNewBudgetOpen} 
          onOpenChange={setIsNewBudgetOpen} 
          onSubmit={handleBudgetSubmit} 
        />
        
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
        
        {/* Debug Information */}
        <div>
          <h2>Debug Information</h2>
          <p>{debug}</p>
        </div>
      </div>
    </Layout>
  );
};

export default BudgetPage;