import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/supabase';
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, startOfQuarter, endOfQuarter } from 'date-fns';

// Placeholder until we implement proper auth
const MOCK_USER_ID = "11111111-1111-1111-1111-111111111111";

// Define filter types
export type DateFilterType = 'month' | 'quarter' | 'year' | 'custom';

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface DateFilter {
  type: DateFilterType;
  month?: number; // 0-11
  year: number;
  quarter?: number; // 1-4
  customRange?: DateRange;
}

interface DashboardContextType {
  isLoading: boolean;
  error: string | null;
  balance: number;
  income: number;
  expenses: number;
  incomeTrend: number | null;
  expenseTrend: number | null;
  refreshData: () => void;
  dateFilter: DateFilter;
  setDateFilter: (filter: DateFilter) => void;
  filterOptions: {
    type: DateFilterType;
    label: string;
  }[];
  dateRangeText: string;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};

interface DashboardProviderProps {
  children: React.ReactNode;
}

export const DashboardProvider: React.FC<DashboardProviderProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState(0);
  const [income, setIncome] = useState(0);
  const [expenses, setExpenses] = useState(0);
  const [incomeTrend, setIncomeTrend] = useState<number | null>(null);
  const [expenseTrend, setExpenseTrend] = useState<number | null>(null);
  
  // Default date filter is current month
  const now = new Date();
  const [dateFilter, setDateFilter] = useState<DateFilter>({
    type: 'month',
    month: now.getMonth(),
    year: now.getFullYear(),
  });

  // Filter options
  const filterOptions = [
    { type: 'month' as DateFilterType, label: 'Monthly' },
    { type: 'quarter' as DateFilterType, label: 'Quarterly' },
    { type: 'year' as DateFilterType, label: 'Yearly' },
    { type: 'custom' as DateFilterType, label: 'Custom Range' }
  ];
  
  // Get human-readable description of current date range
  const getDateRangeText = useCallback(() => {
    switch (dateFilter.type) {
      case 'month':
        return format(new Date(dateFilter.year, dateFilter.month || 0), 'MMMM yyyy');
      case 'quarter':
        return `Q${dateFilter.quarter} ${dateFilter.year}`;
      case 'year':
        return `Year ${dateFilter.year}`;
      case 'custom':
        if (dateFilter.customRange) {
          return `${format(dateFilter.customRange.startDate, 'MMM d, yyyy')} - ${format(dateFilter.customRange.endDate, 'MMM d, yyyy')}`;
        }
        return 'Custom Range';
      default:
        return '';
    }
  }, [dateFilter]);
  
  // Calculate date range based on current filter
  const getDateRange = useCallback(() => {
    switch (dateFilter.type) {
      case 'month': {
        const month = dateFilter.month || 0;
        const year = dateFilter.year;
        const startDate = startOfMonth(new Date(year, month));
        const endDate = endOfMonth(new Date(year, month));
        return { startDate, endDate };
      }
      case 'quarter': {
        const quarter = dateFilter.quarter || 1;
        const year = dateFilter.year;
        const startMonth = (quarter - 1) * 3;
        const startDate = startOfQuarter(new Date(year, startMonth));
        const endDate = endOfQuarter(new Date(year, startMonth));
        return { startDate, endDate };
      }
      case 'year': {
        const year = dateFilter.year;
        const startDate = startOfYear(new Date(year, 0));
        const endDate = endOfYear(new Date(year, 0));
        return { startDate, endDate };
      }
      case 'custom': {
        if (dateFilter.customRange) {
          return dateFilter.customRange;
        }
        // Default to current month if no custom range
        const startDate = startOfMonth(new Date());
        const endDate = endOfMonth(new Date());
        return { startDate, endDate };
      }
      default:
        // Default to current month
        const startDate = startOfMonth(new Date());
        const endDate = endOfMonth(new Date());
        return { startDate, endDate };
    }
  }, [dateFilter]);
  
  // Calculate date range for previous period (for comparison)
  const getPreviousDateRange = useCallback(() => {
    const { startDate, endDate } = getDateRange();
    
    switch (dateFilter.type) {
      case 'month': {
        const prevMonthStart = subMonths(startDate, 1);
        const prevMonthEnd = subMonths(endDate, 1);
        return { startDate: prevMonthStart, endDate: prevMonthEnd };
      }
      case 'quarter': {
        // Previous quarter (3 months back)
        const prevQuarterStart = subMonths(startDate, 3);
        const prevQuarterEnd = subMonths(endDate, 3);
        return { startDate: prevQuarterStart, endDate: prevQuarterEnd };
      }
      case 'year': {
        // Previous year
        const prevYearStart = new Date(startDate);
        prevYearStart.setFullYear(prevYearStart.getFullYear() - 1);
        const prevYearEnd = new Date(endDate);
        prevYearEnd.setFullYear(prevYearEnd.getFullYear() - 1);
        return { startDate: prevYearStart, endDate: prevYearEnd };
      }
      case 'custom': {
        // For custom, calculate a previous period of same duration
        const currentRangeDuration = endDate.getTime() - startDate.getTime();
        const prevStartDate = new Date(startDate.getTime() - currentRangeDuration);
        const prevEndDate = new Date(startDate.getTime() - 1);
        return { startDate: prevStartDate, endDate: prevEndDate };
      }
      default:
        return { startDate: new Date(), endDate: new Date() };
    }
  }, [getDateRange, dateFilter.type]);
  
  const fetchSummaryData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { startDate, endDate } = getDateRange();
      const { startDate: prevStartDate, endDate: prevEndDate } = getPreviousDateRange();
      
      // Fetch income using RPC function
      const { data: incomeData, error: incomeError } = await supabase
        .rpc('get_total_income', {
          p_user_id: MOCK_USER_ID,
          p_start_date: startDate.toISOString(),
          p_end_date: endDate.toISOString()
        });
        
      if (incomeError) throw incomeError;
      setIncome(Number(incomeData));
      
      // Fetch expenses using RPC function
      const { data: expenseData, error: expenseError } = await supabase
        .rpc('get_total_expenses', {
          p_user_id: MOCK_USER_ID,
          p_start_date: startDate.toISOString(),
          p_end_date: endDate.toISOString()
        });
        
      if (expenseError) throw expenseError;
      setExpenses(Number(expenseData));
      
      // Calculate balance using RPC function
      const { data: balanceData, error: balanceError } = await supabase
        .rpc('get_user_balance', {
          p_user_id: MOCK_USER_ID,
          p_start_date: startDate.toISOString(),
          p_end_date: endDate.toISOString()
        });
        
      if (balanceError) throw balanceError;
      setBalance(Number(balanceData));
      
      // Get trend data for income
      const { data: incomeTrendData, error: incomeTrendError } = await supabase
        .rpc('get_period_comparison', {
          p_user_id: MOCK_USER_ID,
          p_current_start: startDate.toISOString(),
          p_current_end: endDate.toISOString(),
          p_previous_start: prevStartDate.toISOString(),
          p_previous_end: prevEndDate.toISOString(),
          p_transaction_type: 'income'
        });
        
      if (incomeTrendError) throw incomeTrendError;
      setIncomeTrend(Number(incomeTrendData?.percentage_change));
      
      // Get trend data for expenses
      const { data: expenseTrendData, error: expenseTrendError } = await supabase
        .rpc('get_period_comparison', {
          p_user_id: MOCK_USER_ID,
          p_current_start: startDate.toISOString(),
          p_current_end: endDate.toISOString(),
          p_previous_start: prevStartDate.toISOString(),
          p_previous_end: prevEndDate.toISOString(),
          p_transaction_type: 'expense'
        });
        
      if (expenseTrendError) throw expenseTrendError;
      setExpenseTrend(Number(expenseTrendData?.percentage_change));
      
    } catch (err) {
      console.error('Error fetching summary data:', err);
      setError('Failed to load financial summary data');
    } finally {
      setIsLoading(false);
    }
  }, [getDateRange, getPreviousDateRange]);
  
  useEffect(() => {
    fetchSummaryData();
    
    // Subscribe to transaction changes
    const subscription = supabase
      .channel('transaction-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'expense'
      }, () => {
        fetchSummaryData();
      })
      .subscribe();
    
    return () => {
      subscription.unsubscribe();
    };
  }, [fetchSummaryData]);
  
  // Refresh data when date filter changes
  useEffect(() => {
    fetchSummaryData();
  }, [dateFilter, fetchSummaryData]);
  
  const refreshData = useCallback(() => {
    fetchSummaryData();
  }, [fetchSummaryData]);
  
  const value = {
    isLoading,
    error,
    balance,
    income,
    expenses,
    incomeTrend,
    expenseTrend,
    refreshData,
    dateFilter,
    setDateFilter,
    filterOptions,
    dateRangeText: getDateRangeText()
  };
  
  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}; 