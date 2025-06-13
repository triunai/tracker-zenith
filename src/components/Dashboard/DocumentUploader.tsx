import { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '@/lib/auth/hooks/useAuth';
import { supabase } from '@/lib/supabase/supabase';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { FilePlus2, Loader2, CheckCircle, AlertCircle, Clock, DollarSign, Calendar, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useQueryClient } from '@tanstack/react-query';
import { useDashboard } from '@/context/DashboardContext';

interface ProcessedDocument {
  id: number;
  originalFilename: string;
  status: 'uploaded' | 'processing' | 'ocr_completed' | 'parsed' | 'transaction_created' | 'failed';
  documentType?: string;
  vendorName?: string;
  transactionDate?: string;
  totalAmount?: number;
  currency?: string;
  transactionType?: 'expense' | 'income';
  suggestedCategoryId?: number;
  suggestedCategoryType?: 'expense' | 'income';
  aiConfidenceScore?: number;
  suggestedPaymentMethodId?: number;
  processingError?: string;
}

export const DocumentUploader = () => {
  const { user } = useAuth();
  const { userId, refreshData } = useDashboard();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [processedDocuments, setProcessedDocuments] = useState<ProcessedDocument[]>([]);



  // Setup real-time listener for document processing updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('document-processing')
      .on('broadcast', { event: 'document-processed' }, (payload) => {
        const { documentId, parsedData } = payload.payload;
        
        setProcessedDocuments(prev => 
          prev.map(doc => 
            doc.id === documentId 
              ? {
                  ...doc,
                  status: 'parsed',
                  documentType: parsedData.documentType,
                  vendorName: parsedData.vendorName,
                  transactionDate: parsedData.transactionDate,
                  totalAmount: parsedData.totalAmount,
                  transactionType: parsedData.transactionType,
                  suggestedCategoryId: parsedData.suggestedCategoryId,
                  suggestedCategoryType: parsedData.suggestedCategoryType,
                  aiConfidenceScore: parsedData.confidenceScore,
                  suggestedPaymentMethodId: parsedData.suggestedPaymentMethodId
                }
              : doc
          )
        );

        toast.success('Document Processed!', {
          description: `AI found: ${parsedData.vendorName}, $${parsedData.totalAmount}`,
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      console.log('🚀 onDrop triggered!', { 
        acceptedFiles, 
        fileCount: acceptedFiles.length,
        user: !!user 
      });

      if (!user) {
        console.log('❌ No user - aborting upload');
        toast.error('You must be logged in to upload documents.');
        return;
      }
      if (acceptedFiles.length === 0) {
        console.log('❌ No files accepted - aborting upload');
        return;
      }

      const file = acceptedFiles[0];
      console.log('📁 File selected:', {
        name: file.name,
        size: file.size,
        type: file.type
      });

      const fileExtension = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExtension}`;
      const filePath = `${user.id}/${fileName}`;

      console.log('🔄 Setting uploading to true...');
      setUploading(true);

      try {
        console.log('🔍 STEP 1: Starting file upload...', {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          filePath,
          userId: user.id
        });

        // Step 1: Upload to storage (keep your existing bucket name)
        const { error: uploadError } = await supabase.storage
          .from('document-uploads')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        console.log('🔍 STEP 1 RESULT: File upload result', { uploadError });

        if (uploadError) {
          throw new Error(`Upload failed: ${uploadError.message}`);
        }

        console.log('🔍 STEP 2: Creating document record in database...');

        // Step 2: Create document record in database
        const { data: documentId, error: dbError } = await supabase
          .rpc('insert_document_data', {
            p_user_id: user.id,
            p_file_path: filePath,
            p_original_filename: file.name,
            p_file_size: file.size,
            p_mime_type: file.type || 'application/octet-stream'
          });

        console.log('🔍 STEP 2 RESULT: Database insert result', { documentId, dbError });

        if (dbError) {
          throw new Error(`Database error: ${dbError.message}`);
        }

        console.log('🔍 STEP 3: Adding document to local state...');

        // Step 3: Add to local state
        const newDocument: ProcessedDocument = {
          id: documentId,
          originalFilename: file.name,
          status: 'uploaded'
        };

        setProcessedDocuments(prev => [...prev, newDocument]);

        console.log('🔍 STEP 4: Triggering Edge Function processing...');

        // Step 4: Trigger Edge Function for processing using proper Supabase method
        // Update status to processing locally
        setProcessedDocuments(prev => 
          prev.map(doc => 
            doc.id === documentId ? { ...doc, status: 'processing' } : doc
          )
        );

        console.log('🔍 Invoking Edge Function with:', { documentId, filePath });

        // Use proper Supabase function invocation (handles auth automatically)
        const { data: functionResult, error: functionError } = await supabase.functions.invoke('process-document', {
          body: {
            documentId,
            fileName: filePath  // Fix: send as fileName instead of filePath
          }
        });

        console.log('Function result:', functionResult);
        console.log('Function error:', functionError);

        if (functionError) {
          throw new Error(`Document processing failed: ${functionError.message}`);
        }

        // Update document with parsed data from Edge Function
        if (functionResult?.success && functionResult?.parsedData) {
          console.log('✅ Updating document with parsed data:', functionResult.parsedData);
          
          setProcessedDocuments(prev => 
            prev.map(doc => 
              doc.id === documentId ? {
                ...doc,
                status: 'parsed',
                documentType: functionResult.parsedData.documentType,
                vendorName: functionResult.parsedData.vendorName,
                transactionDate: functionResult.parsedData.transactionDate,
                totalAmount: functionResult.parsedData.totalAmount,
                currency: functionResult.parsedData.currency,
                transactionType: functionResult.parsedData.transactionType,
                suggestedCategoryId: functionResult.parsedData.suggestedCategoryId,
                suggestedCategoryType: functionResult.parsedData.suggestedCategoryType,
                aiConfidenceScore: functionResult.parsedData.confidenceScore,
                suggestedPaymentMethodId: functionResult.parsedData.suggestedPaymentMethodId
              } : doc
            )
          );

          const currencySymbol = functionResult.parsedData.currency === 'MYR' ? 'RM' : 
                                 functionResult.parsedData.currency === 'USD' ? '$' : 
                                 functionResult.parsedData.currency || 'RM';
          
          toast.success('Document Processed Successfully!', {
            description: `Found: ${functionResult.parsedData.vendorName} - ${currencySymbol} ${functionResult.parsedData.totalAmount}`,
          });
        } else {
          toast.success('File uploaded successfully!', {
            description: 'AI is now processing your document...',
          });
        }

      } catch (error) {
        console.error('💥 Upload error caught:', error);
        console.error('💥 Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          error
        });
        toast.error('Error uploading file.', { 
          description: error instanceof Error ? error.message : 'Upload failed' 
        });
      } finally {
        console.log('🏁 Upload process finished, setting uploading to false');
        setUploading(false);
      }
    },
    [user]
  );

  // Handle creating transaction from processed document
  const handleCreateTransaction = async (document: ProcessedDocument) => {
    try {
      const { data: result, error } = await supabase
        .rpc('create_transaction_from_document', {
          p_document_id: document.id,
          p_category_id: document.suggestedCategoryId,
          p_category_type: document.suggestedCategoryType,
          p_payment_method_id: document.suggestedPaymentMethodId,
          p_amount: document.totalAmount,
          p_description: document.vendorName
        });

      if (error) {
        throw new Error(error.message);
      }

      const parsedResult = typeof result === 'string' ? JSON.parse(result) : result;

      if (!parsedResult.success) {
        throw new Error(parsedResult.error);
      }

      // Update document status
      setProcessedDocuments(prev => 
        prev.map(doc => 
          doc.id === document.id 
            ? { ...doc, status: 'transaction_created' }
            : doc
        )
      );

      // 🎯 CRITICAL FIX: Invalidate React Query caches to trigger UI updates
      console.log('🔄 Invalidating React Query caches after transaction creation...');
      
      // Invalidate all transaction-related queries
      queryClient.invalidateQueries({ queryKey: ['expenses', userId] });
      queryClient.invalidateQueries({ queryKey: ['transactions', userId] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary', userId] });
      queryClient.invalidateQueries({ queryKey: ['spendingByCategory', userId] });
      queryClient.invalidateQueries({ queryKey: ['spendingByPayment', userId] });
      
      // Invalidate budget-related queries
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['budgetSpending'] });
      queryClient.invalidateQueries({ queryKey: ['budgetCategorySpending'] });
      
      // Also trigger dashboard refresh
      refreshData();

      toast.success('Transaction Created!', {
        description: `Transaction for ${document.vendorName} added to your records`,
      });

    } catch (error) {
      console.error('Error creating transaction:', error);
      toast.error('Failed to create transaction', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
    onDropRejected: (rejections) => {
      rejections.forEach(rejection => {
        console.error(`File ${rejection.file.name} rejected:`, rejection.errors);
      });
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploaded':
      case 'processing':
      case 'ocr_completed':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'parsed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'transaction_created':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <FilePlus2 className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'uploaded': return 'Uploaded';
      case 'processing': return 'AI Processing...';
      case 'ocr_completed': return 'Text Extracted';
      case 'parsed': return 'Ready!';
      case 'transaction_created': return 'Transaction Created';
      case 'failed': return 'Failed';
      default: return status;
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={cn(
          'relative group w-full h-48 rounded-2xl flex flex-col items-center justify-center',
          'border-2 border-dashed border-border',
          'bg-card/50 dark:bg-slate-800/20 backdrop-blur-sm',
          'cursor-pointer transition-all duration-300 ease-in-out',
          'hover:border-primary',
          isDragActive && 'border-primary'
        )}
      >
        <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 opacity-0 group-hover:opacity-75 transition-opacity duration-300 blur"></div>
        <div className="relative w-full h-full flex flex-col items-center justify-center text-center p-4">
          <input {...getInputProps()} />
          {uploading ? (
            <>
              <Loader2 className="h-12 w-12 text-muted-foreground animate-spin" />
              <p className="mt-2 text-sm text-muted-foreground">Uploading...</p>
            </>
          ) : (
            <>
              <FilePlus2 className="h-12 w-12 text-muted-foreground group-hover:text-primary transition-colors" />
              <p className="mt-2 text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                Drop Receipt or Invoice
              </p>
              <p className="text-xs text-muted-foreground/80">(PNG, JPG, PDF - or click to browse)</p>
            </>
          )}
        </div>
      </div>

      {/* Processing Results */}
      {processedDocuments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">AI Processing Results</CardTitle>
            <CardDescription>
              Documents processed by AI are ready to become transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {processedDocuments.map((document) => (
                <div
                  key={document.id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-card/50"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {getStatusIcon(document.status)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {document.originalFilename}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {getStatusText(document.status)}
                        </Badge>
                        {document.aiConfidenceScore && (
                          <Badge variant="outline" className="text-xs">
                            {Math.round(document.aiConfidenceScore * 100)}% confidence
                          </Badge>
                        )}
                      </div>
                      
                      {/* Show parsed data */}
                      {document.status === 'parsed' && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {document.vendorName && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Building2 className="h-3 w-3" />
                              {document.vendorName}
                            </div>
                          )}
                          {document.totalAmount && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <span className="text-xs font-medium">💰</span>
                              {document.currency === 'MYR' ? 'RM' : 
                               document.currency === 'USD' ? '$' : 
                               document.currency || 'RM'} {document.totalAmount}
                            </div>
                          )}
                          {document.transactionDate && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {document.transactionDate}
                            </div>
                          )}
                          <Badge 
                            variant={document.transactionType === 'income' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {document.transactionType}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Action Button */}
                  <div className="ml-3">
                    {document.status === 'parsed' && (
                      <Button
                        size="sm"
                        onClick={() => handleCreateTransaction(document)}
                        className="whitespace-nowrap"
                      >
                        Create Transaction
                      </Button>
                    )}
                    {document.status === 'transaction_created' && (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    )}
                    {document.status === 'processing' && (
                      <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 