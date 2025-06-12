import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo } from 'react';
import { supabase } from '@/lib/supabase/supabase';
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, startOfQuarter, endOfQuarter } from 'date-fns';
import { useAuth } from '@/lib/auth';
import { useQuery, useQueryClient } from '@tanstack/react-query';

// Define filter types
export type DateFilterType = 'month' | 'quarter' | 'year' | 'custom';

export interface DateRange {
  from: Date;
  to: Date;
}

export interface DateFilter {
  type: DateFilterType;
  month?: number; // 0-11
  year: number;
  quarter?: number; // 1-4
  customRange?: DateRange;
}

// Type for the summary data fetched by useQuery
interface DashboardSummaryData {
  balance: number;
  income: number;
  expenses: number;
  incomeTrend: number | null;
  expenseTrend: number | null;
}

interface DashboardContextType extends DashboardSummaryData { // Inherit summary data fields
  isLoading: boolean;
  error: string | null;
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

// Keep withTimeout helper if needed elsewhere, but useQuery handles timeouts/retries

export const DashboardProvider: React.FC<DashboardProviderProps> = ({ children }) => {
  const queryClient = useQueryClient();
  const [dateFilter, setDateFilter] = useState<DateFilter>({
    type: 'month',
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
  });
  const [dateFilterApplied, setDateFilterApplied] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const userId = isAuthenticated && user ? user.id : undefined;

  // --- Calculate Date Ranges using useMemo for stability ---
  const { startDate, endDate, prevStartDate, prevEndDate } = useMemo(() => {
    let currentStart: Date, currentEnd: Date;
    // Calculate current range
    switch (dateFilter.type) {
      case 'month': {
        const month = dateFilter.month || 0;
        const year = dateFilter.year;
        currentStart = startOfMonth(new Date(year, month));
        currentEnd = endOfMonth(new Date(year, month));
        break;
      }
      case 'quarter': {
        const quarter = dateFilter.quarter || 1;
        const qYear = dateFilter.year;
        const startMonth = (quarter - 1) * 3;
        currentStart = startOfQuarter(new Date(qYear, startMonth));
        currentEnd = endOfQuarter(new Date(qYear, startMonth));
        break;
      }
      case 'year': {
        const yYear = dateFilter.year;
        currentStart = startOfYear(new Date(yYear, 0));
        currentEnd = endOfYear(new Date(yYear, 0));
        break;
      }
      case 'custom': {
        if (dateFilter.customRange) {
          currentStart = dateFilter.customRange.from;
          currentEnd = dateFilter.customRange.to;
        } else {
          currentStart = startOfMonth(new Date());
          currentEnd = endOfMonth(new Date());
        }
        break;
      }
      default: {
        currentStart = startOfMonth(new Date());
        currentEnd = endOfMonth(new Date());
      }
    }

    // Calculate previous range based on current
    let previousStart: Date, previousEnd: Date;
    switch (dateFilter.type) {
      case 'month': {
        previousStart = subMonths(currentStart, 1);
        previousEnd = endOfMonth(previousStart);
        break;
      }
      case 'quarter': {
        previousStart = subMonths(currentStart, 3);
        previousEnd = endOfQuarter(previousStart);
        break;
      }
      case 'year': {
        previousStart = subMonths(currentStart, 12);
        previousEnd = endOfYear(previousStart);
        break;
      }
      case 'custom': {
        const duration = currentEnd.getTime() - currentStart.getTime();
        previousStart = new Date(currentStart.getTime() - duration);
        previousEnd = new Date(currentStart.getTime() - 1); // End day before current start
        break;
      }
      default: {
         previousStart = subMonths(currentStart, 1);
         previousEnd = endOfMonth(previousStart);
      }
    }
    
    // Format dates for API calls (consistent ISO strings)
    const formatStartDateStr = (date: Date) => date.toISOString().split('T')[0] + 'T00:00:00.000Z';
    const formatEndDateStr = (date: Date) => date.toISOString().split('T')[0] + 'T23:59:59.999Z';

    return {
      startDate: formatStartDateStr(currentStart),
      endDate: formatEndDateStr(currentEnd),
      prevStartDate: formatStartDateStr(previousStart),
      prevEndDate: formatEndDateStr(previousEnd),
    };

  }, [dateFilter]);

  // --- Fetch Dashboard Summary Data using useQuery --- 
  const { 
    data: summaryData, 
    isLoading, 
    error: queryError, 
    refetch // Function to manually refetch 
  } = useQuery<DashboardSummaryData, Error>({
    queryKey: ['dashboardSummary', userId, startDate, endDate], // Use calculated dates in key
    queryFn: async () => {
      if (!userId) {
        console.log('[DashboardContext] No user ID, skipping fetch.');
        // Return default state when not logged in
        return { balance: 0, income: 0, expenses: 0, incomeTrend: null, expenseTrend: null };
      }
      console.log(`[DashboardContext] Fetching summary for ${userId} from ${startDate} to ${endDate}`);

      // Fetch all data points in parallel
      const [incomeRes, expensesRes, balanceRes, incomeTrendRes, expenseTrendRes] = await Promise.all([
        supabase.rpc('get_total_income', { p_user_id: userId, p_start_date: startDate, p_end_date: endDate }),
        supabase.rpc('get_total_expenses', { p_user_id: userId, p_start_date: startDate, p_end_date: endDate }),
        supabase.rpc('get_user_balance', { p_user_id: userId, p_start_date: startDate, p_end_date: endDate }),
        supabase.rpc('get_period_comparison', { 
          p_user_id: userId, p_current_start: startDate, p_current_end: endDate,
          p_previous_start: prevStartDate, p_previous_end: prevEndDate, p_transaction_type: 'income'
        }),
        supabase.rpc('get_period_comparison', { 
          p_user_id: userId, p_current_start: startDate, p_current_end: endDate,
          p_previous_start: prevStartDate, p_previous_end: prevEndDate, p_transaction_type: 'expense'
        })
      ]);

      // Check for errors in each response
      if (incomeRes.error) throw new Error(`Income fetch failed: ${incomeRes.error.message}`);
      if (expensesRes.error) throw new Error(`Expenses fetch failed: ${expensesRes.error.message}`);
      if (balanceRes.error) throw new Error(`Balance fetch failed: ${balanceRes.error.message}`);
      if (incomeTrendRes.error) throw new Error(`Income trend fetch failed: ${incomeTrendRes.error.message}`);
      if (expenseTrendRes.error) throw new Error(`Expense trend fetch failed: ${expenseTrendRes.error.message}`);

      console.log('[DashboardContext] Summary data fetched successfully.');
      return {
        income: Number(incomeRes.data) || 0,
        expenses: Number(expensesRes.data) || 0,
        balance: Number(balanceRes.data) || 0,
        incomeTrend: incomeTrendRes.data ? Number(incomeTrendRes.data[0]?.percentage_change) : null,
        expenseTrend: expenseTrendRes.data ? Number(expenseTrendRes.data[0]?.percentage_change) : null,
      };
    },
    enabled: !!userId, // Only run when userId is available
    staleTime: 5 * 60 * 1000, // Data is fresh for 5 minutes
    gcTime: 10 * 60 * 1000,
  });

  // ---- End of useQuery ----

  // Use calculated data or defaults
  const balance = summaryData?.balance ?? 0;
  const income = summaryData?.income ?? 0;
  const expenses = summaryData?.expenses ?? 0;
  const incomeTrend = summaryData?.incomeTrend ?? null;
  const expenseTrend = summaryData?.expenseTrend ?? null;
  const error = queryError?.message ?? null; // Get error message from query state

  // Filter options (no changes needed)
  const filterOptions = [
    { type: 'month' as DateFilterType, label: 'Monthly' },
    { type: 'quarter' as DateFilterType, label: 'Quarterly' },
    { type: 'year' as DateFilterType, label: 'Yearly' },
    { type: 'custom' as DateFilterType, label: 'Custom Range' }
  ];
  
  // Get human-readable description of current date range (no changes needed)
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
          const { from: customStart, to: customEnd } = dateFilter.customRange;
          const startFormatted = new Date(customStart).toLocaleDateString();
          const endFormatted = new Date(customEnd).toLocaleDateString();
          return `${startFormatted} - ${endFormatted}`;
        }
        return 'Custom Range';
      }
      default:
        return 'Current Month';
    }
  }, [dateFilter]);
  
  // Expose a refresh function that uses React Query's refetch
  const refreshData = useCallback(() => {
    console.log('[DashboardContext] Refresh triggered.');
    refetch(); // Call the refetch function from useQuery
  }, [refetch]);
  
  const value: DashboardContextType = {
    isLoading,
    error,
    balance,
    income,
    expenses,
    incomeTrend,
    expenseTrend,
    refreshData,
    dateFilter,
    setDateFilter, // Pass setDateFilter to allow components to change it
    filterOptions,
    dateRangeText: getDateRangeText(),
    dateFilterApplied, // Keep this if used elsewhere, otherwise can be removed
    userId,
    isAuthenticated
  };
  
  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}; 