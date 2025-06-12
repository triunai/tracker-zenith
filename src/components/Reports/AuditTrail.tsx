import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AuditTrailProps {
  dateRange: {
    from: Date | undefined;
    to: Date | undefined;
  };
}

export const AuditTrail: React.FC<AuditTrailProps> = ({ dateRange }) => {
  // Placeholder data - in a real app, this would come from an API
  const auditData = [
    {
      id: 1,
      date: '2023-04-15T10:30:00',
      user: 'John Doe',
      action: 'created',
      entityType: 'transaction',
      entityName: 'Grocery Shopping',
      details: 'Created new expense transaction',
      amount: 125.50,
    },
    {
      id: 2,
      date: '2023-04-14T15:45:00',
      user: 'Jane Smith',
      action: 'modified',
      entityType: 'budget',
      entityName: 'Monthly Budget',
      details: 'Updated budget allocation for Food category',
      amount: null,
    },
    {
      id: 3,
      date: '2023-04-13T09:15:00',
      user: 'John Doe',
      action: 'deleted',
      entityType: 'transaction',
      entityName: 'Duplicate Entry',
      details: 'Removed duplicate transaction',
      amount: 75.25,
    },
    {
      id: 4,
      date: '2023-04-12T14:20:00',
      user: 'Jane Smith',
      action: 'created',
      entityType: 'category',
      entityName: 'Home Improvement',
      details: 'Added new expense category',
      amount: null,
    },
    {
      id: 5,
      date: '2023-04-11T11:05:00',
      user: 'John Doe',
      action: 'modified',
      entityType: 'transaction',
      entityName: 'Electric Bill',
      details: 'Updated transaction amount',
      amount: 95.75,
    },
  ];

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'created':
        return <Badge className="bg-green-500">Created</Badge>;
      case 'modified':
        return <Badge className="bg-blue-500">Modified</Badge>;
      case 'deleted':
        return <Badge className="bg-red-500">Deleted</Badge>;
      default:
        return <Badge>{action}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        <Input
          placeholder="Search audit trail..."
          className="max-w-xs"
        />
        <Select defaultValue="all">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="created">Created</SelectItem>
            <SelectItem value="modified">Modified</SelectItem>
            <SelectItem value="deleted">Deleted</SelectItem>
          </SelectContent>
        </Select>
        <Select defaultValue="all">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by entity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Entities</SelectItem>
            <SelectItem value="transaction">Transactions</SelectItem>
            <SelectItem value="budget">Budgets</SelectItem>
            <SelectItem value="category">Categories</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline">Export</Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date & Time</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Details</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{formatDate(item.date)}</TableCell>
                  <TableCell>{item.user}</TableCell>
                  <TableCell>{getActionBadge(item.action)}</TableCell>
                  <TableCell>
                    <span className="capitalize">{item.entityType}</span>: {item.entityName}
                  </TableCell>
                  <TableCell>{item.details}</TableCell>
                  <TableCell className="text-right">
                    {item.amount ? `$${item.amount.toFixed(2)}` : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}; 