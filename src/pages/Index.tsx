import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { DashboardProvider, useDashboard } from '@/context/DashboardContext';
import { DocumentUploader } from '@/components/Dashboard/DocumentUploader';
import DashboardSummary from '@/components/Dashboard/DashboardSummary';
import SpendingChart from '@/components/Charts/SpendingChart';
import TransactionList from '@/components/Transactions/TransactionList';
import BudgetTracker from '@/components/Budgets/BudgetTracker';
import BudgetForm from '@/components/Budgets/BudgetForm';
import { Budget, CreateBudgetRequest } from '@/interfaces/budget-interface';
import DateFilter from '@/components/Dashboard/DateFilter';

const Index = () => {
  const { userId } = useDashboard();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const [isNewBudgetOpen, setIsNewBudgetOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  const handleBudgetSubmit = (formData: CreateBudgetRequest) => {
    console.log('Submitting budget from dashboard:', formData);
    queryClient.invalidateQueries({ queryKey: ['budgets'] });
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

  return (
    <DashboardProvider>
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">
            Hi, Welcome back {user?.display_name ?? 'User'} 👋
          </h2>
          <div className="flex items-center space-x-2">
            <DateFilter />
            <Button onClick={handleOpenNewBudgetForm}>Add New Budget</Button>
          </div>
        </div>
        <DocumentUploader />
        <DashboardSummary />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <div className="col-span-4">
            <SpendingChart />
          </div>
          <div className="col-span-3">
            <TransactionList />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
           <div className="col-span-4">
              <BudgetTracker onEditBudget={handleEditBudget} onSubmit={handleBudgetSubmit} />
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
  );
};

export default Index;
