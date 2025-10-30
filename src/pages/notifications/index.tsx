import React from 'react';
import Layout from '@/components/Layout/Layout';
import PageHeader from '@/components/Layout/PageHeader';
import { NotificationList } from '@/components/Notifications/NotificationList';

const NotificationsPage: React.FC = () => {
  return (
    <Layout>
      <PageHeader title="Notifications" showBack={true} />
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 lg:pt-8 pt-20">
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold tracking-tight text-foreground lg:block hidden">Notifications</h1>
            <p className="mt-2 text-lg text-muted-foreground lg:block hidden">
                Stay updated with alerts about your budgets and account activity.
            </p>
            <div className="mt-8 lg:mt-8 mt-0">
                <NotificationList />
            </div>
        </div>
    </div>
    </Layout>
  );
};

export default NotificationsPage;