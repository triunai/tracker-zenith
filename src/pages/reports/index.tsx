import React from 'react';
import ReportsDashboard from '@/components/Reports/ReportsDashboard';
import Layout from '@/components/Layout/Layout';

const ReportsPage: React.FC = () => {
  return (
    <Layout>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Reports & Analytics</h1>
        <ReportsDashboard />
      </div>
    </Layout>
  );
};

export default ReportsPage; 