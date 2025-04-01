import { useState, useEffect } from 'react';
import { FormErrors } from '@/interfaces/types/transaction';
import { expenseApi } from '@/lib/api/expenseApi';
import { validateTransaction, isFormValid } from '@/lib/validation/transactionValidation';
import { useToast } from '@/components/UI/use-toast';
import { CreateExpenseRequest, CreateExpenseItemRequest, Expense } from '@/interfaces/expense-interface';
import { supabase } from '@/lib/supabase/supabase';
import { useDashboard } from '@/context/DashboardContext';

// Placeholder until we implement proper auth
const MOCK_USER_ID = "11111111-1111-1111-1111-111111111111";

export type TransactionType = 'expense' | 'income';

export interface TransactionFormHookProps {
  onSuccess?: () => void;
  expenseToEdit?: Expense | null;
}

export const useTransactionForm = ({ onSuccess, expenseToEdit }: TransactionFormHookProps = {}) => {
  const { toast } = useToast();
  const { refreshData } = useDashboard();
  
  const [transactionId, setTransactionId] = useState<number | null>(null);
  const [transactionType, setTransactionType] = useState<TransactionType>('expense');
  const [date, setDate] = useState<Date>(new Date());
  const [category, setCategory] = useState<string>("");
  const [incomeCategory, setIncomeCategory] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [isEditMode, setIsEditMode] = useState(false);
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load transaction data when editing
  useEffect(() => {
    if (expenseToEdit) {
      setIsEditMode(true);
      setTransactionId(expenseToEdit.id);
      
      // Set transaction type
      if (expenseToEdit.transaction_type) {
        setTransactionType(expenseToEdit.transaction_type as TransactionType);
      }
      
      // Set date
      if (expenseToEdit.date) {
        setDate(new Date(expenseToEdit.date));
      }
      
      // Set description
      if (expenseToEdit.description) {
        setDescription(expenseToEdit.description);
      }
      
      // Set payment method
      if (expenseToEdit.payment_method_id) {
        setPaymentMethod(expenseToEdit.payment_method_id.toString());
      }
      
      // Set category and amount based on first expense item
      if (expenseToEdit.expense_items && expenseToEdit.expense_items.length > 0) {
        const firstItem = expenseToEdit.expense_items[0];
        
        // Handle amount
        if (firstItem.amount) {
          setAmount(firstItem.amount.toString());
        }
        
        // Handle category based on transaction type
        if (expenseToEdit.transaction_type === 'income') {
          if (firstItem.income_category_id) {
            setIncomeCategory(firstItem.income_category_id.toString());
          }
        } else {
          if (firstItem.category_id) {
            setCategory(firstItem.category_id.toString());
          }
        }
      }
    }
  }, [expenseToEdit]);

  const resetForm = () => {
    setTransactionId(null);
    setTransactionType('expense');
    setCategory("");
    setIncomeCategory("");
    setPaymentMethod("");
    setDescription("");
    setAmount("");
    setDate(new Date());
    setErrors({});
    setIsEditMode(false);
  };

  const handleSubmit = async () => {
    const formData = {
      date,
      category: transactionType === 'expense' ? category : incomeCategory,
      paymentMethod,
      description,
      amount
    };
    
    const newErrors = validateTransaction(formData);
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      setIsSubmitting(true);
      
      try {
        const amountNum = parseFloat(amount);
        
        if (isEditMode && transactionId) {
          // Update existing transaction
          if (transactionType === 'expense') {
            // Update expense transaction
            const expenseItem: CreateExpenseItemRequest = {
              category_id: parseInt(category),
              amount: amountNum,
              description: description
            };
            
            // Update the transaction
            await expenseApi.update(transactionId, {
              date: date.toISOString(),
              description: description,
              payment_method_id: parseInt(paymentMethod),
              expense_items: [expenseItem] as any,
              transaction_type: 'expense'
            });
            
            toast({
              title: "Expense updated",
              description: `Expense updated for ${description}`,
              variant: "default",
            });
          } else {
            // Update income transaction
            // First update the transaction
            const { error: expenseError } = await supabase
              .from('expense')
              .update({
                date: date.toISOString(),
                description: description,
                payment_method_id: paymentMethod ? parseInt(paymentMethod) : null,
                transaction_type: 'income'
              })
              .eq('id', transactionId);
              
            if (expenseError) throw expenseError;
            
            // Get the expense item ID directly from the database
            const { data: expenseItems, error: getItemError } = await supabase
              .from('expense_item')
              .select('id')
              .eq('expense_id', transactionId)
              .eq('isdeleted', false);
              
            if (getItemError) throw getItemError;
            
            if (expenseItems && expenseItems.length > 0) {
              const itemId = expenseItems[0].id;
              
              // Update the existing expense item - make sure category_id is null for income
              const { error: itemError } = await supabase
                .from('expense_item')
                .update({
                  income_category_id: parseInt(incomeCategory),
                  category_id: null,
                  amount: amountNum,
                  description: description
                })
                .eq('id', itemId);
                
              if (itemError) throw itemError;
            }
            
            toast({
              title: "Income updated",
              description: `Income updated for ${description}`,
              variant: "default",
            });
          }
        } else {
          // Create new transaction
          if (transactionType === 'expense') {
            // Create expense transaction
            // Prepare expense item request
            const expenseItem: CreateExpenseItemRequest = {
              category_id: parseInt(category),
              amount: amountNum,
              description: description
            };
            
            // Prepare the complete expense request
            const expenseRequest: CreateExpenseRequest = {
              user_id: MOCK_USER_ID,
              date: date.toISOString(),
              description: description,
              payment_method_id: parseInt(paymentMethod),
              expense_items: [expenseItem],
              transaction_type: 'expense'
            };
            
            // Submit to the API
            const result = await expenseApi.create(expenseRequest);
            
            toast({
              title: "Expense saved",
              description: `Expense recorded for ${result.description}`,
              variant: "default",
            });
          } else {
            // Create income transaction
            // First create the transaction
            const { data: expense, error: expenseError } = await supabase
              .from('expense')
              .insert({
                user_id: MOCK_USER_ID,
                date: date.toISOString(),
                description: description,
                payment_method_id: paymentMethod ? parseInt(paymentMethod) : null,
                transaction_type: 'income'
              })
              .select();
              
            if (expenseError) throw expenseError;
            
            // Then create the expense item with income category
            const { error: itemError } = await supabase
              .from('expense_item')
              .insert({
                expense_id: expense[0].id,
                category_id: null, // For income, category_id should be null
                income_category_id: parseInt(incomeCategory),
                amount: amountNum,
                description: description
              });
              
            if (itemError) throw itemError;
            
            toast({
              title: "Income saved",
              description: `Income recorded for ${description}`,
              variant: "default",
            });
          }
        }
        
        resetForm();
        
        // Refresh dashboard data instead of forcing page reload
        refreshData();
        
        if (onSuccess) onSuccess();
        
        // Return success to allow Promise chaining
        return true;
      } catch (error) {
        console.error("Transaction submission error:", error);
        toast({
          title: `Error ${isEditMode ? 'updating' : 'saving'} ${transactionType}`,
          description: error instanceof Error ? error.message : "An unexpected error occurred",
          variant: "destructive",
        });
        // Return the error to allow Promise error handling
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    }
    
    // If validation fails, return a rejected promise
    return Promise.reject(new Error("Validation failed"));
  };

  const formIsValid = isFormValid({
    date,
    category: transactionType === 'expense' ? category : incomeCategory,
    paymentMethod,
    description,
    amount
  });

  return {
    transactionId,
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
    errors,
    isSubmitting,
    handleSubmit,
    formIsValid,
    isEditMode,
    resetForm
  };
};
