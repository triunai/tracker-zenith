
import { useState } from 'react';
import { FormErrors, TransactionData } from '@/interfaces/types/transaction';
import { validateTransaction, isFormValid } from '@/lib/validation/transactionValidation';
import { saveTransaction } from '@/lib/api/transactionApi';
import { useToast } from "@/hooks/use-toast";

export const useTransactionForm = (onSuccess?: () => void) => {
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
        const transactionData: TransactionData = {
          date,
          category,
          paymentMethod,
          description,
          amount: parseFloat(amount),
          quantity: parseInt(quantity),
        };
        
        const success = await saveTransaction(transactionData);
        
        if (success) {
          toast({
            title: "Transaction saved",
            variant: "default",
          });
          
          resetForm();
          setOpen(false);
          if (onSuccess) onSuccess();
        } else {
          toast({
            title: "Error",
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "An unexpected error occurred. Please try again.",
          variant: "destructive",
        });
        console.error("Transaction submission error:", error);
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
