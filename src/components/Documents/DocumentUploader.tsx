import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '@/lib/auth/hooks/useAuth';
import { supabase } from '@/lib/supabase/supabase';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { FilePlus2, Loader2, Upload, FileText, Image, FileIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Document } from '@/interfaces/document-interface';

interface DocumentUploaderProps {
  onDocumentProcessed: (document: Document) => void;
}

export const DocumentUploader = ({ onDocumentProcessed }: DocumentUploaderProps) => {
  console.log('🔧 DocumentUploader rendered with props:', {
    onDocumentProcessedType: typeof onDocumentProcessed,
    onDocumentProcessedExists: !!onDocumentProcessed
  });
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);

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

        // Step 1: Upload to storage
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

        // Step 3: Add to local state and notify parent
        const newDocument: Document = {
          id: documentId,
          user_id: user.id,
          file_path: filePath,
          original_filename: file.name,
          file_size: file.size,
          mime_type: file.type || 'application/octet-stream',
          status: 'uploaded',
          currency: 'MYR',
          created_at: new Date().toISOString(),
          isdeleted: false
        };

        console.log('🔍 STEP 3.1: Checking onDocumentProcessed function...', {
          onDocumentProcessedType: typeof onDocumentProcessed,
          onDocumentProcessedExists: !!onDocumentProcessed
        });

        if (typeof onDocumentProcessed === 'function') {
          onDocumentProcessed(newDocument);
        } else {
          console.error('❌ onDocumentProcessed is not a function!', { onDocumentProcessed });
        }

        console.log('🔍 STEP 4: Triggering Edge Function processing...');

        // Step 4: Trigger Edge Function for processing
        console.log('🔍 Invoking Edge Function with:', { documentId, filePath });

        // Use proper Supabase function invocation
        const { data: functionResult, error: functionError } = await supabase.functions.invoke('process-document', {
          body: {
            documentId,
            fileName: filePath
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
          
          const updatedDocument: Document = {
            id: documentId,
            user_id: user.id,
            file_path: filePath,
            original_filename: file.name,
            file_size: file.size,
            mime_type: file.type || 'application/octet-stream',
            status: 'parsed',
            document_type: functionResult.parsedData.documentType,
            vendor_name: functionResult.parsedData.vendorName,
            transaction_date: functionResult.parsedData.transactionDate,
            total_amount: functionResult.parsedData.totalAmount,
            currency: functionResult.parsedData.currency,
            transaction_type: functionResult.parsedData.transactionType,
            suggested_category_id: functionResult.parsedData.suggestedCategoryId,
            suggested_category_type: functionResult.parsedData.suggestedCategoryType,
            ai_confidence_score: functionResult.parsedData.confidenceScore,
            suggested_payment_method_id: functionResult.parsedData.suggestedPaymentMethodId,
            created_at: new Date().toISOString(),
            isdeleted: false
          };

          if (typeof onDocumentProcessed === 'function') {
            onDocumentProcessed(updatedDocument);
          } else {
            console.error('❌ onDocumentProcessed is not a function in update step!', { onDocumentProcessed });
          }

          const currencySymbol = functionResult.parsedData.currency === 'MYR' ? 'RM' : 
                                 functionResult.parsedData.currency === 'USD' ? '$' : 
                                 functionResult.parsedData.currency || 'RM';
          
          toast.success('Document Processed Successfully!', {
            description: `Found: ${functionResult.parsedData.vendorName} - ${currencySymbol} ${functionResult.parsedData.totalAmount.toFixed(2)}`,
          });
        } else {
          toast.success('File uploaded successfully!', {
            description: 'AI is now processing your document...',
          });
        }

      } catch (error) {
        console.error('💥 Upload error caught:', error);
        toast.error('Error uploading file.', { 
          description: error instanceof Error ? error.message : 'Upload failed' 
        });
      } finally {
        console.log('🏁 Upload process finished, setting uploading to false');
        setUploading(false);
      }
    },
    [user, onDocumentProcessed]
  );

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

  const getFileIcon = () => {
    if (uploading) {
      return <Loader2 className="h-8 w-8 text-primary animate-spin" />;
    }
    return <Upload className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />;
  };

  return (
    <Card className="shadow-purple hover:shadow-purple-md transition-all duration-300">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Document Upload</CardTitle>
        </div>
        <CardDescription>
          Upload receipts or invoices for AI-powered transaction extraction
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          {...getRootProps()}
          className={cn(
            'relative group w-full h-32 rounded-xl flex flex-col items-center justify-center',
            'border-2 border-dashed transition-all duration-300 ease-in-out cursor-pointer',
            'bg-gradient-to-br from-background to-muted/20',
            isDragActive 
              ? 'border-primary bg-primary/5 scale-[1.02]' 
              : 'border-border hover:border-primary/60 hover:bg-primary/5',
            uploading && 'pointer-events-none opacity-75'
          )}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center text-center p-4">
            {getFileIcon()}
            {uploading ? (
              <div className="mt-3">
                <p className="text-sm font-medium text-primary">Processing...</p>
                <p className="text-xs text-muted-foreground mt-1">AI is analyzing your document</p>
              </div>
            ) : (
              <div className="mt-3">
                <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                  {isDragActive ? 'Drop your file here' : 'Drop files or click to browse'}
                </p>
                <div className="flex items-center justify-center gap-4 mt-2">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Image className="h-3 w-3" />
                    <span>PNG, JPG</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <FileIcon className="h-3 w-3" />
                    <span>PDF</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 