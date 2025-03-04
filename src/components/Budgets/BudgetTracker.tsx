import React from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { budgets, categories, getBudgetStatus } from '@/lib/mockData';
import { Button } from "@/components/ui/button";
import { Plus, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';

const BudgetTracker = () => {
  return (
    <Card className="animate-fade-up animate-delay-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Monthly Budgets</CardTitle>
            <CardDescription>Track your spending against budget goals</CardDescription>
          </div>
          <Button size="sm" className="gap-1">
            <Plus className="h-4 w-4" /> New Budget
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {budgets.map((budget) => {
            const category = categories.find(c => c.name === budget.category?.name);
            const percentage = Math.round((budget.spent / budget.amount) * 100);
            const status = getBudgetStatus(budget);
            const remaining = budget.amount - budget.spent;
            
            // Determine status-based styling
            const getProgressColor = () => {
              switch (status) {
                case 'danger': return 'bg-finance-expense';
                case 'warning': return 'bg-orange-400';
                case 'caution': return 'bg-yellow-400';
                default: return 'bg-finance-income';
              }
            };
            
            const getBgColor = () => {
              switch (status) {
                case 'danger': return 'bg-finance-budget-danger';
                case 'warning': return 'bg-finance-budget-warning';
                case 'caution': return 'bg-finance-budget-warning';
                default: return 'bg-finance-budget-safe';
              }
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
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: category?.color }}
                    ></div>
                    <h4 className="font-medium">{budget.category?.name}</h4>
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
                
                <div className="mb-2 grid grid-cols-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Spent</p>
                    <p className="font-medium">{formatCurrency(budget.spent)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Budget</p>
                    <p className="font-medium">{formatCurrency(budget.amount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Remaining</p>
                    <p className={cn(
                      "font-medium",
                      remaining >= 0 ? "text-finance-income" : "text-finance-expense"
                    )}>
                      {formatCurrency(Math.abs(remaining))}
                    </p>
                  </div>
                </div>
                
                <div className="w-full">
                  <div className="flex justify-between items-center mb-1">
                    <div className={cn(
                      "text-xs font-medium",
                      percentage >= 100 ? "text-finance-expense" : "text-muted-foreground"
                    )}>
                      {percentage}%
                    </div>
                  </div>
                  <Progress 
                    value={percentage > 100 ? 100 : percentage} 
                    className={cn("h-2", getBgColor())}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default BudgetTracker;
