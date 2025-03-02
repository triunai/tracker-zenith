
import React, { useState } from 'react';
import { format } from "date-fns";
import { Calendar as CalendarIcon, Plus, X } from "lucide-react";
import { categories, PaymentMethod, getPaymentMethodName } from '@/lib/utils';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type FormErrors = {
  date?: string;
  category?: string;
  paymentMethod?: string;
  description?: string;
  amount?: string;
  quantity?: string;
};

const TransactionForm = () => {
  const [open, setOpen] = useState(false);
  
  // Form state
  const [date, setDate] = useState<Date>(new Date());
  const [category, setCategory] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("1");
  
  // Form errors
  const [errors, setErrors] = useState<FormErrors>({});

  // Validate the form
  const validateForm = () => {
    const newErrors: FormErrors = {};
    
    // Date validation - cannot be in the future
    if (date > new Date()) {
      newErrors.date = "Date cannot be in the future";
    }
    
    // Category validation - must be selected
    if (!category) {
      newErrors.category = "Please select a category";
    }
    
    // Payment method validation - must be selected
    if (!paymentMethod) {
      newErrors.paymentMethod = "Please select a payment method";
    }
    
    // Description validation - cannot be empty
    if (!description.trim()) {
      newErrors.description = "Description is required";
    }
    
    // Amount validation - must be positive
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      newErrors.amount = "Amount must be a positive number";
    }
    
    // Quantity validation - must be an integer >= 1
    const quantityNum = parseInt(quantity);
    if (isNaN(quantityNum) || quantityNum < 1 || !Number.isInteger(quantityNum)) {
      newErrors.quantity = "Quantity must be a whole number greater than or equal to 1";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Check if the form is valid
  const isFormValid = () => {
    return (
      category !== "" &&
      paymentMethod !== "" &&
      description.trim() !== "" &&
      parseFloat(amount) > 0 &&
      parseInt(quantity) >= 1 &&
      date <= new Date()
    );
  };

  // Handle form submission
  const handleSubmit = () => {
    if (validateForm()) {
      // This would be where we would handle the submission
      console.log({
        date,
        category,
        paymentMethod,
        description,
        amount: parseFloat(amount),
        quantity: parseInt(quantity),
      });
      
      // Close the dialog
      setOpen(false);
      
      // Reset the form
      setCategory("");
      setPaymentMethod("");
      setDescription("");
      setAmount("");
      setQuantity("1");
      setDate(new Date());
    }
  };

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
          {/* Date Field */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="date" className="text-right">
              Date
            </Label>
            <div className="col-span-3">
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
              {errors.date && (
                <p className="text-destructive text-xs mt-1">{errors.date}</p>
              )}
            </div>
          </div>
          
          {/* Category Field */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">
              Category
            </Label>
            <div className="col-span-3">
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
              {errors.category && (
                <p className="text-destructive text-xs mt-1">{errors.category}</p>
              )}
            </div>
          </div>
          
          {/* Payment Method Field */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="paymentMethod" className="text-right">
              Payment
            </Label>
            <div className="col-span-3">
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
              {errors.paymentMethod && (
                <p className="text-destructive text-xs mt-1">{errors.paymentMethod}</p>
              )}
            </div>
          </div>
          
          {/* Description Field */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <div className="col-span-3">
              <Input
                id="description"
                placeholder="Enter description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              {errors.description && (
                <p className="text-destructive text-xs mt-1">{errors.description}</p>
              )}
            </div>
          </div>
          
          {/* Amount Field */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right">
              Amount
            </Label>
            <div className="col-span-3 relative">
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
              {errors.amount && (
                <p className="text-destructive text-xs mt-1">{errors.amount}</p>
              )}
            </div>
          </div>
          
          {/* Quantity Field */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="quantity" className="text-right">
              Quantity
            </Label>
            <div className="col-span-3">
              <Input
                id="quantity"
                type="number"
                min="1"
                defaultValue="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
              {errors.quantity && (
                <p className="text-destructive text-xs mt-1">{errors.quantity}</p>
              )}
            </div>
          </div>
        </div>
        <CardFooter className="flex justify-between">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button 
            type="submit" 
            onClick={handleSubmit}
            disabled={!isFormValid()}
          >
            Save Transaction
          </Button>
        </CardFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionForm;
