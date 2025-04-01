import React, { useState, useEffect } from 'react';
import { Plus, Pencil } from "lucide-react";
import { useTransactionForm, TransactionType, TransactionFormHookProps } from './hooks/useTransactionForm';
import TransactionFormFields from './TransactionFormFields';
import { Expense } from '@/interfaces/expense-interface';

import { Button } from "@/components/UI/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/UI/dialog";
import { CardFooter } from "@/components/UI/card";

interface TransactionFormProps {
  initialType?: TransactionType;
  buttonText?: string;
  buttonIcon?: React.ReactNode;
  onSuccess?: () => void;
  expenseToEdit?: Expense | null;
  buttonVariant?: "default" | "outline" | "secondary" | "destructive" | "ghost" | "link";
  buttonSize?: "default" | "sm" | "lg" | "icon";
  className?: string;
  asChild?: boolean;
}

const TransactionForm = ({ 
  initialType = 'expense',
  buttonText,
  buttonIcon,
  onSuccess,
  expenseToEdit,
  buttonVariant = "default",
  buttonSize = "default",
  className = "font-medium shadow-sm hover:shadow-md transition-all",
  asChild = false
}: TransactionFormProps) => {
  // Local state for dialog open
  const [isOpen, setIsOpen] = useState(false);
  
  // Set default button text and icon based on edit mode
  const defaultButtonText = expenseToEdit ? 'Edit' : 'Add Transaction';
  const defaultButtonIcon = expenseToEdit ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />;
  
  // Use provided values or defaults
  const finalButtonText = buttonText ?? defaultButtonText;
  const finalButtonIcon = buttonIcon ?? defaultButtonIcon;

  const hookProps: TransactionFormHookProps = {
    onSuccess,
    expenseToEdit
  };

  const {
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
  } = useTransactionForm(hookProps);

  // Handle dialog open change
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Clean up when dialog is closed
      resetForm();
    }
  };

  // Handle button click explicitly
  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event propagation
    setIsOpen(true);
  };

  // Set initial transaction type when component mounts or when initialType changes
  useEffect(() => {
    if (!expenseToEdit) {
      setTransactionType(initialType);
    }
  }, [initialType, setTransactionType, expenseToEdit]);

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <Button 
        variant={buttonVariant}
        size={buttonSize} 
        className={className}
        data-transaction-form-trigger
        onClick={handleButtonClick}
      >
        {finalButtonIcon}
        {finalButtonText}
      </Button>
      <DialogContent onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle className="text-xl font-medium">
            {isEditMode ? 'Edit' : 'Add'} {transactionType === 'expense' ? 'Expense' : 'Income'}
          </DialogTitle>
        </DialogHeader>
        
        <TransactionFormFields
          date={date}
          setDate={setDate}
          transactionType={transactionType}
          setTransactionType={setTransactionType}
          category={category}
          setCategory={setCategory}
          incomeCategory={incomeCategory}
          setIncomeCategory={setIncomeCategory}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          description={description}
          setDescription={setDescription}
          amount={amount}
          setAmount={setAmount}
          errors={errors}
          isEditMode={isEditMode}
        />
        
        <CardFooter className="flex justify-between">
          <Button variant="outline" disabled={isSubmitting} onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            onClick={(e) => {
              e.stopPropagation();
              handleSubmit()
                .then(() => {
                  // Close the dialog on successful submission
                  setIsOpen(false);
                })
                .catch((error) => {
                  // Error is already handled by the useTransactionForm hook
                  console.log("Form submission failed:", error);
                  // Don't close the form so user can correct the errors
                });
            }}
            disabled={!formIsValid || isSubmitting}
          >
            {isSubmitting ? "Submitting..." : `Save ${transactionType === 'expense' ? 'Expense' : 'Income'}`}
          </Button>
        </CardFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionForm;
