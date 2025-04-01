import { useState } from 'react';
import { FormErrors } from '@/interfaces/types/transaction';
import { expenseApi } from '@/lib/api/expenseApi';
import { validateTransaction, isFormValid } from '@/lib/validation/transactionValidation';
import { useToast } from '@/components/UI/use-toast';
import { CreateExpenseRequest, CreateExpenseItemRequest } from '@/interfaces/expense-interface';
import { supabase } from '@/lib/supabase/supabase';
import { useDashboard } from '@/context/DashboardContext';

// Placeholder until we implement proper auth
const MOCK_USER_ID = "11111111-1111-1111-1111-111111111111";

export type TransactionType = 'expense' | 'income';

export const useTransactionForm = (onSuccess?: () => void) => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { refreshData } = useDashboard();
  
  const [transactionType, setTransactionType] = useState<TransactionType>('expense');
  const [date, setDate] = useState<Date>(new Date());
  const [category, setCategory] = useState<string>("");
  const [incomeCategory, setIncomeCategory] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("1");
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setTransactionType('expense');
    setCategory("");
    setIncomeCategory("");
    setPaymentMethod("");
    setDescription("");
    setAmount("");
    setQuantity("1");
    setDate(new Date());
    setErrors({});
  };

  const handleSubmit = async () => {
    const formData = {
      date,
      category: transactionType === 'expense' ? category : incomeCategory,
      paymentMethod,
      description,
      amount,
      quantity
    };
    
    const newErrors = validateTransaction(formData);
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      setIsSubmitting(true);
      
      try {
        const amountNum = parseFloat(amount);
        const quantityNum = parseInt(quantity);
        const totalAmount = amountNum * quantityNum;
        
        if (transactionType === 'expense') {
          // Create expense transaction
          // Prepare expense item request
          const expenseItem: CreateExpenseItemRequest = {
            category_id: parseInt(category),
            amount: totalAmount,
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
              amount: totalAmount,
              description: description
            });
            
          if (itemError) throw itemError;
          
          toast({
            title: "Income saved",
            description: `Income recorded for ${description}`,
            variant: "default",
          });
        }
        
        resetForm();
        setOpen(false);
        
        // Refresh dashboard data instead of forcing page reload
        refreshData();
        
        if (onSuccess) onSuccess();
      } catch (error) {
        console.error("Transaction submission error:", error);
        toast({
          title: `Error saving ${transactionType}`,
          description: error instanceof Error ? error.message : "An unexpected error occurred",
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const formIsValid = isFormValid({
    date,
    category: transactionType === 'expense' ? category : incomeCategory,
    paymentMethod,
    description,
    amount,
    quantity
  });

  return {
    open,
    setOpen,
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
    quantity,
    setQuantity,
    errors,
    isSubmitting,
    handleSubmit,
    formIsValid
  };
};
