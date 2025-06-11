import React from 'react';
import Layout from '@/components/Layout/Layout';
import TransactionList from '@/components/Transactions/TransactionList';
import { DocumentUploader } from '@/components/Dashboard/DocumentUploader';

const TransactionsPage = () => {
  return (
    <Layout>
      <div className="p-4 md:p-8 pt-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Transactions</h1>
          <DocumentUploader />
        </div>
        
        <div className="grid grid-cols-1 gap-6">
          <TransactionList />
        </div>
      </div>
    </Layout>
  );
};

export default TransactionsPage;
