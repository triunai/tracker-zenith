
import { formatCurrency } from '@/lib/utils';

// Enums
export enum PaymentMethod {
  Cash = 1,
  CreditCard = 2,
  QRCodePayment = 3,
  EWallet = 4,
  BankTransfer = 5,
  DuitNow = 6
}

// Types matching your database schema
export type Category = {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string | null;
  color: string; // Added for UI purposes
  icon: string; // Added for UI purposes
};

export type ExpenseItem = {
  id: number;
  expenseId: number;
  categoryId: number;
  paymentMethod: PaymentMethod;
  description: string;
  price: number;
  quantity: number;
  createdAt: string;
  updatedAt: string | null;
  // Calculated & joined fields
  total: number;
  category?: Category;
};

export type Expense = {
  id: number;
  date: string;
  notes: string;
  createdAt: string;
  updatedAt: string | null;
  createdByUserId: number | null;
  updatedByUserId: number | null;
  // Collections
  expenseItems: ExpenseItem[];
  // Calculated fields
  totalAmount: number;
};

// UI helper types
export type ChartDataPoint = {
  name: string;
  value: number;
  color: string;
};

export type BudgetStatus = 'safe' | 'caution' | 'warning' | 'danger';

export type Budget = {
  id: number;
  categoryId: number;
  amount: number;
  period: 'daily'|'monthly' | 'weekly' | 'yearly';
  // Calculated & joined fields
  spent: number;
  category?: Category;
};

// Sample categories with iOS-like muted colors
export const categories: Category[] = [
  { 
    id: 1, 
    name: 'Housing', 
    description: 'Rent, mortgage, and home-related expenses',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: null,
    color: '#8E9BC7', 
    icon: 'home' 
  },
  { 
    id: 2, 
    name: 'Food', 
    description: 'Groceries, restaurants, and food delivery',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: null,
    color: '#93C0DA', 
    icon: 'utensils' 
  },
  { 
    id: 3, 
    name: 'Transport', 
    description: 'Gas, public transport, and vehicle maintenance',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: null,
    color: '#D6A99A', 
    icon: 'car' 
  },
  { 
    id: 4, 
    name: 'Entertainment', 
    description: 'Movies, streaming services, and recreation',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: null,
    color: '#92C1B8', 
    icon: 'tv' 
  },
  { 
    id: 5, 
    name: 'Shopping', 
    description: 'Clothing, electronics, and other purchases',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: null,
    color: '#B7A7CC', 
    icon: 'shopping-bag' 
  },
  { 
    id: 6, 
    name: 'Utilities', 
    description: 'Electric, water, internet, and phone bills',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: null,
    color: '#D8B78E', 
    icon: 'zap' 
  },
  { 
    id: 7, 
    name: 'Healthcare', 
    description: 'Medical expenses, insurance, and medications',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: null,
    color: '#7AADC8', 
    icon: 'activity' 
  },
  { 
    id: 8, 
    name: 'Education', 
    description: 'Tuition, books, and learning materials',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: null,
    color: '#D48A9B', 
    icon: 'book' 
  },
  { 
    id: 9, 
    name: 'Miscellaneous', 
    description: 'Other expenses that don\'t fit into specific categories',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: null,
    color: '#A4B494', 
    icon: 'package' 
  }
];

