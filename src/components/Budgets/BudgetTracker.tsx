import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/UI/card";
import { Progress } from "@/components/UI/progress";
import { 
  budgets, 
  categories, 
  getBudgetStatus, 
  Period,
  getBudgetsByPeriod
} from '@/lib/mockData';
import { Button } from '@/components/UI/button';
import { Plus, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';
import BudgetForm from '@/components/Budgets/BudgetForm';
import { Badge } from '@/components/UI/badge';

const BudgetTracker = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>(Period.Monthly);
  const [isNewBudgetOpen, setIsNewBudgetOpen] = useState(false);

  // Period selection buttons
  const periods: Period[] = [Period.Daily, Period.Weekly, Period.Monthly, Period.Yearly];

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
                {period}
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
        <div className="space-y-4">
          {getBudgetsByPeriod(selectedPeriod).map((budget) => {
            const category = categories.find(c => c.id === budget.categoryId);
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

          {getBudgetsByPeriod(selectedPeriod).length === 0 && (
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
          )}
        </div>
      </CardContent>

      {/* Budget Form Modal */}
      <BudgetForm 
        open={isNewBudgetOpen} 
        onOpenChange={setIsNewBudgetOpen}
      />
    </Card>
  );
};

export default BudgetTracker;
