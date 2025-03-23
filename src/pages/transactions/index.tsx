import React from 'react';
import Layout from '@/components/Layout/Layout';
import TransactionList from '@/components/Transactions/TransactionList';

const TransactionsPage = () => {
  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Transactions</h1>
          <div className="text-sm text-muted-foreground">
            Manage your financial transactions
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-6">
          <TransactionList />
        </div>
      </div>
    </Layout>
  );
};

export default TransactionsPage;
