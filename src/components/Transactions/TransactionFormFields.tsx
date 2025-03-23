
import React from 'react';
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { categories, PaymentMethod, getPaymentMethodName } from '@/lib/utils';
import FormField from './FormField';
import { FormErrors } from '@/types/transaction';

import { Button } from "@/components/UI/button";
import { Input } from "@/components/UI/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/UI/select";
import { Calendar } from "@/components/UI/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/UI/popover";
import { cn } from "@/lib/utils";

interface TransactionFormFieldsProps {
  date: Date;
  setDate: (date: Date) => void;
  category: string;
  setCategory: (category: string) => void;
  paymentMethod: string;
  setPaymentMethod: (method: string) => void;
  description: string;
  setDescription: (desc: string) => void;
  amount: string;
  setAmount: (amount: string) => void;
  quantity: string;
  setQuantity: (quantity: string) => void;
  errors: FormErrors;
}

const TransactionFormFields = ({
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
  errors
}: TransactionFormFieldsProps) => {
  return (
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
            <span className="text-gray-500">RM</span>
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
  );
};

export default TransactionFormFields;
