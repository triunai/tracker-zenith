import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { useQuery } from '@tanstack/react-query';
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

// Helper function to format chart data (group small slices into "Other")
const formatChartData = (rawData: any[], nameKey: string, valueKey: string, maxSlices = 8, minPercentage = 1) => {
  if (!rawData || rawData.length === 0) return [];

  // Filter out zero/invalid amounts and ensure value is numeric
  const validData = rawData
    .map(item => ({ ...item, [valueKey]: parseFloat(item[valueKey]) })) // Ensure correct key is parsed
    .filter(item => !isNaN(item[valueKey]) && item[valueKey] > 0);

  if (validData.length === 0) return [];

  // Sort by value descending
  validData.sort((a, b) => b[valueKey] - a[valueKey]);

  // Calculate total for percentage calculation
  const totalValue = validData.reduce((sum, item) => sum + item[valueKey], 0);
  if (totalValue === 0) return []; // Avoid division by zero

  let formattedData = [];
  let otherValue = 0;

  validData.forEach((item, index) => {
    const percentage = (item[valueKey] / totalValue) * 100;
    
    if (index < maxSlices && percentage >= minPercentage) {
      formattedData.push({
        name: item[nameKey] || 'Unknown',
        value: item[valueKey],
        color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
        percentage: percentage
      });
    } else {
      otherValue += item[valueKey];
    }
  });

  if (otherValue > 0) {
    formattedData.push({
      name: 'Other',
      value: otherValue,
      color: '#888888', // Gray color for "Other"
      percentage: (otherValue / totalValue) * 100
    });
  }

  return formattedData;
};

const SpendingChart = () => {
  const { dateFilter, userId, dateRangeText } = useDashboard();
  const [chartType, setChartType] = useState('pie');
  const [dataType, setDataType] = useState('category');
  
  // Get date range based on filter (memoized for stability)
  const { startDate, endDate } = useMemo(() => {
    let start: Date, end: Date;
    switch (dateFilter.type) {
      case 'month': {
        const year = dateFilter.year;
        const month = dateFilter.month || 0;
        start = new Date(year, month, 1);
        end = new Date(year, month + 1, 0);
        break;
      }
      case 'quarter': {
        const year = dateFilter.year;
        const quarter = dateFilter.quarter || 1;
        const startMonth = (quarter - 1) * 3;
        start = new Date(year, startMonth, 1);
        end = new Date(year, startMonth + 3, 0);
        break;
      }
      case 'year': {
        const year = dateFilter.year;
        start = new Date(year, 0, 1);
        end = new Date(year, 11, 31);
        break;
      }
      case 'custom': {
        if (dateFilter.customRange) {
          start = new Date(dateFilter.customRange.startDate);
          end = new Date(dateFilter.customRange.endDate);
        } else {
          const now = new Date();
          start = new Date(now.getFullYear(), now.getMonth(), 1);
          end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        }
        break;
      }
      default: {
        const now = new Date();
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      }
    }
     // Return ISO strings directly for query key stability
    return {
      startDate: start.toISOString(),
      endDate: end.toISOString()
    };
  }, [dateFilter]);

  // --- Fetch Spending by Category using useQuery --- 
  const { 
    data: rawCategoryData, 
    isLoading: isLoadingCategory, 
    error: errorCategory 
  } = useQuery<any[], Error>({
    // Ensure query key updates when dependencies change
    queryKey: ['spendingByCategory', userId, startDate, endDate], 
    queryFn: async () => {
      if (!userId) return []; // Don't fetch if no user
      console.log('RQ: Fetching spending by category...');
      // Use RPC call - ensure function exists and works
      const { data, error } = await supabase
        .rpc('get_spending_by_category', { 
          p_user_id: userId,
          p_start_date: startDate,
          p_end_date: endDate 
        });
      if (error) {
        console.error('RQ Error fetching spending by category:', error);
        throw new Error(error.message);
      }
      console.log('RQ: Received category data:', data?.length);
      // Ensure the RPC returns 'amount' for the value
      return (data || []).map(item => ({ ...item, amount: parseFloat(item.amount) })); 
    },
    enabled: !!userId, // Only run query if userId is available
    staleTime: 5 * 60 * 1000, // Cache data for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep data in cache longer
  });

  // --- Fetch Spending by Payment Method using useQuery ---
  const { 
    data: rawPaymentData, 
    isLoading: isLoadingPayment, 
    error: errorPayment 
  } = useQuery<any[], Error>({
    // Ensure query key updates when dependencies change
    queryKey: ['spendingByPayment', userId, startDate, endDate], 
    queryFn: async () => {
      if (!userId) return [];
      console.log('RQ: Fetching spending by payment...');
      // Use expenseApi function (assuming it fetches correctly)
      try {
         // Ensure this API function exists and works as expected
         // Pass ISO strings for dates as the API likely expects strings
         const paymentSummary = await expenseApi.getSummaryByPaymentMethod(
          userId,
          startDate, // startDate is already an ISO string from useMemo
          endDate   // endDate is already an ISO string from useMemo
        );
         // Use item.total directly as it's already a number per API definition
        const data = paymentSummary.map(item => ({
          name: item.method_name, 
          value: item.total // Directly use the number value
        }));
        console.log('RQ: Received payment data:', data?.length);
        return data || [];
      } catch (err) {
         console.error('RQ Error fetching spending by payment:', err);
         throw new Error(err.message);
      }
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Combine loading states
  const isLoading = isLoadingCategory || isLoadingPayment;
  // Combine errors (show first error)
  const error = errorCategory || errorPayment;

  // Process data for charts using useMemo
  const categoryChartData = useMemo(() => 
    // Use 'amount' as the value key, matching the RPC response
    formatChartData(rawCategoryData, 'category_name', 'amount')
  , [rawCategoryData]);
  
  const paymentChartData = useMemo(() => 
    // Use 'value' as the value key, matching the transformed data
    formatChartData(rawPaymentData, 'name', 'value')
  , [rawPaymentData]);

  // Get current chart data based on data type
  const chartData = dataType === 'category' ? categoryChartData : paymentChartData;
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
          <CardDescription className="text-destructive">{error.message}</CardDescription>
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
              <PieChart key={dataType}>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  isAnimationActive={true}
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
                key={dataType}
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
                <Bar dataKey="value" isAnimationActive={true}>
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
