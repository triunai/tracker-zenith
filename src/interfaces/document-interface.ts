// Document processing interfaces

export interface Document {
  id: number;
  user_id: string;
  file_path: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  status: DocumentStatus;
  raw_markdown_output?: string;
  processing_error?: string;
  document_type?: DocumentType;
  vendor_name?: string;
  transaction_date?: string;
  total_amount?: number;
  currency: string;
  transaction_type?: 'expense' | 'income';
  suggested_category_id?: number;
  suggested_category_type?: 'expense' | 'income';
  ai_confidence_score?: number;
  suggested_payment_method_id?: number;
  created_expense_id?: number;
  created_by?: string;
  created_at: string;
  updated_by?: string;
  updated_at?: string;
  isdeleted: boolean;
}

export type DocumentStatus = 
  | 'uploaded' 
  | 'processing' 
  | 'ocr_completed' 
  | 'parsed' 
  | 'transaction_created' 
  | 'failed';

export type DocumentType = 
  | 'receipt' 
  | 'invoice' 
  | 'bank_statement' 
  | 'other';

export interface CreateDocumentRequest {
  user_id: string;
  file_path: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  status?: DocumentStatus;
}

export interface DocumentProcessingResult {
  documentType: DocumentType;
  vendorName: string;
  transactionDate: string;
  totalAmount: number;
  transactionType: 'expense' | 'income';
  suggestedCategoryId: number;
  suggestedCategoryType: 'expense' | 'income';
  confidenceScore: number;
  suggestedPaymentMethodId?: number;
}

export interface CreateTransactionFromDocumentRequest {
  documentId: number;
  categoryId?: number;
  categoryType?: 'expense' | 'income';
  paymentMethodId?: number;
  amount?: number;
  description?: string;
}

export interface CreateTransactionFromDocumentResponse {
  success: boolean;
  expenseId?: number;
  documentId?: number;
  error?: string;
} 