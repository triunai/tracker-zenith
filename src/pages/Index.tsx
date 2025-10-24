import { useState, useEffect } from 'react';
import Layout from '@/components/Layout/Layout';
import { useQueryClient, useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useDashboard } from '@/context/DashboardContext';
import { useScanner } from '@/context/ScannerContext';
import DashboardSummary from '@/components/Dashboard/DashboardSummary';
import SpendingChart from '@/components/Charts/SpendingChart';
import TransactionList from '@/components/Transactions/TransactionList';
import BudgetTracker from '@/components/Budgets/BudgetTracker';
import BudgetForm from '@/components/Budgets/BudgetForm';
import { Budget, CreateBudgetRequest, UpdateBudgetRequest } from '@/interfaces/budget-interface';
import { Document } from '@/interfaces/document-interface';
import DateFilter from '@/components/Dashboard/DateFilter';
import TransactionForm from '@/components/Transactions/TransactionForm';
import { DocumentUploader } from '@/components/Documents/DocumentUploader';
import { ProcessedDocuments } from '@/components/Documents/ProcessedDocuments';
import { PlusCircle, MinusCircle, X, Loader2 } from 'lucide-react';
import { budgetApi } from '@/lib/api/budgetApi';
import { PeriodEnum } from '@/interfaces/enums/PeriodEnum';
import { useToast } from '@/components/ui/use-toast';
import BlurText from '@/components/ui/BlurText';
import ShinyText from '@/components/ui/ShinyText';

