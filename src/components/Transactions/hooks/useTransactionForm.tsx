import { useState, useEffect, useCallback } from 'react';
import { TransactionData } from '@/interfaces/types/transaction';
import { expenseApi } from '@/lib/api/expenseApi';
import { ExpenseCategory, Expense, CreateExpenseItemRequest, CreateExpenseRequest } from '@/interfaces/expense-interface';
import { PaymentMethod } from '@/interfaces/payment-method-interface';
import { useToast } from '@/components/ui/use-toast.ts';
import { useDashboard } from '@/context/DashboardContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';

// Type definitions
export type TransactionType = 'expense' | 'income';

export interface TransactionFormHookProps {
  onSuccess?: () => void;
  expenseToEdit?: Expense | null;
}

// Define a simplified type for the expense item that matches what the API expects
interface ExpenseItemInput {
  amount: number;
  description: string;
  category_id: number | null;
  income_category_id?: number | null;
}

export const useTransactionForm = ({
  onSuccess,
  expenseToEdit
}: TransactionFormHookProps = {}) => {
  const { toast } = useToast();
  const { userId, refreshData } = useDashboard();
  const queryClient = useQueryClient();
  
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [incomeCategories, setIncomeCategories] = useState<ExpenseCategory[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<{
    date?: string;
    category?: string;
    paymentMethod?: string;
    amount?: string;
    description?: string;
  }>({});
  
  // Form field states
  const [transactionType, setTransactionType] = useState<TransactionType>('expense');
  const [isExpense, setIsExpense] = useState(true);
  const [date, setDate] = useState<Date>(new Date());
  const [category, setCategory] = useState<string>('');
  const [incomeCategory, setIncomeCategory] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [isEditMode, setIsEditMode] = useState(!!expenseToEdit);
  
  // This is used for tracking changes in individual fields to prevent excessive rerenders
  const [formData, setFormData] = useState<TransactionData>({
    date: new Date().toISOString().split('T')[0],
    category: '',
    paymentMethod: '',
    description: '',
    amount: '',
  });

  // Update isExpense when transactionType changes - this is the only effect that manages sync between the two
  useEffect(() => {
    setIsExpense(transactionType === 'expense');
  }, [transactionType]);

  // Load categories and payment methods
  const loadCategoriesAndPaymentMethods = useCallback(async () => {
    try {
      setIsLoading(true);
      const categoryData = await expenseApi.getCategories();
      
      // Get expense and income categories
      // We'll check if a field to determine income exists, if not use a fallback approach
      const hasIsIncomeField = categoryData.length > 0 && 'is_income' in categoryData[0];
      
      let expenseCats: ExpenseCategory[] = [];
      let incomeCats: ExpenseCategory[] = [];
      
      if (hasIsIncomeField) {
        // @ts-ignore - is_income might not be in the interface but exists in runtime data
        expenseCats = categoryData.filter(cat => !cat.is_income);
        // @ts-ignore - is_income might not be in the interface but exists in runtime data
        incomeCats = categoryData.filter(cat => cat.is_income);
      } else {
        // Fallback: Assume categories with ID >= 100 are income (or use another logic)
        expenseCats = categoryData.filter(cat => cat.id < 100);
        incomeCats = categoryData.filter(cat => cat.id >= 100);
      }
      
      setCategories(expenseCats);
      setIncomeCategories(incomeCats);
      
      const paymentMethodsData = await expenseApi.getPaymentMethods();
      setPaymentMethods(paymentMethodsData);
    } catch (error) {
      console.error('Error loading form data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load form data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  // Initialize the form with data from expenseToEdit if provided
  useEffect(() => {
    loadCategoriesAndPaymentMethods();
    
    if (expenseToEdit && expenseToEdit.expense_items && expenseToEdit.expense_items.length > 0) {
      const item = expenseToEdit.expense_items[0];
      const isIncomeItem = item.income_category_id !== null;
      
      // Update transactionType directly (which will update isExpense via the other useEffect)
      setTransactionType(!isIncomeItem ? 'expense' : 'income');
      setIsEditMode(true);
      
      // Set all the form fields directly from the expense
      const newDate = new Date(expenseToEdit.date);
      setDate(newDate);
      
      if (isIncomeItem) {
        setIncomeCategory(item.income_category_id?.toString() || '');
        setCategory('');
      } else {
        setCategory(item.category_id?.toString() || '');
        setIncomeCategory('');
      }
      
      setPaymentMethod(expenseToEdit.payment_method_id?.toString() || '');
      setDescription(expenseToEdit.description || '');
      setAmount(item.amount.toString());
      
      // Update the formData state for tracking purposes only
      setFormData({
        date: newDate.toISOString().split('T')[0],
        category: isIncomeItem ? (item.income_category_id?.toString() || '') : (item.category_id?.toString() || ''),
        paymentMethod: expenseToEdit.payment_method_id?.toString() || '',
        description: expenseToEdit.description || '',
        amount: item.amount.toString(),
      });
    }
  }, [expenseToEdit, loadCategoriesAndPaymentMethods]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Update both the individual field and the tracking formData
    switch (name) {
      case 'date':
        setDate(new Date(value));
        break;
      case 'category':
        if (isExpense) {
          setCategory(value);
        } else {
          setIncomeCategory(value);
        }
        break;
      case 'paymentMethod':
        setPaymentMethod(value);
        break;
      case 'description':
        setDescription(value);
        break;
      case 'amount':
        setAmount(value);
        break;
    }
    
    // Update the tracking formData state
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear errors when user makes changes
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors({
        ...formErrors,
        [name]: undefined,
      });
    }
  };
  
  const handleTypeChange = (isExpenseType: boolean) => {
    // Only update transactionType, which will update isExpense via the useEffect
    setTransactionType(isExpenseType ? 'expense' : 'income');
    
    // Reset the category when changing transaction type
    if (isExpenseType) {
      setIncomeCategory('');
      setFormData(prev => ({
        ...prev,
        category: category,
      }));
    } else {
      setCategory('');
      setFormData(prev => ({
        ...prev,
        category: incomeCategory,
      }));
    }
  };
  
  const validateForm = (): boolean => {
    const errors: {
      date?: string;
      category?: string;
      paymentMethod?: string;
      amount?: string;
      description?: string;
    } = {};
    
    if (!date) {
      errors.date = 'Date is required';
    }
    
    const currentCategory = isExpense ? category : incomeCategory;
    if (!currentCategory) {
      errors.category = 'Category is required';
    }
    
    if (!paymentMethod) {
      errors.paymentMethod = 'Payment method is required';
    }
    
    const amountValue = parseFloat(amount);
    if (!amount || isNaN(amountValue) || amountValue <= 0) {
      errors.amount = 'Amount must be a positive number';
    }
    
    if (!description || description.trim() === '') {
      errors.description = 'Description is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // --- Define the Mutation using useMutation --- 
  const mutation = useMutation({
    mutationFn: async (formData: CreateExpenseRequest | { id: number; data: Partial<Expense> }) => {
      if ('id' in formData) {
        // Update existing expense
        console.log('Updating expense with ID:', formData.id);
        // Ensure data contains necessary fields for update
        const updateData = { ...formData.data, user_id: userId }; 
        return await expenseApi.update(formData.id, updateData);
      } else {
        // Create new expense
        console.log('Creating new expense...');
        return await expenseApi.create(formData);
      }
    },
    onSuccess: (data, variables) => {
      console.log('Mutation successful:', data);
      toast({
        title: isEditMode ? 'Transaction Updated' : 'Transaction Added',
        variant: 'default',
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['expenses', userId] }); // Invalidate the main transaction list query
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary', userId] }); // Invalidate dashboard summary
      queryClient.invalidateQueries({ queryKey: ['spendingByCategory', userId] }); // Invalidate chart data
      queryClient.invalidateQueries({ queryKey: ['spendingByPayment', userId] }); // Invalidate chart data
      
      // Invalidate BudgetTracker queries
      queryClient.invalidateQueries({ queryKey: ['budgets'] }); // Invalidate all budgets queries
      queryClient.invalidateQueries({ queryKey: ['budgetSpending'] }); // Invalidate all budget spending queries
      queryClient.invalidateQueries({ queryKey: ['budgetCategorySpending'] }); // Invalidate all budget category spending queries
      
      // Call the onSuccess prop passed to the hook (e.g., to close a modal)
      if (onSuccess) {
        onSuccess();
      }
      resetForm(); // Reset form fields after successful submission
    },
    onError: (error) => {
      console.error('Error submitting transaction:', error);
      toast({
        title: 'Error',
        description: `Failed to save transaction: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
  
  const handleSubmit = async () => {
    if (!validateForm()) {
      return Promise.reject(new Error('Form validation failed'));
    }
    
    if (!userId) {
      toast({
        title: 'Error',
        description: 'You must be logged in to create a transaction',
        variant: 'destructive',
      });
      return Promise.reject(new Error('User not authenticated'));
    }
    
    const amountValue = parseFloat(amount);
    const categoryId = parseInt(isExpense ? category : incomeCategory);
    const paymentMethodId = parseInt(paymentMethod);
    
    // Format date consistently using local date components to avoid timezone issues
    const formatLocalDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    const expenseItem: CreateExpenseItemRequest = {
      category_id: isExpense ? categoryId : null as any,
      amount: amountValue,
      description: description
    };
    if (!isExpense) {
      (expenseItem as any).income_category_id = categoryId;
    }
    
    let mutationData: CreateExpenseRequest | { id: number; data: Partial<Expense> };
    
    if (expenseToEdit) {
      const updateData: Partial<Expense> = {
        user_id: userId,
        date: formatLocalDate(date),
        description: description,
        payment_method_id: paymentMethodId,
        transaction_type: transactionType,
        expense_items: [expenseItem] as any
      };
      mutationData = { id: expenseToEdit.id, data: updateData };
    } else {
      const createData: CreateExpenseRequest = {
        user_id: userId,
        date: formatLocalDate(date),
        description: description,
        payment_method_id: paymentMethodId,
        transaction_type: transactionType,
        expense_items: [expenseItem]
      };
      mutationData = createData;
    }
    
    // Trigger the mutation
    try {
      await mutation.mutateAsync(mutationData); // Use mutateAsync to await completion for promise chain
      return Promise.resolve(true); // Resolve promise for the calling component
    } catch (error) {
      // Error is handled by onError callback in useMutation
      return Promise.reject(error); // Reject promise for the calling component
    }
  };
  
  const resetForm = () => {
    // Reset all form states to initial values
    setTransactionType('expense');
    setIsExpense(true);
    setDate(new Date());
    setCategory('');
    setIncomeCategory('');
    setPaymentMethod('');
    setDescription('');
    setAmount('');
    setIsEditMode(false);
    setFormErrors({});
    
    // Reset tracking formData state
    setFormData({
      date: new Date().toISOString().split('T')[0],
      category: '',
      paymentMethod: '',
      description: '',
      amount: '',
    });
  };
  
  // Calculate form validity
  const formIsValid = 
    !!date && 
    !!(isExpense ? category : incomeCategory) && 
    !!paymentMethod && 
    !!description && 
    parseFloat(amount) > 0 &&
    Object.keys(formErrors).length === 0;
  
  return {
    formData,
    formErrors: formErrors,
    categories,
    incomeCategories,
    paymentMethods,
    isExpense,
    isLoading,
    isSubmitting: mutation.isPending,
    handleChange,
    handleTypeChange,
    handleSubmit,
    resetForm,
    // Individual field states for the component
    transactionType,
    setTransactionType,
    date,
    setDate,
    category,
    setCategory,
    incomeCategory,
    setIncomeCategory,
    paymentMethod,
    setPaymentMethod,
    description,
    setDescription,
    amount,
    setAmount,
    errors: formErrors,
    formIsValid,
    isEditMode
  };
};