// Sample expense items
export const expenseItems: ExpenseItem[] = [
  {
    id: 1,
    expenseId: 1,
    categoryId: 1,
    paymentMethod: PaymentMethod.BankTransfer,
    description: 'Monthly Rent',
    price: 1200,
    quantity: 1,
    createdAt: '2023-05-01T10:00:00Z',
    updatedAt: null,
    total: 1200,
    category: categories.find(c => c.id === 1)
  },
  {
    id: 2,
    expenseId: 2,
    categoryId: 2,
    paymentMethod: PaymentMethod.Cash,
    description: 'Grocery Shopping',
    price: 85.75,
    quantity: 1,
    createdAt: '2023-05-02T15:30:00Z',
    updatedAt: null,
    total: 85.75,
    category: categories.find(c => c.id === 2)
  },
  {
    id: 3,
    expenseId: 3,
    categoryId: 3,
    paymentMethod: PaymentMethod.CreditCard,
    description: 'Gas',
    price: 45.30,
    quantity: 1,
    createdAt: '2023-05-03T09:15:00Z',
    updatedAt: null,
    total: 45.30,
    category: categories.find(c => c.id === 3)
  },
  {
    id: 4,
    expenseId: 4,
    categoryId: 4,
    paymentMethod: PaymentMethod.QRCodePayment,
    description: 'Movie Tickets',
    price: 12.5,
    quantity: 2,
    createdAt: '2023-05-04T18:45:00Z',
    updatedAt: null,
    total: 25.00,
    category: categories.find(c => c.id === 4)
  },
  {
    id: 5,
    expenseId: 5,
    categoryId: 5,
    paymentMethod: PaymentMethod.CreditCard,
    description: 'Online Shopping',
    price: 99.95,
    quantity: 1,
    createdAt: '2023-05-05T14:20:00Z',
    updatedAt: null,
    total: 99.95,
    category: categories.find(c => c.id === 5)
  },
  {
    id: 6,
    expenseId: 6,
    categoryId: 6,
    paymentMethod: PaymentMethod.DuitNow,
    description: 'Electricity Bill',
    price: 75.40,
    quantity: 1,
    createdAt: '2023-05-06T11:10:00Z',
    updatedAt: null,
    total: 75.40,
    category: categories.find(c => c.id === 6)
  },
  {
    id: 7,
    expenseId: 7,
    categoryId: 7,
    paymentMethod: PaymentMethod.EWallet,
    description: 'Pharmacy',
    price: 32.50,
    quantity: 1,
    createdAt: '2023-05-07T16:35:00Z',
    updatedAt: null,
    total: 32.50,
    category: categories.find(c => c.id === 7)
  },
  {
    id: 8,
    expenseId: 8,
    categoryId: 2,
    paymentMethod: PaymentMethod.CreditCard,
    description: 'Restaurant',
    price: 65.80,
    quantity: 1,
    createdAt: '2023-05-10T19:30:00Z',
    updatedAt: null,
    total: 65.80,
    category: categories.find(c => c.id === 2)
  },
  {
    id: 9,
    expenseId: 9,
    categoryId: 8,
    paymentMethod: PaymentMethod.BankTransfer,
    description: 'Online Course',
    price: 199.99,
    quantity: 1,
    createdAt: '2023-05-12T13:15:00Z',
    updatedAt: null,
    total: 199.99,
    category: categories.find(c => c.id === 8)
  },
  {
    id: 10,
    expenseId: 10,
    categoryId: 9,
    paymentMethod: PaymentMethod.Cash,
    description: 'Gift',
    price: 50.00,
    quantity: 1,
    createdAt: '2023-05-15T10:45:00Z',
    updatedAt: null,
    total: 50.00,
    category: categories.find(c => c.id === 9)
  }
];

// Sample expenses
export const expenses: Expense[] = [
  {
    id: 1,
    date: '2023-05-01',
    notes: 'Monthly housing expense',
    createdAt: '2023-05-01T10:00:00Z',
    updatedAt: null,
    createdByUserId: 1,
    updatedByUserId: null,
    expenseItems: [expenseItems.find(ei => ei.expenseId === 1)!],
    totalAmount: 1200
  },
  {
    id: 2,
    date: '2023-05-02',
    notes: 'Weekly grocery run',
    createdAt: '2023-05-02T15:30:00Z',
    updatedAt: null,
    createdByUserId: 1,
    updatedByUserId: null,
    expenseItems: [expenseItems.find(ei => ei.expenseId === 2)!],
    totalAmount: 85.75
  },
  {
    id: 3,
    date: '2023-05-03',
    notes: 'Filled up the tank',
    createdAt: '2023-05-03T09:15:00Z',
    updatedAt: null,
    createdByUserId: 1,
    updatedByUserId: null,
    expenseItems: [expenseItems.find(ei => ei.expenseId === 3)!],
    totalAmount: 45.30
  },
  {
    id: 4,
    date: '2023-05-04',
    notes: 'Movie night',
    createdAt: '2023-05-04T18:45:00Z',
    updatedAt: null,
    createdByUserId: 1,
    updatedByUserId: null,
    expenseItems: [expenseItems.find(ei => ei.expenseId === 4)!],
    totalAmount: 25.00
  },
  {
    id: 5,
    date: '2023-05-05',
    notes: 'Amazon purchase',
    createdAt: '2023-05-05T14:20:00Z',
    updatedAt: null,
    createdByUserId: 1,
    updatedByUserId: null,
    expenseItems: [expenseItems.find(ei => ei.expenseId === 5)!],
    totalAmount: 99.95
  },
  {
    id: 6,
    date: '2023-05-06',
    notes: 'Monthly utility bill',
    createdAt: '2023-05-06T11:10:00Z',
    updatedAt: null,
    createdByUserId: 1,
    updatedByUserId: null,
    expenseItems: [expenseItems.find(ei => ei.expenseId === 6)!],
    totalAmount: 75.40
  },
  {
    id: 7,
    date: '2023-05-07',
    notes: 'Medication refill',
    createdAt: '2023-05-07T16:35:00Z',
    updatedAt: null,
    createdByUserId: 1,
    updatedByUserId: null,
    expenseItems: [expenseItems.find(ei => ei.expenseId === 7)!],
    totalAmount: 32.50
  },
  {
    id: 8,
    date: '2023-05-10',
    notes: 'Dinner out',
    createdAt: '2023-05-10T19:30:00Z',
    updatedAt: null,
    createdByUserId: 1,
    updatedByUserId: null,
    expenseItems: [expenseItems.find(ei => ei.expenseId === 8)!],
    totalAmount: 65.80
  },
  {
    id: 9,
    date: '2023-05-12',
    notes: 'Programming course',
    createdAt: '2023-05-12T13:15:00Z',
    updatedAt: null,
    createdByUserId: 1,
    updatedByUserId: null,
    expenseItems: [expenseItems.find(ei => ei.expenseId === 9)!],
    totalAmount: 199.99
  },
  {
    id: 10,
    date: '2023-05-15',
    notes: 'Birthday present',
    createdAt: '2023-05-15T10:45:00Z',
    updatedAt: null,
    createdByUserId: 1,
    updatedByUserId: null,
    expenseItems: [expenseItems.find(ei => ei.expenseId === 10)!],
    totalAmount: 50.00
  }
];

