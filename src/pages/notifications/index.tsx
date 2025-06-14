import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Bell, 
  BellRing, 
  Settings, 
  Mail, 
  Smartphone, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  X, 
  Eye, 
  EyeOff,
  Filter,
  Search,
  Calendar,
  DollarSign,
  Store,
  TrendingUp,
  Clock,
  MoreVertical,
  Archive,
  Trash2,
  CheckCheck
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';
import Layout from '@/components/Layout/Layout';

// Mock data for demonstration - will be replaced with real API calls
const mockAlerts = [
  {
    id: 1,
    type: 'budget_alert',
    severity: 'critical',
    title: 'Budget Exceeded',
    message: '🚨 Budget exceeded! Groceries: RM47.23 over budget (RM547.23 spent of RM500.00)',
    timestamp: '2024-01-15T10:30:00Z',
    isRead: false,
    data: { budget_name: 'Groceries', percentage: 109.4, amount: 547.23 }
  },
  {
    id: 2,
    type: 'amount_anomaly',
    severity: 'warning',
    title: 'Unusual Spending Detected',
    message: '💸 High spending alert! RM89.99 in Entertainment (2.3x your average of RM39.12)',
    timestamp: '2024-01-15T09:15:00Z',
    isRead: false,
    data: { category: 'Entertainment', amount: 89.99, average: 39.12 }
  },
  {
    id: 3,
    type: 'new_merchant',
    severity: 'info',
    title: 'New Merchant',
    message: '🏪 New merchant detected: "EXOTIC RESTAURANT BANGKOK" - RM67.45 in Dining',
    timestamp: '2024-01-14T19:45:00Z',
    isRead: true,
    data: { merchant: 'EXOTIC RESTAURANT BANGKOK', amount: 67.45, category: 'Dining' }
  },
  {
    id: 4,
    type: 'budget_alert',
    severity: 'warning',
    title: 'Budget Warning',
    message: '💡 Budget warning: Transportation: 85.2% used (RM426.00 of RM500.00)',
    timestamp: '2024-01-14T16:20:00Z',
    isRead: true,
    data: { budget_name: 'Transportation', percentage: 85.2, amount: 426.00 }
  },
  {
    id: 5,
    type: 'amount_anomaly',
    severity: 'info',
    title: 'Unusual Spending Pattern',
    message: '💰 Unusually low spending: RM12.50 in Coffee (3.2x below average of RM40.00)',
    timestamp: '2024-01-13T08:30:00Z',
    isRead: true,
    data: { category: 'Coffee', amount: 12.50, average: 40.00 }
  }
];

const mockPreferences = {
  email_notifications: true,
  push_notifications: true,
  email_frequency: 'immediate',
  quiet_hours_enabled: true,
  quiet_hours_start: '22:00',
  quiet_hours_end: '08:00',
  amount_anomaly_enabled: true,
  amount_sigma_threshold: 2.0,
  budget_alert_enabled: true,
  budget_warning_threshold: 0.80,
  budget_critical_threshold: 0.95,
  new_merchant_alert_enabled: true,
  email_address: 'user@example.com'
};

