import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient, useQueries } from '@tanstack/react-query';
import Layout from '@/components/Layout/Layout';
import PageHeader from '@/components/Layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Edit, Plus, AlertTriangle, Trash, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress.tsx';
import { PeriodEnum } from '@/interfaces/enums/PeriodEnum';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';
import { budgetApi } from '@/lib/api/budgetApi';
import { CreateBudgetRequest, UpdateBudgetRequest, Budget } from '@/interfaces/budget-interface';
import { useToast } from '@/components/ui/use-toast.ts';
import BudgetForm from '@/components/Budgets/BudgetForm';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog.tsx';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog.tsx';
import BudgetTracker from '@/components/Budgets/BudgetTracker';
import BudgetAnalytics from '@/components/Budgets/BudgetAnalytics.tsx';
import BudgetList from '@/components/Budgets/BudgetList.tsx';
import { useDashboard } from '@/context/DashboardContext';
import { supabase } from '@/lib/supabase/supabase';

const BudgetPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodEnum>(PeriodEnum.MONTHLY);
  const [isNewBudgetOpen, setIsNewBudgetOpen] = useState(false);
  const [debug, setDebug] = useState<string>("");
  const [budgetToDelete, setBudgetToDelete] = useState<number | null>(null);
  const [budgetToEdit, setBudgetToEdit] = useState<Budget | null>(null);
  
  const { userId } = useDashboard();
  
  // Fetch categories for the budget form
  const { data: categories = [] } = useQuery({
    queryKey: ['expenseCategories'],
    queryFn: budgetApi.getCategories,
  });
  
  // Create budget mutation
  const createBudget = useMutation({
    mutationFn: (newBudget: CreateBudgetRequest) => budgetApi.create(newBudget),
    onSuccess: (data) => {
      console.log('Budget created successfully, invalidating queries:', data);
      
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['budgetSpending'] });
      queryClient.invalidateQueries({ queryKey: ['budgetCategorySpending'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      
      setIsNewBudgetOpen(false);
      toast({
        title: "Success!",
        description: "Budget has been created successfully.",
      });
    },
    onError: (error) => {
      console.error('Failed to create budget:', error);
      toast({
        title: "Error",
        description: `Failed to create budget: ${error.message}`,
        variant: "destructive",
      });
      setDebug(`Error creating budget: ${error.message}`);
    }
  });
  
  // Update budget mutation
  const updateBudget = useMutation({
    mutationFn: async (updatedBudgetData: { id: number; data: UpdateBudgetRequest }) => {
      console.log(`Calling budgetApi.update for budget ID: ${updatedBudgetData.id}`);
      return await budgetApi.update(updatedBudgetData.id, updatedBudgetData.data);
    },
    onSuccess: (data) => {
      console.log('Budget updated successfully via API, invalidating queries:', data);
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['budgetSpending', data.id] });
      queryClient.invalidateQueries({ queryKey: ['budgetCategorySpending', data.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });

      setIsNewBudgetOpen(false);
      setBudgetToEdit(null);
      toast({
        title: "Success!",
        description: "Budget has been updated successfully.",
      });
    },
    onError: (error: Error, variables) => {
      console.error(`Failed to update budget ${variables.id} via API:`, error);
      toast({
        title: "Error",
        description: `Failed to update budget: ${error.message}`,
        variant: "destructive",
      });
      setDebug(`Error updating budget ${variables.id}: ${error.message}`);
    }
  });
  
  // Delete budget mutation
  const deleteBudget = useMutation({
    mutationFn: (budgetId: number) => budgetApi.delete(budgetId),
    onSuccess: (_, deletedBudgetId) => {
      console.log(`Budget ${deletedBudgetId} deleted successfully, invalidating queries`);
      
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['budgetSpending', deletedBudgetId] });
      queryClient.invalidateQueries({ queryKey: ['budgetCategorySpending', deletedBudgetId] });
      queryClient.invalidateQueries({ queryKey: ['budgetSpending'] });
      queryClient.invalidateQueries({ queryKey: ['budgetCategorySpending'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      
      toast({
        title: "Success!",
        description: "Budget has been deleted successfully.",
      });
    },
    onError: (error) => {
      console.error('Failed to delete budget:', error);
      toast({
        title: "Error",
        description: `Failed to delete budget: ${error.message}`,
        variant: "destructive",
      });
      setDebug(`Error deleting budget: ${error.message}`);
    }
  });
  
  const confirmDelete = () => {
    if (budgetToDelete) {
      deleteBudget.mutate(budgetToDelete);
      setBudgetToDelete(null);
    }
  };
  
  const cancelDelete = () => {
    setBudgetToDelete(null);
  };
  
  // Updated handler for form submission
  const handleMainPageBudgetSubmit = (formData: {
    amount: number;
    period: PeriodEnum;
    categoryId?: number;
    categoryName?: string;
  }) => {
    console.log('MAIN PAGE handleBudgetSubmit called with form data:', formData);
    console.log('Current budgetToEdit state:', budgetToEdit);

    try {
      if (!userId) {
        throw new Error("User ID is missing. Cannot proceed.");
      }

      if (budgetToEdit) {
        const updatePayload: UpdateBudgetRequest = {
          name: budgetToEdit.name,
          amount: formData.amount,
          period: formData.period,
        };

        console.log('Updating budget with payload:', updatePayload);
        updateBudget.mutate({ id: budgetToEdit.id, data: updatePayload });

      } else {
        console.log("Preparing to CREATE new budget");
        
        if (!formData.categoryId) {
            throw new Error("Category is required to create a budget.");
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
              alert_threshold: formData.amount * 0.8
            }
          ]
        };

        console.log('Creating budget with data:', newBudget);
        createBudget.mutate(newBudget);
      }

    } catch (error: unknown) {
      console.error('Error in handleMainPageBudgetSubmit:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: "Submission Error",
        description: `Failed to process budget: ${errorMessage}`,
        variant: "destructive",
      });
      setDebug(`Error submitting budget: ${errorMessage}`);
    }
  };
  
  const handleDeleteBudget = (budgetId: number) => {
    setBudgetToDelete(budgetId);
  };
  
  const handleEditBudget = (budget: Budget) => {
    console.log("Editing budget:", budget);
    setBudgetToEdit(budget);
    setIsNewBudgetOpen(true);
  };

  const handleOpenCreateForm = () => {
    setBudgetToEdit(null);
    setIsNewBudgetOpen(true);
  };
  
  const periods = Object.values(PeriodEnum);

  // Set up budget form event listener
  useEffect(() => {
    const handleOpenBudgetFormEvent = (event: CustomEvent) => {
      console.log('Opening budget form from event:', event.detail);
      setIsNewBudgetOpen(true);
    };

    document.addEventListener('openBudgetForm', handleOpenBudgetFormEvent);

    return () => {
      document.removeEventListener('openBudgetForm', handleOpenBudgetFormEvent);
    };
  }, []);

  // Ensure we refresh data when userId changes
  useEffect(() => {
    if (userId) {
      console.log(`UserId changed to ${userId}, refreshing budget data...`);
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    }
  }, [userId, queryClient]);

  return (
    <Layout>
      <PageHeader title="Budgets" showBack={true} />
      <div className="container mx-auto space-y-6 lg:pt-0 pt-20">
        {/* Alert Dialog for Delete Confirmation */}
        <AlertDialog open={budgetToDelete !== null} onOpenChange={(open) => {
          if (!open) setBudgetToDelete(null);
        }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete this budget. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={cancelDelete}>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmDelete} 
                disabled={deleteBudget.isPending}
                className="bg-red-500 hover:bg-red-600"
              >
                {deleteBudget.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Budgets</h1>
            <p className="text-muted-foreground mt-1">
              Manage your budgets and spending goals
            </p>
          </div>
          <Button 
            className="gap-2" 
            onClick={handleOpenCreateForm}
          >
            <Plus className="h-4 w-4" />
            Create New Budget
          </Button>
        </div>

        {/* Budget Tracker Component */}
        <BudgetTracker 
          onEditBudget={handleEditBudget}
          onDeleteBudget={handleDeleteBudget}
        />

        {/* Budget Analytics Component */}
        <BudgetAnalytics />

        {/* Budget Management Component */}
        <BudgetList 
          onEditBudget={handleEditBudget}
          onDeleteBudget={handleDeleteBudget}
        />
        
        {/* Budget Form Dialog */}
        <BudgetForm 
          open={isNewBudgetOpen} 
          onOpenChange={(isOpen) => {
            setIsNewBudgetOpen(isOpen);
            if (!isOpen) {
              setBudgetToEdit(null);
            }
          }}
          onSubmit={handleMainPageBudgetSubmit}
          initialData={budgetToEdit}
          categories={categories}
        />

        {/* Debug Output */}
        {debug && (
          <pre className="mt-4 p-4 bg-muted rounded-md text-xs overflow-x-auto">
            <code>{debug}</code>
          </pre>
        )}
      </div>
    </Layout>
  );
};

export default BudgetPage;