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

// Placeholder until we implement proper auth
const MOCK_USER_ID = "11111111-1111-1111-1111-111111111111";

// Colors for the chart
const CATEGORY_COLORS = [
  '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
  '#FF9F40', '#2FCC71', '#F1C40F', '#E74C3C', '#9B59B6'
];

const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border shadow-md rounded-md p-2 text-sm">
        <p className="font-medium">{payload[0].name}</p>
        <p className="text-primary">{formatCurrency(payload[0].value as number)}</p>
      </div>
    );
  }

  return null;
};

const SpendingChart = () => {
  const [chartType, setChartType] = useState('pie');
  const [dataType, setDataType] = useState('category');
  const [chartData, setChartData] = useState<{ name: string; value: number; color: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { dateFilter, dateRangeText } = useDashboard();
  
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
  
  // Load data whenever the data type or date filter changes
  useEffect(() => {
    const loadChartData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const { startDate, endDate } = getDateRangeForFilter();
        
        // Get expenses data
        const expenses = await expenseApi.getAllByUser(MOCK_USER_ID, {
          startDate,
          endDate
        });
        
        if (dataType === 'category') {
          // Group by category
          const categoryMap = new Map<number, { name: string; value: number; color: string }>();
          
          // Process each expense
          expenses.forEach(expense => {
            expense.expense_items?.forEach(item => {
              if (!item.category) return;
              
              const categoryId = item.category_id;
              const categoryName = item.category.name;
              const amount = Number(item.amount);
              
              if (categoryMap.has(categoryId)) {
                // Add to existing category
                const current = categoryMap.get(categoryId)!;
                categoryMap.set(categoryId, {
                  ...current,
                  value: current.value + amount
                });
              } else {
                // Create new category entry
                const colorIndex = categoryMap.size % CATEGORY_COLORS.length;
                categoryMap.set(categoryId, {
                  name: categoryName,
                  value: amount,
                  color: CATEGORY_COLORS[colorIndex]
                });
              }
            });
          });
          
          // Convert map to array and sort by value
          const chartDataArray = Array.from(categoryMap.values())
            .sort((a, b) => b.value - a.value);
          
          setChartData(chartDataArray);
        } else {
          // Group by payment method
          const paymentMap = new Map<number, { name: string; value: number; color: string }>();
          
          // Process each expense
          expenses.forEach(expense => {
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
                ...current,
                value: current.value + totalAmount
              });
            } else {
              // Create new payment method entry
              const colorIndex = paymentMap.size % CATEGORY_COLORS.length;
              paymentMap.set(paymentMethodId, {
                name: methodName,
                value: totalAmount,
                color: CATEGORY_COLORS[colorIndex]
              });
            }
          });
          
          // Convert map to array and sort by value
          const chartDataArray = Array.from(paymentMap.values())
            .sort((a, b) => b.value - a.value);
          
          setChartData(chartDataArray);
        }
      } catch (err) {
        console.error('Error loading chart data:', err);
        setError('Failed to load spending analysis data');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadChartData();
  }, [dataType, getDateRangeForFilter, dateFilter]);
  
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
        {isLoading ? (
          <div className="h-[300px] w-full flex items-center justify-center">
            <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />
            <span>Loading chart data...</span>
          </div>
        ) : error ? (
          <div className="h-[300px] w-full flex items-center justify-center text-destructive">
            <p>{error}</p>
          </div>
        ) : chartData.length === 0 ? (
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