const Index = () => {
  const { userId, dateRangeText } = useDashboard();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();
  const { isOpen: isScannerOpen, closeScanner, isLoading: isScannerLoading } = useScanner();
  
  const [isNewBudgetOpen, setIsNewBudgetOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [processedDocuments, setProcessedDocuments] = useState<Document[]>([]);
  const [showProcessedDocuments, setShowProcessedDocuments] = useState(false);

  // Fetch categories for the budget form
  const { data: categories = [] } = useQuery({
    queryKey: ['expenseCategories'],
    queryFn: budgetApi.getCategories,
  });

  // Create budget mutation
  const createBudget = useMutation({
    mutationFn: (newBudget: CreateBudgetRequest) => budgetApi.create(newBudget),
    onSuccess: (data) => {
      console.log('Budget created successfully from dashboard:', data);
      
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['budgetSpending'] });
      queryClient.invalidateQueries({ queryKey: ['budgetCategorySpending'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      
      setIsNewBudgetOpen(false);
      setEditingBudget(null);
      toast({
        title: "Success!",
        description: "Budget has been created successfully.",
      });
    },
    onError: (error) => {
      console.error('Failed to create budget from dashboard:', error);
      toast({
        title: "Error",
        description: `Failed to create budget: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Update budget mutation
  const updateBudget = useMutation({
    mutationFn: async (updatedBudgetData: { id: number; data: UpdateBudgetRequest }) => {
      console.log(`Updating budget from dashboard, ID: ${updatedBudgetData.id}`);
      return await budgetApi.update(updatedBudgetData.id, updatedBudgetData.data);
    },
    onSuccess: (data) => {
      console.log('Budget updated successfully from dashboard:', data);
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['budgetSpending', data.id] });
      queryClient.invalidateQueries({ queryKey: ['budgetCategorySpending', data.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });

      setIsNewBudgetOpen(false);
      setEditingBudget(null);
      toast({
        title: "Success!",
        description: "Budget has been updated successfully.",
      });
    },
    onError: (error: Error, variables) => {
      console.error(`Failed to update budget ${variables.id} from dashboard:`, error);
      toast({
        title: "Error",
        description: `Failed to update budget: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const handleBudgetSubmit = (formData: {
    amount: string;
    period: PeriodEnum;
    categoryId?: number;
    categoryName?: string;
    alert_threshold?: number;
  }) => {
    console.log('Dashboard handleBudgetSubmit called with form data:', formData);
    console.log('Current editingBudget state:', editingBudget);

    try {
      if (!userId) {
        throw new Error("User ID is missing. Cannot proceed.");
      }

      // Convert string amount to number
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error("Invalid amount provided.");
      }

      if (editingBudget) {
        const updatePayload: UpdateBudgetRequest = {
          name: editingBudget.name,
          amount: amount,
          period: formData.period,
        };

        console.log('Updating budget with payload:', updatePayload);
        updateBudget.mutate({ id: editingBudget.id, data: updatePayload });

      } else {
        console.log("Preparing to CREATE new budget from dashboard");
        
        if (!formData.categoryId) {
            throw new Error("Category is required to create a budget.");
        }

        const newBudget: CreateBudgetRequest = {
          user_id: userId,
          name: `${formData.categoryName || 'New'} Budget`,
          amount: amount,
          period: formData.period,
          start_date: new Date().toISOString(),
          categories: [
            {
              category_id: formData.categoryId,
              alert_threshold: formData.alert_threshold || amount * 0.8
            }
          ]
        };

        console.log('Creating budget with data:', newBudget);
        createBudget.mutate(newBudget);
      }

    } catch (error: unknown) {
      console.error('Error in dashboard handleBudgetSubmit:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: "Submission Error",
        description: `Failed to process budget: ${errorMessage}`,
        variant: "destructive",
      });
    }
  };

  const handleEditBudget = (budget: Budget) => {
    setEditingBudget(budget);
    setIsNewBudgetOpen(true);
  };

  const handleOpenNewBudgetForm = () => {
    setEditingBudget(null);
    setIsNewBudgetOpen(true);
  };

  const handleDocumentProcessed = (document: Document) => {
    console.log('[Index] Document processed:', document);
    setProcessedDocuments((prev) => {
      // Check if document already exists and update it, otherwise add it
      const existingIndex = prev.findIndex(d => d.id === document.id);
      if (existingIndex !== -1) {
        console.log('🔄 [Index] Document already exists, updating:', document.id);
        const updated = [...prev];
        updated[existingIndex] = document;
        return updated;
      } else {
        console.log('🔄 [Index] New document, adding:', document.id);
        return [document, ...prev];
      }
    });
    closeScanner();
    setShowProcessedDocuments(true);
    // Invalidate queries to refresh the transaction list
    queryClient.invalidateQueries({ queryKey: ['expenses', userId] });
  };

  useEffect(() => {
    const handleOpenBudgetFormEvent = (event: CustomEvent) => {
      console.log('Dashboard received openBudgetForm event:', event.detail);
      if(event.detail?.source === 'BudgetTracker'){
        console.log('Opening budget form from BudgetTracker');
        setIsNewBudgetOpen(true);
        setEditingBudget(null);
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
              <BlurText
                text={`Hi, Welcome back ${user?.display_name ?? 'User'} 👋`}
                delay={150}
                animateBy="words"
                direction="top"
                className="text-3xl font-bold tracking-tight"
                fallbackText={`Hi, Welcome back ${user?.display_name ?? 'User'} 👋`}
                enableFallback={true}
                onFallback={() => console.log('BlurText animation failed, using fallback')}
              />
              <ShinyText 
                text={`Your financial overview for ${dateRangeText}.`}
                speed={8}
                className="text-muted-foreground"
              />
            </div>

            {/* Date Filter */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <DateFilter />
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
          onOpenChange={(isOpen) => {
            setIsNewBudgetOpen(isOpen);
            if (!isOpen) {
              setEditingBudget(null);
            }
          }}
          onSubmit={handleBudgetSubmit}
          initialData={editingBudget}
          categories={categories}
        />
      </div>

      {/* Scanner Overlay - Full Screen */}
      {isScannerOpen && (
        <div className="fixed inset-0 z-[60] bg-background/40 backdrop-blur-xl lg:hidden supports-[backdrop-filter]:bg-background/30">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-bold">
                {isScannerLoading ? 'Processing...' : 'Scan Receipt'}
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (isScannerLoading) {
                    // Show confirmation when processing
                    const confirmed = window.confirm(
                      'AI is still processing your document. Close anyway?\n\n(Processing will continue in the background)'
                    );
                    if (confirmed) {
                      closeScanner();
                    }
                  } else {
                    closeScanner();
                  }
                }}
                className="h-10 w-10"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
            <div className="flex-1 flex items-center justify-center p-4">
              {isScannerLoading ? (
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <p className="text-lg font-medium">Processing document...</p>
                  <p className="text-sm text-muted-foreground">AI is analyzing your receipt</p>
                </div>
              ) : (
                <DocumentUploader 
                  onDocumentProcessed={handleDocumentProcessed}
                  autoOpen={true}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Processed Documents Overlay */}
      {showProcessedDocuments && processedDocuments.length > 0 && (
        <div className="fixed inset-0 z-[60] bg-background/40 backdrop-blur-xl lg:hidden supports-[backdrop-filter]:bg-background/30">
          <div className="flex flex-col h-full max-w-[500px] mx-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-bold">Processed Documents</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowProcessedDocuments(false)}
                className="h-10 w-10"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <ProcessedDocuments
                documents={processedDocuments}
                onDocumentUpdate={(doc) => {
                  console.log('🔄 [Index] onDocumentUpdate called with:', doc);
                  setProcessedDocuments((prev) => {
                    console.log('🔄 [Index] Previous documents:', prev.map(d => ({ id: d.id, filename: d.original_filename })));
                    const updated = prev.map((d) => {
                      if (d.id === doc.id) {
                        console.log('🔄 [Index] Replacing document:', d.id, 'with updated:', doc.id);
                        return doc;
                      }
                      return d;
                    });
                    console.log('🔄 [Index] Updated processedDocuments:', updated.map(d => ({ id: d.id, filename: d.original_filename })));
                    return updated;
                  });
                }}
                onDocumentRemove={(documentId) => {
                  setProcessedDocuments((prev) => 
                    prev.filter((d) => d.id !== documentId)
                  );
                }}
              />
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Index;
