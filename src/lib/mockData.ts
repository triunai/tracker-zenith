export type Transaction = {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  type: 'income' | 'expense';
};

export type Category = {
  id: string;
  name: string;
  color: string;
  type: 'income' | 'expense';
  icon: string;
};

export type Budget = {
  id: string;
  category: string;
  amount: number;
  spent: number;
  period: 'monthly' | 'weekly' | 'yearly';
};

// Sample categories with iOS-like muted colors
export const categories: Category[] = [
  { id: '1', name: 'Housing', color: '#8E9BC7', type: 'expense', icon: 'home' },
  { id: '2', name: 'Food', color: '#93C0DA', type: 'expense', icon: 'utensils' },
  { id: '3', name: 'Transport', color: '#D6A99A', type: 'expense', icon: 'car' },
  { id: '4', name: 'Entertainment', color: '#92C1B8', type: 'expense', icon: 'tv' },
  { id: '5', name: 'Shopping', color: '#B7A7CC', type: 'expense', icon: 'shopping-bag' },
  { id: '6', name: 'Utilities', color: '#D8B78E', type: 'expense', icon: 'zap' },
  { id: '7', name: 'Salary', color: '#73B17C', type: 'income', icon: 'briefcase' },
  { id: '8', name: 'Investments', color: '#7AADC8', type: 'income', icon: 'trending-up' },
  { id: '9', name: 'Gifts', color: '#D48A9B', type: 'income', icon: 'gift' }
];

// Sample transactions
export const transactions: Transaction[] = [
  { 
    id: '1', 
    date: '2023-05-01', 
    description: 'Monthly Rent', 
    amount: 1200, 
    category: 'Housing', 
    type: 'expense' 
  },
  { 
    id: '2', 
    date: '2023-05-01', 
    description: 'Salary', 
    amount: 3500, 
    category: 'Salary', 
    type: 'income' 
  },
  { 
    id: '3', 
    date: '2023-05-02', 
    description: 'Grocery Shopping', 
    amount: 85.75, 
    category: 'Food', 
    type: 'expense' 
  },
  { 
    id: '4', 
    date: '2023-05-03', 
    description: 'Gas', 
    amount: 45.30, 
    category: 'Transport', 
    type: 'expense' 
  },
  { 
    id: '5', 
    date: '2023-05-04', 
    description: 'Movie Tickets', 
    amount: 24.99, 
    category: 'Entertainment', 
    type: 'expense' 
  },
  { 
    id: '6', 
    date: '2023-05-05', 
    description: 'Online Shopping', 
    amount: 99.95, 
    category: 'Shopping', 
    type: 'expense' 
  },
  { 
    id: '7', 
    date: '2023-05-06', 
    description: 'Electricity Bill', 
    amount: 75.40, 
    category: 'Utilities', 
    type: 'expense' 
  },
  { 
    id: '8', 
    date: '2023-05-07', 
    description: 'Dividend Payment', 
    amount: 125.30, 
    category: 'Investments', 
    type: 'income' 
  },
  { 
    id: '9', 
    date: '2023-05-08', 
    description: 'Birthday Gift', 
    amount: 50, 
    category: 'Gifts', 
    type: 'income' 
  },
  { 
    id: '10', 
    date: '2023-05-10', 
    description: 'Restaurant', 
    amount: 65.80, 
    category: 'Food', 
    type: 'expense' 
  }
];

// Sample budgets
export const budgets: Budget[] = [
  { id: '1', category: 'Housing', amount: 1500, spent: 1200, period: 'monthly' },
  { id: '2', category: 'Food', amount: 500, spent: 450, period: 'monthly' },
  { id: '3', category: 'Transport', amount: 200, spent: 150, period: 'monthly' },
  { id: '4', category: 'Entertainment', amount: 200, spent: 100, period: 'monthly' },
  { id: '5', category: 'Shopping', amount: 300, spent: 240, period: 'monthly' },
  { id: '6', category: 'Utilities', amount: 400, spent: 280, period: 'monthly' }
];

// Financial summary calculations
export const getIncomeTotal = () => {
  return transactions
    .filter(transaction => transaction.type === 'income')
    .reduce((total, transaction) => total + transaction.amount, 0);
};

export const getExpenseTotal = () => {
  return transactions
    .filter(transaction => transaction.type === 'expense')
    .reduce((total, transaction) => total + transaction.amount, 0);
};

export const getBalance = () => {
  return getIncomeTotal() - getExpenseTotal();
};

// Get spending by category for charts
export const getSpendingByCategory = () => {
  const spendingByCategory: { name: string; value: number; color: string }[] = [];
  
  // Group expenses by category
  const categoryMap = new Map<string, number>();
  transactions
    .filter(transaction => transaction.type === 'expense')
    .forEach(transaction => {
      const current = categoryMap.get(transaction.category) || 0;
      categoryMap.set(transaction.category, current + transaction.amount);
    });
  
  // Create array for chart data
  categories
    .filter(category => category.type === 'expense')
    .forEach(category => {
      const amount = categoryMap.get(category.name) || 0;
      if (amount > 0) {
        spendingByCategory.push({
          name: category.name,
          value: amount,
          color: category.color
        });
      }
    });
  
  return spendingByCategory;
};

// Get budget status for alerts
export const getBudgetStatus = (budget: Budget) => {
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

// AI suggestions for categorization
export const suggestCategory = (description: string): string => {
  const lowerDesc = description.toLowerCase();
  
  // Very simple matching logic (in a real app, this would be ML-based)
  if (lowerDesc.includes('rent') || lowerDesc.includes('mortgage')) {
    return 'Housing';
  } else if (lowerDesc.includes('grocery') || lowerDesc.includes('restaurant') || lowerDesc.includes('food')) {
    return 'Food';
  } else if (lowerDesc.includes('gas') || lowerDesc.includes('uber') || lowerDesc.includes('lyft') || lowerDesc.includes('train')) {
    return 'Transport';
  } else if (lowerDesc.includes('movie') || lowerDesc.includes('netflix') || lowerDesc.includes('spotify')) {
    return 'Entertainment';
  } else if (lowerDesc.includes('amazon') || lowerDesc.includes('shopping')) {
    return 'Shopping';
  } else if (lowerDesc.includes('electric') || lowerDesc.includes('water') || lowerDesc.includes('phone') || lowerDesc.includes('internet')) {
    return 'Utilities';
  } else if (lowerDesc.includes('salary') || lowerDesc.includes('paycheck')) {
    return 'Salary';
  } else if (lowerDesc.includes('dividend') || lowerDesc.includes('stock')) {
    return 'Investments';
  } else if (lowerDesc.includes('gift') || lowerDesc.includes('birthday')) {
    return 'Gifts';
  }
  
  return 'Other';
};
