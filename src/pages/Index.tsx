import { useState, useEffect } from 'react';
import Layout from '@/components/Layout/Layout';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useDashboard } from '@/context/DashboardContext';
import DashboardSummary from '@/components/Dashboard/DashboardSummary';
import SpendingChart from '@/components/Charts/SpendingChart';
import TransactionList from '@/components/Transactions/TransactionList';
import BudgetTracker from '@/components/Budgets/BudgetTracker';
import BudgetForm from '@/components/Budgets/BudgetForm';
import { Budget } from '@/interfaces/budget-interface';
import DateFilter from '@/components/Dashboard/DateFilter';
import TransactionForm from '@/components/Transactions/TransactionForm';
import { PlusCircle, MinusCircle } from 'lucide-react';

const Index = () => {
  const { userId, dateRangeText } = useDashboard();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const [isNewBudgetOpen, setIsNewBudgetOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  const handleBudgetSubmit = () => {
    queryClient.invalidateQueries({ queryKey: ['budgets', userId] });
      setIsNewBudgetOpen(false);
    setEditingBudget(null);
  };

  const handleEditBudget = (budget: Budget) => {
    setEditingBudget(budget);
    setIsNewBudgetOpen(true);
  };

  const handleOpenNewBudgetForm = () => {
    setEditingBudget(null);
    setIsNewBudgetOpen(true);
    }

  useEffect(() => {
    const handleOpenBudgetFormEvent = (event: CustomEvent) => {
      if(event.detail.source === 'BudgetTracker'){
      setIsNewBudgetOpen(true);
      }
    };
    document.addEventListener('openBudgetForm', handleOpenBudgetFormEvent as EventListener);
    return () => {
      document.removeEventListener('openBudgetForm', handleOpenBudgetFormEvent as EventListener);
    };
  }, []);

  return (
    <Layout>
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
          {/* Header */}
          <div className="space-y-4">
            {/* Welcome Message */}
            <div>
              <h2 className="text-3xl font-bold tracking-tight">
                Hi, Welcome back {user?.display_name ?? 'User'} 👋
              </h2>
              <p className="text-muted-foreground">
                Your financial overview for {dateRangeText}.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <DateFilter />
              <div className="flex flex-wrap items-center gap-2">
                <TransactionForm
                  initialType="income"
                  buttonText="Add Income"
                  buttonIcon={<PlusCircle className="h-4 w-4 md:mr-1" />}
                />
                <TransactionForm
                  initialType="expense"
                  buttonText="Add Expense"
                  buttonIcon={<MinusCircle className="h-4 w-4 md:mr-1" />}
                />
                <Button onClick={handleOpenNewBudgetForm}>Add New Budget</Button>
              </div>
            </div>
          </div>
          
          {/* Main Content */}
          <DashboardSummary />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-10 lg:items-start">
            {/* Left Column */}
            <div className="lg:col-span-7">
              <TransactionList />
            </div>
            {/* Right Column */}
            <div className="lg:col-span-3 h-full">
              <BudgetTracker />
            </div>
            
            {/* Bottom Row */}
            <div className="lg:col-span-10">
              <SpendingChart />
            </div>
          </div>

        <BudgetForm 
          open={isNewBudgetOpen} 
          onOpenChange={setIsNewBudgetOpen}
          onSubmit={handleBudgetSubmit}
            initialData={editingBudget}
        />
      </div>
    </Layout>
  );
};

export default Index;
