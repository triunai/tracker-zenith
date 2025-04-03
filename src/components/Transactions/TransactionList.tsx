import React, { useState, useMemo, useEffect, useCallback } from 'react';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Expense, ExpenseCategory } from '@/interfaces/expense-interface';
import { PaymentMethod } from '@/interfaces/payment-method-interface';
import { expenseApi } from '@/lib/api/expenseApi';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useDashboard } from '@/context/DashboardContext';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useMutation, useQueryClient } from '@tanstack/react-query';

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
  // State management
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
  const { refreshData, dateFilter, dateRangeText, userId } = useDashboard();
  const queryClient = useQueryClient();
  
  // Get date range based on filter
  const getDateRangeForFilter = useCallback(() => {
    let startDate, endDate;
    
    switch (dateFilter.type) {
      case 'month': {
        const year = dateFilter.year;
        const month = dateFilter.month || 0;
        startDate = new Date(year, month, 1);
        endDate = new Date(year, month + 1, 0);
        break;
      }
      case 'quarter': {
        const year = dateFilter.year;
        const quarter = dateFilter.quarter || 1;
        const startMonth = (quarter - 1) * 3;
        startDate = new Date(year, startMonth, 1);
        endDate = new Date(year, startMonth + 3, 0);
        break;
      }
      case 'year': {
        const year = dateFilter.year;
        startDate = new Date(year, 0, 1);
        endDate = new Date(year, 11, 31);
        break;
      }
      case 'custom': {
        if (dateFilter.customRange) {
          startDate = dateFilter.customRange.startDate;
          endDate = dateFilter.customRange.endDate;
        } else {
          // Default to current month if no custom range
          const now = new Date();
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        }
        break;
      }
      default: {
        // Default to current month
        const now = new Date();
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      }
    }
    
    // Fix timezone issues by using a timezone-safe approach
    // Method 1: Create a timezone-safe range by directly formatting dates
    // to avoid the implicit timezone conversion of toISOString()
    
    // Format start date as YYYY-MM-DDT00:00:00Z to ensure correct day
    const formatDate = (date: Date, isEndDate = false) => {
      const year = date.getFullYear();
      // Month is 0-based in JS, but we want 1-based for formatting
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      // Set to beginning of day for start date, end of day for end date
      const time = isEndDate ? 'T23:59:59.999Z' : 'T00:00:00.000Z';
      
      return `${year}-${month}-${day}${time}`;
    };
    
    // Use our safer date formatting method
    const formattedStartDate = formatDate(startDate, false);
    const formattedEndDate = formatDate(endDate, true);
    
    console.log(`Transaction List: Using date range ${formattedStartDate} to ${formattedEndDate}`);
    console.log(`Debug - Original dates: start=${startDate.toDateString()}, end=${endDate.toDateString()}`);
    console.log(`Debug - Formatted without timezone shift: start=${formattedStartDate}, end=${formattedEndDate}`);
    
    return {
      startDate: formattedStartDate,
      endDate: formattedEndDate
    };
  }, [dateFilter]);
  
  // Fetch data from API
  const fetchTransactions = useCallback(async () => {
    // Only fetch if we have a user ID
    if (!userId) {
      console.warn("💡 DIAGNOSTIC: fetchTransactions called with no userId");
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Get date range from filter
      const { startDate, endDate } = getDateRangeForFilter();
      
      // Add enhanced debugging information
      console.log(`💡 DIAGNOSTIC: TransactionList fetchTransactions STARTING with filters:`, {
        userId,
        dateFilter: {
          type: dateFilter.type,
          year: dateFilter.year,
          month: dateFilter.month,
          quarter: dateFilter.quarter,
          hasCustomRange: !!dateFilter.customRange
        },
        startDate,
        endDate,
        startDateObj: new Date(startDate),
        endDateObj: new Date(endDate),
        startDateFormatted: new Date(startDate).toLocaleString(),
        endDateFormatted: new Date(endDate).toLocaleString(),
        current_time: new Date().toISOString(),
        current_component_state: {
          transactionTypeFilter,
          selectedCategory,
          selectedPaymentMethod
        }
      });
      
      // Log for diagnostics
      console.time("💡 DIAGNOSTIC: expenseApi.getAllByUser call duration");
      console.log(`💡 DIAGNOSTIC: Calling expenseApi.getAllByUser with:`, {
        userId, 
        options: {
          limit: 100, // Increased from 50 to ensure we capture all transactions
          startDate: startDate,
          startDateType: typeof startDate,
          endDate: endDate,
          endDateType: typeof endDate
        }
      });
      
      // Convert dates to ISO strings to match expected types in expenseApi
      const startDateIso = typeof startDate === 'string' ? startDate : new Date(startDate).toISOString();
      const endDateIso = typeof endDate === 'string' ? endDate : new Date(endDate).toISOString();
      
      // Fetch expenses with pagination and date range - increased limit to ensure all transactions are captured
      const expenseData = await expenseApi.getAllByUser(userId, {
        limit: 100, // Increased from 50 to ensure we capture all transactions
        startDate: startDateIso, 
        endDate: endDateIso
      });
      
      console.timeEnd("💡 DIAGNOSTIC: expenseApi.getAllByUser call duration");
      
      // TARGETED DEBUG: Look specifically for expense ID 52
      const targetExpense = expenseData.find(e => e.id === 52);
      if (targetExpense) {
        console.log("🎯 TARGET FOUND: Expense ID 52 was returned from the API:", {
          id: targetExpense.id,
          date: targetExpense.date,
          dateObj: new Date(targetExpense.date),
          inDateRange: isDateInRange(targetExpense.date, startDateIso, endDateIso),
          payment_method_id: targetExpense.payment_method_id,
          description: targetExpense.description,
          transaction_type: targetExpense.transaction_type,
          items: targetExpense.expense_items?.map(item => ({
            id: item.id,
            amount: item.amount,
            category_id: item.category_id,
            description: item.description
          })) || 'No items'
        });
      } else {
        console.warn("🎯 TARGET MISSING: Expense ID 52 was NOT returned from the API");
        console.log("Current date filter:", { startDateIso, endDateIso });
        console.log("Try temporarily removing date filters to see if it appears");
      }
      
      // Add more detailed logging about results
      console.log(`💡 DIAGNOSTIC: TransactionList: Got ${expenseData.length} expenses from API`, {
        hasSomeData: expenseData.length > 0,
        newest_expense: expenseData.length > 0 ? {
          id: expenseData[0]?.id,
          date: expenseData[0]?.date,
          dateFormatted: new Date(expenseData[0]?.date).toLocaleString(),
          dateInRange: isDateInRange(expenseData[0]?.date, startDateIso, endDateIso),
          description: expenseData[0]?.description,
          first_item: expenseData[0]?.expense_items?.[0]?.description || 'No items',
          transaction_type: expenseData[0]?.transaction_type,
          expense_items: expenseData[0]?.expense_items?.map(item => ({
            id: item.id,
            category_id: item.category_id,
            amount: item.amount,
            description: item.description
          }))
        } : 'No expenses',
        originalDateRange: {
          startDate: startDateIso,
          endDate: endDateIso
        }
      });
      
      // Check for expenses with no valid expense_items
      let validExpenses = expenseData.filter(expense => 
        expense.expense_items && expense.expense_items.length > 0
      );
      
      if (validExpenses.length !== expenseData.length) {
        console.warn(`💡 DIAGNOSTIC: Found ${expenseData.length - validExpenses.length} expenses with no valid expense items`);
        
        // Log the expenses with no items for debugging
        const invalidExpenses = expenseData.filter(expense => 
          !expense.expense_items || expense.expense_items.length === 0
        );
        
        invalidExpenses.forEach((expense, index) => {
          if (index < 3) { // Just log the first 3 to avoid console spam
            console.warn(`💡 DIAGNOSTIC: Expense with no items: ID=${expense.id}, Date=${expense.date}, Type=${expense.transaction_type}`);
          }
        });
      }
      
      // TARGETED DEBUG: Check if expense ID 52 was filtered out due to no items
      if (targetExpense && !validExpenses.some(e => e.id === 52)) {
        console.warn("🎯 TARGET FILTERED: Expense ID 52 was filtered out because it has no valid expense_items");
        console.log("Original expense:", targetExpense);
      }
      
      // Sort expenses by date (newest first)
      validExpenses = validExpenses.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      
      console.log(`💡 DIAGNOSTIC: Setting ${validExpenses.length} valid expenses in state for date range: ${startDateIso} to ${endDateIso}`);
      
      // Log each expense date for debugging
      if (validExpenses.length > 0) {
        console.log("💡 DIAGNOSTIC: Transaction dates in result set:");
        validExpenses.forEach((expense, index) => {
          if (index < 10) { // Log more, but still limit to avoid spam
            console.log(`  ${index}: ID=${expense.id}, Date=${expense.date} (${new Date(expense.date).toLocaleString()}), Type=${expense.transaction_type}, Description=${expense.description || 'No description'}, Items: ${expense.expense_items?.length || 0}`);
          }
        });
      } else {
        console.warn("💡 DIAGNOSTIC: No valid transactions found in the specified date range");
        console.log("💡 DIAGNOSTIC: Checking dateFilter state:", dateFilter);
      }
      
      setExpenses(validExpenses);
      
      // Fetch categories and payment methods for filters
      const categoryData = await expenseApi.getCategories();
      setCategories(categoryData);
      
      // Fetch payment methods from the API
      const paymentMethodsData = await expenseApi.getPaymentMethods();
      setPaymentMethods(paymentMethodsData);
    } catch (err) {
      console.error('💡 DIAGNOSTIC: Error fetching expense data:', err);
      setError('Failed to fetch transaction data. Please try again.');
      toast({
        title: 'Error',
        description: 'Failed to load transactions',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, getDateRangeForFilter, userId, dateFilter, transactionTypeFilter, selectedCategory, selectedPaymentMethod]);
  
  // Helper function to check if a date is within a range - improved with better error handling
  const isDateInRange = (dateStr, startDate, endDate) => {
    if (!dateStr) return false;
    
    try {
      const date = new Date(dateStr).getTime();
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime();
      
      const isInRange = date >= start && date <= end;
      
      if (!isInRange) {
        console.log(`Date ${dateStr} (${new Date(dateStr).toLocaleString()}) is outside range: ${startDate} - ${endDate}`);
      }
      
      return isInRange;
    } catch (error) {
      console.error(`Error checking if date ${dateStr} is in range:`, error);
      return false; // Default to false on error
    }
  };
  
  useEffect(() => {
    fetchTransactions();
    
    // Only set up subscription if we have a user ID
    if (!userId) return;
    
    // Set up subscription to real-time updates
    const subscription = expenseApi.subscribeToExpenses(userId, (payload) => {
      // Refetch data when changes occur
      fetchTransactions();
      
      // Also refresh dashboard data
      refreshData();
    });
    
    return () => {
      subscription?.unsubscribe();
    };
  }, [fetchTransactions, refreshData, userId]);
  
  // Open delete confirmation dialog
  const confirmDelete = (expenseId: number) => {
    setExpenseToDelete(expenseId);
    setIsDeleteDialogOpen(true);
  };
  
  // --- Refactored Delete Mutation --- 
  const deleteMutation = useMutation({
    mutationFn: async (expenseId: number) => {
      return await expenseApi.delete(expenseId);
    },
    onSuccess: (data, expenseId) => {
      toast({
        title: 'Transaction deleted',
        variant: 'default',
      });
      
      // Invalidate queries after successful deletion
      queryClient.invalidateQueries({ queryKey: ['expenses', userId] }); 
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary', userId] });
      queryClient.invalidateQueries({ queryKey: ['spendingByCategory', userId] });
      queryClient.invalidateQueries({ queryKey: ['spendingByPayment', userId] });
      
      // Invalidate BudgetTracker queries
      queryClient.invalidateQueries({ queryKey: ['budgets'] }); // Invalidate all budgets queries
      queryClient.invalidateQueries({ queryKey: ['budgetSpending'] }); // Invalidate all budget spending queries
      queryClient.invalidateQueries({ queryKey: ['budgetCategorySpending'] }); // Invalidate all budget category spending queries
      
      // Optional: Update local state immediately for better UX (Optimistic update could also be used)
      setExpenses(prev => prev.filter(expense => expense.id !== expenseId));

      // Close the dialog
      setIsDeleteDialogOpen(false);
      setExpenseToDelete(null);
      
      // Optional: refreshData();
    },
    onError: (error) => {
      console.error('Error deleting expense:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete transaction',
        variant: 'destructive',
      });
      // Close the dialog even on error
      setIsDeleteDialogOpen(false);
      setExpenseToDelete(null);
    },
  });

  // Call the mutation when delete is confirmed
  const handleDelete = () => {
    if (!expenseToDelete) return;
    deleteMutation.mutate(expenseToDelete);
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
  const handleTransactionAdded = useCallback(() => {
    console.log('Transaction added, refreshing data...');
    fetchTransactions();
  }, [fetchTransactions]);
  
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
    <Card className="shadow-purple">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-xl font-bold">Transactions</CardTitle>
          <CardDescription>View and manage your transactions for {dateRangeText}</CardDescription>
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
        <div className="mb-6" onClick={(e) => e.stopPropagation()}>
          <Tabs 
            defaultValue="all" 
            value={transactionTypeFilter} 
            onValueChange={handleTransactionTypeChange}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All Transactions</TabsTrigger>
              <TabsTrigger value="expense">Expenses</TabsTrigger>
              <TabsTrigger value="income">Income</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        {/* Filters */}
        <div className="space-y-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                <Input
                  className="pl-9"
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by category" />
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
            </div>
            
            <div>
              <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by payment" />
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
            <p>{error}</p>
            <Button 
              variant="outline" 
              className="mt-2"
              onClick={() => expenseApi.getAllByUser(userId).then(setExpenses).catch(console.error)}
            >
              Try Again
            </Button>
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
                <div key={expense.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-md hover:bg-muted/50 transition-colors hover:shadow-purple-sm">
                  <div className="flex items-start gap-3 mb-2 sm:mb-0">
                    <div className="hidden sm:flex h-10 w-10 rounded-full items-center justify-center bg-primary/10">
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
                        {/* Only show the Income badge, not the Expense badge */}
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
                  
                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
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
          <AlertDialogTitle>Are you sure you want to delete this transaction?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the transaction.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
};

export default TransactionList;