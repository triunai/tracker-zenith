import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout/Layout';
import DashboardSummary from '@/components/Dashboard/DashboardSummary';
import TransactionList from '@/components/Transactions/TransactionList';
import BudgetTracker from '@/components/Budgets/BudgetTracker';
import SpendingChart from '@/components/Charts/SpendingChart';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { budgetApi } from '@/lib/api/budgetApi';
import { useToast } from '@/components/UI/use-toast.ts';
import { useDashboard } from '@/context/DashboardContext';
import { CreateBudgetRequest } from '@/interfaces/budget-interface';
import BudgetForm from '@/components/Budgets/BudgetForm';
import { supabase } from '@/lib/supabase/supabase.ts';
import { AuthError } from '@supabase/supabase-js';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/UI/button.tsx';

const Index = () => {
  const { toast } = useToast();
  const { userId } = useDashboard();
  const queryClient = useQueryClient();
  // State for controlling the budget form
  const [isNewBudgetOpen, setIsNewBudgetOpen] = useState(false);
  
  // Create budget mutation
  const createBudget = useMutation({
    mutationFn: (budget: CreateBudgetRequest) => budgetApi.create(budget),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Budget created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      setIsNewBudgetOpen(false);
    },
    onError: (error) => {
      console.error('Error creating budget:', error);
      toast({
        title: "Error",
        description: `Failed to create budget: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Handle budget form submission
  const handleBudgetSubmit = (formData: any) => {
    console.log('Dashboard - handleBudgetSubmit called:', formData);
    
    try {
      // Make sure we have a user ID
      if (!userId) {
        console.error('Missing userId, cannot create budget');
        toast({
          title: "Error",
          description: "You must be logged in to create a budget",
          variant: "destructive",
        });
        return;
      }
      
      const newBudget: CreateBudgetRequest = {
        user_id: userId,
        name: `${formData.categoryName || 'New'} Budget`,
        amount: formData.amount,
        period: formData.period,
        start_date: new Date().toISOString(),
        categories: [
          {
            category_id: formData.categoryId,
            alert_threshold: formData.amount * 0.8 // 80% alert threshold
          }
        ]
      };
      
      console.log('Creating budget with data:', newBudget);
      
      // Create the budget using the mutation
      createBudget.mutate(newBudget);
    } catch (error) {
      console.error('Error creating budget:', error);
      toast({
        title: "Error",
        description: `Failed to create budget: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  // Listen for openBudgetForm event
  useEffect(() => {
    const handleOpenBudgetFormEvent = (event: any) => {
      console.log('Opening budget form from event:', event.detail);
      setIsNewBudgetOpen(true);
    };

    // Add event listener
    document.addEventListener('openBudgetForm', handleOpenBudgetFormEvent);

    // Clean up
    return () => {
      document.removeEventListener('openBudgetForm', handleOpenBudgetFormEvent);
    };
  }, []);

  return (
    <Layout>
      <div className="space-y-8">
        <DashboardSummary />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <TransactionList />
          </div>
          <div className="lg:col-span-1">
            <BudgetTracker onSubmit={handleBudgetSubmit} />
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-6">
          <SpendingChart />
        </div>

        {/* Budget Form Dialog */}
        <BudgetForm 
          open={isNewBudgetOpen} 
          onOpenChange={setIsNewBudgetOpen}
          onSubmit={handleBudgetSubmit}
        />
      </div>
    </Layout>
  );
};

export default Index;
