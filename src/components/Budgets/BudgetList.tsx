import React from 'react';
import { useQuery, useQueries } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Button } from '@/components/ui/button.tsx';
import { Edit, Trash } from 'lucide-react';
import { Progress } from "@/components/ui/progress.tsx";
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';
import { budgetApi } from '@/lib/api/budgetApi';
import { useDashboard } from '@/context/DashboardContext';
import { supabase } from '@/lib/supabase/supabase';
import { Budget } from '@/interfaces/budget-interface';
import { PeriodEnum } from '@/interfaces/enums/PeriodEnum';

interface BudgetListProps {
  onEditBudget: (budget: Budget) => void;
  onDeleteBudget: (budgetId: number) => void;
}

const BudgetList: React.FC<BudgetListProps> = ({ onEditBudget, onDeleteBudget }) => {
  const { userId, startDate, endDate } = useDashboard();

  // Fetch ALL budgets
  const { data: budgetsData = [], isLoading, error } = useQuery({
    queryKey: ['budgets', userId],
    queryFn: async () => {
      if (!userId) return [];
      return await budgetApi.getAllByUser(userId);
    },
    enabled: !!userId,
  });

  // Sort budgets by period
  const sortedBudgets = React.useMemo(() => {
    if (!budgetsData) return [];
    const periodOrder = [PeriodEnum.DAILY, PeriodEnum.WEEKLY, PeriodEnum.MONTHLY, PeriodEnum.QUARTERLY, PeriodEnum.YEARLY];
    return [...budgetsData].sort((a, b) => {
      const periodAIndex = periodOrder.indexOf(a.period);
      const periodBIndex = periodOrder.indexOf(b.period);
      if (periodAIndex !== periodBIndex) {
        return periodAIndex - periodBIndex;
      }
      return a.name.localeCompare(b.name);
    });
  }, [budgetsData]);

  // Fetch spending data using the same successful pattern as BudgetTracker
  const spendingQueries = useQueries({
    queries: sortedBudgets.map(budget => ({
      queryKey: ['budgetSpending', budget.id, startDate, endDate],
      queryFn: async () => {
        const { data, error } = await supabase.rpc('calculate_budget_spending_by_date', {
          budget_id: budget.id,
          p_start_date: startDate,
          p_end_date: endDate
        });
        if (error) throw new Error(error.message);
        return data;
      },
      enabled: !!userId && sortedBudgets.length > 0,
    }))
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Budget Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <div>Loading budgets...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Budget Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-destructive">
            <div>Error loading budgets</div>
            <div className="text-sm mt-2">{error.message}</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (sortedBudgets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Budget Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No budgets found. Create a new budget to get started.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-purple">
      <CardHeader>
        <CardTitle>Budget Management</CardTitle>
        <p className="text-sm text-muted-foreground">
          Complete overview of all budgets with management controls
        </p>
      </CardHeader>
      <CardContent>
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
                  // Get first category for display
                  const budgetCategory = budget.budget_categories?.[0];
                  const category = budgetCategory?.category;
                  
                  // Get actual spending - using same logic as BudgetTracker
                  const spendingQuery = spendingQueries[index];
                  const spent = Number(spendingQuery?.data || 0);
                  const budgetAmount = Number(budget.amount);
                  const percentage = budgetAmount > 0 ? Math.round((spent / budgetAmount) * 100) : 0;
                  const remaining = budgetAmount - spent;
                  
                  // Determine status-based styling - matching BudgetTracker logic
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
                      <td className="p-4 text-right">{formatCurrency(budgetAmount)}</td>
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
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                            onClick={() => onEditBudget(budget)}
                          >
                            <span className="sr-only">Edit</span>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => onDeleteBudget(budget.id)}
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
            
            // Get actual spending - using same logic as BudgetTracker
            const spendingQuery = spendingQueries[index];
            const spent = Number(spendingQuery?.data || 0);
            const budgetAmount = Number(budget.amount);
            const percentage = budgetAmount > 0 ? Math.round((spent / budgetAmount) * 100) : 0;
            const remaining = budgetAmount - spent;
            
            // Determine status-based styling
            const getProgressColor = () => {
              if (percentage >= 100) return 'bg-finance-expense';
              if (percentage >= 80) return 'bg-orange-400';
              if (percentage >= 60) return 'bg-yellow-400';
              return 'bg-finance-income';
            };

            return (
              <Card key={budget.id} className="shadow-purple-sm hover:shadow-purple transition-shadow duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: '#' + Math.floor(Math.random()*16777215).toString(16) }}
                    />
                    {category?.name || budget.name}
                  </CardTitle>
                  <span className="text-xs text-muted-foreground capitalize border border-muted-foreground/20 px-2 py-1 rounded">
                    {budget.period.toLowerCase()}
                  </span>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold">{formatCurrency(budgetAmount)}</div>
                  <div className="text-xs text-muted-foreground">
                    Spent: <span className="font-medium text-destructive">{formatCurrency(spent)}</span> ({percentage}%)
                  </div>
                  <Progress value={percentage} className={cn("h-2 mt-2", getProgressColor())} />
                  <div className="text-xs text-muted-foreground mt-1">
                    Remaining: {formatCurrency(remaining)}
                  </div>
                  <div className="flex justify-end gap-1 mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                      onClick={() => onEditBudget(budget)}
                    >
                      <span className="sr-only">Edit</span>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => onDeleteBudget(budget.id)}
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
      </CardContent>
    </Card>
  );
};

export default BudgetList; 