import React from 'react';
import Layout from '@/components/Layout/Layout';
import PageHeader from '@/components/Layout/PageHeader';
import { HybridSearchTest } from '@/components/debug/HybridSearchTest';

const TestSearchPage = () => {
  return (
    <Layout>
      <PageHeader title="Smart Search" showBack={true} />
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-8 lg:pt-6 pt-20">
        <div className="space-y-4">
          <div className="lg:block hidden">
            <h2 className="text-3xl font-bold tracking-tight">
              🔍 Smart Search
            </h2>
            <p className="text-muted-foreground">
              Search your expenses using natural language - try "coffee expenses last month" or "birthday gifts"
            </p>
          </div>
        </div>
        
        <HybridSearchTest />
      </div>
    </Layout>
  );
};

export default TestSearchPage; 