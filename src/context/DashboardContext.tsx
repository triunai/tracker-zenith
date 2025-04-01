import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/supabase';

// Placeholder until we implement proper auth
const MOCK_USER_ID = "11111111-1111-1111-1111-111111111111";

interface DashboardContextType {
  isLoading: boolean;
  error: string | null;
  balance: number;
  income: number;
  expenses: number;
  incomeTrend: number | null;
  expenseTrend: number | null;
  refreshData: () => void;
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
  
  // Calculate date range for previous month
  const getPreviousMonthDateRange = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
    return {
      startDate: firstDay.toISOString(),
      endDate: lastDay.toISOString()
    };
  };
  
  const fetchSummaryData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { startDate, endDate } = getCurrentMonthDateRange();
      const { startDate: prevStartDate, endDate: prevEndDate } = getPreviousMonthDateRange();
      
      // Fetch income using RPC function
      const { data: incomeData, error: incomeError } = await supabase
        .rpc('get_total_income', {
          p_user_id: MOCK_USER_ID,
          p_start_date: startDate,
          p_end_date: endDate
        });
        
      if (incomeError) throw incomeError;
      setIncome(Number(incomeData));
      
      // Fetch expenses using RPC function
      const { data: expenseData, error: expenseError } = await supabase
        .rpc('get_total_expenses', {
          p_user_id: MOCK_USER_ID,
          p_start_date: startDate,
          p_end_date: endDate
        });
        
      if (expenseError) throw expenseError;
      setExpenses(Number(expenseData));
      
      // Calculate balance
      setBalance(Number(incomeData) - Number(expenseData));
      
      // Get trend data for income
      const { data: incomeTrendData, error: incomeTrendError } = await supabase
        .rpc('get_period_comparison', {
          p_user_id: MOCK_USER_ID,
          p_current_start: startDate,
          p_current_end: endDate,
          p_previous_start: prevStartDate,
          p_previous_end: prevEndDate,
          p_transaction_type: 'income'
        });
        
      if (incomeTrendError) throw incomeTrendError;
      setIncomeTrend(Number(incomeTrendData?.percentage_change));
      
      // Get trend data for expenses
      const { data: expenseTrendData, error: expenseTrendError } = await supabase
        .rpc('get_period_comparison', {
          p_user_id: MOCK_USER_ID,
          p_current_start: startDate,
          p_current_end: endDate,
          p_previous_start: prevStartDate,
          p_previous_end: prevEndDate,
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
  }, []);
  
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
    refreshData
  };
  
  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}; 