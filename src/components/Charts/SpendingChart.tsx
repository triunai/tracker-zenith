import React, { useState, useEffect } from 'react';
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
  
  // Calculate date range for current month
  const getCurrentMonthDateRange = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      startDate: firstDay.toISOString(),
      endDate: lastDay.toISOString()
    };
  };
  
  // Load data whenever the data type changes
  useEffect(() => {
    const loadChartData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const { startDate, endDate } = getCurrentMonthDateRange();
        
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
  }, [dataType]);
  
  return (
    <Card className="animate-fade-up animate-delay-300">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <CardTitle>Spending Analysis</CardTitle>
            <CardDescription>Your expense breakdown</CardDescription>
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
            <p>No expense data available for the current month</p>
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
