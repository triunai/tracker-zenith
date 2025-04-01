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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/UI/card";
import { Button } from "@/components/UI/button";
import { Input } from "@/components/UI/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/UI/select";
import { Expense, ExpenseCategory } from '@/interfaces/expense-interface';
import { PaymentMethod } from '@/interfaces/payment-method-interface';
import { expenseApi } from '@/lib/api/expenseApi';
import { useToast } from '@/components/UI/use-toast';
import { Badge } from '@/components/UI/badge';
import { format } from 'date-fns';
import { useDashboard } from '@/context/DashboardContext';
import { Tabs, TabsList, TabsTrigger } from "@/components/UI/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/UI/alert-dialog";

// Placeholder until we implement proper auth
const MOCK_USER_ID = "11111111-1111-1111-1111-111111111111";

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
  const { refreshData, dateFilter, dateRangeText } = useDashboard();
  
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
    
    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    };
  }, [dateFilter]);
  
  // Fetch data from API
  const fetchTransactions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get date range from filter
      const { startDate, endDate } = getDateRangeForFilter();
      
      // Fetch expenses with pagination and date range
      const expenseData = await expenseApi.getAllByUser(MOCK_USER_ID, {
        limit: 50, // fetch a larger batch initially for client-side filtering
        startDate,
        endDate
      });
      
      // Check for expenses with no valid expense_items
      let validExpenses = expenseData.filter(expense => 
        expense.expense_items && expense.expense_items.length > 0
      );
      
      if (validExpenses.length !== expenseData.length) {
        console.warn(`Found ${expenseData.length - validExpenses.length} expenses with no valid expense items`);
      }
      
      // Sort expenses by date (newest first)
      validExpenses = validExpenses.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      
      console.log(`Setting ${validExpenses.length} valid expenses in state for date range: ${startDate} to ${endDate}`);
      setExpenses(validExpenses);
      
      // Fetch categories and payment methods for filters
      const categoryData = await expenseApi.getCategories();
      setCategories(categoryData);
      
      // Fetch payment methods from the API
      const paymentMethodsData = await expenseApi.getPaymentMethods();
      setPaymentMethods(paymentMethodsData);
    } catch (err) {
      console.error('Error fetching expense data:', err);
      setError('Failed to fetch transaction data. Please try again.');
      toast({
        title: 'Error',
        description: 'Failed to load transactions',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, getDateRangeForFilter]);
  
  useEffect(() => {
    fetchTransactions();
    
    // Set up subscription to real-time updates
    const subscription = expenseApi.subscribeToExpenses(MOCK_USER_ID, (payload) => {
      // Refetch data when changes occur
      fetchTransactions();
      
      // Also refresh dashboard data
      refreshData();
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, [fetchTransactions, refreshData]);
  
  // Open delete confirmation dialog
  const confirmDelete = (expenseId: number) => {
    setExpenseToDelete(expenseId);
    setIsDeleteDialogOpen(true);
  };
  
  // Delete a transaction
  const handleDelete = async () => {
    if (!expenseToDelete) return;
    
    try {
      await expenseApi.delete(expenseToDelete);
      setExpenses(expenses.filter(expense => expense.id !== expenseToDelete));
      toast({
        title: 'Transaction deleted',
        variant: 'default',
      });
      
      // Refresh dashboard data
      refreshData();
    } catch (err) {
      console.error('Error deleting expense:', err);
      toast({
        title: 'Error',
        description: 'Failed to delete transaction',
        variant: 'destructive',
      });
    } finally {
      setExpenseToDelete(null);
      setIsDeleteDialogOpen(false);
    }
  };
  
  // Filter and paginate expenses
  const filteredExpenses = useMemo(() => {
    try {
      return expenses
        .filter(expense => {
          // Transaction type filter
          if (transactionTypeFilter !== 'all') {
            if (expense.transaction_type !== transactionTypeFilter) {
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
            
          return matchesSearch && matchesCategory && matchesPaymentMethod;
        });
        // Note: We already sort in fetchTransactions, and by default the API returns sorted data
    } catch (error) {
      console.error('Error filtering expenses:', error);
      return [];
    }
  }, [expenses, searchTerm, selectedCategory, selectedPaymentMethod, transactionTypeFilter]);
  
  // Paginate transactions
  const paginatedExpenses = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredExpenses.slice(startIndex, startIndex + pageSize);
  }, [filteredExpenses, currentPage, pageSize]);
  
  // Calculate total pages
  const totalPages = Math.ceil(filteredExpenses.length / pageSize);
  
  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedPaymentMethod, transactionTypeFilter, dateFilter]);

  // Handle initiating editing of a transaction
  const handleEditTransaction = (expense: Expense) => {
    setExpenseToEdit(expense);
  };

  // Handle reload after adding or editing a transaction
  const handleTransactionAdded = () => {
    // Refetch the expenses data
    fetchTransactions();
    // Also refresh dashboard data
    refreshData();
    // Clear any editing state
    setExpenseToEdit(null);
  };

  return (
    <>
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-xl font-bold">Transactions</CardTitle>
          <CardDescription>View and manage your transactions for {dateRangeText}</CardDescription>
        </div>
        <TransactionForm onSuccess={handleTransactionAdded} />
      </CardHeader>
      
      <CardContent>
        {/* Transaction Type Filter */}
        <div className="mb-6" onClick={(e) => e.stopPropagation()}>
          <Tabs 
            defaultValue="all" 
            value={transactionTypeFilter} 
            onValueChange={(value) => setTransactionTypeFilter(value as 'all' | 'expense' | 'income')}
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
              onClick={() => expenseApi.getAllByUser(MOCK_USER_ID).then(setExpenses).catch(console.error)}
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
                <div key={expense.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-md hover:bg-muted/50 transition-colors">
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
                      <TransactionForm 
                        expenseToEdit={expense} 
                        onSuccess={handleTransactionAdded}
                        buttonVariant="ghost"
                        buttonSize="icon"
                        asChild={false}
                        buttonText=""
                        buttonIcon={<Edit className="h-4 w-4" />}
                      />
                      <Button variant="ghost" size="icon" onClick={() => confirmDelete(expense.id)}>
                        <Trash2 className="h-4 w-4" />
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
