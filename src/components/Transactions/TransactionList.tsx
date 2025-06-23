import React, { useState, useMemo, useEffect } from 'react';
import { formatCurrency } from '@/lib/utils';
import TransactionForm from './TransactionForm';
import { 
  CalendarIcon, 
  CreditCard, 
  Trash2, 
  Edit, 
  ChevronLeft, 
  ChevronRight,
  Search,
  SlidersHorizontal,
  LoaderCircle,
  ArrowDownCircle,
  ArrowUpCircle,
  AlertTriangle
} from 'lucide-react';

// Import UI components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Expense, ExpenseCategory } from '@/interfaces/expense-interface';
import { PaymentMethod } from '@/interfaces/payment-method-interface';
import { expenseApi } from '@/lib/api/expenseApi';
import { useToast } from '@/components/ui/use-toast.ts';
import { Badge } from '@/components/ui/badge.tsx';
import { format } from 'date-fns';
import { useDashboard } from '@/context/DashboardContext';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog.tsx";
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useIsMobile } from '@/hooks/use-mobile';

// Custom MYR currency formatter with error handling
const formatMYR = (amount: number): string => {
  try {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Math.abs(amount));
  } catch (error) {
    console.error('Error formatting currency:', error);
    return `MYR ${Math.abs(amount).toFixed(2)}`;
  }
};

