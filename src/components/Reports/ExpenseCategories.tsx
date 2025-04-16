import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { DateRange } from 'react-day-picker';

interface ExpenseCategoriesProps {
  dateRange: DateRange;
}

export const ExpenseCategories: React.FC<ExpenseCategoriesProps> = ({ dateRange }) => {
  // Placeholder data - in a real app, this would come from an API
  const categoryData = [
    { name: 'Housing', amount: 2500, percentage: 28.6, color: 'bg-blue-500' },
    { name: 'Food', amount: 1200, percentage: 13.7, color: 'bg-green-500' },
    { name: 'Transportation', amount: 800, percentage: 9.1, color: 'bg-yellow-500' },
    { name: 'Entertainment', amount: 600, percentage: 6.9, color: 'bg-purple-500' },
    { name: 'Utilities', amount: 450, percentage: 5.1, color: 'bg-red-500' },
    { name: 'Healthcare', amount: 350, percentage: 4.0, color: 'bg-indigo-500' },
    { name: 'Shopping', amount: 1200, percentage: 13.7, color: 'bg-pink-500' },
    { name: 'Other', amount: 1650, percentage: 18.9, color: 'bg-gray-500' },
  ];

  const totalExpenses = categoryData.reduce((sum, category) => sum + category.amount, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-4">Expense Distribution</h3>
            <div className="h-80 flex items-center justify-center bg-muted/20 rounded-md">
              <p className="text-muted-foreground">Pie Chart Placeholder</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-4">Category Breakdown</h3>
            <div className="space-y-4">
              {categoryData.map((category) => (
                <div key={category.name} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{category.name}</span>
                    <span className="text-muted-foreground">
                      ${category.amount.toLocaleString()} ({category.percentage}%)
                    </span>
                  </div>
                  <Progress value={category.percentage} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-medium mb-4">Category Trends</h3>
          <div className="h-60 flex items-center justify-center bg-muted/20 rounded-md">
            <p className="text-muted-foreground">Category Trends Chart Placeholder</p>
          </div>
        </CardContent>
      </Card>

      <div className="text-sm text-muted-foreground text-right">
        Total Expenses: ${totalExpenses.toLocaleString()}
      </div>
    </div>
  );
}; 