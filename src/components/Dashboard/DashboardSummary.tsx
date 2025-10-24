import React, { useEffect, useState } from 'react';
import { 
  TrendingDown, 
  TrendingUp, 
  Wallet, 
  CreditCard, 
  ArrowUpRight, 
  LoaderCircle,
  PlusCircle,
  MinusCircle
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import StatCard from '@/components/ui/StatCard.tsx';
import { Button } from '@/components/ui/button.tsx';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast.ts';
import TransactionForm from '@/components/Transactions/TransactionForm';
import { useDashboard } from '@/context/DashboardContext';
import DateFilter from './DateFilter';
import { useIsMobile } from '@/hooks/use-mobile';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { useDrag } from '@use-gesture/react';
import ShinyText from '@/components/ui/ShinyText';

// Helper function to format trend values
const formatTrendValue = (value: number | null): { value: number, isPositive: boolean } => {
  // Handle null, NaN, or undefined
  if (value === null || isNaN(value) || value === undefined) {
    // Return a default of "0% change" (i.e., same as previous period)
    return { value: 0, isPositive: true };
  }
  
  const absValue = Math.abs(Math.round(value));
  // For expenses, a negative percentage is positive (spending less)
  // For income, a positive percentage is positive (earning more)
  return { value: absValue, isPositive: value >= 0 };
};

const DashboardSummary = () => {
  const { 
    isLoading, 
    error, 
    balance, 
    income, 
    expenses, 
    incomeTrend, 
    expenseTrend,
    dateFilter, 
    dateRangeText, 
    userId,
    refreshData
  } = useDashboard();
  
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState('balance');
  
  // Tab navigation for mobile
  const tabs = [
    { id: 'balance', label: 'Balance', icon: Wallet },
    { id: 'income', label: 'Income', icon: TrendingUp },
    { id: 'expenses', label: 'Expenses', icon: TrendingDown }
  ];
  
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };
  
  // Swipe gesture handling for mobile
  const bind = useDrag(({ last, movement: [mx], direction: [dx] }) => {
    console.log('🔄 Swipe gesture detected:', { last, mx, dx, activeTab });
    
    // Enable gestures for both mobile and when testing on desktop
    // Lowered threshold to 15px for easier triggering
    if (last && Math.abs(mx) > 15) {
      const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
      let newIndex = currentIndex;
      
      if (dx > 0 && currentIndex > 0) {
        // Swipe right - go to previous tab
        newIndex = currentIndex - 1;
        console.log('🔄 Swiping right, going to previous tab');
      } else if (dx < 0 && currentIndex < tabs.length - 1) {
        // Swipe left - go to next tab
        newIndex = currentIndex + 1;
        console.log('🔄 Swiping left, going to next tab');
      }
      
      if (newIndex !== currentIndex) {
        console.log('🔄 Changing tab from', activeTab, 'to', tabs[newIndex].id);
        setActiveTab(tabs[newIndex].id);
      }
    }
  }, {
    filterTaps: true,
    axis: 'x',
    from: () => [0, 0],
    // Always enable gestures when tabs are shown (mobile or testing)
    enabled: true,
  });
  
  // Log dashboard state on mount and when any data changes
  useEffect(() => {
    console.log('🔍 [DashboardSummary] State:', {
      isLoading,
      error,
      balance,
      income,
      expenses,
      incomeTrend,
      expenseTrend,
      dateFilter,
      dateRangeText,
      userId
    });
  }, [isLoading, error, balance, income, expenses, incomeTrend, expenseTrend, dateFilter, dateRangeText, userId]);
  
  // Handle manual refresh
  const handleRefresh = () => {
    console.log('🔍 [DashboardSummary] Manual refresh requested');
    refreshData();
    toast({
      title: "Refreshing data",
      description: "Fetching the latest financial data...",
    });
  };
  
  // Render mobile tab content
  const renderMobileTabContent = (tabId: string) => {
    const currentTab = tabs.find(tab => tab.id === tabId);
    if (!currentTab) return null;
    
    const IconComponent = currentTab.icon;
    
    let value, trend, valueClassName;
    
    switch (tabId) {
      case 'balance':
        value = formatCurrency(balance);
        valueClassName = balance >= 0 ? "text-finance-income" : "text-finance-expense";
        break;
      case 'income':
        value = formatCurrency(income);
        trend = formatTrendValue(incomeTrend);
        valueClassName = "text-finance-income";
        break;
      case 'expenses':
        value = formatCurrency(expenses);
        trend = formatTrendValue(expenseTrend);
        valueClassName = "text-finance-expense";
        break;
      default:
        return null;
    }
    
    return (
      <Card className="shadow-purple">
        <CardContent className="pt-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{currentTab.label}</p>
              <p className={cn("text-3xl font-bold mt-2", valueClassName)}>{value}</p>
              
              {trend && (
                <div className="flex items-center mt-2">
                  <div className={cn(
                    "text-sm font-medium mr-2 px-2 py-1 rounded-sm",
                    trend.isPositive 
                      ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" 
                      : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                  )}>
                    {trend.value}%
                  </div>
                  <p className="text-sm text-muted-foreground">vs. previous period</p>
                </div>
              )}
            </div>
            
            <div className="p-3 bg-primary/10 rounded-full text-primary">
              <IconComponent className="h-6 w-6" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };
  
  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />
          <span>Loading financial summary...</span>
        </div>
      ) : error ? (
        <div className="text-center py-8 text-destructive">
          <p>{error}</p>
          <Button 
            variant="outline" 
            className="mt-2"
            onClick={handleRefresh}
          >
            Try Again
          </Button>
        </div>
      ) : isMobile || window.innerWidth < 1024 ? (
        // Mobile: Tab-based layout with swipe gestures
        <div {...bind()} className="space-y-4" style={{ touchAction: 'none' }}>
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              {tabs.map((tab) => (
                <TabsTrigger key={tab.id} value={tab.id} className="text-sm">
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {tabs.map((tab) => (
              <TabsContent key={tab.id} value={tab.id} className="mt-4">
                {renderMobileTabContent(tab.id)}
              </TabsContent>
            ))}
          </Tabs>
          
          {/* Swipe hint for mobile */}
          <div className="text-center">
            <ShinyText 
              text="Swipe left or right to switch between metrics"
              speed={3}
              className="text-xs text-muted-foreground"
            />
          </div>
        </div>
      ) : (
        // Desktop: Original three-card layout
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            title="Total Balance"
            value={formatCurrency(balance)}
            icon={<Wallet className="h-5 w-5" />}
            valueClassName={cn(
              balance >= 0 ? "text-finance-income" : "text-finance-expense"
            )}
            className="animate-delay-100"
          />
          
          <StatCard
            title="Total Income"
            value={formatCurrency(income)}
            icon={<TrendingUp className="h-5 w-5" />}
            trend={formatTrendValue(incomeTrend)}
            valueClassName="text-finance-income"
            className="animate-delay-200"
          />
          
          <StatCard
            title="Total Expenses"
            value={formatCurrency(expenses)}
            icon={<TrendingDown className="h-5 w-5" />}
            trend={formatTrendValue(expenseTrend)}
            valueClassName="text-finance-expense"
            className="animate-delay-300"
          />
        </div>
      )}
    </div>
  );
};

export default DashboardSummary;
