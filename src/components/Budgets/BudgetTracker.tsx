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
import { Plus, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';
import { PeriodEnum } from '@/interfaces/enums/PeriodEnum';
import { budgetApi } from '@/lib/api/budgetApi';
import { useDashboard } from '@/context/DashboardContext';
import { supabase } from '@/lib/supabase/supabase';
import { Budget } from '@/interfaces/budget-interface';

const BudgetTracker = () => {
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
    document.dispatchEvent(new CustomEvent('openBudgetForm'));
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
    <Card className="h-full flex flex-col">
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
          <div className="space-y-6">
            {isSpendingLoading && <p className="text-center text-muted-foreground">Calculating spending...</p>}
            {budgets.map((budget, index) => {
              const spendingQuery = spendingQueries[index];
              const spent = Number(spendingQuery.data || 0);
              const budgetAmount = Number(budget.amount);
              const percentage = budgetAmount > 0 ? Math.round((spent / budgetAmount) * 100) : 0;
              const remaining = budgetAmount - spent;

              return (
                <div key={budget.id}>
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="font-medium truncate pr-2" title={budget.name}>{budget.name}</span>
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      {formatCurrency(spent)} / {formatCurrency(budgetAmount)}
                    </span>
                  </div>
                  <Progress value={percentage} />
                  <div className="text-right text-xs text-muted-foreground mt-1">
                    {formatCurrency(remaining)} remaining
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BudgetTracker;
