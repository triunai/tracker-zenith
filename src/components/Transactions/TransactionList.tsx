
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getRecentExpenses, formatCurrency } from '@/lib/utils';
import TransactionForm from './TransactionForm';
import { CalendarIcon } from 'lucide-react';

const TransactionList = () => {
  const recentTransactions = getRecentExpenses(5);

  return (
    <Card className="col-span-3">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Recent expense transactions</CardDescription>
        </div>
        <TransactionForm />
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {recentTransactions.map(transaction => {
            const firstItem = transaction.expenseItems[0];
            
            return (
              <div key={transaction.id} className="flex items-center">
                <div className="mr-4 rounded-full p-2" 
                     style={{ backgroundColor: firstItem?.category?.color + '30' }}>
                  <div className="rounded-full p-2" 
                       style={{ backgroundColor: firstItem?.category?.color }}>
                  </div>
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {firstItem?.description}
                  </p>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <CalendarIcon className="mr-1 h-3 w-3" />
                    <span>{transaction.date}</span>
                  </div>
                </div>
                <div className="font-medium">
                  {formatCurrency(transaction.totalAmount)}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default TransactionList;
