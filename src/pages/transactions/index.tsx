import React from 'react';
import Layout from '@/components/Layout/Layout';
import TransactionList from '@/components/Transactions/TransactionList';
import { DocumentUploader } from '@/components/Dashboard/DocumentUploader';

const TransactionsPage = () => {
  return (
    <Layout>
      <div className="p-4 md:p-8 pt-6">
        <div className="flex items-center justify-center gap-8">
          <div className="flex-grow" style={{ flexBasis: '70%' }}>
            <TransactionList />
          </div>
          <div className="flex-shrink-0" style={{ flexBasis: '30%' }}>
            <DocumentUploader />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TransactionsPage;
