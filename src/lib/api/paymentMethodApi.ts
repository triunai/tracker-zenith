import { supabase } from '../supabase/supabase';
import { PaymentMethod, CreatePaymentMethodRequest } from '@/interfaces/payment-method-interface';

export const paymentMethodApi = {
  // Get all payment methods
  getAll: async (): Promise<PaymentMethod[]> => {
    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('isdeleted', false)
      .order('method_name');
    
    if (error) throw error;
    return data || [];
  },
  
  // Get payment method by ID
  getById: async (id: number): Promise<PaymentMethod | null> => {
    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('id', id)
      .eq('isdeleted', false)
      .single();
    
    if (error) throw error;
    return data;
  },
  
  // Create new payment method
  create: async (paymentMethod: CreatePaymentMethodRequest): Promise<PaymentMethod> => {
    const { data, error } = await supabase
      .from('payment_methods')
      .insert([paymentMethod])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  // Update payment method
  update: async (id: number, paymentMethod: Partial<PaymentMethod>): Promise<PaymentMethod> => {
    const { data, error } = await supabase
      .from('payment_methods')
      .update(paymentMethod)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  // Delete payment method (soft delete)
  delete: async (id: number): Promise<void> => {
    const { error } = await supabase
      .from('payment_methods')
      .update({ isdeleted: true })
      .eq('id', id);
    
    if (error) throw error;
  }
};