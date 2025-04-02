import { useState, useEffect, useCallback } from 'react';
import { TransactionData } from '@/interfaces/types/transaction';
import { expenseApi } from '@/lib/api/expenseApi';
import { ExpenseCategory, Expense, CreateExpenseItemRequest, CreateExpenseRequest } from '@/interfaces/expense-interface';
import { PaymentMethod } from '@/interfaces/payment-method-interface';
import { useToast } from '@/components/UI/use-toast';
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
        return expenseApi.update(formData.id, formData.data);
      } else {
        // Create new expense
        return expenseApi.create(formData);
      }
    },
    onSuccess: (_, variables) => {
      // Determine if it was a create or update based on variables
      const action = ('id' in variables) ? 'updated' : 'added';
      
      toast({
        title: 'Success',
        description: `Transaction ${action} successfully`,
        variant: 'default',
      });
      
      // --- Invalidate Queries --- 
      console.log(`Transaction ${action}, invalidating relevant queries...`);
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] }); 
      queryClient.invalidateQueries({ queryKey: ['spendingChartData'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['budgetSpending'] });
      queryClient.invalidateQueries({ queryKey: ['budgetCategorySpending'] });
      // Add any other relevant query keys here
      
      // Call the original onSuccess callback if provided (e.g., to close modal)
      if (onSuccess) {
        onSuccess();
      }
      
      // Refresh dashboard data context (if it does more than just query)
      refreshData();
      
      // Reset form only on successful creation
      if (!('id' in variables)) {
        resetForm();
      }
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
        date: date.toISOString().split('T')[0],
        description: description,
        payment_method_id: paymentMethodId,
        transaction_type: transactionType,
        expense_items: [expenseItem] as any
      };
      mutationData = { id: expenseToEdit.id, data: updateData };
    } else {
      const createData: CreateExpenseRequest = {
        user_id: userId,
        date: date.toISOString().split('T')[0],
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
