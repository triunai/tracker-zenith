import { useState } from 'react';
import { FormErrors } from '@/interfaces/types/transaction';
import { expenseApi } from '@/lib/api/expenseApi';
import { validateTransaction, isFormValid } from '@/lib/validation/transactionValidation';
import { useToast } from '@/components/UI/use-toast';
import { CreateExpenseRequest, CreateExpenseItemRequest } from '@/interfaces/expense-interface';

// Placeholder for auth until we integrate it properly
const MOCK_USER_ID = "11111111-1111-1111-1111-111111111111";

export const useExpenseForm = (onSuccess?: () => void) => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  
  const [date, setDate] = useState<Date>(new Date());
  const [category, setCategory] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("1");
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setCategory("");
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
      category,
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
          expense_items: [expenseItem]
        };
        
        // Submit to the API
        const result = await expenseApi.create(expenseRequest);
        
        toast({
          title: "Transaction saved",
          description: `Expense recorded for ${result.description}`,
          variant: "default",
        });
        
        resetForm();
        setOpen(false);
        if (onSuccess) onSuccess();
      } catch (error) {
        console.error("Expense submission error:", error);
        toast({
          title: "Error saving transaction",
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
    category,
    paymentMethod,
    description,
    amount,
    quantity
  });

  return {
    open,
    setOpen,
    date,
    setDate,
    category,
    setCategory,
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