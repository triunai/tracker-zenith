import { useState, useEffect } from 'react';
import Layout from '@/components/Layout/Layout';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { DashboardProvider, useDashboard } from '@/context/DashboardContext';
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
      <DashboardProvider>
        <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">
                Hi, Welcome back {user?.display_name ?? 'User'} 👋
              </h2>
              <p className="text-muted-foreground">
                Your financial overview for {dateRangeText}.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
              <DateFilter />
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
          <DashboardSummary />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-10">
            {/* Top Row */}
            <div className="lg:col-span-7">
              <TransactionList />
            </div>
            <div className="lg:col-span-3">
              <BudgetTracker onEditBudget={handleEditBudget} onSubmit={handleBudgetSubmit} />
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
      </DashboardProvider>
    </Layout>
  );
};

export default Index;
