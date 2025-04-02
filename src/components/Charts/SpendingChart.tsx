import React, { useState, useEffect, useCallback } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/UI/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/UI/tabs";
import { formatCurrency } from '@/lib/utils';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Legend, 
  Tooltip, 
  BarChart, 
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  TooltipProps
} from 'recharts';
import { expenseApi } from '@/lib/api/expenseApi';
import { LoaderCircle } from 'lucide-react';
import { useDashboard } from '@/context/DashboardContext';
import { Skeleton } from '@/components/UI/skeleton';
import { supabase } from '@/lib/supabase/supabase';
import { format } from 'date-fns';

// Colors for the chart
const CATEGORY_COLORS = [
  '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
  '#FF9F40', '#2FCC71', '#F1C40F', '#E74C3C', '#9B59B6'
];

const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-popover border shadow-md rounded-md p-2 text-sm">
        <p className="font-medium">{payload[0].name}</p>
        <p className="text-primary">{formatCurrency(payload[0].value as number)}</p>
        {data.percentage && (
          <p className="text-muted-foreground text-xs">
            {data.percentage.toFixed(1)}% of total
          </p>
        )}
      </div>
    );
  }

  return null;
};

// Helper function to add timeout to supabase calls
const withTimeout = (promise, timeoutMs = 10000) => {
  let timeoutId;
  
  // Create a promise that rejects after the specified timeout
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Operation timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });
  
  // Return a promise that resolves/rejects with the result of whichever promise 
  // completes first (the original promise or the timeout)
  return Promise.race([
    promise,
    timeoutPromise
  ]).finally(() => {
    clearTimeout(timeoutId);
  });
};

