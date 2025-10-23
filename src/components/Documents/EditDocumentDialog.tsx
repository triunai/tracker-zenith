import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Document } from '@/interfaces/document-interface';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Edit2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface EditDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: Document | null;
  onSave: (updatedDocument: Document) => void;
}

export const EditDocumentDialog: React.FC<EditDocumentDialogProps> = ({
  open,
  onOpenChange,
  document,
  onSave
}) => {
  const [vendorName, setVendorName] = useState('');
  const [amount, setAmount] = useState('');
  const [transactionType, setTransactionType] = useState<'expense' | 'income'>('expense');
  const [date, setDate] = useState<Date | undefined>(new Date());

  // Reset form when document changes
  useEffect(() => {
    if (document) {
      setVendorName(document.vendor_name || '');
      setAmount(document.total_amount?.toString() || '');
      setTransactionType((document.transaction_type as 'expense' | 'income') || 'expense');
      setDate(document.transaction_date ? new Date(document.transaction_date) : new Date());
    }
  }, [document]);

  const handleSave = () => {
    if (!document) return;

    const updated: Document = {
      ...document,
      vendor_name: vendorName,
      total_amount: parseFloat(amount) || 0,
      transaction_type: transactionType,
      transaction_date: date ? format(date, 'yyyy-MM-dd') : null
    };
    
    onSave(updated);
    onOpenChange(false);
  };

  if (!document) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Edit2 className="h-5 w-5 text-primary" />
            <DialogTitle>Edit Transaction Details</DialogTitle>
          </div>
          <DialogDescription>
            Review and modify the AI-extracted data before creating the transaction.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Vendor Name */}
          <div className="grid gap-2">
            <Label htmlFor="vendor">Vendor/Merchant</Label>
            <Input
              id="vendor"
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
              placeholder="e.g., Starbucks, Amazon"
            />
          </div>

          {/* Amount */}
          <div className="grid gap-2">
            <Label htmlFor="amount">Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {document.currency === 'MYR' ? 'RM' : document.currency === 'USD' ? '$' : 'RM'}
              </span>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="pl-10"
              />
            </div>
          </div>

          {/* Transaction Type */}
          <div className="grid gap-2">
            <Label htmlFor="type">Type</Label>
            <Select value={transactionType} onValueChange={(val) => setTransactionType(val as 'expense' | 'income')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">💸 Expense</SelectItem>
                <SelectItem value="income">💰 Income</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date */}
          <div className="grid gap-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  className={cn(
                    "justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="gap-2">
            <Edit2 className="h-4 w-4" />
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

