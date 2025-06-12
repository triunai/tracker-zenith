import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
import { Budget } from '@/interfaces/budget-interface';

interface BudgetTrackerProps {
  className?: string;
}

const BudgetTracker = ({ className }: BudgetTrackerProps) => {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodEnum>(PeriodEnum.MONTHLY);
  const { userId } = useDashboard();

  const { data: budgets = [], isLoading, error } = useQuery({
    queryKey: ['budgets', selectedPeriod, userId],
    queryFn: () => budgetApi.getByPeriod(userId, selectedPeriod),
    enabled: !!userId,
  });

  return (
    <Card className={cn("h-full flex flex-col", className)}>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Budget Tracker</CardTitle>
            <CardDescription>Monitor your spending against your budgets.</CardDescription>
          </div>
          <Button size="sm" disabled>
            <Plus className="mr-2 h-4 w-4" /> New Budget
          </Button>
        </div>
        <div className="flex justify-center space-x-2 pt-4">
          {Object.values(PeriodEnum).map((p) => (
            <Button
              key={p}
              variant={selectedPeriod === p ? 'default' : 'outline'}
              onClick={() => setSelectedPeriod(p)}
              className="capitalize"
            >
              {p.toLowerCase()}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        {isLoading && <p>Loading budgets...</p>}
        {error && (
          <div className="text-destructive text-center">
            <AlertTriangle className="mx-auto mb-2" />
            <p>Error loading budgets.</p>
          </div>
        )}
        {!isLoading && !error && budgets.length === 0 && (
          <div className="text-center text-muted-foreground pt-8">
            <p>No budgets found for the {selectedPeriod.toLowerCase()} period.</p>
          </div>
        )}
        {!isLoading && !error && budgets.length > 0 && (
          <div className="space-y-4">
            {budgets.map((budget: Budget) => {
              const amount = Number(budget.amount);
              // Placeholder for spending and progress
              const spending = 0; // Replace with actual spending data later
              const progress = 0;

              return (
                <div key={budget.id} className="flex flex-col">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium">{budget.name}</span>
                    <span className='font-semibold'>
                      {formatCurrency(spending)} / {formatCurrency(amount)}
                    </span>
                  </div>
                  <Progress value={progress} />
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
