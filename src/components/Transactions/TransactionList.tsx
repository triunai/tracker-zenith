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
  LoaderCircle
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
  
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('all');
  
  const { toast } = useToast();
  
  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch expenses with pagination
        const expenseData = await expenseApi.getAllByUser(MOCK_USER_ID, {
          limit: 50 // fetch a larger batch initially for client-side filtering
        });
        setExpenses(expenseData);
        
        // Fetch categories and payment methods for filters
        const categoryData = await expenseApi.getCategories();
        setCategories(categoryData);
        
        // For now, we'll use a mock array for payment methods
        // TODO: Replace with actual API call once implemented
        setPaymentMethods([
          { id: 1, method_name: 'Cash', isdeleted: false, created_at: '' },
          { id: 2, method_name: 'Credit Card', isdeleted: false, created_at: '' },
          { id: 3, method_name: 'Debit Card', isdeleted: false, created_at: '' },
          { id: 4, method_name: 'E-Wallet', isdeleted: false, created_at: '' }
        ]);
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
    };
    
    fetchData();
    
    // Set up subscription to real-time updates
    const subscription = expenseApi.subscribeToExpenses(MOCK_USER_ID, (payload) => {
      // Refetch data when changes occur
      fetchData();
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, [toast]);
  
  // Delete a transaction
  const handleDelete = async (expenseId: number) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      try {
        await expenseApi.delete(expenseId);
        setExpenses(expenses.filter(expense => expense.id !== expenseId));
        toast({
          title: 'Transaction deleted',
          variant: 'default',
        });
      } catch (err) {
        console.error('Error deleting expense:', err);
        toast({
          title: 'Error',
          description: 'Failed to delete transaction',
          variant: 'destructive',
        });
      }
    }
  };
  
  // Filter and paginate expenses
  const filteredExpenses = useMemo(() => {
    try {
      return expenses
        .filter(expense => {
          // Search filter - check if any expense item description matches
          const matchesSearch = searchTerm === '' || 
            expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            expense.expense_items?.some(item => 
              item.description?.toLowerCase().includes(searchTerm.toLowerCase())
            );
          
          // Category filter
          const matchesCategory = selectedCategory === 'all' ? true : 
            expense.expense_items?.some(item => 
              item.category_id.toString() === selectedCategory
            );
            
          // Payment method filter
          const matchesPaymentMethod = selectedPaymentMethod === 'all' ? true :
            expense.payment_method_id?.toString() === selectedPaymentMethod;
            
          return matchesSearch && matchesCategory && matchesPaymentMethod;
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (error) {
      console.error('Error filtering expenses:', error);
      return [];
    }
  }, [expenses, searchTerm, selectedCategory, selectedPaymentMethod]);
  
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
  }, [searchTerm, selectedCategory, selectedPaymentMethod]);

  // Handle reload after adding a new transaction
  const handleTransactionAdded = () => {
    // Refetch the expenses data
    expenseApi.getAllByUser(MOCK_USER_ID, { limit: 50 })
      .then(data => setExpenses(data))
      .catch(err => console.error('Error refreshing expenses:', err));
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-xl font-bold">Transactions</CardTitle>
          <CardDescription>View and manage your transaction history</CardDescription>
        </div>
        <TransactionForm />
      </CardHeader>
      
      <CardContent>
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
            {searchTerm || selectedCategory !== 'all' || selectedPaymentMethod !== 'all' ? (
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
                      <CreditCard className="h-5 w-5 text-primary" />
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
                      <div className="font-medium text-destructive">
                        {formatMYR(totalAmount)}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => console.log('Edit transaction', expense.id)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(expense.id)}>
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
  );
};

export default TransactionList;