// Sample budgets (manually created, not part of your schema)
export const budgets: Budget[] = [
  { 
    id: 1, 
    categoryId: 1, 
    amount: 1500, 
    spent: 1200, 
    period: 'monthly',
    category: categories.find(c => c.id === 1)
  },
  { 
    id: 2, 
    categoryId: 2, 
    amount: 500, 
    spent: 151.55, 
    period: 'monthly',
    category: categories.find(c => c.id === 2)
  },
  { 
    id: 3, 
    categoryId: 3, 
    amount: 200, 
    spent: 45.30, 
    period: 'monthly',
    category: categories.find(c => c.id === 3)
  },
  { 
    id: 4, 
    categoryId: 4, 
    amount: 200, 
    spent: 25, 
    period: 'monthly',
    category: categories.find(c => c.id === 4)
  },
  { 
    id: 5, 
    categoryId: 5, 
    amount: 300, 
    spent: 99.95, 
    period: 'monthly',
    category: categories.find(c => c.id === 5)
  },
  { 
    id: 6, 
    categoryId: 6, 
    amount: 400, 
    spent: 75.40, 
    period: 'monthly',
    category: categories.find(c => c.id === 6)
  }
];

// Utility functions
export const getPaymentMethodName = (method: PaymentMethod): string => {
  switch (method) {
    case PaymentMethod.Cash: return 'Cash';
    case PaymentMethod.CreditCard: return 'Credit Card';
    case PaymentMethod.QRCodePayment: return 'QR Code Payment';
    case PaymentMethod.EWallet: return 'eWallet';
    case PaymentMethod.BankTransfer: return 'Bank Transfer';
    case PaymentMethod.DuitNow: return 'DuitNow';
    default: return 'Unknown';
  }
};

// Get total expenses
export const getTotalExpenses = (): number => {
  return expenses.reduce((total, expense) => total + expense.totalAmount, 0);
};

// Add the missing functions for DashboardSummary
export const getIncomeTotal = (): number => {
  // For this mock, let's assume we have some hard-coded income
  return 3500; // Example monthly income
};

export const getExpenseTotal = (): number => {
  return getTotalExpenses();
};

export const getBalance = (): number => {
  return getIncomeTotal() - getExpenseTotal();
};

// Get expenses by category
export const getExpensesByCategory = (): ChartDataPoint[] => {
  const categoryTotals = new Map<number, number>();
  
  // Sum up all expenses by category
  expenseItems.forEach(item => {
    const currentTotal = categoryTotals.get(item.categoryId) || 0;
    categoryTotals.set(item.categoryId, currentTotal + item.total);
  });
  
  // Create chart data
  const chartData: ChartDataPoint[] = [];
  categoryTotals.forEach((total, categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    if (category) {
      chartData.push({
        name: category.name,
        value: total,
        color: category.color
      });
    }
  });
  
  return chartData;
};

// Get spending by category (for backward compatibility)
export const getSpendingByCategory = (): ChartDataPoint[] => {
  return getExpensesByCategory();
};

// Get budget status
export const getBudgetStatus = (budget: Budget): BudgetStatus => {
  const percentage = (budget.spent / budget.amount) * 100;
  
  if (percentage >= 100) {
    return 'danger';
  } else if (percentage >= 90) {
    return 'warning';
  } else if (percentage >= 70) {
    return 'caution';
  } else {
    return 'safe';
  }
};