const SpendingChart = () => {
  const { dateFilter, userId, dateRangeText } = useDashboard();
  const [chartType, setChartType] = useState('pie');
  const [dataType, setDataType] = useState('category');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for chart data
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [paymentData, setPaymentData] = useState<any[]>([]);
  
  // Get date range based on filter
  const getDateRangeForFilter = useCallback(() => {
    let startDate: Date, endDate: Date;
    
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
          startDate = new Date(dateFilter.customRange.startDate);
          endDate = new Date(dateFilter.customRange.endDate);
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
      startDate,
      endDate
    };
  }, [dateFilter]);
  
  // Load spending data
  const loadChartData = useCallback(async () => {
    if (!userId) {
      console.log('❌ [SpendingChart] Aborting data fetch - no userId available');
      setIsLoading(false);
      return;
    }
    
    try {
      console.log('🔍 [SpendingChart] Starting to load chart data...');
      setIsLoading(true);
      setError(null);
      
      // Verify that we have a valid user ID before proceeding
      if (!userId || typeof userId !== 'string' || userId.trim() === '') {
        console.error('❌ [SpendingChart] Invalid userId:', userId);
        setError("User authentication issue. Please log in again.");
        setIsLoading(false);
        return;
      }
      
      const { startDate, endDate } = getDateRangeForFilter();
      console.log(`🔍 [SpendingChart] Date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);
      console.log(`🔍 [SpendingChart] User ID: ${userId}`);
      
      // Fetch spending by category
      console.log('🔍 [SpendingChart] Calling get_spending_by_category...');
      // Add explicit parameters to ensure SQL function only returns current user's data
      const spendingByCategoryPromise = supabase
        .rpc('get_spending_by_category', {
          p_user_id: userId,
          p_start_date: startDate.toISOString(),
          p_end_date: endDate.toISOString()
        });
      
      const spendingByCategoryResponse = await withTimeout(spendingByCategoryPromise, 8000);
      
      if (spendingByCategoryResponse.error) {
        console.error('❌ [SpendingChart] Error fetching spending by category:', spendingByCategoryResponse.error);
        throw spendingByCategoryResponse.error;
      }
      
      const spendingByCategory = spendingByCategoryResponse.data;
      console.log(`✅ [SpendingChart] Received spending by category: ${spendingByCategory?.length} records`);
      
      // Verify data belongs to current user (additional safety check)
      if (spendingByCategory && spendingByCategory.length > 0) {
        console.log(`✅ [SpendingChart] Original categories count: ${spendingByCategory.length}`);
        console.log(`✅ [SpendingChart] Raw data:`, 
          spendingByCategory.slice(0, 10).map((item: any) => ({
            category: item.category_name,
            amount: parseFloat(item.amount)
          }))
        );
        
        // Log non-zero categories
        const categoriesWithValues = spendingByCategory.filter((item: any) => parseFloat(item.amount) > 0);
        console.log(`✅ [SpendingChart] Non-zero categories (${categoriesWithValues.length}):`, 
          categoriesWithValues.map((item: any) => ({
            category: item.category_name,
            amount: parseFloat(item.amount)
          }))
        );
      }
      
      // Try to get payment method data from RPC, fallback to manual calculation if not available
      let paymentMethodData = [];
      
      try {
        console.log('🔍 [SpendingChart] Using expenseApi.getSummaryByPaymentMethod...');
        
        // Explicitly send current userId to ensure we only get current user's data
        const paymentSummary = await expenseApi.getSummaryByPaymentMethod(
          userId,
          startDate.toISOString(),
          endDate.toISOString()
        );
        
        paymentMethodData = paymentSummary.map(item => ({
          method_name: item.method_name,
          amount: item.total
        }));
        
        console.log(`✅ [SpendingChart] Received spending by payment method: ${paymentMethodData.length} records`);
      } catch (err) {
        // Fallback to using the expenseApi to get payment method data
        console.log('🔍 [SpendingChart] Fallback: getting payment method data from expenses...');
        
        // Get expenses data - ensure we're only getting current user's data
        const expensesResponse = await expenseApi.getAllByUser(userId, {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        });
        
        // Verify expenses are for current user only
        if (expensesResponse && Array.isArray(expensesResponse) && expensesResponse.length > 0) {
          const firstExpense = expensesResponse[0];
          console.log(`✅ [SpendingChart] Expense user verification:`, {
            expense_user_id: firstExpense.user_id,
            current_user_id: userId,
            matching: firstExpense.user_id === userId
          });
          
          if (firstExpense.user_id !== userId) {
            console.error('❌ [SpendingChart] Expense data mismatch! Expected user:', userId, 'Got:', firstExpense.user_id);
            throw new Error('Data privacy issue detected. Please contact support.');
          }
        }
        
        // Group by payment method
        const paymentMap = new Map<number, { method_name: string; amount: number }>();
        
        if (expensesResponse && Array.isArray(expensesResponse)) {
          // Process each expense
          expensesResponse.forEach(expense => {
            if (!expense.payment_method_id || !expense.payment_method) return;
            
            const paymentMethodId = expense.payment_method_id;
            const methodName = expense.payment_method.method_name;
            
            // Calculate total amount for this expense
            const totalAmount = expense.expense_items?.reduce((sum, item) => 
              sum + Number(item.amount), 0) || 0;
            
            if (paymentMap.has(paymentMethodId)) {
              // Add to existing payment method
              const current = paymentMap.get(paymentMethodId)!;
              paymentMap.set(paymentMethodId, {
                method_name: current.method_name,
                amount: current.amount + totalAmount
              });
            } else {
              // Create new payment method entry
              paymentMap.set(paymentMethodId, {
                method_name: methodName,
                amount: totalAmount
              });
            }
          });
          
          // Convert map to array
          paymentMethodData = Array.from(paymentMap.values());
          console.log(`✅ [SpendingChart] Fallback: created payment method data with ${paymentMethodData.length} records`);
        } else {
          console.log('⚠️ [SpendingChart] Fallback: could not get expenses for payment methods');
        }
      }
      
      // Prepare data for spending by category chart
      if (spendingByCategory && spendingByCategory.length > 0) {
        console.log('🔍 [SpendingChart] Processing spending by category data...');
        
        // Filter out categories with zero amounts
        const validCategories = spendingByCategory.filter((item: any) => 
          parseFloat(item.amount) > 0
        );
        
        console.log(`🔍 [SpendingChart] Filtered ${spendingByCategory.length} categories down to ${validCategories.length} with non-zero amounts`);
        
        // Sort by amount descending
        validCategories.sort((a: any, b: any) => parseFloat(b.amount) - parseFloat(a.amount));
        
        // Calculate total amount for percentage threshold
        const totalAmount = validCategories.reduce((sum: number, item: any) => 
          sum + parseFloat(item.amount), 0);
        
        // Get top 8 categories and group the rest as "Other"
        const MAX_CATEGORIES = 8;
        const MIN_PERCENTAGE = 1; // Categories must be at least 1% of total to be shown individually
        
        let formattedCategoryData = [];
        let otherAmount = 0;
        
        validCategories.forEach((item: any, index: number) => {
          const amount = parseFloat(item.amount);
          const percentage = (amount / totalAmount) * 100;
          
          // Add to top categories if it's in the top 8 AND above the minimum percentage threshold
          if (index < MAX_CATEGORIES && percentage >= MIN_PERCENTAGE) {
            formattedCategoryData.push({
              name: item.category_name,
              value: amount,
              color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
              percentage: percentage
            });
          } else {
            // Otherwise add to "Other"
            otherAmount += amount;
          }
        });
        
        // Add "Other" category if it has a value
        if (otherAmount > 0) {
          formattedCategoryData.push({
            name: 'Other',
            value: otherAmount,
            color: '#888888', // Gray color for "Other"
            percentage: (otherAmount / totalAmount) * 100
          });
        }
        
        setCategoryData(formattedCategoryData);
        console.log('✅ [SpendingChart] Spending by category data processed with top categories');
      } else {
        console.log('ℹ️ [SpendingChart] No spending by category data available');
        setCategoryData([]);
      }
      
      // Prepare data for spending by payment method chart
      if (paymentMethodData && paymentMethodData.length > 0) {
        console.log('🔍 [SpendingChart] Processing spending by payment method data...');
        
        // Filter out payment methods with zero amounts
        const validPaymentMethods = paymentMethodData.filter((item: any) => 
          parseFloat(item.amount) > 0
        );
        
        console.log(`🔍 [SpendingChart] Filtered ${paymentMethodData.length} payment methods down to ${validPaymentMethods.length} with non-zero amounts`);
        
        // Sort by amount descending
        validPaymentMethods.sort((a: any, b: any) => parseFloat(b.amount) - parseFloat(a.amount));
        
        // Calculate total amount for percentage threshold
        const totalAmount = validPaymentMethods.reduce((sum: number, item: any) => 
          sum + parseFloat(item.amount), 0);
        
        // Get top 8 payment methods and group the rest as "Other"
        const MAX_PAYMENT_METHODS = 8;
        const MIN_PERCENTAGE = 1; // Payment methods must be at least 1% of total to be shown individually
        
        let formattedPaymentData = [];
        let otherAmount = 0;
        
        validPaymentMethods.forEach((item: any, index: number) => {
          const amount = parseFloat(item.amount);
          const percentage = (amount / totalAmount) * 100;
          
          // Add to top payment methods if it's in the top MAX_PAYMENT_METHODS AND above the minimum threshold
          if (index < MAX_PAYMENT_METHODS && percentage >= MIN_PERCENTAGE) {
            formattedPaymentData.push({
              name: item.method_name || 'Unknown',
              value: amount,
              color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
              percentage: percentage
            });
          } else {
            // Otherwise add to "Other"
            otherAmount += amount;
          }
        });
        
        // Add "Other" category if it has a value
        if (otherAmount > 0) {
          formattedPaymentData.push({
            name: 'Other',
            value: otherAmount,
            color: '#888888', // Gray color for "Other"
            percentage: (otherAmount / totalAmount) * 100
          });
        }
        
        setPaymentData(formattedPaymentData);
        console.log('✅ [SpendingChart] Spending by payment method data processed with top methods');
      } else {
        console.log('ℹ️ [SpendingChart] No spending by payment method data available');
        setPaymentData([]);
      }
      
      console.log('✅ [SpendingChart] All chart data loaded successfully');
    } catch (err) {
      console.error("❌ [SpendingChart] Error loading chart data:", err);
      console.error("❌ [SpendingChart] Error details:", JSON.stringify(err, null, 2));
      setError("Failed to load chart data");
    } finally {
      console.log('🔍 [SpendingChart] Setting isLoading to false');
      setIsLoading(false);
    }
  }, [getDateRangeForFilter, userId]);
  
  // Load chart data when the component mounts or when date filter changes
  useEffect(() => {
    loadChartData();
  }, [loadChartData, dateFilter]);
  
  // Get current chart data based on data type
  const getCurrentChartData = () => {
    return dataType === 'category' ? categoryData : paymentData;
  };
  
  const chartData = getCurrentChartData();
  const hasData = chartData && chartData.length > 0;
  
  // Render loading skeleton
  if (isLoading) {
    return (
      <Card className="animate-fade-up animate-delay-300">
        <CardHeader>
          <CardTitle>Spending Analysis</CardTitle>
          <CardDescription>Loading your spending data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <div className="flex h-full flex-col items-center justify-center">
              <Skeleton className="h-[240px] w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Render error message
  if (error) {
    return (
      <Card className="animate-fade-up animate-delay-300">
        <CardHeader>
          <CardTitle>Spending Analysis</CardTitle>
          <CardDescription className="text-destructive">{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <p>Failed to load chart data. Please try again later.</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="animate-fade-up animate-delay-300">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <CardTitle>Spending Analysis</CardTitle>
            <CardDescription>Your expense breakdown for {dateRangeText}</CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Tabs 
              defaultValue="category" 
              value={dataType} 
              onValueChange={setDataType}
              className="w-[240px]"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="category">By Category</TabsTrigger>
                <TabsTrigger value="payment">By Payment</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <Tabs 
              defaultValue="pie" 
              value={chartType} 
              onValueChange={setChartType}
              className="w-[240px]"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="pie">Pie Chart</TabsTrigger>
                <TabsTrigger value="bar">Bar Chart</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        {!hasData ? (
          <div className="h-[300px] w-full flex items-center justify-center text-muted-foreground">
            <p>No expense data available for {dateRangeText}</p>
          </div>
        ) : (
        <div className="h-[300px] w-full">
          {chartType === 'pie' ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value">
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SpendingChart;
