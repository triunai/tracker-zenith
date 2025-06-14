import React, { useState } from 'react';
import Layout from '@/components/Layout/Layout';
import TransactionList from '@/components/Transactions/TransactionList';
import { DocumentUploader } from '@/components/Documents/DocumentUploader';
import { ProcessedDocuments } from '@/components/Documents/ProcessedDocuments';
import DateFilter from '@/components/Dashboard/DateFilter';
import { useDashboard } from '@/context/DashboardContext';
import { Document } from '@/interfaces/document-interface';

const TransactionsPage = () => {
  const { dateRangeText } = useDashboard();
  const [processedDocuments, setProcessedDocuments] = useState<Document[]>([]);

  console.log('🔧 TransactionsPage rendered');

  const handleDocumentProcessed = (document: Document) => {
    console.log('📄 handleDocumentProcessed called with:', document);
    setProcessedDocuments(prev => {
      const existingIndex = prev.findIndex(doc => doc.id === document.id);
      if (existingIndex >= 0) {
        // Update existing document
        const updated = [...prev];
        updated[existingIndex] = document;
        console.log('📄 Updated existing document at index:', existingIndex);
        return updated;
      } else {
        // Add new document
        console.log('📄 Adding new document to list');
        return [...prev, document];
      }
    });
  };

  return (
    <Layout>
      <div className="p-4 md:p-8 pt-6">
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
          {/* Document Upload Section - Full Width */}
          <div className="w-full animate-in fade-in-0 duration-500">
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
              />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TransactionsPage;
