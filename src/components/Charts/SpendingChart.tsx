
import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/UI/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/UI/tabs";
import { getSpendingByCategory, getExpensesByPaymentMethod } from '@/lib/mockData';
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
  
  // Get the appropriate data based on the selected type
  const chartData = dataType === 'category' 
    ? getSpendingByCategory() 
    : getExpensesByPaymentMethod();
  
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
      </CardContent>
    </Card>
  );
};

export default SpendingChart;
