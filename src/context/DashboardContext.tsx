import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/lib/supabase/supabase';
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, startOfQuarter, endOfQuarter } from 'date-fns';
import { useAuth } from '@/context/AuthContext';

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
  dateFilterApplied: boolean;
  userId: string | undefined;
  isAuthenticated: boolean;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};

interface DashboardProviderProps {
  children: ReactNode;
}

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

export const DashboardProvider: React.FC<DashboardProviderProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState(0);
  const [income, setIncome] = useState(0);
  const [expenses, setExpenses] = useState(0);
  const [incomeTrend, setIncomeTrend] = useState<number | null>(null);
  const [expenseTrend, setExpenseTrend] = useState<number | null>(null);
  const [dateFilter, setDateFilter] = useState<DateFilter>({
    type: 'month',
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
  });
  const [dateFilterApplied, setDateFilterApplied] = useState(false);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const { user, isAuthenticated } = useAuth();
  
  const userId = isAuthenticated && user ? user.id : undefined;

  // Filter options
  const filterOptions = [
    { type: 'month' as DateFilterType, label: 'Monthly' },
    { type: 'quarter' as DateFilterType, label: 'Quarterly' },
    { type: 'year' as DateFilterType, label: 'Yearly' },
    { type: 'custom' as DateFilterType, label: 'Custom Range' }
  ];
  
  // Get human-readable description of current date range
  const getDateRangeText = useCallback(() => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    switch (dateFilter.type) {
      case 'month': {
        const year = dateFilter.year;
        const month = dateFilter.month !== undefined ? dateFilter.month : 0;
        return `${months[month]} ${year}`;
      }
      case 'quarter': {
        const year = dateFilter.year;
        const quarter = dateFilter.quarter;
        return `Q${quarter} ${year}`;
      }
      case 'year': {
        return `${dateFilter.year}`;
      }
      case 'custom': {
        if (dateFilter.customRange) {
          const { startDate, endDate } = dateFilter.customRange;
          const startFormatted = new Date(startDate).toLocaleDateString();
          const endFormatted = new Date(endDate).toLocaleDateString();
          return `${startFormatted} - ${endFormatted}`;
        }
        return 'Custom Range';
      }
      default:
        return 'Current Month';
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
      console.log('🔍 [Dashboard] Starting to fetch summary data...');
      setIsLoading(true);
      setError(null);
      
      const { startDate, endDate } = getDateRange();
      const { startDate: prevStartDate, endDate: prevEndDate } = getPreviousDateRange();
      
      // Format dates to ensure consistent timezone handling
      // Start date should be at 00:00:00 and end date at 23:59:59 of the respective days
      const formatStartDate = (date: Date) => {
        return new Date(
          date.getFullYear(), 
          date.getMonth(), 
          date.getDate(), 
          0, 0, 0
        ).toISOString();
      };
      
      const formatEndDate = (date: Date) => {
        return new Date(
          date.getFullYear(), 
          date.getMonth(), 
          date.getDate(), 
          23, 59, 59
        ).toISOString();
      };
      
      // Apply the formatting to get consistent date strings
      const startDateStr = formatStartDate(startDate);
      const endDateStr = formatEndDate(endDate);
      const prevStartDateStr = formatStartDate(prevStartDate);
      const prevEndDateStr = formatEndDate(prevEndDate);
      
      console.log(`🔍 [Dashboard] Date range: ${startDateStr} to ${endDateStr}`);
      console.log(`🔍 [Dashboard] Previous date range: ${prevStartDateStr} to ${prevEndDateStr}`);
      console.log(`🔍 [Dashboard] User ID: ${userId}`);
      
      // Fetch income using RPC function
      console.log('🔍 [Dashboard] Calling get_total_income...');
      const incomePromise = supabase
        .rpc('get_total_income', {
          p_user_id: userId,
          p_start_date: startDateStr,
          p_end_date: endDateStr
        });
      
      const { data: incomeData, error: incomeError } = await withTimeout(incomePromise, 8000);
        
      if (incomeError) {
        console.error('❌ [Dashboard] Income error:', incomeError);
        throw incomeError;
      }
      console.log('✅ [Dashboard] Income data received:', incomeData);
      setIncome(Number(incomeData));
      
      // Fetch expenses using RPC function
      console.log('🔍 [Dashboard] Calling get_total_expenses...');
      const expensePromise = supabase
        .rpc('get_total_expenses', {
          p_user_id: userId,
          p_start_date: startDateStr,
          p_end_date: endDateStr
        });
        
      const { data: expenseData, error: expenseError } = await withTimeout(expensePromise, 8000);
        
      if (expenseError) {
        console.error('❌ [Dashboard] Expenses error:', expenseError);
        throw expenseError;
      }
      console.log('✅ [Dashboard] Expense data received:', expenseData);
      setExpenses(Number(expenseData));
      
      // Calculate balance using RPC function
      console.log('🔍 [Dashboard] Calling get_user_balance...');
      const balancePromise = supabase
        .rpc('get_user_balance', {
          p_user_id: userId,
          p_start_date: startDateStr,
          p_end_date: endDateStr
        });
        
      const { data: balanceData, error: balanceError } = await withTimeout(balancePromise, 8000);
        
      if (balanceError) {
        console.error('❌ [Dashboard] Balance error:', balanceError);
        throw balanceError;
      }
      console.log('✅ [Dashboard] Balance data received:', balanceData);
      setBalance(Number(balanceData));
      
      // Get trend data for income
      console.log('🔍 [Dashboard] Calling get_period_comparison for income trend...');
      const incomeTrendPromise = supabase
        .rpc('get_period_comparison', {
          p_user_id: userId,
          p_current_start: startDateStr,
          p_current_end: endDateStr,
          p_previous_start: prevStartDateStr,
          p_previous_end: prevEndDateStr,
          p_transaction_type: 'income'
        });
        
      const { data: incomeTrendData, error: incomeTrendError } = await withTimeout(incomeTrendPromise, 8000);
        
      if (incomeTrendError) {
        console.error('❌ [Dashboard] Income trend error:', incomeTrendError);
        throw incomeTrendError;
      }
      console.log('✅ [Dashboard] Income trend data received:', incomeTrendData);
      setIncomeTrend(Number(incomeTrendData?.percentage_change));
      
      // Get trend data for expenses
      console.log('🔍 [Dashboard] Calling get_period_comparison for expense trend...');
      const expenseTrendPromise = supabase
        .rpc('get_period_comparison', {
          p_user_id: userId,
          p_current_start: startDateStr,
          p_current_end: endDateStr,
          p_previous_start: prevStartDateStr,
          p_previous_end: prevEndDateStr,
          p_transaction_type: 'expense'
        });
        
      const { data: expenseTrendData, error: expenseTrendError } = await withTimeout(expenseTrendPromise, 8000);
        
      if (expenseTrendError) {
        console.error('❌ [Dashboard] Expense trend error:', expenseTrendError);
        throw expenseTrendError;
      }
      console.log('✅ [Dashboard] Expense trend data received:', expenseTrendData);
      setExpenseTrend(Number(expenseTrendData?.percentage_change));
      
      console.log('✅ [Dashboard] All summary data fetched successfully');
      
    } catch (err) {
      console.error('❌ [Dashboard] Error fetching summary data:', err);
      console.error('❌ [Dashboard] Error stack:', err instanceof Error ? err.stack : 'No stack trace');
      console.error('❌ [Dashboard] Error details:', JSON.stringify(err, null, 2));
      setError('Failed to load financial summary data');
    } finally {
      console.log(`🔍 [Dashboard] Setting isLoading to false`);
      setIsLoading(false);
    }
  }, [getDateRange, getPreviousDateRange, userId]);
  
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
  }, [fetchSummaryData, userId]);
  
  // Refresh data when date filter changes
  useEffect(() => {
    fetchSummaryData();
  }, [dateFilter, fetchSummaryData]);
  
  const refreshData = useCallback(() => {
    setRefreshCounter(prev => prev + 1);
  }, []);
  
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
    dateRangeText: getDateRangeText(),
    dateFilterApplied,
    userId,
    isAuthenticated
  };
  
  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}; 