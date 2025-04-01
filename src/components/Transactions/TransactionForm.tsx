import React from 'react';
import { Plus } from "lucide-react";
import { useTransactionForm, TransactionType } from './hooks/useTransactionForm';
import TransactionFormFields from './TransactionFormFields';

import { Button } from "@/components/UI/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/UI/dialog";
import { CardFooter } from "@/components/UI/card";

interface TransactionFormProps {
  initialType?: TransactionType;
  buttonText?: string;
  buttonIcon?: React.ReactNode;
}

const TransactionForm = ({ 
  initialType = 'expense',
  buttonText = 'Add Transaction',
  buttonIcon = <Plus className="h-4 w-4" />
}: TransactionFormProps) => {
  const {
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
  } = useTransactionForm();

  // Set initial transaction type when component mounts or when initialType changes
  React.useEffect(() => {
    setTransactionType(initialType);
  }, [initialType, setTransactionType]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="default"
          size="default" 
          className="font-medium shadow-sm hover:shadow-md transition-all"
          data-transaction-form-trigger
        >
          {buttonIcon}
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-xl font-medium">
            Add {transactionType === 'expense' ? 'Expense' : 'Income'}
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
          quantity={quantity}
          setQuantity={setQuantity}
          errors={errors}
        />
        
        <CardFooter className="flex justify-between">
          <DialogClose asChild>
            <Button variant="outline" disabled={isSubmitting}>Cancel</Button>
          </DialogClose>
          <Button 
            type="submit" 
            onClick={handleSubmit}
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
