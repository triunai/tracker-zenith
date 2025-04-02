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
  const { dateFilter, userId } = useDashboard();

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
    
    // Format dates for PostgreSQL compatibility - set time to beginning/end of day
    const formatStartDate = (date) => {
      // Set to beginning of day (00:00:00)
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      return d.toISOString();
    };
    
    const formatEndDate = (date) => {
      // Set to end of day (23:59:59)
      const d = new Date(date);
      d.setHours(23, 59, 59, 999);
      return d.toISOString();
    };
    
    return {
      startDate: formatStartDate(startDate),
      endDate: formatEndDate(endDate)
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
          try {
            console.log(`Fetching spending data for budget ${budget.id} from ${startDate} to ${endDate}`);
            const { data, error } = await supabase.rpc('calculate_budget_spending_by_date', {
              budget_id: budget.id,
              p_start_date: startDate,
              p_end_date: endDate
            });
            
            if (error) {
              console.error(`Error fetching spending for budget ${budget.id}:`, error);
              throw error;
            }
            console.log(`Spending data for budget ${budget.id}:`, data);
            return data;
          } catch (e) {
            console.error(`Exception in spending query for budget ${budget.id}:`, e);
            return 0; // Return 0 as fallback
          }
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
          try {
            console.log(`Fetching category spending for budget ${budget.id} from ${startDate} to ${endDate}`);
            const { data, error } = await supabase.rpc('get_budget_category_spending_by_date', {
              budget_id: budget.id,
              p_start_date: startDate,
              p_end_date: endDate
            });
            
            if (error) {
              console.error(`Error fetching category spending for budget ${budget.id}:`, error);
              throw error;
            }
            console.log(`Category spending data for budget ${budget.id}:`, data);
            return data;
          } catch (e) {
            console.error(`Exception in category spending query for budget ${budget.id}:`, e);
            return []; // Return empty array as fallback
          }
        }
      };
    })
  });

  // Period selection buttons
  const periods = Object.values(PeriodEnum);

  // Handle New Budget button click (trigger parent form directly)
  const handleNewBudgetClick = () => {
    // Check if onSubmit is a function
    if (typeof onSubmit === 'function') {
      console.log('Triggering parent new budget form');
      // Signal to parent that we want to open the form
      if (typeof window !== 'undefined') {
        // Create a custom event to notify the parent
        const event = new CustomEvent('openBudgetForm', { 
          bubbles: true, 
          detail: { source: 'BudgetTracker' } 
        });
        document.dispatchEvent(event);
      }
    } else {
      // Fallback to local form if no parent handler
      console.log('Using local form (fallback)');
      setIsNewBudgetOpen(true);
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
              onClick={handleNewBudgetClick}
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
                onClick={handleNewBudgetClick}
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
        onSubmit={(data) => {
          console.log('BudgetTracker form submission:', data);
          
          // Ensure period is in correct format from PeriodEnum
          // Convert lowercase string like 'monthly' to enum value 'monthly'
          // This is just defense in case the values aren't formatted correctly 
          const formattedData = {
            ...data,
            period: data.period.toLowerCase()
          };
          
          // If we have a parent handler, use it
          if (typeof onSubmit === 'function') {
            onSubmit(formattedData);
          } else {
            // No parent handler, just log the data
            console.warn('No parent onSubmit handler, cannot create budget:', formattedData);
            alert('Budget creation is disabled in this view.');
          }
          // Close the form
          setIsNewBudgetOpen(false);
        }}
      />
    </Card>
  );
};

export default BudgetTracker;
