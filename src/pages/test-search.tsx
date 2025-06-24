import React from 'react';
import Layout from '@/components/Layout/Layout';
import { HybridSearchTest } from '@/components/debug/HybridSearchTest';

const TestSearchPage = () => {
  return (
    <Layout>
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <div className="space-y-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              🧪 Hybrid Search Testing
            </h2>
            <p className="text-muted-foreground">
              Test the Step 1 FTS implementation before adding embeddings
            </p>
          </div>
        </div>
        
        <HybridSearchTest />
      </div>
    </Layout>
  );
};

export default TestSearchPage; 