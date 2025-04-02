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
  onClose?: () => void;
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
  onClose,
  buttonVariant = "default",
  buttonSize = "default",
  className = "font-medium shadow-sm hover:shadow-md transition-all",
  asChild = false
}: TransactionFormProps) => {
  // State for the dialog
  const [isOpen, setIsOpen] = useState(false);
  
  // Default text & icons
  const defaultButtonText = 'Add Transaction';
  const defaultButtonIcon = <Plus className="h-4 w-4" />;
  const finalButtonText = buttonText ?? defaultButtonText;
  const finalButtonIcon = buttonIcon ?? defaultButtonIcon;

  // Setup transaction form hook
  const hookProps: TransactionFormHookProps = {
    onSuccess: () => {
      setIsOpen(false);
      if (onSuccess) onSuccess();
    },
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

  // IMPORTANT: This opens the dialog when expenseToEdit changes from null to a value
  useEffect(() => {
    if (expenseToEdit) {
      console.log("Opening dialog for edit", expenseToEdit.id);
      setIsOpen(true);
    }
  }, [expenseToEdit]);  

  // Handle dialog state changes
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      resetForm();
      if (onClose) {
        onClose(); // Clear expenseToEdit in parent
      }
    }
  };

  // Click handler for the Add button
  const handleAddButtonClick = () => {
    setIsOpen(true);
  };

  // Set initial transaction type
  useEffect(() => {
    if (!isEditMode) {
      setTransactionType(initialType);
    }
  }, [initialType, isEditMode, setTransactionType]);

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {/* Only show Add button when not in edit mode */}
      {!expenseToEdit && (
        <DialogTrigger asChild={asChild}>
          <Button 
            variant={buttonVariant}
            size={buttonSize} 
            className={className}
            onClick={handleAddButtonClick}
          >
            {finalButtonIcon}
            {finalButtonText}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent>
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
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            onClick={() => {
              handleSubmit()
                .catch((error) => {
                  console.log("Form submission failed:", error);
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
