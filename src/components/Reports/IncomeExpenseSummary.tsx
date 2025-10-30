import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import StatCard from '@/components/ui/StatCard';
import { DateRange } from 'react-day-picker';

interface IncomeExpenseSummaryProps {
  dateRange: DateRange;
}

export const IncomeExpenseSummary: React.FC<IncomeExpenseSummaryProps> = ({ dateRange }) => {
  // Placeholder data - in a real app, this would come from an API
  const summaryData = {
    totalIncome: 12500,
    totalExpenses: 8750,
    netIncome: 3750,
    incomeByMonth: [
      { month: 'Jan', amount: 4200 },
      { month: 'Feb', amount: 3800 },
      { month: 'Mar', amount: 4500 },
    ],
    expensesByMonth: [
      { month: 'Jan', amount: 3100 },
      { month: 'Feb', amount: 2800 },
      { month: 'Mar', amount: 2850 },
    ],
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Total Income"
          value={`$${summaryData.totalIncome.toLocaleString()}`}
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Total Expenses"
          value={`$${summaryData.totalExpenses.toLocaleString()}`}
          trend={{ value: 5, isPositive: false }}
        />
        <StatCard
          title="Net Income"
          value={`$${summaryData.netIncome.toLocaleString()}`}
          trend={{ value: 8, isPositive: true }}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-purple">
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-4">Income vs Expenses</h3>
            <div className="h-80 flex items-center justify-center bg-muted/20 rounded-md">
              <p className="text-muted-foreground">Income vs Expenses Chart Placeholder</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-purple">
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-4">Monthly Breakdown</h3>
            <div className="h-80 flex items-center justify-center bg-muted/20 rounded-md">
              <p className="text-muted-foreground">Monthly Breakdown Chart Placeholder</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-purple">
        <CardContent className="pt-6">
          <h3 className="text-lg font-medium mb-4">Cash Flow Timeline</h3>
          <div className="h-60 flex items-center justify-center bg-muted/20 rounded-md">
            <p className="text-muted-foreground">Cash Flow Timeline Chart Placeholder</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 