const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [selectedAlerts, setSelectedAlerts] = useState<number[]>([]);
  const [preferences, setPreferences] = useState(mockPreferences);

  // Filter alerts based on search and filters
  const filteredAlerts = mockAlerts.filter(alert => {
    const matchesSearch = alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         alert.message.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || alert.type === filterType;
    const matchesSeverity = filterSeverity === 'all' || alert.severity === filterSeverity;
    const matchesReadStatus = !showUnreadOnly || !alert.isRead;
    
    return matchesSearch && matchesType && matchesSeverity && matchesReadStatus;
  });

  const unreadCount = mockAlerts.filter(alert => !alert.isRead).length;

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="destructive" className="text-xs">Critical</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Warning</Badge>;
      case 'info':
        return <Badge variant="outline" className="text-xs">Info</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Unknown</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'budget_alert':
        return <DollarSign className="h-4 w-4" />;
      case 'amount_anomaly':
        return <TrendingUp className="h-4 w-4" />;
      case 'new_merchant':
        return <Store className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const handleSelectAlert = (alertId: number) => {
    setSelectedAlerts(prev => 
      prev.includes(alertId) 
        ? prev.filter(id => id !== alertId)
        : [...prev, alertId]
    );
  };

  const handleSelectAll = () => {
    if (selectedAlerts.length === filteredAlerts.length) {
      setSelectedAlerts([]);
    } else {
      setSelectedAlerts(filteredAlerts.map(alert => alert.id));
    }
  };

  const handleBulkAction = (action: string) => {
    toast({
      title: 'Action Completed',
      description: `${action} applied to ${selectedAlerts.length} alert(s)`,
    });
    setSelectedAlerts([]);
  };

  const handlePreferenceChange = (key: string, value: unknown) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  const savePreferences = () => {
    toast({
      title: 'Settings Saved',
      description: 'Your notification preferences have been updated.',
    });
  };

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">
            Manage your alerts and notification preferences
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="text-sm">
            {unreadCount} unread
          </Badge>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      <Tabs defaultValue="alerts" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="alerts" className="flex items-center space-x-2">
            <Bell className="h-4 w-4" />
            <span>Alerts</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center space-x-2">
            <Mail className="h-4 w-4" />
            <span>Email Setup</span>
          </TabsTrigger>
        </TabsList>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-6">
          {/* Filters and Search */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search alerts..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="budget_alert">Budget</SelectItem>
                      <SelectItem value="amount_anomaly">Spending</SelectItem>
                      <SelectItem value="new_merchant">Merchant</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button
                    variant={showUnreadOnly ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowUnreadOnly(!showUnreadOnly)}
                  >
                    <EyeOff className="h-4 w-4 mr-2" />
                    Unread Only
                  </Button>
                </div>
              </div>
              
              {/* Bulk Actions */}
              {selectedAlerts.length > 0 && (
                <div className="mt-4 p-3 bg-muted rounded-lg flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {selectedAlerts.length} alert(s) selected
                  </span>
                  <div className="flex gap-2">
                                         <Button size="sm" variant="outline" onClick={() => handleBulkAction('Mark as read')}>
                       <CheckCheck className="h-4 w-4 mr-2" />
                       Mark as Read
                     </Button>
                    <Button size="sm" variant="outline" onClick={() => handleBulkAction('Archive')}>
                      <Archive className="h-4 w-4 mr-2" />
                      Archive
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleBulkAction('Delete')}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Alerts List */}
          <div className="space-y-3">
            {filteredAlerts.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No alerts found</h3>
                    <p className="text-muted-foreground">
                      {searchQuery || filterType !== 'all' || filterSeverity !== 'all' || showUnreadOnly
                        ? 'Try adjusting your filters or search query.'
                        : 'You\'re all caught up! No new alerts at the moment.'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              filteredAlerts.map((alert) => (
                <Card 
                  key={alert.id} 
                  className={cn(
                    "transition-all duration-200 hover:shadow-md cursor-pointer",
                    !alert.isRead && "border-l-4 border-l-primary bg-primary/5",
                    selectedAlerts.includes(alert.id) && "ring-2 ring-primary"
                  )}
                  onClick={() => handleSelectAlert(alert.id)}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-start space-x-4">
                      {/* Alert Icon */}
                      <div className={cn(
                        "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
                        alert.severity === 'critical' && "bg-red-100 dark:bg-red-900/20",
                        alert.severity === 'warning' && "bg-yellow-100 dark:bg-yellow-900/20",
                        alert.severity === 'info' && "bg-blue-100 dark:bg-blue-900/20"
                      )}>
                        {getTypeIcon(alert.type)}
                      </div>
                      
                      {/* Alert Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="text-sm font-medium">{alert.title}</h4>
                            {getSeverityBadge(alert.severity)}
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-muted-foreground">
                              {formatTimestamp(alert.timestamp)}
                            </span>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                  <MoreVertical className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Mark as read
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Archive className="h-4 w-4 mr-2" />
                                  Archive
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-2">
                          {alert.message}
                        </p>
                        
                        {/* Alert Data */}
                        {alert.data && (
                          <div className="flex flex-wrap gap-2 text-xs">
                            {alert.type === 'budget_alert' && (
                              <>
                                <Badge variant="outline" className="text-xs">
                                  {alert.data.budget_name}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {alert.data.percentage}% used
                                </Badge>
                              </>
                            )}
                            {alert.type === 'amount_anomaly' && (
                              <>
                                <Badge variant="outline" className="text-xs">
                                  {alert.data.category}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  RM{alert.data.amount}
                                </Badge>
                              </>
                            )}
                            {alert.type === 'new_merchant' && (
                              <>
                                <Badge variant="outline" className="text-xs">
                                  {alert.data.category}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  RM{alert.data.amount}
                                </Badge>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* Read Status Indicator */}
                      {!alert.isRead && (
                        <div className="flex-shrink-0 w-2 h-2 bg-primary rounded-full"></div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Notification Preferences */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BellRing className="h-5 w-5" />
                  <span>Notification Preferences</span>
                </CardTitle>
                <CardDescription>
                  Choose how you want to receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications in your browser
                    </p>
                  </div>
                  <Switch
                    checked={preferences.push_notifications}
                    onCheckedChange={(checked) => handlePreferenceChange('push_notifications', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch
                    checked={preferences.email_notifications}
                    onCheckedChange={(checked) => handlePreferenceChange('email_notifications', checked)}
                  />
                </div>
                
                {preferences.email_notifications && (
                  <div className="space-y-2">
                    <Label>Email Frequency</Label>
                    <Select 
                      value={preferences.email_frequency} 
                      onValueChange={(value) => handlePreferenceChange('email_frequency', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="immediate">Immediate</SelectItem>
                        <SelectItem value="hourly">Hourly Digest</SelectItem>
                        <SelectItem value="daily">Daily Digest</SelectItem>
                        <SelectItem value="weekly">Weekly Summary</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                <Separator />
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Quiet Hours</Label>
                      <p className="text-sm text-muted-foreground">
                        Pause notifications during specific hours
                      </p>
                    </div>
                    <Switch
                      checked={preferences.quiet_hours_enabled}
                      onCheckedChange={(checked) => handlePreferenceChange('quiet_hours_enabled', checked)}
                    />
                  </div>
                  
                  {preferences.quiet_hours_enabled && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Start Time</Label>
                        <Input
                          type="time"
                          value={preferences.quiet_hours_start}
                          onChange={(e) => handlePreferenceChange('quiet_hours_start', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>End Time</Label>
                        <Input
                          type="time"
                          value={preferences.quiet_hours_end}
                          onChange={(e) => handlePreferenceChange('quiet_hours_end', e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Alert Types */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5" />
                  <span>Alert Types</span>
                </CardTitle>
                <CardDescription>
                  Configure which types of alerts you want to receive
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Budget Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified when approaching budget limits
                      </p>
                    </div>
                    <Switch
                      checked={preferences.budget_alert_enabled}
                      onCheckedChange={(checked) => handlePreferenceChange('budget_alert_enabled', checked)}
                    />
                  </div>
                  
                  {preferences.budget_alert_enabled && (
                    <div className="space-y-4 ml-4 pl-4 border-l-2 border-muted">
                      <div className="space-y-2">
                        <Label>Warning Threshold</Label>
                        <Slider
                          value={[preferences.budget_warning_threshold * 100]}
                          onValueChange={([value]) => handlePreferenceChange('budget_warning_threshold', value / 100)}
                          min={50}
                          max={95}
                          step={5}
                          className="w-full"
                        />
                        <p className="text-xs text-muted-foreground">
                          Alert when {Math.round(preferences.budget_warning_threshold * 100)}% of budget is used
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Critical Threshold</Label>
                        <Slider
                          value={[preferences.budget_critical_threshold * 100]}
                          onValueChange={([value]) => handlePreferenceChange('budget_critical_threshold', value / 100)}
                          min={80}
                          max={100}
                          step={5}
                          className="w-full"
                        />
                        <p className="text-xs text-muted-foreground">
                          Critical alert when {Math.round(preferences.budget_critical_threshold * 100)}% of budget is used
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Spending Anomalies</Label>
                      <p className="text-sm text-muted-foreground">
                        Detect unusual spending patterns
                      </p>
                    </div>
                    <Switch
                      checked={preferences.amount_anomaly_enabled}
                      onCheckedChange={(checked) => handlePreferenceChange('amount_anomaly_enabled', checked)}
                    />
                  </div>
                  
                  {preferences.amount_anomaly_enabled && (
                    <div className="space-y-2 ml-4 pl-4 border-l-2 border-muted">
                      <Label>Sensitivity</Label>
                      <Slider
                        value={[preferences.amount_sigma_threshold]}
                        onValueChange={([value]) => handlePreferenceChange('amount_sigma_threshold', value)}
                        min={1.0}
                        max={3.0}
                        step={0.1}
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground">
                        {preferences.amount_sigma_threshold}σ - {
                          preferences.amount_sigma_threshold < 1.5 ? 'Very Sensitive' :
                          preferences.amount_sigma_threshold < 2.0 ? 'Sensitive' :
                          preferences.amount_sigma_threshold < 2.5 ? 'Balanced' : 'Conservative'
                        }
                      </p>
                    </div>
                  )}
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">New Merchant Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified about transactions with new merchants
                    </p>
                  </div>
                  <Switch
                    checked={preferences.new_merchant_alert_enabled}
                    onCheckedChange={(checked) => handlePreferenceChange('new_merchant_alert_enabled', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="flex justify-end">
            <Button onClick={savePreferences} className="w-full sm:w-auto">
              Save Preferences
            </Button>
          </div>
        </TabsContent>

        {/* Email Setup Tab */}
        <TabsContent value="email" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Mail className="h-5 w-5" />
                <span>Email Configuration</span>
              </CardTitle>
              <CardDescription>
                Set up email notifications for your financial alerts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={preferences.email_address}
                    onChange={(e) => handlePreferenceChange('email_address', e.target.value)}
                    placeholder="your@email.com"
                  />
                  <p className="text-sm text-muted-foreground">
                    This email will receive all notification alerts
                  </p>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Email Templates Preview</h4>
                  
                  <div className="grid gap-4">
                    <Card className="border-dashed">
                      <CardContent className="pt-4">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="w-8 h-8 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                          </div>
                          <div>
                            <h5 className="text-sm font-medium">Budget Alert</h5>
                            <p className="text-xs text-muted-foreground">Critical budget threshold reached</p>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                          Subject: 🚨 Budget Alert - Groceries Budget Exceeded<br/>
                          Your Groceries budget has exceeded the limit. You've spent $547.23 of your $500.00 budget (109.4%).
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="border-dashed">
                      <CardContent className="pt-4">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center">
                            <TrendingUp className="h-4 w-4 text-yellow-500" />
                          </div>
                          <div>
                            <h5 className="text-sm font-medium">Spending Anomaly</h5>
                            <p className="text-xs text-muted-foreground">Unusual spending pattern detected</p>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                          Subject: 💸 Unusual Spending Alert - Entertainment<br/>
                          We detected unusual spending in Entertainment: $89.99 (2.3x your average of $39.12).
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="border-dashed">
                      <CardContent className="pt-4">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                            <Store className="h-4 w-4 text-blue-500" />
                          </div>
                          <div>
                            <h5 className="text-sm font-medium">New Merchant</h5>
                            <p className="text-xs text-muted-foreground">First-time transaction detected</p>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                          Subject: 🏪 New Merchant Alert<br/>
                          New merchant detected: "EXOTIC RESTAURANT BANGKOK" - $67.45 in Dining category.
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Email Delivery Options</h4>
                  
                  <div className="grid gap-4">
                    <div className="flex items-center space-x-3 p-3 border rounded-lg">
                      <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      </div>
                      <div className="flex-1">
                        <h5 className="text-sm font-medium">Immediate Alerts</h5>
                        <p className="text-xs text-muted-foreground">
                          Critical alerts sent immediately when detected
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3 p-3 border rounded-lg">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                        <Clock className="h-4 w-4 text-blue-500" />
                      </div>
                      <div className="flex-1">
                        <h5 className="text-sm font-medium">Daily Digest</h5>
                        <p className="text-xs text-muted-foreground">
                          Summary of all alerts from the past 24 hours
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3 p-3 border rounded-lg">
                      <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
                        <Calendar className="h-4 w-4 text-purple-500" />
                      </div>
                      <div className="flex-1">
                        <h5 className="text-sm font-medium">Weekly Summary</h5>
                        <p className="text-xs text-muted-foreground">
                          Comprehensive weekly financial insights and alerts
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between">
                <Button variant="outline">
                  Send Test Email
                </Button>
                <Button>
                  Save Email Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    </Layout>
  );
};

export default NotificationsPage;