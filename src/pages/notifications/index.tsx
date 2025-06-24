import React from 'react';
import Layout from '@/components/Layout/Layout';
import { NotificationList } from '@/components/Notifications/NotificationList';

const NotificationsPage: React.FC = () => {
  return (
    <Layout>
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Notifications</h1>
            <p className="mt-2 text-lg text-muted-foreground">
                Stay updated with alerts about your budgets and account activity.
            </p>
            <div className="mt-8">
                <NotificationList />
            </div>
        </div>
    </div>
    </Layout>
  );
};

export default NotificationsPage;