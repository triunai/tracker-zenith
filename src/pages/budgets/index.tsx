import React, { useState } from 'react';
import Layout from '@/components/Layout/Layout';
import BudgetTracker from '@/components/Budgets/BudgetTracker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/card';
import { Button } from '@/components/UI/button';
import { Plus, AlertTriangle } from 'lucide-react';
import { Progress } from '@/components/UI/progress';
import { Period, getBudgetsByPeriod, categories } from '@/lib/mockData';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';
import BudgetForm from '@/components/Budgets/BudgetForm';

const BudgetPage = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>(Period.Monthly);
  const periods = [Period.Daily, Period.Weekly, Period.Monthly, Period.Yearly];
  const budgets = getBudgetsByPeriod(selectedPeriod);
  const [isNewBudgetOpen, setIsNewBudgetOpen] = useState(false);

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
                  {period}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Budget Tracker Component */}
        <BudgetTracker />

        {/* Detailed Budget Grid */}
        <Card>
          <CardHeader>
            <CardTitle>Budget Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
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
                      </tr>
                    </thead>
                    <tbody>
                      {budgets.map((budget) => {
                        const category = categories.find(c => c.id === budget.categoryId);
                        const percentage = Math.round((budget.spent / budget.amount) * 100);
                        const remaining = budget.amount - budget.spent;
                        
                        return (
                          <tr key={budget.id} className="border-b">
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: category?.color }}
                                />
                                <span>{category?.name}</span>
                              </div>
                            </td>
                            <td className="p-4 text-right">{formatCurrency(budget.amount)}</td>
                            <td className="p-4 text-right">{formatCurrency(budget.spent)}</td>
                            <td className="p-4 text-right">
                              <span className={cn(
                                remaining >= 0 ? "text-finance-income" : "text-finance-expense"
                              )}>
                                {formatCurrency(Math.abs(remaining))}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <Progress 
                                  value={percentage > 100 ? 100 : percentage}
                                  className={cn(
                                    "h-2",
                                    percentage > 100 ? "bg-finance-budget-danger" :
                                    percentage > 80 ? "bg-finance-budget-warning" :
                                    "bg-finance-budget-safe"
                                  )}
                                />
                                <span className="text-xs w-9 text-muted-foreground">
                                  {percentage}%
                                </span>
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
                {budgets.map((budget) => {
                  const category = categories.find(c => c.id === budget.categoryId);
                  const percentage = Math.round((budget.spent / budget.amount) * 100);
                  const remaining = budget.amount - budget.spent;

                  return (
                    <div key={budget.id} className="rounded-lg border p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: category?.color }}
                          />
                          <span className="font-medium">{category?.name}</span>
                        </div>
                        {percentage >= 90 && (
                          <div className={cn(
                            "px-2 py-1 text-xs rounded-full flex items-center gap-1",
                            percentage >= 100 ? "bg-finance-budget-danger text-finance-expense" : "bg-finance-budget-warning text-orange-600"
                          )}>
                            <AlertTriangle size={12} />
                            {percentage >= 100 ? 'Exceeded' : 'Almost'}
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-2 mb-3 text-sm">
                        <div>
                          <p className="text-muted-foreground">Budget</p>
                          <p className="font-medium">{formatCurrency(budget.amount)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Spent</p>
                          <p className="font-medium">{formatCurrency(budget.spent)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Remaining</p>
                          <p className={cn(
                            "font-medium",
                            remaining >= 0 ? "text-finance-income" : "text-finance-expense"
                          )}>
                            {formatCurrency(Math.abs(remaining))}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Progress</span>
                          <span className={cn(
                            percentage >= 100 ? "text-finance-expense" : "text-muted-foreground"
                          )}>{percentage}%</span>
                        </div>
                        <Progress 
                          value={percentage > 100 ? 100 : percentage}
                          className={cn(
                            "h-2",
                            percentage > 100 ? "bg-finance-budget-danger" :
                            percentage > 80 ? "bg-finance-budget-warning" :
                            "bg-finance-budget-safe"
                          )}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {budgets.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  No budgets found for {selectedPeriod.toLowerCase()} period.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      <BudgetForm 
        open={isNewBudgetOpen} 
        onOpenChange={setIsNewBudgetOpen}
      />
    </Layout>
  );
};

export default BudgetPage; 