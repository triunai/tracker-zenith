import React from 'react';
import { CheckCircle, AlertCircle, Clock, DollarSign, Calendar, Building2, Loader2, Sparkles, Brain, Zap, X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase/supabase';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useDashboard } from '@/context/DashboardContext';
import { cn } from '@/lib/utils';
import { Document } from '@/interfaces/document-interface';

interface ProcessedDocumentsProps {
  documents: Document[];
  onDocumentUpdate: (document: Document) => void;
  onDocumentRemove?: (documentId: number) => void;
}

export const ProcessedDocuments = ({ documents, onDocumentUpdate, onDocumentRemove }: ProcessedDocumentsProps) => {
  const { userId, refreshData } = useDashboard();
  const queryClient = useQueryClient();

  const handleRemoveDocument = (documentId: number) => {
    if (onDocumentRemove) {
      onDocumentRemove(documentId);
      toast.success('Document removed', {
        description: 'Document has been removed from the list',
      });
    }
  };

  const handleCreateTransaction = async (document: Document) => {
    try {
      const { data: result, error } = await supabase
        .rpc('create_transaction_from_document', {
          p_document_id: document.id,
          p_category_id: document.suggested_category_id,
          p_category_type: document.suggested_category_type,
          p_payment_method_id: document.suggested_payment_method_id,
          p_amount: document.total_amount,
          p_description: document.vendor_name
        });

      if (error) {
        throw new Error(error.message);
      }

      const parsedResult = typeof result === 'string' ? JSON.parse(result) : result;

      if (!parsedResult.success) {
        throw new Error(parsedResult.error);
      }

      const updatedDocument = { ...document, status: 'transaction_created' as const };
      onDocumentUpdate(updatedDocument);

      queryClient.invalidateQueries({ queryKey: ['expenses', userId] });
      queryClient.invalidateQueries({ queryKey: ['transactions', userId] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary', userId] });
      queryClient.invalidateQueries({ queryKey: ['spendingByCategory', userId] });
      queryClient.invalidateQueries({ queryKey: ['spendingByPayment', userId] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['budgetSpending'] });
      queryClient.invalidateQueries({ queryKey: ['budgetCategorySpending'] });
      
      refreshData();

      toast.success('Transaction Created!', {
        description: `Transaction for ${document.vendor_name} added to your records`,
      });

    } catch (error) {
      console.error('Error creating transaction:', error);
      toast.error('Failed to create transaction', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploaded':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'processing':
      case 'ocr_completed':
        return <Brain className="h-4 w-4 text-purple-500 animate-pulse" />;
      case 'parsed':
        return <Sparkles className="h-4 w-4 text-green-500" />;
      case 'transaction_created':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'uploaded': return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700';
      case 'processing': 
      case 'ocr_completed': return 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700';
      case 'parsed': return 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700';
      case 'transaction_created': return 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700';
      case 'failed': return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    const symbol = currency === 'MYR' ? 'RM' : currency === 'USD' ? '$' : currency || 'RM';
    return `${symbol} ${amount.toFixed(2)}`;
  };

  if (documents.length === 0) {
    return (
      <Card className="shadow-purple hover:shadow-purple-md transition-all duration-300">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">AI Processing Results</CardTitle>
          </div>
          <CardDescription>
            Documents processed by AI are ready to become transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-muted/50 p-4 mb-4">
              <Brain className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-foreground mb-2">No documents processed yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Upload a receipt or invoice above to see AI-powered transaction extraction in action.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-purple hover:shadow-purple-md transition-all duration-300">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">AI Processing Results</CardTitle>
        </div>
        <CardDescription>
          Documents processed by AI are ready to become transactions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {documents.map((document) => (
            <div
              key={document.id}
              className={cn(
                "relative overflow-hidden rounded-xl border transition-all duration-300",
                "bg-gradient-to-r from-background to-muted/20",
                "hover:shadow-md hover:scale-[1.01]",
                document.status === 'parsed' && "ring-2 ring-green-200 dark:ring-green-800 bg-gradient-to-r from-green-50/50 dark:from-green-950/20 to-background",
                document.status === 'transaction_created' && "ring-2 ring-emerald-200 dark:ring-emerald-800 bg-gradient-to-r from-emerald-50/50 dark:from-emerald-950/20 to-background"
              )}
            >
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="flex-shrink-0 mt-1">
                      {getStatusIcon(document.status)}
                    </div>
                    
                    <div className="flex-1 min-w-0 space-y-2">
                      {/* Header with filename and status */}
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-sm truncate text-foreground">
                          {document.original_filename}
                        </h3>
                        <Badge 
                          variant="outline" 
                          className={cn("text-xs font-medium shrink-0", getStatusColor(document.status))}
                        >
                          {getStatusText(document.status)}
                        </Badge>
                      </div>
                      
                      {/* AI Confidence Score - Only show if available */}
                      {document.ai_confidence_score && (
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="text-xs bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700">
                            <Brain className="h-3 w-3 mr-1" />
                            {Math.round(document.ai_confidence_score * 100)}%
                          </Badge>
                        </div>
                      )}
                      
                      {/* Parsed Data - Compact Layout */}
                      {document.status === 'parsed' && (
                        <div className="space-y-2">
                          {/* Main Info Row */}
                          <div className="flex items-center gap-2 text-sm">
                            {document.vendor_name && (
                              <span className="font-medium text-foreground truncate">
                                {document.vendor_name}
                              </span>
                            )}
                            {document.total_amount && (
                              <span className="font-bold text-green-600 dark:text-green-400 shrink-0">
                                {formatCurrency(document.total_amount, document.currency)}
                              </span>
                            )}
                          </div>
                          
                          {/* Secondary Info Row */}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {document.transaction_date && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {document.transaction_date}
                              </span>
                            )}
                            {document.transaction_type && (
                              <Badge 
                                variant="outline"
                                                                 className={cn(
                                   "text-xs",
                                   document.transaction_type === 'income' 
                                     ? "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700" 
                                     : "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700"
                                 )}
                              >
                                {document.transaction_type}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Processing State */}
                      {document.status === 'processing' && (
                        <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          <span className="text-xs">AI is analyzing your document...</span>
                        </div>
                      )}
                      
                      {/* Error State */}
                      {document.status === 'failed' && document.processing_error && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">{document.processing_error}</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-start gap-2 shrink-0">
                    {/* Remove Button - Always show */}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveDocument(document.id)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    
                    {/* Status-specific Actions */}
                    {document.status === 'parsed' && (
                      <Button
                        size="sm"
                        onClick={() => handleCreateTransaction(document)}
                        className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white shadow-sm hover:shadow-md transition-all duration-200"
                      >
                        <Sparkles className="h-3 w-3 mr-1" />
                        Create Transaction
                      </Button>
                    )}
                    {document.status === 'transaction_created' && (
                      <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 px-2">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-xs font-medium">Complete</span>
                      </div>
                    )}
                    {document.status === 'processing' && (
                      <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400 px-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-xs">Processing</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-primary/5 pointer-events-none" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
