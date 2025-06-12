import React from 'react';
import Layout from '@/components/Layout/Layout';
import TransactionList from '@/components/Transactions/TransactionList';
import { DocumentUploader } from '@/components/Dashboard/DocumentUploader';
import DateFilter from '@/components/Dashboard/DateFilter';
import { useDashboard } from '@/context/DashboardContext';

const TransactionsPage = () => {
  const { dateRangeText } = useDashboard();

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

        {/* Main Content */}
        <div className="flex items-start gap-8">
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