const TransactionList = () => {
  // UI State management
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<number | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('all');
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<'all' | 'expense' | 'income'>('all');
  
  const { toast } = useToast();
  const { refreshData, dateFilter, dateRangeText, userId, startDate, endDate } = useDashboard();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  // 🎯 CRITICAL FIX: Use React Query for data fetching
  const { 
    data: expenses = [], 
    isLoading, 
    error: queryError,
    refetch: refetchTransactions 
  } = useQuery({
    queryKey: ['expenses', userId, startDate, endDate],
    queryFn: async () => {
      if (!userId) {
        console.warn("💡 DIAGNOSTIC: useQuery called with no userId");
        return [];
      }
      
      console.log(`💡 DIAGNOSTIC: React Query fetching transactions for user ${userId} from ${startDate} to ${endDate}`);
      
      // Convert dates to ISO strings to match expected types in expenseApi
      const startDateIso = typeof startDate === 'string' ? startDate : new Date(startDate).toISOString();
      const endDateIso = typeof endDate === 'string' ? endDate : new Date(endDate).toISOString();
      
      // Fetch expenses with date range
      const expenseData = await expenseApi.getAllByUser(userId, {
        limit: 100,
        startDate: startDateIso, 
        endDate: endDateIso
      });
      
      // Filter out expenses with no valid expense_items
      const validExpenses = expenseData.filter(expense => 
        expense.expense_items && expense.expense_items.length > 0
      );
      
      // Sort expenses by date (newest first)
      return validExpenses.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    },
    enabled: !!userId, // Only run when userId is available
    staleTime: 30 * 1000, // Data is fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  });

  // Fetch categories and payment methods for filtering
  const { data: categories = [] } = useQuery({
    queryKey: ['expenseCategories'],
    queryFn: expenseApi.getCategories,
    staleTime: 10 * 60 * 1000, // Categories don't change often
  });

  const { data: paymentMethods = [] } = useQuery({
    queryKey: ['paymentMethods'],
    queryFn: expenseApi.getPaymentMethods,
    staleTime: 10 * 60 * 1000, // Payment methods don't change often
  });

  const error = queryError?.message ?? null;
  
  // Set up real-time subscription for automatic updates
  useEffect(() => {
    // Only set up subscription if we have a user ID
    if (!userId) return;
    
    // Set up subscription to real-time updates
    const subscription = expenseApi.subscribeToExpenses(userId, (payload) => {
      console.log('🔄 Real-time update received, invalidating React Query cache...');
      // Invalidate React Query cache to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['expenses', userId] });
      
      // Also refresh dashboard data
      refreshData();
    });
    
    return () => {
      subscription?.unsubscribe();
    };
  }, [userId, queryClient, refreshData]);
  
  // Open delete confirmation dialog
  const confirmDelete = (expenseId: number) => {
    setExpenseToDelete(expenseId);
    setIsDeleteDialogOpen(true);
  };
  
  // --- Refactored Delete Mutation --- 
  const deleteMutation = useMutation({
    mutationFn: (expenseId: number) => expenseApi.delete(expenseId),
    onSuccess: () => {
      // 🎯 CRITICAL FIX: Use correct query key that matches our React Query setup
      queryClient.invalidateQueries({ queryKey: ['expenses', userId] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary', userId] });
      queryClient.invalidateQueries({ queryKey: ['spendingByCategory', userId] });
      queryClient.invalidateQueries({ queryKey: ['spendingByPayment', userId] });
      
      toast({
        title: 'Success',
        description: 'Transaction deleted successfully.',
      });
      refreshData();
      setIsDeleteDialogOpen(false);
      setExpenseToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to delete transaction: ${error.message}`,
        variant: 'destructive',
      });
      setIsDeleteDialogOpen(false);
      setExpenseToDelete(null);
    },
  });

  // Call the mutation when delete is confirmed
  const handleDelete = () => {
    if (expenseToDelete !== null) {
    deleteMutation.mutate(expenseToDelete);
    }
  };
  
  // Filter and paginate expenses
  const filteredExpenses = useMemo(() => {
    try {
      console.log(`💡 DIAGNOSTIC: Filtering ${expenses.length} expenses with:`, {
        searchTerm,
        selectedCategory,
        selectedPaymentMethod,
        transactionTypeFilter
      });
      
      // TARGETED DEBUG: Check if expense ID 52 is in the expenses array
      const targetExpense = expenses.find(e => e.id === 52);
      if (targetExpense) {
        console.log("🎯 TARGET PRESENT: Expense ID 52 is in the expenses array before filtering");
      } else {
        console.warn("🎯 TARGET ABSENT: Expense ID 52 is NOT in the expenses array before filtering");
      }
      
      const result = expenses
        .filter(expense => {
          // TARGETED DEBUG: Log filtering process for expense ID 52
          const isTarget = expense.id === 52;
          
          // Transaction type filter
          if (transactionTypeFilter !== 'all') {
            // Add detailed logging for transaction type filtering
            const transactionType = expense.transaction_type || 
              (expense.expense_items?.some(item => item.income_category_id) ? 'income' : 'expense');
            
            if (isTarget) {
              console.log(`🎯 TARGET FILTER: Transaction type check for expense ID 52: has type=${transactionType}, filter requires=${transactionTypeFilter}`);
            }
            
            if (transactionType !== transactionTypeFilter) {
              if (isTarget) {
                console.warn(`🎯 TARGET EXCLUDED: Expense ID 52 filtered out due to transaction type mismatch: ${transactionType} vs ${transactionTypeFilter}`);
              }
              return false;
            }
          }
          
          // Search filter - check if any expense item description matches
          const matchesSearch = searchTerm === '' || 
            expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            expense.expense_items?.some(item => 
              item.description?.toLowerCase().includes(searchTerm.toLowerCase())
            );
          
          // Category filter
          const matchesCategory = selectedCategory === 'all' ? true : 
            expense.expense_items?.some(item => 
              item.category_id?.toString() === selectedCategory
            );
            
          // Payment method filter
          const matchesPaymentMethod = selectedPaymentMethod === 'all' ? true :
            expense.payment_method_id?.toString() === selectedPaymentMethod;
          
          if (isTarget) {
            console.log(`🎯 TARGET FILTER DETAILS for expense ID 52:`, {
              matchesSearch,
              matchesCategory,
              selectedCategory,
              actualCategories: expense.expense_items?.map(item => item.category_id),
              matchesPaymentMethod,
              selectedPaymentMethod,
              actualPaymentMethod: expense.payment_method_id
            });
          }
          
          // For debugging non-matching items
          if (!matchesSearch || !matchesCategory || !matchesPaymentMethod) {
            if (isTarget) {
              console.warn(`🎯 TARGET EXCLUDED: Expense ID 52 filtered out due to:`, {
                matchesSearch,
                matchesCategory,
                matchesPaymentMethod
              });
            }
          }
            
          return matchesSearch && matchesCategory && matchesPaymentMethod;
        });
      
      // TARGETED DEBUG: Check if expense ID 52 is in the filtered results
      if (targetExpense) {
        const stillPresent = result.some(e => e.id === 52);
        if (stillPresent) {
          console.log("🎯 TARGET INCLUDED: Expense ID 52 passed all filters and is in the final result set");
        } else {
          console.warn("🎯 TARGET FILTERED OUT: Expense ID 52 was removed by filters");
        }
      }
      
      console.log(`💡 DIAGNOSTIC: Filtered to ${result.length} expenses after applying all filters`);
      return result;
    } catch (error) {
      console.error('Error filtering expenses:', error);
      return [];
    }
  }, [expenses, searchTerm, selectedCategory, selectedPaymentMethod, transactionTypeFilter]);
  
  // Function to handle transaction type filter change
  const handleTransactionTypeChange = (value: string) => {
    console.log(`Changing transaction type filter to: ${value}`);
    setTransactionTypeFilter(value as 'all' | 'expense' | 'income');
    
    // Reset to first page when changing filters
    setCurrentPage(1);
  };
  
  // Reset page when any filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedPaymentMethod, transactionTypeFilter]);
  
  // Handle transaction added event
  const handleTransactionAdded = () => {
    console.log('Transaction added, refreshing data...');
    refetchTransactions();
  };
  
  // Paginate transactions
  const paginatedExpenses = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredExpenses.slice(startIndex, startIndex + pageSize);
  }, [filteredExpenses, currentPage, pageSize]);
  
  // Calculate total pages - ensure it has a default value
  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredExpenses.length / pageSize));
  }, [filteredExpenses, pageSize]);

  return (
    <>
    <Card className="h-full shadow-purple">
      <CardHeader className="flex flex-row items-start justify-between gap-4 pb-4">
        <div className="flex-1 min-w-0">
          <CardTitle className="text-lg sm:text-xl font-bold">Transactions</CardTitle>
          <CardDescription className="text-sm text-muted-foreground mt-1">
             {isMobile ? `For ${dateRangeText}`: `View and manage your transactions for ${dateRangeText}`}
          </CardDescription>
        </div>
        <TransactionForm 
          key={expenseToEdit ? `edit-${expenseToEdit.id}` : 'add'}
          onSuccess={handleTransactionAdded} 
          expenseToEdit={expenseToEdit}
          onClose={() => setExpenseToEdit(null)}
        />
      </CardHeader>
      
      <CardContent>
        {/* Transaction Type Filter */}
        <div className="mb-4" onClick={(e) => e.stopPropagation()}>
          <Tabs 
            defaultValue="all" 
            value={transactionTypeFilter} 
            onValueChange={handleTransactionTypeChange}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">{isMobile ? 'All' : 'All Transactions'}</TabsTrigger>
              <TabsTrigger value="expense">Expenses</TabsTrigger>
              <TabsTrigger value="income">Income</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        {/* Filters */}
        <div className="space-y-3 mb-4">
          <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-1 md:grid-cols-3 sm:gap-4">
            <div className="col-span-full md:col-span-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                <Input
                  className="pl-9"
                  placeholder={isMobile ? "Search..." : "Search transactions..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-2 md:col-span-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder={isMobile ? "Category" : "Filter by category"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder={isMobile ? "Payment" : "Filter by payment"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payment Methods</SelectItem>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method.id} value={method.id.toString()}>
                      {method.method_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        {/* Loading state */}
        {isLoading && (
          <div className="flex justify-center items-center py-8">
            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            <span>Loading transactions...</span>
          </div>
        )}
        
        {/* Error state */}
        {error && (
          <div className="text-center py-8 text-destructive">
            <AlertTriangle className="mx-auto h-8 w-8 mb-2" />
            <p>{error}</p>
          </div>
        )}
        
        {/* Empty state */}
        {!isLoading && !error && filteredExpenses.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p className="mb-2">No transactions found.</p>
            {searchTerm || selectedCategory !== 'all' || selectedPaymentMethod !== 'all' || transactionTypeFilter !== 'all' ? (
              <p>Try adjusting your filters.</p>
            ) : (
              <p>Add a new transaction to get started.</p>
            )}
          </div>
        )}
        
        {/* Transactions list */}
        {!isLoading && !error && paginatedExpenses.length > 0 && (
          <div className="space-y-4">
            {paginatedExpenses.map((expense) => {
              // Get the total amount
              const totalAmount = expense.expense_items?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;
              
              // Get the first item for display purposes
              const firstItem = expense.expense_items?.[0];
              const category = firstItem?.category;
              
              return (
                <div key={expense.id} className="border rounded-md hover:bg-muted/50 transition-colors hover:shadow-purple-sm overflow-hidden">
                  <div className="p-3 sm:p-4">
                    {/* Mobile Layout */}
                    {isMobile ? (
                      <div className="space-y-3">
                        {/* Header Row - Amount and Actions */}
                        <div className="flex items-center justify-between">
                          <div className={`text-lg font-bold ${expense.transaction_type === 'income' ? 'text-green-500' : 'text-destructive'}`}>
                            {expense.transaction_type === 'income' ? '+' : '-'}{formatMYR(totalAmount)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-8 w-8 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                              onClick={() => setExpenseToEdit(expense)}
                            >
                              <Edit className="h-3 w-3" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                              onClick={() => confirmDelete(expense.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </div>
                        
                        {/* Transaction Info */}
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <h3 className="font-medium text-sm leading-tight flex-1 pr-2">
                              {firstItem?.description || expense.description || 'Unnamed Transaction'}
                            </h3>
                            <div className="flex flex-wrap gap-1 justify-end">
                              {category && (
                                <Badge variant="outline" className="text-xs">
                                  {category.name}
                                </Badge>
                              )}
                              {expense.transaction_type === 'income' && (
                                <Badge variant="outline" className="text-xs text-green-500">
                                  Income
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <CalendarIcon className="h-3 w-3" />
                              <span>{format(new Date(expense.date), 'MMM d')}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              {expense.payment_method && (
                                <span>{expense.payment_method.method_name}</span>
                              )}
                              {expense.expense_items && expense.expense_items.length > 1 && (
                                <span>{expense.expense_items.length} items</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Desktop Layout - Existing */
                      <div className="flex items-center justify-between">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 rounded-full items-center justify-center bg-primary/10">
                            {expense.transaction_type === 'income' ? (
                              <ArrowDownCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <CreditCard className="h-5 w-5 text-primary" />
                            )}
                          </div>
                          
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">
                                {firstItem?.description || expense.description || 'Unnamed Transaction'}
                              </h3>
                              {category && (
                                <Badge variant="outline" className="text-xs">
                                  {category.name}
                                </Badge>
                              )}
                              {expense.transaction_type === 'income' && (
                                <Badge variant="outline" className="text-xs text-green-500">
                                  Income
                                </Badge>
                              )}
                            </div>
                            
                            <div className="flex items-center text-sm text-muted-foreground gap-3 mt-1">
                              <div className="flex items-center gap-1">
                                <CalendarIcon className="h-3 w-3" />
                                <span>{format(new Date(expense.date), 'MMM d, yyyy')}</span>
                              </div>
                              
                              {expense.payment_method && (
                                <div>
                                  <span>{expense.payment_method.method_name}</span>
                                </div>
                              )}
                              
                              {expense.expense_items && expense.expense_items.length > 1 && (
                                <div>
                                  <span>{expense.expense_items.length} items</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className={`font-medium ${expense.transaction_type === 'income' ? 'text-green-500' : 'text-destructive'}`}>
                              {expense.transaction_type === 'income' ? '+' : '-'}{formatMYR(totalAmount)}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="text-gray-500 hover:text-blue-800 hover:bg-blue-100 rounded-full transition-colors"
                              onClick={() => setExpenseToEdit(expense)}
                            >
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Edit Transaction</span>
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors"
                              onClick={() => confirmDelete(expense.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete Transaction</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {/* Pagination */}
        {!isLoading && !error && totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredExpenses.length)} of {filteredExpenses.length} transactions
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
    
    {/* Delete Confirmation Dialog */}
    <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete this transaction record.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
            Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
};

export default TransactionList;