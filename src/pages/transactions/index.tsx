import React, { useState } from 'react';
import Layout from '@/components/Layout/Layout';
import PageHeader from '@/components/Layout/PageHeader';
import TransactionList from '@/components/Transactions/TransactionList';
import { DocumentUploader } from '@/components/Documents/DocumentUploader';
import { ProcessedDocuments } from '@/components/Documents/ProcessedDocuments';
import DateFilter from '@/components/Dashboard/DateFilter';
import { useDashboard } from '@/context/DashboardContext';
import { Document } from '@/interfaces/document-interface';

const TransactionsPage = () => {
  const { dateRangeText } = useDashboard();
  const [processedDocuments, setProcessedDocuments] = useState<Document[]>([]);
  const [showScanner, setShowScanner] = useState(false);

  // Listen for central button triggering scanner
  React.useEffect(() => {
    const handleOpenScanner = () => {
      setShowScanner(true);
    };
    
    document.addEventListener('openDocumentScanner', handleOpenScanner);
    return () => document.removeEventListener('openDocumentScanner', handleOpenScanner);
  }, []);

  const handleDocumentProcessed = (document: Document) => {
    setProcessedDocuments(prev => {
      const existingIndex = prev.findIndex(doc => doc.id === document.id);
      if (existingIndex >= 0) {
        // Update existing document
        const updated = [...prev];
        updated[existingIndex] = document;
        return updated;
      } else {
        // Add new document
        return [...prev, document];
      }
    });
    // Auto-hide scanner after processing
    setShowScanner(false);
  };

  const handleDocumentRemove = (documentId: number) => {
    setProcessedDocuments(prev => prev.filter(doc => doc.id !== documentId));
  };

  return (
    <Layout>
      <PageHeader title="Transactions" showBack={true} />
      <div className="p-4 md:p-8 pt-6 lg:pt-6 pt-20">
        {/* Header */}
        <div className="space-y-4 mb-6">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Transactions</h2>
            <p className="text-muted-foreground">
              View and manage your transactions for {dateRangeText}.
            </p>
          </div>
          
          {/* Date Filter */}
          <div className="flex justify-start">
            <DateFilter />
          </div>
        </div>

        {/* Main Content - New Layout */}
        <div className="space-y-6">
          {/* Document Upload Section - Full Width on Desktop, Hidden on Mobile */}
          <div className="w-full animate-in fade-in-0 duration-500 hidden md:block">
            <DocumentUploader onDocumentProcessed={handleDocumentProcessed} />
          </div>

          {/* Content Grid Layout */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Transaction List - Takes 2/3 of the space on large screens */}
            <div className="xl:col-span-2 animate-in slide-in-from-left-5 duration-700">
              <TransactionList />
            </div>
            
            {/* AI Processing Results - Takes 1/3 of the space on large screens, full width on smaller screens */}
            <div className="xl:col-span-1 animate-in slide-in-from-right-5 duration-700">
              <ProcessedDocuments 
                documents={processedDocuments} 
                onDocumentUpdate={handleDocumentProcessed}
                onDocumentRemove={handleDocumentRemove}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Scanner Overlay */}
      {showScanner && (
        <div className="fixed inset-0 z-[60] bg-background animate-in fade-in-0 slide-in-from-bottom-5 duration-300">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Scan Receipt</h2>
              <button
                onClick={() => setShowScanner(false)}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                ✕
              </button>
            </div>
            
            {/* Scanner Content */}
            <div className="flex-1 p-4 overflow-auto">
              <DocumentUploader onDocumentProcessed={handleDocumentProcessed} />
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default TransactionsPage;
