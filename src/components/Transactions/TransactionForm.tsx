
import React from 'react';
import { Plus } from "lucide-react";
import { useTransactionForm } from './hooks/useTransactionForm';
import TransactionFormFields from './TransactionFormFields';

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { CardFooter } from "@/components/ui/card";

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
  } = useTransactionForm();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full" size="lg">
          <Plus className="mr-2 h-4 w-4" />
          Add Transaction
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
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
