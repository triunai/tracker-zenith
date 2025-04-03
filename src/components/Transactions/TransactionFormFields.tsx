import React, { useEffect, useState } from 'react';
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { getPaymentMethodName } from '@/lib/utils';
import { PaymentMethodEnum } from '@/interfaces/payment-method-interface';
import FormField from './FormField';
import { FormErrors } from '@/interfaces/types/transaction';
import { TransactionType } from './hooks/useTransactionForm';
import { supabase } from '@/lib/supabase/supabase';
import { useQuery } from '@tanstack/react-query';
import { expenseApi } from '@/lib/api/expenseApi';
import { paymentMethodApi } from '@/lib/api/paymentMethodApi';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface TransactionFormFieldsProps {
  date: Date;
  setDate: (date: Date) => void;
  transactionType?: TransactionType;
  setTransactionType?: (type: TransactionType) => void;
  category: string;
  setCategory: (category: string) => void;
  incomeCategory?: string;
  setIncomeCategory?: (category: string) => void;
  paymentMethod: string;
  setPaymentMethod: (method: string) => void;
  description: string;
  setDescription: (desc: string) => void;
  amount: string;
  setAmount: (amount: string) => void;
  errors: FormErrors;
  isEditMode?: boolean;
}

const TransactionFormFields = ({
  date,
  setDate,
  transactionType = 'expense',
  setTransactionType,
  category,
  setCategory,
  incomeCategory = '',
  setIncomeCategory,
  paymentMethod,
  setPaymentMethod,
  description,
  setDescription,
  amount,
  setAmount,
  errors,
  isEditMode
}: TransactionFormFieldsProps) => {
  const [incomeCategories, setIncomeCategories] = useState<Array<{id: number, name: string}>>([]);

  // Fetch expense categories using React Query
  const { data: expenseCategories = [] } = useQuery({
    queryKey: ['expenseCategories'],
    queryFn: expenseApi.getCategories,
  });

  // Fetch income categories on mount
  useEffect(() => {
    const fetchIncomeCategories = async () => {
      const { data, error } = await supabase
        .from('income_category')
        .select('id, name')
        .eq('isdeleted', false)
        .order('name');
        
      if (error) {
        console.error('Error fetching income categories:', error);
        return;
      }
      
      setIncomeCategories(data || []);
    };
    
    fetchIncomeCategories();
  }, []);

  // Fetch payment methods
  const { data: paymentMethods = [] } = useQuery({
    queryKey: ['paymentMethods'],
    queryFn: paymentMethodApi.getAll,
  });

  return (
    <div className="grid gap-4 py-4">
      {setTransactionType && (
        <FormField id="transactionType" label="Transaction Type" error={null}>
          <ToggleGroup 
            type="single" 
            value={transactionType} 
            onValueChange={(value) => value && setTransactionType(value as TransactionType)}
            className="justify-start"
          >
            <ToggleGroupItem value="expense" aria-label="Expense">
              Expense
            </ToggleGroupItem>
            <ToggleGroupItem value="income" aria-label="Income">
              Income
            </ToggleGroupItem>
          </ToggleGroup>
        </FormField>
      )}
      
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
      
      {transactionType === 'expense' ? (
        <FormField id="category" label="Expense Category" error={errors.category}>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Select expense category" />
            </SelectTrigger>
            <SelectContent>
              {expenseCategories.map((category) => (
                <SelectItem key={category.id} value={category.id.toString()}>
                  <div className="flex items-center">
                    <div
                      className="w-3 h-3 mr-2 rounded-full"
                      style={{ backgroundColor: '#' + Math.floor(Math.random()*16777215).toString(16) }}
                    ></div>
                    {category.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
      ) : setIncomeCategory && (
        <FormField id="incomeCategory" label="Income Category" error={errors.category}>
          <Select value={incomeCategory} onValueChange={setIncomeCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Select income category" />
            </SelectTrigger>
            <SelectContent>
              {incomeCategories.map((category) => (
                <SelectItem key={category.id} value={category.id.toString()}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
      )}
      
      <FormField id="paymentMethod" label="Payment Method" error={errors.paymentMethod}>
        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
          <SelectTrigger>
            <SelectValue placeholder="Select payment method" />
          </SelectTrigger>
          <SelectContent>
            {paymentMethods.map((method) => (
              <SelectItem key={method.id} value={method.id.toString()}>
                {method.method_name}
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
    </div>
  );
};

export default TransactionFormFields;
