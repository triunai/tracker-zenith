
import React from 'react';
import Layout from '@/components/Layout/Layout';
import DashboardSummary from '@/components/Dashboard/DashboardSummary';
import TransactionList from '@/components/Transactions/TransactionList';
import BudgetTracker from '@/components/Budgets/BudgetTracker';
import SpendingChart from '@/components/Charts/SpendingChart';

const Index = () => {
  return (
    <Layout>
      <div className="space-y-8">
        <DashboardSummary />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <TransactionList />
          </div>
          <div className="lg:col-span-1">
            <BudgetTracker />
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-6">
          <SpendingChart />
        </div>
      </div>
    </Layout>
  );
};

export default Index;
