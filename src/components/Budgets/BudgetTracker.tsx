import React, { useState, useCallback } from 'react';
import { useQuery, useQueries } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card.tsx";
import { Progress } from "@/components/ui/progress.tsx";
import { Button } from '@/components/ui/button.tsx';
import { Plus, AlertTriangle, Edit, Trash } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';
import { PeriodEnum } from '@/interfaces/enums/PeriodEnum';
import { budgetApi } from '@/lib/api/budgetApi';
import { useDashboard } from '@/context/DashboardContext';
import { supabase } from '@/lib/supabase/supabase';
import { Budget } from '@/interfaces/budget-interface';

interface BudgetTrackerProps {
  onEditBudget?: (budget: Budget) => void;
  onDeleteBudget?: (budgetId: number) => void;
}

const BudgetTracker: React.FC<BudgetTrackerProps> = ({ 
  onEditBudget, 
  onDeleteBudget 
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodEnum>(PeriodEnum.MONTHLY);
  const { userId, startDate, endDate } = useDashboard();

  const { data: budgets = [], isLoading, error: budgetsError } = useQuery({
    queryKey: ['budgets', userId, selectedPeriod],
    queryFn: () => budgetApi.getByPeriod(userId, selectedPeriod),
    enabled: !!userId,
  });

  const handleNewBudgetClick = () => {
    // This will require the parent component (`Index.tsx`) to handle the modal state
    // We can dispatch a custom event for this.
    document.dispatchEvent(new CustomEvent('openBudgetForm', { 
      detail: { source: 'BudgetTracker' } 
    }));
  };

  const spendingQueries = useQueries({
    queries: budgets.map(budget => {
      return {
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
        enabled: !!userId && budgets.length > 0,
      };
    })
  });

  const isSpendingLoading = spendingQueries.some(q => q.isLoading);

  return (
    <Card className="h-full flex flex-col shadow-purple">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle>Budget Tracker</CardTitle>
            <CardDescription>Monitor your spending against your budgets.</CardDescription>
          </div>
          <Button onClick={handleNewBudgetClick} size="sm">
            <Plus className="mr-2 h-4 w-4" /> New Budget
          </Button>
        </div>
        <div className="flex flex-wrap justify-center gap-2 pt-4">
          {Object.values(PeriodEnum).map((p) => (
            <Button
              key={p}
              variant={selectedPeriod === p ? 'default' : 'outline'}
              onClick={() => setSelectedPeriod(p)}
              className="capitalize text-xs h-8"
            >
              {p.toLowerCase()}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="flex-grow overflow-y-auto">
        {isLoading && <p className="text-center text-muted-foreground">Loading budgets...</p>}
        {budgetsError && (
          <div className="text-destructive text-center">
            <AlertTriangle className="mx-auto mb-2" />
            <p>Error loading budgets.</p>
          </div>
        )}
        {!isLoading && !budgetsError && budgets.length === 0 && (
          <div className="text-center text-muted-foreground pt-8">
            <p>No budgets found for the {selectedPeriod.toLowerCase()} period.</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={handleNewBudgetClick}>
                <Plus className="h-4 w-4 mr-2" />
                Create a Budget
            </Button>
          </div>
        )}
        {!isLoading && !budgetsError && budgets.length > 0 && (
          <div className="space-y-4">
            {isSpendingLoading && <p className="text-center text-muted-foreground">Calculating spending...</p>}
            {budgets.map((budget, index) => {
              const spendingQuery = spendingQueries[index];
              const spent = Number(spendingQuery.data || 0);
              const budgetAmount = Number(budget.amount);
              const percentage = budgetAmount > 0 ? Math.round((spent / budgetAmount) * 100) : 0;
              const remaining = budgetAmount - spent;

              // Get first category for display
              const budgetCategory = budget.budget_categories?.[0];
              const category = budgetCategory?.category;

              // Determine progress color based on percentage
              const getProgressColor = () => {
                if (percentage >= 100) return 'bg-finance-expense';
                if (percentage >= 80) return 'bg-orange-400';
                if (percentage >= 60) return 'bg-yellow-400';
                return 'bg-finance-income';
              };

              return (
                <Card key={budget.id} className="relative shadow-purple-sm hover:shadow-purple transition-shadow duration-200">
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
                      {/* Edit Button */}
                      {onEditBudget && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                          onClick={() => onEditBudget(budget)}
                        >
                          <span className="sr-only">Edit</span>
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {/* Delete Button */}
                      {onDeleteBudget && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => onDeleteBudget(budget.id)}
                        >
                          <span className="sr-only">Delete</span>
                          <Trash className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BudgetTracker;