// Get expenses by payment method
export const getExpensesByPaymentMethod = (): ChartDataPoint[] => {
  const paymentMethodTotals = new Map<PaymentMethod, number>();
  
  // Sum up all expenses by payment method
  expenseItems.forEach(item => {
    const currentTotal = paymentMethodTotals.get(item.paymentMethod) || 0;
    paymentMethodTotals.set(item.paymentMethod, currentTotal + item.total);
  });
  
  // Create chart data with predefined colors
  const paymentMethodColors = {
    [PaymentMethod.Cash]: '#92C1B8',
    [PaymentMethod.CreditCard]: '#8E9BC7',
    [PaymentMethod.QRCodePayment]: '#D6A99A',
    [PaymentMethod.EWallet]: '#B7A7CC',
    [PaymentMethod.BankTransfer]: '#93C0DA',
    [PaymentMethod.DuitNow]: '#D8B78E'
  };
  
  const chartData: ChartDataPoint[] = [];
  paymentMethodTotals.forEach((total, method) => {
    chartData.push({
      name: getPaymentMethodName(method),
      value: total,
      color: paymentMethodColors[method] || '#A4B494'
    });
  });
  
  return chartData;
};

// Get expenses for a given date range
export const getExpensesForDateRange = (
  startDate: Date, 
  endDate: Date
): Expense[] => {
  return expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    return expenseDate >= startDate && expenseDate <= endDate;
  });
};

// Get monthly spending trend
export const getMonthlySpendingTrend = (): { month: string; amount: number }[] => {
  // Creating sample monthly data - in a real app, this would calculate from actual expenses
  return [
    { month: 'Jan', amount: 1850.42 },
    { month: 'Feb', amount: 1724.31 },
    { month: 'Mar', amount: 1952.67 },
    { month: 'Apr', amount: 1621.89 },
    { month: 'May', amount: 1879.69 }
  ];
};

// Search and filter expenses
export const searchExpenses = (
  query: string,
  categoryIds: number[] = [],
  paymentMethods: PaymentMethod[] = [],
  startDate?: Date,
  endDate?: Date
): Expense[] => {
  return expenses.filter(expense => {
    // Filter by search query
    const matchesQuery = query === '' || 
      expense.notes.toLowerCase().includes(query.toLowerCase()) ||
      expense.expenseItems.some(item => 
        item.description.toLowerCase().includes(query.toLowerCase())
      );
    
    // Filter by category
    const matchesCategory = categoryIds.length === 0 ||
      expense.expenseItems.some(item => 
        categoryIds.includes(item.categoryId)
      );
    
    // Filter by payment method
    const matchesPaymentMethod = paymentMethods.length === 0 ||
      expense.expenseItems.some(item => 
        paymentMethods.includes(item.paymentMethod)
      );
    
    // Filter by date range
    let matchesDateRange = true;
    if (startDate && endDate) {
      const expenseDate = new Date(expense.date);
      matchesDateRange = expenseDate >= startDate && expenseDate <= endDate;
    }
    
    return matchesQuery && matchesCategory && matchesPaymentMethod && matchesDateRange;
  });
};

// Get most recent expenses
export const getRecentExpenses = (limit: number = 5): Expense[] => {
  return [...expenses]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);
};

// Suggest category based on description (AI-like functionality)
export const suggestCategory = (description: string): number => {
  const lowerDesc = description.toLowerCase();
  
  if (lowerDesc.includes('rent') || lowerDesc.includes('mortgage')) {
    return 1; // Housing
  } else if (lowerDesc.includes('grocery') || lowerDesc.includes('restaurant') || lowerDesc.includes('food')) {
    return 2; // Food
  } else if (lowerDesc.includes('gas') || lowerDesc.includes('uber') || lowerDesc.includes('lyft') || lowerDesc.includes('train')) {
    return 3; // Transport
  } else if (lowerDesc.includes('movie') || lowerDesc.includes('netflix') || lowerDesc.includes('spotify')) {
    return 4; // Entertainment
  } else if (lowerDesc.includes('amazon') || lowerDesc.includes('shopping') || lowerDesc.includes('clothing')) {
    return 5; // Shopping
  } else if (lowerDesc.includes('electric') || lowerDesc.includes('water') || lowerDesc.includes('phone') || lowerDesc.includes('internet')) {
    return 6; // Utilities
  } else if (lowerDesc.includes('doctor') || lowerDesc.includes('medicine') || lowerDesc.includes('pharmacy')) {
    return 7; // Healthcare
  } else if (lowerDesc.includes('course') || lowerDesc.includes('tuition') || lowerDesc.includes('book')) {
    return 8; // Education
  }
  
  return 9; // Miscellaneous
};
