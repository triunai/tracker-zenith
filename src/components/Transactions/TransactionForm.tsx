import React from 'react';
import { Plus } from "lucide-react";
import { useExpenseForm } from './hooks/useExpenseForm';
import TransactionFormFields from './TransactionFormFields';

import { Button } from "@/components/UI/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/UI/dialog";
import { CardFooter } from "@/components/UI/card";

const TransactionForm = () => {
  const {
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
  } = useExpenseForm();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="default"
          size="default" 
          className="font-medium shadow-sm hover:shadow-md transition-all"
          data-transaction-form-trigger
        >
          <Plus className="h-4 w-4" />
          Add Transaction
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-xl font-medium">Add Transaction</DialogTitle>
        </DialogHeader>
        
        <TransactionFormFields
          date={date}
          setDate={setDate}
          category={category}
          setCategory={setCategory}
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
            {isSubmitting ? "Submitting..." : "Save Transaction"}
          </Button>
        </CardFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionForm;
