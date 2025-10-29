import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from '@/components/Layout/Layout';
import PageHeader from '@/components/Layout/PageHeader';
import { paymentMethodApi } from '@/lib/api/paymentMethodApi';
import { PaymentMethod, CreatePaymentMethodRequest } from '@/interfaces/payment-method-interface';
import { Button } from '@/components/ui/button.tsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { Input } from '@/components/ui/input.tsx';
import { useToast } from '@/components/ui/use-toast.ts';
import { PlusIcon, PencilIcon, TrashIcon, CheckIcon, XIcon, AlertTriangle, Lock } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'; 

const PaymentMethodsPage = () => {
  // ⚠️ TEMPORARY: Read-only mode until user-scoping is implemented
  // This prevents data corruption while proper user isolation is being fixed
  const READ_ONLY_MODE = true;
  
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
    if (READ_ONLY_MODE) {
      toast({
        title: "Editing Disabled",
        description: "Payment methods are temporarily read-only for security reasons.",
        variant: "destructive",
      });
      return;
    }
    if (!newMethodName.trim()) return;
    
    const newMethod: CreatePaymentMethodRequest = {
      method_name: newMethodName.trim()
    };
    
    createMutation.mutate(newMethod);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (READ_ONLY_MODE) {
      toast({
        title: "Editing Disabled",
        description: "Payment methods are temporarily read-only for security reasons.",
        variant: "destructive",
      });
      return;
    }
    if (!editingMethod || !editingMethod.method_name.trim()) return;
    
    updateMutation.mutate({
      id: editingMethod.id,
      data: { method_name: editingMethod.method_name }
    });
  };

  const handleDelete = (id: number) => {
    if (READ_ONLY_MODE) {
      toast({
        title: "Deletion Disabled",
        description: "Payment methods are temporarily read-only for security reasons.",
        variant: "destructive",
      });
      return;
    }
    if (window.confirm('Are you sure you want to delete this payment method?')) {
      deleteMutation.mutate(id);
    }
  };

  if (error) {
    return <div>Error loading payment methods: {error.message}</div>;
  }

  return (
    <Layout>
      <PageHeader title="Payment Methods" showBack={true} />
      <div className="container mx-auto py-8 lg:pt-8 pt-20">
        {/* Security Warning Banner */}
        {READ_ONLY_MODE && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Read-Only Mode Active</AlertTitle>
            <AlertDescription>
              Payment methods are temporarily view-only while we implement proper user isolation. 
              Editing and deletion are disabled to prevent data corruption.
            </AlertDescription>
          </Alert>
        )}
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Payment Methods
              {READ_ONLY_MODE && <Lock className="h-4 w-4 text-muted-foreground" />}
            </CardTitle>
            <CardDescription>
              {READ_ONLY_MODE 
                ? "View payment methods (editing temporarily disabled)" 
                : "Manage your payment methods for expense tracking"}
            </CardDescription>
          </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex items-end gap-4 mb-6">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <label htmlFor="method-name" className={READ_ONLY_MODE ? "text-muted-foreground" : ""}>
                New Payment Method
              </label>
              <Input 
                id="method-name"
                value={newMethodName}
                onChange={(e) => setNewMethodName(e.target.value)}
                placeholder="Enter payment method name"
                disabled={READ_ONLY_MODE}
                className={READ_ONLY_MODE ? "cursor-not-allowed" : ""}
              />
            </div>
            <Button 
              type="submit" 
              disabled={createMutation.isPending || READ_ONLY_MODE}
              className={READ_ONLY_MODE ? "cursor-not-allowed" : ""}
            >
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
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => READ_ONLY_MODE ? null : setEditingMethod(method)}
                              disabled={READ_ONLY_MODE}
                              className={READ_ONLY_MODE ? "cursor-not-allowed opacity-50" : ""}
                              title={READ_ONLY_MODE ? "Editing disabled for security" : "Edit payment method"}
                            >
                              <PencilIcon className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive" 
                              onClick={() => READ_ONLY_MODE ? null : handleDelete(method.id)}
                              disabled={READ_ONLY_MODE}
                              className={READ_ONLY_MODE ? "cursor-not-allowed opacity-50" : ""}
                              title={READ_ONLY_MODE ? "Deletion disabled for security" : "Delete payment method"}
                            >
                              <TrashIcon className="h-4 w-4 mr-1" />
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
    </Layout>
  );
};

export default PaymentMethodsPage;