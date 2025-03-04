import React from 'react';
import { 
  DollarSign, 
  TrendingDown, 
  TrendingUp, 
  Wallet, 
  CreditCard, 
  ArrowUpRight
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import StatCard from '@/components/UI/StatCard';
import { getBalance, getExpenseTotal, getIncomeTotal } from '@/lib/mockData';
import { Button } from "@/components/ui/button";
import { cn } from '@/lib/utils';

const DashboardSummary = () => {
  // Get data from our mock
  const balance = getBalance();
  const income = getIncomeTotal();
  const expenses = getExpenseTotal();
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground mt-1">
            Your financial overview for May 2023
          </p>
        </div>
        <Button className="gap-1">
          <CreditCard size={16} /> Add Transaction
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Total Balance"
          value={formatCurrency(balance)}
          icon={<Wallet className="h-5 w-5" />}
          valueClassName={cn(
            balance >= 0 ? "text-finance-income" : "text-finance-expense"
          )}
          className="animate-delay-100"
        />
        
        <StatCard
          title="Total Income"
          value={formatCurrency(income)}
          icon={<TrendingUp className="h-5 w-5" />}
          trend={{ value: 12, isPositive: true }}
          valueClassName="text-finance-income"
          className="animate-delay-200"
        />
        
        <StatCard
          title="Total Expenses"
          value={formatCurrency(expenses)}
          icon={<TrendingDown className="h-5 w-5" />}
          trend={{ value: 8, isPositive: false }}
          valueClassName="text-finance-expense"
          className="animate-delay-300"
        />
      </div>
      
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium">Quick Actions</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Button variant="outline" className="h-auto py-4 flex flex-col items-center justify-center gap-2">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <CreditCard size={20} />
            </div>
            <span className="text-sm">New Transaction</span>
          </Button>
          
          <Button variant="outline" className="h-auto py-4 flex flex-col items-center justify-center gap-2">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Wallet size={20} />
            </div>
            <span className="text-sm">Set Budget</span>
          </Button>
          
          <Button variant="outline" className="h-auto py-4 flex flex-col items-center justify-center gap-2">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <TrendingUp size={20} />
            </div>
            <span className="text-sm">View Reports</span>
          </Button>
          
          <Button variant="outline" className="h-auto py-4 flex flex-col items-center justify-center gap-2">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <ArrowUpRight size={20} />
            </div>
            <span className="text-sm">Export Data</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DashboardSummary;
