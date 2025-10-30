import React from 'react';
import { useQuery, useQueries } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { TrendingUp, TrendingDown, AlertTriangle, Target } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { budgetApi } from '@/lib/api/budgetApi';
import { useDashboard } from '@/context/DashboardContext';
import { supabase } from '@/lib/supabase/supabase';

const BudgetAnalytics = () => {
  const { userId, startDate, endDate } = useDashboard();

  // Fetch ALL budgets for analytics
  const { data: budgets = [], isLoading } = useQuery({
    queryKey: ['budgets', userId],
    queryFn: async () => {
      if (!userId) return [];
      return await budgetApi.getAllByUser(userId);
    },
    enabled: !!userId,
  });

  // Fetch spending data using the same successful pattern as BudgetTracker
  const spendingQueries = useQueries({
    queries: budgets.map(budget => ({
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
    }))
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Budget Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate analytics
  const totalBudgets = budgets.length;
  const totalBudgetAmount = budgets.reduce((sum, budget) => sum + Number(budget.amount), 0);
  const totalSpent = spendingQueries.reduce((sum, query) => {
    if (query.data) return sum + Number(query.data);
    return sum;
  }, 0);
  
  const overBudgetCount = spendingQueries.filter((query, index) => {
    if (query.data) {
      const spent = Number(query.data);
      const budgetAmount = Number(budgets[index]?.amount || 0);
      return spent > budgetAmount;
    }
    return false;
  }).length;

  const avgSpendingPercentage = totalBudgetAmount > 0 ? Math.round((totalSpent / totalBudgetAmount) * 100) : 0;
  const totalRemaining = totalBudgetAmount - totalSpent;
  
  // Calculate trends (this could be enhanced with historical data)
  const healthyBudgets = budgets.length - overBudgetCount;
  const healthPercentage = totalBudgets > 0 ? Math.round((healthyBudgets / totalBudgets) * 100) : 100;

  return (
    <Card className="shadow-purple">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-finance-income" />
          Budget Analytics
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          High-level insights into your budget performance
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {/* Total Budgets */}
          <div className="bg-muted/30 p-3 sm:p-4 rounded-lg border border-muted">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Active</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold">{totalBudgets}</div>
            <div className="text-xs text-muted-foreground">Budgets</div>
          </div>

          {/* Budget Health */}
          <div className="bg-muted/30 p-3 sm:p-4 rounded-lg border border-muted">
            <div className="flex items-center gap-2 mb-2">
              {healthPercentage >= 80 ? (
                <TrendingUp className="h-4 w-4 text-finance-income" />
              ) : (
                <TrendingDown className="h-4 w-4 text-finance-expense" />
              )}
              <span className="text-xs text-muted-foreground">Health</span>
            </div>
            <div className={`text-xl sm:text-2xl font-bold ${healthPercentage >= 80 ? 'text-finance-income' : 'text-finance-expense'}`}>
              {healthPercentage}%
            </div>
            <div className="text-xs text-muted-foreground">On Track</div>
          </div>

          {/* Total Allocated */}
          <div className="bg-muted/30 p-3 sm:p-4 rounded-lg border border-muted">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-4 w-4 rounded-full bg-finance-income"></div>
              <span className="text-xs text-muted-foreground">Allocated</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-finance-income break-words">{formatCurrency(totalBudgetAmount)}</div>
            <div className="text-xs text-muted-foreground">Total Budget</div>
          </div>

          {/* Remaining */}
          <div className="bg-muted/30 p-3 sm:p-4 rounded-lg border border-muted">
            <div className="flex items-center gap-2 mb-2">
              {overBudgetCount > 0 ? (
                <AlertTriangle className="h-4 w-4 text-finance-expense" />
              ) : (
                <div className="h-4 w-4 rounded-full bg-muted-foreground"></div>
              )}
              <span className="text-xs text-muted-foreground">Available</span>
            </div>
            <div className={`text-xl sm:text-2xl font-bold ${totalRemaining < 0 ? 'text-finance-expense' : ''} break-words`}>
              {formatCurrency(totalRemaining)}
            </div>
            <div className="text-xs text-muted-foreground">Remaining</div>
          </div>
        </div>

        {/* Summary insights */}
        <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-muted/20 rounded-lg">
          <h4 className="font-medium mb-2">Quick Insights</h4>
          <ul className="space-y-1.5 text-sm text-muted-foreground list-disc list-inside">
            <li>You've spent <strong className="text-finance-expense">{formatCurrency(totalSpent)}</strong> ({avgSpendingPercentage}%) of your total budget.</li>
            {overBudgetCount > 0 ? (
              <li><strong className="text-finance-expense">{overBudgetCount}</strong> budget(s) are over limit.</li>
            ) : (
              <li><strong className="text-finance-income">All budgets</strong> are within their limits.</li>
            )}
            <li>Budget health score: <strong className={healthPercentage >= 80 ? 'text-finance-income' : 'text-finance-expense'}>{healthPercentage}%</strong></li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default BudgetAnalytics; 