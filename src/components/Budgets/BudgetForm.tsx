// Updated BudgetForm.tsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery } from '@tanstack/react-query';
import { budgetApi } from '@/lib/api/budgetApi';
import { PeriodEnum } from '@/interfaces/enums/PeriodEnum';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/UI/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/UI/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/UI/select';
import { Input } from '@/components/UI/input';
import { Button } from '@/components/UI/button';
import { Loader2 } from 'lucide-react';

// Form validation schema
const budgetFormSchema = z.object({
  categoryId: z.number({
    required_error: "Please select a category",
  }),
  categoryName: z.string().optional(),
  amount: z.number({
    required_error: "Please enter an amount",
  }).positive("Amount must be greater than 0"),
  period: z.nativeEnum(PeriodEnum, {
    required_error: "Please select a period",
  }),
});

type BudgetFormValues = z.infer<typeof budgetFormSchema>;

interface BudgetFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: BudgetFormValues) => void;
}

const BudgetForm = ({ open, onOpenChange, onSubmit }: BudgetFormProps) => {
  // Fetch categories
  const { data: categories = [], isLoading: isLoadingCategories } = useQuery({
    queryKey: ['expenseCategories'],
    queryFn: budgetApi.getCategories,
  });
  
  const form = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: {
      period: PeriodEnum.MONTHLY,
    },
  });

  const handleSubmit = async (data: BudgetFormValues) => {
    // Find selected category to get the name
    const selectedCategory = categories.find(c => c.id === data.categoryId);
    if (selectedCategory) {
      data.categoryName = selectedCategory.name;
    }
    
    onSubmit(data);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Budget</DialogTitle>
          <DialogDescription>
            Set up a new budget for tracking your expenses.
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
                    onValueChange={value => field.onChange(Number(value))}
                    defaultValue={field.value?.toString()}
                    disabled={isLoadingCategories}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
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
                        type="number"
                        min="0.01"
                        step="0.01"
                        placeholder="0.00"
                        className="pl-10"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
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
                  <div className="flex flex-wrap gap-2">
                    {Object.values(PeriodEnum).map((period) => (
                      <Button
                        key={period}
                        type="button"
                        size="sm"
                        variant={field.value === period ? 'default' : 'outline'}
                        onClick={() => field.onChange(period)}
                        className="capitalize"
                      >
                        {period.toLowerCase()}
                      </Button>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
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
                    Creating...
                  </>
                ) : (
                  'Create Budget'
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