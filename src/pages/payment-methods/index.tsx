import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentMethodApi } from '@/lib/api/paymentMethodApi';
import { PaymentMethod, CreatePaymentMethodRequest } from '@/interfaces/payment-method-interface';
import { Button } from '@/components/UI/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/UI/card';
import { Input } from '@/components/UI/input';
import { useToast } from '@/components/UI/use-toast';

const PaymentMethodsPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newMethodName, setNewMethodName] = useState('');
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);

  // Fetch payment methods
  const { data: paymentMethods = [], isLoading, error } = useQuery({
    queryKey: ['paymentMethods'],
    queryFn: paymentMethodApi.getAll,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: paymentMethodApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentMethods'] });
      setNewMethodName('');
      toast({
        title: "Success",
        description: "Payment method created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create payment method: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: Partial<PaymentMethod> }) => 
      paymentMethodApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentMethods'] });
      setEditingMethod(null);
      toast({
        title: "Success",
        description: "Payment method updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update payment method: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: paymentMethodApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentMethods'] });
      toast({
        title: "Success",
        description: "Payment method deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete payment method: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMethodName.trim()) return;
    
    const newMethod: CreatePaymentMethodRequest = {
      method_name: newMethodName.trim()
    };
    
    createMutation.mutate(newMethod);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMethod || !editingMethod.method_name.trim()) return;
    
    updateMutation.mutate({
      id: editingMethod.id,
      data: { method_name: editingMethod.method_name }
    });
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this payment method?')) {
      deleteMutation.mutate(id);
    }
  };

  if (error) {
    return <div>Error loading payment methods: {error.message}</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
          <CardDescription>Manage your payment methods for expense tracking</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex items-end gap-4 mb-6">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <label htmlFor="method-name">New Payment Method</label>
              <Input 
                id="method-name"
                value={newMethodName}
                onChange={(e) => setNewMethodName(e.target.value)}
                placeholder="Enter payment method name"
              />
            </div>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Adding...' : 'Add Method'}
            </Button>
          </form>

          {isLoading ? (
            <div>Loading payment methods...</div>
          ) : (
            <div className="border rounded-md">
              {paymentMethods.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  No payment methods found. Add one to get started.
                </div>
              ) : (
                <ul className="divide-y">
                  {paymentMethods.map((method) => (
                    <li key={method.id} className="p-4 flex items-center justify-between">
                      {editingMethod?.id === method.id ? (
                        <form onSubmit={handleUpdate} className="flex items-end gap-4 flex-1">
                          <Input 
                            value={editingMethod.method_name}
                            onChange={(e) => setEditingMethod({...editingMethod, method_name: e.target.value})}
                            className="flex-1"
                          />
                          <Button type="submit" size="sm" disabled={updateMutation.isPending}>
                            Save
                          </Button>
                          <Button type="button" size="sm" variant="outline" onClick={() => setEditingMethod(null)}>
                            Cancel
                          </Button>
                        </form>
                      ) : (
                        <>
                          <span>{method.method_name}</span>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => setEditingMethod(method)}>
                              Edit
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDelete(method.id)}>
                              Delete
                            </Button>
                          </div>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentMethodsPage;