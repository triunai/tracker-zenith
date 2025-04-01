import React, { useState, useCallback } from 'react';
import { useQuery, useQueries } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/UI/card";
import { Progress } from "@/components/UI/progress";
import { Button } from '@/components/UI/button';
import { Plus, AlertTriangle, Trash } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';
import BudgetForm from '@/components/Budgets/BudgetForm';
import { PeriodEnum } from '@/interfaces/enums/PeriodEnum';
import { budgetApi } from '@/lib/api/budgetApi';
import { useDashboard } from '@/context/DashboardContext';
import { supabase } from '@/lib/supabase/supabase';

interface BudgetTrackerProps {
  onDelete?: (budgetId: number) => void;
  onSubmit?: (formData: any) => void;
}

const BudgetTracker = ({ onDelete, onSubmit }: BudgetTrackerProps) => {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodEnum>(PeriodEnum.MONTHLY);
  const [isNewBudgetOpen, setIsNewBudgetOpen] = useState(false);
  const { dateFilter } = useDashboard();

  // Mock user ID - you'd get this from auth context in a real app
  const userId = "11111111-1111-1111-1111-111111111111";
  
  // Get date range based on the filter
  const getDateRangeForFilter = useCallback(() => {
    let startDate, endDate;
    
    switch (dateFilter.type) {
      case 'month': {
        const year = dateFilter.year;
        const month = dateFilter.month || 0;
        startDate = new Date(year, month, 1);
        endDate = new Date(year, month + 1, 0);
        break;
      }
      case 'quarter': {
        const year = dateFilter.year;
        const quarter = dateFilter.quarter || 1;
        const startMonth = (quarter - 1) * 3;
        startDate = new Date(year, startMonth, 1);
        endDate = new Date(year, startMonth + 3, 0);
        break;
      }
      case 'year': {
        const year = dateFilter.year;
        startDate = new Date(year, 0, 1);
        endDate = new Date(year, 11, 31);
        break;
      }
      case 'custom': {
        if (dateFilter.customRange) {
          startDate = dateFilter.customRange.startDate;
          endDate = dateFilter.customRange.endDate;
        } else {
          // Default to current month if no custom range
          const now = new Date();
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        }
        break;
      }
      default: {
        // Default to current month
        const now = new Date();
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      }
    }
    
    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    };
  }, [dateFilter]);
  
  // Fetch budgets for the selected period
  const { data: budgets = [], isLoading, error } = useQuery({
    queryKey: ['budgets', selectedPeriod],
    queryFn: () => budgetApi.getByPeriod(userId, selectedPeriod),
  });
  
  // Fetch spending data for each budget with date filter
  const spendingQueries = useQueries({
    queries: budgets.map(budget => {
      const { startDate, endDate } = getDateRangeForFilter();
      return {
        queryKey: ['budgetSpending', budget.id, startDate, endDate],
        queryFn: async () => {
          const { data, error } = await supabase.rpc('calculate_budget_spending_by_date', {
            budget_id: budget.id,
            p_start_date: startDate,
            p_end_date: endDate
          });
          
          if (error) throw error;
          return data;
        }
      };
    })
  });

  // Fetch category spending data for each budget with date filter
  const categorySpendingQueries = useQueries({
    queries: budgets.map(budget => {
      const { startDate, endDate } = getDateRangeForFilter();
      return {
        queryKey: ['budgetCategorySpending', budget.id, startDate, endDate],
        queryFn: async () => {
          const { data, error } = await supabase.rpc('get_budget_category_spending_by_date', {
            budget_id: budget.id,
            p_start_date: startDate,
            p_end_date: endDate
          });
          
          if (error) throw error;
          return data;
        }
      };
    })
  });

  // Period selection buttons
  const periods = Object.values(PeriodEnum);

  // Handle form submission if onSubmit is not provided
  const handleFormSubmit = (formData: any) => {
    if (onSubmit) {
      onSubmit(formData);
    } else {
      console.log('New budget created:', formData);
      setIsNewBudgetOpen(false);
    }
  };

  // Handle budget deletion if onDelete is not provided
  const handleDeleteBudget = (budgetId: number) => {
    if (onDelete) {
      onDelete(budgetId);
    } else {
      console.log('Delete budget:', budgetId);
    }
  };

  return (
    <Card className="animate-fade-up animate-delay-200">
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Budget Tracker</CardTitle>
            <CardDescription>Track your spending against budget goals</CardDescription>
          </div>
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
            <Button 
              size="sm" 
              className="gap-1 ml-2"
              onClick={() => setIsNewBudgetOpen(true)}
            >
              <Plus className="h-4 w-4" /> New Budget
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">Loading budgets...</div>
        ) : error ? (
          <div className="text-center py-6 text-destructive">
            Error loading budgets. Please try again.
          </div>
        ) : budgets.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            No budgets found for {selectedPeriod.toLowerCase()} period.
            <div className="mt-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsNewBudgetOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create your first budget
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {budgets.map((budget, index) => {
              // Get first category for simplicity
              const budgetCategory = budget.budget_categories?.[0];
              const category = budgetCategory?.category;
              
              // Get actual spending from the API
              const spendingQuery = spendingQueries[index];
              const spent = Number(spendingQuery.data || 0);
              const percentage = Math.round((spent / Number(budget.amount)) * 100);
              const remaining = Number(budget.amount) - spent;
              
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
                      {/* Delete button */}
                      {onDelete && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDeleteBudget(budget.id)}
                        >
                          <span className="sr-only">Delete</span>
                          <Trash className="h-4 w-4" />
                        </Button>
                      )}
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
                            const catPercentage = Math.round((Number(item.total_spent) / Number(budget.amount)) * 100);
                            return (
                              <div key={item.category_id} className="text-xs">
                                <div className="flex justify-between mb-1">
                                  <span>{item.category_name}</span>
                                  <span>{formatCurrency(Number(item.total_spent))} ({catPercentage}%)</span>
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

      {/* Budget Form Modal */}
      <BudgetForm 
        open={isNewBudgetOpen} 
        onOpenChange={setIsNewBudgetOpen}
        onSubmit={handleFormSubmit}
      />
    </Card>
  );
};

export default BudgetTracker;
