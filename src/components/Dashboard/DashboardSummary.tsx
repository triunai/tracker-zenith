import React, { useState, useEffect } from 'react';
import { 
  TrendingDown, 
  TrendingUp, 
  Wallet, 
  CreditCard, 
  ArrowUpRight, 
  LoaderCircle
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import StatCard from '@/components/UI/StatCard';
import { Button } from '@/components/UI/button';
import { cn } from '@/lib/utils';
import { expenseApi } from '@/lib/api/expenseApi';
import { useToast } from '@/components/UI/use-toast';
import TransactionForm from '@/components/Transactions/TransactionForm';

// Placeholder until we implement proper auth
const MOCK_USER_ID = "11111111-1111-1111-1111-111111111111";

const DashboardSummary = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState(0);
  const [income, setIncome] = useState(0);
  const [expenses, setExpenses] = useState(0);
  const { toast } = useToast();
  
  // Get current month for display
  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
  
  // Calculate date range for current month
  const getCurrentMonthDateRange = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      startDate: firstDay.toISOString(),
      endDate: lastDay.toISOString()
    };
  };
  
  useEffect(() => {
    const fetchSummaryData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const { startDate, endDate } = getCurrentMonthDateRange();
        
        // TODO: Replace this with actual income API once available
        // For now, we'll use a fixed income value
        const incomeValue = 3500;
        setIncome(incomeValue);
        
        // Instead of using RPC function, fetch expenses and calculate the total
        const options = {
          startDate: startDate,
          endDate: endDate,
        };
        
        // Fetch all expenses for the current month
        const expenseData = await expenseApi.getAllByUser(MOCK_USER_ID, options);
        
        // Calculate the total expense amount manually
        const totalExpenseAmount = expenseData.reduce((total, expense) => {
          const expenseItemsTotal = expense.expense_items?.reduce((itemTotal, item) => {
            return itemTotal + Number(item.amount);
          }, 0) || 0;
          
          return total + expenseItemsTotal;
        }, 0);
        
        setExpenses(totalExpenseAmount);
        
        // Calculate balance
        setBalance(incomeValue - totalExpenseAmount);
      } catch (err) {
        console.error('Error fetching summary data:', err);
        setError('Failed to load financial summary data');
        toast({
          title: 'Error',
          description: 'Failed to load dashboard summary',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSummaryData();
  }, [toast]);
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground mt-1">
            Your financial overview for {currentMonth}
          </p>
        </div>
        <TransactionForm />
      </div>
      
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
            onClick={() => window.location.reload()}
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
      )}
      
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium">Quick Actions</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Button variant="outline" className="h-auto py-4 flex flex-col items-center justify-center gap-2" onClick={() => document.querySelector<HTMLButtonElement>('[data-transaction-form-trigger]')?.click()}>
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <CreditCard size={20} />
            </div>
            <span className="text-sm">New Transaction</span>
          </Button>
          
          <Button variant="outline" className="h-auto py-4 flex flex-col items-center justify-center gap-2" onClick={() => window.location.href = '/budgets'}>
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Wallet size={20} />
            </div>
            <span className="text-sm">Set Budget</span>
          </Button>
          
          <Button variant="outline" className="h-auto py-4 flex flex-col items-center justify-center gap-2" onClick={() => window.location.href = '/reports'}>
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <TrendingUp size={20} />
            </div>
            <span className="text-sm">View Reports</span>
          </Button>
          
          <Button variant="outline" className="h-auto py-4 flex flex-col items-center justify-center gap-2" onClick={() => console.log('Export data clicked')}>
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
