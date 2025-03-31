// src/pages/budgets/index-api.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from '@/components/Layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/card';
import { Button } from '@/components/UI/button';
import { Plus, AlertTriangle } from 'lucide-react';
import { Progress } from '@/components/UI/progress';
import { PeriodEnum } from '@/interfaces/enums/PeriodEnum';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';
import { budgetApi } from '@/lib/api/budgetApi';
import { CreateBudgetRequest } from '@/interfaces/budget-interface';
import { useToast } from '@/components/UI/use-toast';

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
    }
  });
  
  // Handle budget form submit
  const handleBudgetSubmit = (formData: any) => {
    const newBudget: CreateBudgetRequest = {
      user_id: userId,
      name: `${formData.categoryName} Budget`,
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
    
    createBudget.mutate(newBudget);
  };
  
  // Handle budget delete
  const handleDeleteBudget = (budgetId: number) => {
    if (confirm("Are you sure you want to delete this budget?")) {
      deleteBudget.mutate(budgetId);
    }
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
                {budgets.map((budget) => {
                  // Get first category for simplicity (in a real app, handle multiple categories)
                  const budgetCategory = budget.budget_categories?.[0];
                  const category = budgetCategory?.category;
                  
                  // Calculate spending - in a real app, you'd fetch this from an API
                  // For now, we'll use a random value between 0 and budget amount
                  const spent = Math.random() * budget.amount;
                  const percentage = Math.round((spent / budget.amount) * 100);
                  const remaining = budget.amount - spent;
                  
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
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={() => handleDeleteBudget(budget.id)}
                          >
                            <span className="sr-only">Delete</span>
                            <AlertTriangle className="h-4 w-4" />
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
                          className="h-2" 
                          indicatorClassName={getProgressColor()}
                        />
                        
                        <div className="flex justify-between text-sm">
                          <span>
                            {percentage}% used
                          </span>
                          <span>
                            {remaining > 0 
                              ? `${formatCurrency(remaining)} remaining` 
                              : `${formatCurrency(Math.abs(remaining))} over budget`}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Budget Form */}
        {/* You'll need to adapt your BudgetForm component to work with the API */}
        {/* <BudgetForm open={isNewBudgetOpen} onOpenChange={setIsNewBudgetOpen} onSubmit={handleBudgetSubmit} /> */}
        
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