import React from 'react';
import ReportsDashboard from '@/components/Reports/ReportsDashboard';
import Layout from '@/components/Layout/Layout';
import PageHeader from '@/components/Layout/PageHeader';

const ReportsPage: React.FC = () => {
  return (
    <Layout>
      <PageHeader title="Reports & Analytics" showBack={true} />
      <div className="container mx-auto py-6 lg:pt-6 pt-20">
        <h1 className="text-3xl font-bold mb-6 lg:block hidden">Reports & Analytics</h1>
        <ReportsDashboard />
      </div>
    </Layout>
  );
};

export default ReportsPage; 