import React, { useState, useEffect, lazy, Suspense } from 'react';
import Layout from '@/components/Layout/Layout';
import { useDashboard } from '@/context/DashboardContext';

// Lazy load ALL heavy components and dependencies
const BudgetPageContent = lazy(() => import('./BudgetPageContent'));

const BudgetPage = () => {
  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Budget Management</h1>
            <p className="text-gray-600 mt-1">Track and manage your budgets across different periods</p>
          </div>
        </div>
        
        <Suspense 
          fallback={
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <span className="ml-3 text-gray-600">Loading budget management...</span>
            </div>
          }
        >
          <BudgetPageContent />
        </Suspense>
      </div>
    </Layout>
  );
};

export default BudgetPage;