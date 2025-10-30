// Updated BudgetForm.tsx
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { PeriodEnum } from '@/interfaces/enums/PeriodEnum';
import { Budget } from '@/interfaces/budget-interface';
import { ExpenseCategory } from '@/interfaces/expense-interface';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.tsx';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form.tsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Loader2 } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

// Form validation schema
const budgetFormSchema = z.object({
  categoryId: z.number({
    required_error: "Please select a category",
  }),
  categoryName: z.string().optional(),
  amount: z.string().min(1, "Please enter an amount").refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, "Amount must be greater than 0"),
  period: z.nativeEnum(PeriodEnum, {
    required_error: "Please select a period",
  }),
  alert_threshold: z.number().min(50).max(100).optional(),
});

type BudgetFormValues = z.infer<typeof budgetFormSchema>;

interface BudgetFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: BudgetFormValues) => void;
  initialData?: Budget | null;
  categories?: ExpenseCategory[];
}

const BudgetForm = ({ open, onOpenChange, onSubmit, initialData, categories = [] }: BudgetFormProps) => {
  const isEditing = !!initialData;

  const form = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: {
      period: PeriodEnum.MONTHLY,
      amount: '',
      categoryId: undefined,
      alert_threshold: 80,
    },
  });

  // Reset form when initialData or editing state changes
  // Note: form.reset is intentionally excluded from deps to prevent unnecessary re-renders
  useEffect(() => {
    if (isEditing && initialData) {
      const firstCategory = initialData.budget_categories?.[0];

      form.reset({
        categoryId: firstCategory?.category_id,
        amount: initialData.amount?.toString() || '',
        period: initialData.period,
        alert_threshold: firstCategory?.alert_threshold ?? 80,
        categoryName: undefined,
      });
    } else {
      form.reset({
        period: PeriodEnum.MONTHLY,
        amount: '',
        categoryId: undefined,
        alert_threshold: 80,
        categoryName: undefined,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, isEditing]);

  const handleSubmit = async (data: BudgetFormValues) => {
    // Validate amount
    const amount = parseFloat(data.amount);
    if (!data.amount || isNaN(amount) || amount <= 0) {
      console.error('Invalid amount:', data.amount);
      return;
    }

    // Find category name from the selected category ID
    const selectedCategory = categories.find(c => c.id === data.categoryId);
    const submitData: BudgetFormValues = {
      ...data,
      categoryName: selectedCategory?.name,
    };

    console.log(`BudgetForm submitting (${isEditing ? 'Edit' : 'Create'}):`, submitData);

    if (typeof onSubmit === 'function') {
      onSubmit(submitData);
    } else {
      console.error('Invalid onSubmit handler provided to BudgetForm!', onSubmit);
      alert(`Error: Cannot ${isEditing ? 'update' : 'create'} budget. Please try again or refresh the page.`);
    }
  };

  const isLoadingCategories = categories.length === 0 && !isEditing;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-w-[85vw] mx-0 p-6">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Budget' : 'Create New Budget'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the details for this budget.' : 'Set up a new budget for tracking your expenses.'}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select 
                    value={field.value?.toString()}
                    onValueChange={value => field.onChange(Number(value))}
                    disabled={isLoadingCategories || isEditing}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-h-[300px]">
                      {isLoadingCategories ? (
                        <SelectItem value="loading" disabled>Loading categories...</SelectItem>
                      ) : (
                        categories.map(category => (
                          <SelectItem 
                            key={category.id} 
                            value={category.id.toString()}
                          >
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: '#' + Math.floor(Math.random()*16777215).toString(16) }}
                              />
                              {category.name}
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {isEditing && <p className="text-xs text-muted-foreground mt-1">Category cannot be changed after creation.</p>}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Budget Amount</FormLabel>
                  <div className="grid gap-2">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <span className="text-gray-500">RM</span>
                      </div>
                      <Input
                        id="amount"
                        type="text"
                        placeholder="0.00"
                        className="pl-10"
                        value={field.value}
                        onChange={(e) => {
                          const value = e.target.value;
                          // Allow only numbers, decimal point, and empty string
                          if (value === '' || /^\d*\.?\d*$/.test(value)) {
                            field.onChange(value);
                          }
                        }}
                      />
                    </div>
                    {form.formState.errors.amount && (
                      <p className="text-sm text-destructive">{form.formState.errors.amount.message}</p>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="period"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Budget Period</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    disabled={form.formState.isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a period" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={PeriodEnum.DAILY}>Daily</SelectItem>
                      <SelectItem value={PeriodEnum.WEEKLY}>Weekly</SelectItem>
                      <SelectItem value={PeriodEnum.MONTHLY}>Monthly</SelectItem>
                      <SelectItem value={PeriodEnum.QUARTERLY}>Quarterly</SelectItem>
                      <SelectItem value={PeriodEnum.YEARLY}>Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="alert_threshold"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Alert Threshold
                    <span className="text-muted-foreground ml-2">
                      ({field.value}%)
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Slider
                      min={50}
                      max={100}
                      step={5}
                      value={[field.value ?? 80]}
                      onValueChange={(value) => field.onChange(value[0])}
                      disabled={form.formState.isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-center sm:space-x-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditing ? 'Saving...' : 'Creating...'}
                  </>
                ) : (
                  isEditing ? 'Save Changes' : 'Create Budget'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default BudgetForm;