
import React, { useState } from 'react';
import { format } from "date-fns";
import { Calendar as CalendarIcon, Plus } from "lucide-react";
import { categories, PaymentMethod, getPaymentMethodName } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";
import { FormErrors, TransactionData } from '@/types/transaction';
import { validateTransaction, isFormValid } from '@/lib/validation/transactionValidation';
import { saveTransaction } from '@/lib/api/transactionApi';
import FormField from './FormField';

import { Button } from "@/components/UI/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/UI/dialog";
import { Input } from "@/components/UI/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/UI/select";
import { Calendar } from "@/components/UI/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/UI/popover";
import { cn } from "@/lib/utils";
import { CardFooter } from "@/components/UI/card";

const TransactionForm = () => {
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
            description: "Your transaction was successfully recorded.",
          });
          
          resetForm();
          setOpen(false);
        } else {
          toast({
            title: "Error",
            description: "Failed to save transaction. Please try again.",
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "An unexpected error occurred. Please try again.",
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
        <div className="grid gap-4 py-4">
          <FormField id="date" label="Date" error={errors.date}>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(date) => date && setDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </FormField>
          
          <FormField id="category" label="Category" error={errors.category}>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    <div className="flex items-center">
                      <div
                        className="w-3 h-3 mr-2 rounded-full"
                        style={{ backgroundColor: category.color }}
                      ></div>
                      {category.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          
          <FormField id="paymentMethod" label="Payment" error={errors.paymentMethod}>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(PaymentMethod)
                  .filter(value => typeof value === 'number')
                  .map((method) => (
                    <SelectItem key={method} value={method.toString()}>
                      {getPaymentMethodName(method as PaymentMethod)}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </FormField>
          
          <FormField id="description" label="Description" error={errors.description}>
            <Input
              id="description"
              placeholder="Enter description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </FormField>
          
          <FormField id="amount" label="Amount" error={errors.amount}>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <span className="text-gray-500">$</span>
              </div>
              <Input
                id="amount"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                className="pl-8"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </FormField>
          
          <FormField id="quantity" label="Quantity" error={errors.quantity}>
            <Input
              id="quantity"
              type="number"
              min="1"
              defaultValue="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </FormField>
        </div>
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
