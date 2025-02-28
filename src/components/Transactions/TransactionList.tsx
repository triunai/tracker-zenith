
import React, { useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { 
  ArrowUpDown, 
  Calendar as CalendarIcon, 
  Filter,
  Search, 
  ChevronLeft, 
  ChevronRight,
  CreditCard
} from 'lucide-react';
import { categories, expenses, getPaymentMethodName, Expense, PaymentMethod } from '@/lib/mockData';
import CategoryBadge from '@/components/UI/CategoryBadge';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';

const TransactionList = () => {
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>(expenses);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;

  // Apply all filters
  const applyFilters = () => {
    let filtered = [...expenses];
    
    // Search text filter
    if (searchText) {
      filtered = filtered.filter(expense => 
        expense.notes.toLowerCase().includes(searchText.toLowerCase()) ||
        expense.expenseItems.some(item => 
          item.description.toLowerCase().includes(searchText.toLowerCase())
        )
      );
    }
    
    // Category filter
    if (categoryFilter !== 'all') {
      const categoryId = parseInt(categoryFilter);
      filtered = filtered.filter(expense => 
        expense.expenseItems.some(item => item.categoryId === categoryId)
      );
    }
    
    // Payment method filter
    if (paymentMethodFilter !== 'all') {
      const paymentMethod = parseInt(paymentMethodFilter) as PaymentMethod;
      filtered = filtered.filter(expense => 
        expense.expenseItems.some(item => item.paymentMethod === paymentMethod)
      );
    }
    
    // Date filter
    if (selectedDate) {
      filtered = filtered.filter(expense => {
        const expenseDate = new Date(expense.date);
        return (
          expenseDate.getDate() === selectedDate.getDate() &&
          expenseDate.getMonth() === selectedDate.getMonth() &&
          expenseDate.getFullYear() === selectedDate.getFullYear()
        );
      });
    }
    
    setFilteredExpenses(filtered);
  };
  
  // Reset all filters
  const resetFilters = () => {
    setSearchText('');
    setCategoryFilter('all');
    setPaymentMethodFilter('all');
    setSelectedDate(undefined);
    setFilteredExpenses(expenses);
  };
  
  // Handle search input change
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
    applyFilters();
  };
  
  // Paginated data
  const paginatedData = filteredExpenses.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );
  
  // Calculate total pages
  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);
  
  React.useEffect(() => {
    applyFilters();
  }, [searchText, categoryFilter, paymentMethodFilter, selectedDate]);
  
  return (
    <Card className="animate-fade-up animate-delay-100">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Recent Expenses</CardTitle>
            <CardDescription>
              You have {filteredExpenses.length} expenses
            </CardDescription>
          </div>
          <Button size="sm">View All</Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row justify-between gap-3 mb-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search expenses..."
              className="pl-8 w-full md:w-60"
              value={searchText}
              onChange={handleSearch}
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Select
              value={categoryFilter}
              onValueChange={setCategoryFilter}
            >
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Category" />
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
            
            <Select
              value={paymentMethodFilter}
              onValueChange={setPaymentMethodFilter}
            >
              <SelectTrigger className="w-full md:w-36">
                <SelectValue placeholder="Payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value={PaymentMethod.Cash.toString()}>Cash</SelectItem>
                <SelectItem value={PaymentMethod.CreditCard.toString()}>Credit Card</SelectItem>
                <SelectItem value={PaymentMethod.QRCodePayment.toString()}>QR Code</SelectItem>
                <SelectItem value={PaymentMethod.EWallet.toString()}>eWallet</SelectItem>
                <SelectItem value={PaymentMethod.BankTransfer.toString()}>Bank Transfer</SelectItem>
                <SelectItem value={PaymentMethod.DuitNow.toString()}>DuitNow</SelectItem>
              </SelectContent>
            </Select>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full md:w-auto">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, 'PP') : 'Date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            
            <Button 
              variant="outline" 
              size="icon" 
              onClick={resetFilters}
              title="Reset filters"
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead className="text-right">
                  Amount
                  <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-32 text-muted-foreground">
                    No expenses found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((expense) => {
                  // Most expenses will have only 1 item in our mock, but display the first one
                  const firstItem = expense.expenseItems[0];
                  const category = categories.find(c => c.id === firstItem?.categoryId);
                  
                  return (
                    <TableRow key={expense.id}>
                      <TableCell className="font-medium">
                        {format(new Date(expense.date), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        {firstItem?.description}
                        {expense.expenseItems.length > 1 && (
                          <span className="ml-1 text-xs text-muted-foreground">
                            (+{expense.expenseItems.length - 1} more)
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {category && <CategoryBadge category={category.name} />}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <CreditCard className="h-3 w-3 text-muted-foreground" />
                          {getPaymentMethodName(firstItem?.paymentMethod)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium text-finance-expense">
                        {formatCurrency(expense.totalAmount)}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Showing {(page - 1) * itemsPerPage + 1} to{' '}
              {Math.min(page * itemsPerPage, filteredExpenses.length)} of{' '}
              {filteredExpenses.length} entries
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
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
