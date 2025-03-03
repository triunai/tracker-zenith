
import React, { useState, useMemo } from 'react';
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
  Home,
  Utensils,
  Car,
  Tv,
  ShoppingBag,
  Zap,
  Activity,
  Book,
  Package,
  Plus,
  Wallet,
  ChevronsUpDown
} from 'lucide-react';

// Import UI components with lowercase 'ui' path for consistency
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/UI/card";
import { Button } from "@/components/UI/button";
import { Input } from "@/components/UI/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/UI/select";
import { categories, expenses, PaymentMethod, getPaymentMethodName } from '@/lib/mockData';

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
  try {
    // Debug logs
    console.log('TransactionList rendering');
    console.log('Expenses available:', expenses ? expenses.length : 'none');
    
    // State management
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('all');
    
    // Get data from mockData (with error handling)
    const allTransactions = expenses || [];
    
    // Filter and paginate transactions
    const filteredTransactions = useMemo(() => {
      try {
        return allTransactions
          .filter(transaction => {
            // Search filter
            const matchesSearch = searchTerm === '' || transaction.expenseItems.some(item => 
              item?.description?.toLowerCase().includes(searchTerm.toLowerCase())
            );
            
            // Category filter
            const matchesCategory = selectedCategory === 'all' ? true : 
              transaction.expenseItems.some(item => 
                item?.categoryId?.toString() === selectedCategory
              );
              
            // Payment method filter
            const matchesPaymentMethod = selectedPaymentMethod === 'all' ? true :
              transaction.expenseItems.some(item => 
                item?.paymentMethod?.toString() === selectedPaymentMethod
              );
              
            return matchesSearch && matchesCategory && matchesPaymentMethod;
          })
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice((currentPage - 1) * pageSize, currentPage * pageSize);
      } catch (error) {
        console.error('Error filtering transactions:', error);
        return [];
      }
    }, [allTransactions, searchTerm, selectedCategory, selectedPaymentMethod, currentPage, pageSize]);
    
    const totalTransactions = useMemo(() => {
      try {
        return allTransactions.filter(transaction => {
          // Apply the same filters for counting total
          const matchesSearch = searchTerm === '' || transaction.expenseItems.some(item => 
            item?.description?.toLowerCase().includes(searchTerm.toLowerCase())
          );
          
          const matchesCategory = selectedCategory === 'all' ? true : 
            transaction.expenseItems.some(item => 
              item?.categoryId?.toString() === selectedCategory
            );
            
          const matchesPaymentMethod = selectedPaymentMethod === 'all' ? true :
            transaction.expenseItems.some(item => 
              item?.paymentMethod?.toString() === selectedPaymentMethod
            );
            
          return matchesSearch && matchesCategory && matchesPaymentMethod;
        }).length;
      } catch (error) {
        console.error('Error counting transactions:', error);
        return 0;
      }
    }, [allTransactions, searchTerm, selectedCategory, selectedPaymentMethod]);
    
    const totalPages = Math.max(1, Math.ceil(totalTransactions / pageSize));

    // Get appropriate icon for each category
    const getCategoryIcon = (categoryId: number) => {
      try {
        const category = categories.find(c => c.id === categoryId);
        if (!category) return <Package className="h-4 w-4" />;
        
        switch (category.icon) {
          case 'home': return <Home className="h-4 w-4" />;
          case 'utensils': return <Utensils className="h-4 w-4" />;
          case 'car': return <Car className="h-4 w-4" />;
          case 'tv': return <Tv className="h-4 w-4" />;
          case 'shopping-bag': return <ShoppingBag className="h-4 w-4" />;
          case 'zap': return <Zap className="h-4 w-4" />;
          case 'activity': return <Activity className="h-4 w-4" />;
          case 'book': return <Book className="h-4 w-4" />;
          case 'package':
          default: return <Package className="h-4 w-4" />;
        }
      } catch (error) {
        console.error('Error rendering category icon:', error);
        return <CreditCard className="h-4 w-4" />;
      }
    };

    return (
      <Card className="col-span-3">
        <CardHeader className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Recent expense transactions</CardDescription>
            </div>
            <TransactionForm />
          </div>
          
          {/* Search and Filter Bar */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px]">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  <SelectValue placeholder="All Categories" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                      ></div>
                      {category.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Payment Method Filter */}
            <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
              <SelectTrigger className="w-[180px]">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  <SelectValue placeholder="All Payment Methods" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payment Methods</SelectItem>
                {Object.values(PaymentMethod)
                  .filter(value => typeof value === 'number')
                  .map((method) => (
                    <SelectItem key={method} value={method.toString()}>
                      {getPaymentMethodName(method as PaymentMethod)}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {/* Transactions List */}
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No transactions found matching your criteria
              </div>
            ) : (
              filteredTransactions.map(transaction => {
                try {
                  const firstItem = transaction.expenseItems[0];
                  if (!firstItem) {
                    return null;
                  }
                  
                  const isExpense = transaction.totalAmount > 0;
                  
                  return (
                    <div 
                      key={transaction.id} 
                      className="flex items-center p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="mr-4 rounded-full p-2" 
                          style={{ 
                            backgroundColor: firstItem?.category?.color 
                              ? `${firstItem.category.color}30` 
                              : '#e5e5e530'
                          }}>
                        {getCategoryIcon(firstItem?.categoryId)}
                      </div>
                      
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {firstItem?.description || 'Unnamed transaction'}
                        </p>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <CalendarIcon className="mr-1 h-3 w-3" />
                          <span>{transaction.date}</span>
                        </div>
                      </div>
                      
                      <div className={`font-medium mr-4 ${isExpense ? 'text-red-500' : 'text-green-500'}`}>
                        {isExpense 
                          ? `-${formatMYR(transaction.totalAmount)}` 
                          : `+${formatMYR(transaction.totalAmount)}`}
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                } catch (error) {
                  console.error('Error rendering transaction:', error);
                  return null;
                }
              }).filter(Boolean)
            )}

            {/* Pagination Controls */}
            {filteredTransactions.length > 0 && (
              <div className="flex items-center justify-between pt-4">
                <div className="flex items-center gap-2">
                  <Select
                    value={pageSize.toString()}
                    onValueChange={(value) => {
                      setPageSize(Number(value));
                      setCurrentPage(1); // Reset to first page when changing page size
                    }}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="5 per page" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 per page</SelectItem>
                      <SelectItem value="10">10 per page</SelectItem>
                      <SelectItem value="20">20 per page</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-muted-foreground">
                    Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalTransactions)} of {totalTransactions}
                  </span>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  } catch (error) {
    console.error('TransactionList error:', error);
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <p className="font-bold">Error rendering TransactionList</p>
        <p>{error instanceof Error ? error.message : 'Unknown error'}</p>
      </div>
    );
  }
};

export default TransactionList;
