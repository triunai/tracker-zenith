import React, { useEffect } from 'react';
import { 
  TrendingDown, 
  TrendingUp, 
  Wallet, 
  CreditCard, 
  ArrowUpRight, 
  LoaderCircle,
  PlusCircle,
  MinusCircle
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import StatCard from '@/components/ui/StatCard.tsx';
import { Button } from '@/components/ui/button.tsx';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast.ts';
import TransactionForm from '@/components/Transactions/TransactionForm';
import { useDashboard } from '@/context/DashboardContext';
import DateFilter from './DateFilter';

// Helper function to format trend values
const formatTrendValue = (value: number | null): { value: number, isPositive: boolean } => {
  // Handle null, NaN, or undefined
  if (value === null || isNaN(value) || value === undefined) {
    // Return a default of "0% change" (i.e., same as previous period)
    return { value: 0, isPositive: true };
  }
  
  const absValue = Math.abs(Math.round(value));
  // For expenses, a negative percentage is positive (spending less)
  // For income, a positive percentage is positive (earning more)
  return { value: absValue, isPositive: value >= 0 };
};

const DashboardSummary = () => {
  const { 
    isLoading, 
    error, 
    balance, 
    income, 
    expenses, 
    incomeTrend, 
    expenseTrend,
    dateFilter, 
    dateRangeText, 
    userId,
    refreshData
  } = useDashboard();
  
  const { toast } = useToast();
  
  // Log dashboard state on mount and when any data changes
  useEffect(() => {
    console.log('🔍 [DashboardSummary] State:', {
      isLoading,
      error,
      balance,
      income,
      expenses,
      incomeTrend,
      expenseTrend,
      dateFilter,
      dateRangeText,
      userId
    });
  }, [isLoading, error, balance, income, expenses, incomeTrend, expenseTrend, dateFilter, dateRangeText, userId]);
  
  // Handle manual refresh
  const handleRefresh = () => {
    console.log('🔍 [DashboardSummary] Manual refresh requested');
    refreshData();
    toast({
      title: "Refreshing data",
      description: "Fetching the latest financial data...",
    });
  };
  
  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />
          <span>Loading financial summary...</span>
        </div>
      ) : error ? (
        <div className="text-center py-8 text-destructive">
          <p>{error}</p>
          <Button 
            variant="outline" 
            className="mt-2"
            onClick={handleRefresh}
          >
            Try Again
          </Button>
        </div>
      ) : (
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
            trend={formatTrendValue(incomeTrend)}
            valueClassName="text-finance-income"
            className="animate-delay-200"
          />
          
          <StatCard
            title="Total Expenses"
            value={formatCurrency(expenses)}
            icon={<TrendingDown className="h-5 w-5" />}
            trend={formatTrendValue(expenseTrend)}
            valueClassName="text-finance-expense"
            className="animate-delay-300"
          />
        </div>
      )}
      
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium">Quick Actions</h3>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-4">
          <Button 
            variant="outline" 
            className="h-auto py-3 sm:py-4 flex flex-col items-center justify-center gap-1 sm:gap-2 shadow-purple-sm hover:shadow-purple" 
            onClick={() => document.querySelector<HTMLButtonElement>('[data-transaction-form-trigger]')?.click()}
          >
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <CreditCard size={16} className="sm:w-5 sm:h-5" />
            </div>
            <span className="text-xs sm:text-sm font-medium">New Transaction</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="h-auto py-3 sm:py-4 flex flex-col items-center justify-center gap-1 sm:gap-2 shadow-purple-sm hover:shadow-purple" 
            onClick={() => {
              // Create and dispatch custom event to open the budget form
              const event = new CustomEvent('openBudgetForm', { 
                bubbles: true, 
                detail: { source: 'DashboardQuickAction' } 
              });
              document.dispatchEvent(event);
            }}
          >
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Wallet size={16} className="sm:w-5 sm:h-5" />
            </div>
            <span className="text-xs sm:text-sm font-medium">Set Budget</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="h-auto py-3 sm:py-4 flex flex-col items-center justify-center gap-1 sm:gap-2 shadow-purple-sm hover:shadow-purple" 
            onClick={() => window.location.href = '/reports'}
          >
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <TrendingUp size={16} className="sm:w-5 sm:h-5" />
            </div>
            <span className="text-xs sm:text-sm font-medium">View Reports</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="h-auto py-3 sm:py-4 flex flex-col items-center justify-center gap-1 sm:gap-2 shadow-purple-sm hover:shadow-purple" 
            onClick={() => console.log('Export data clicked')}
          >
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <ArrowUpRight size={16} className="sm:w-5 sm:h-5" />
            </div>
            <span className="text-xs sm:text-sm font-medium">Export Data</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DashboardSummary;
