import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  CreditCard, 
  PieChart, 
  Wallet,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  UserCircle,
  ChevronLeft,
  ChevronRight,
  Search
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { ThemeToggle } from '@/components/ui/theme-toggle.tsx';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { NotificationBadge } from '@/components/ui/notification-badge';
import { useDrag } from '@use-gesture/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getUnreadNotificationCount } from '@/lib/api/notificationsApi';
import { supabase } from '@/lib/supabase/supabase';
import MobileBottomNav from './MobileBottomNav';

interface LayoutProps {
  children: React.ReactNode;
}

type NavItem = {
  label: string;
  icon: React.ReactNode;
  href: string;
};

const navItems: NavItem[] = [
  { 
    label: 'Dashboard', 
    icon: <LayoutDashboard size={20} />, 
    href: '/dashboard' 
  },
  { 
    label: 'Transactions', 
    icon: <CreditCard size={20} />, 
    href: '/transactions' 
  },
  { 
    label: 'Budgets', 
    icon: <Wallet size={20} />, 
    href: '/budgets' 
  },
  { 
    label: 'Reports', 
    icon: <PieChart size={20} />, 
    href: '/reports' 
  },
  { 
    label: 'Smart Search', 
    icon: <Search size={20} />, 
    href: '/test-search' 
  },
  { 
    label: 'Notifications', 
    icon: <Bell size={20} />, 
    href: '/notifications' 
  },
];

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = React.useState(() => {
    if (typeof window === 'undefined') {
      return true;
    }
    const isMobileView = window.innerWidth < 1024; // Desktop shows sidebar at >= 1024px
    if (isMobileView) {
      return false;
    }
    const storedState = localStorage.getItem('sidebar-collapsed');
    return storedState ? storedState === 'false' : true;
  });
  const { user, profile, signOut } = useAuth();
  const queryClient = useQueryClient();

  const { data: unreadCount } = useQuery({
    queryKey: ['unread-notifications-count'],
    queryFn: getUnreadNotificationCount,
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  React.useEffect(() => {
    if (!user) {
      return;
    }

    // Define a handler for the notification payload
    const handleNewNotification = (payload: any) => {
      console.log('Real-time notification received!', payload);

      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });

      // Show a toast for the new notification
      if (payload.eventType === 'INSERT') {
        const newRecord = payload.new as { title: string; message?: string };
        toast.info(newRecord.title, {
          description: newRecord.message,
        });
      }
    };

    // Set up the real-time subscription
    const channel = supabase.channel('realtime-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        handleNewNotification
      )
      .subscribe((status, err) => {
        // Add subscription status logging for easier debugging
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to notifications channel!');
        }
        if (status === 'CHANNEL_ERROR') {
          console.error('Channel error:', err);
        }
      });

    // Cleanup function to remove the channel subscription when the component unmounts
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);
  
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const bind = useDrag(({ last, movement: [mx] }) => {
    if (isMobile && last) {
      if (mx > 100 && !sidebarOpen) {
        setSidebarOpen(true);
      } else if (mx < -100 && sidebarOpen) {
        setSidebarOpen(false);
      }
    }
  }, {
    filterTaps: true,
    axis: 'x',
    from: () => [0, 0],
    enabled: isMobile,
  });

  React.useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [isMobile]);

  React.useEffect(() => {
    if (!isMobile) {
      localStorage.setItem('sidebar-collapsed', (!sidebarOpen).toString());
    }
  }, [sidebarOpen, isMobile]);
  
  const handleLogout = async () => {
    try {
      await signOut();
      toast.success("Logged out");
      navigate('/login');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "An error occurred during logout.");
    }
  };
  
  return (
    <div className="flex min-h-screen bg-background" {...bind()}>
      {/* Desktop Sidebar - Only show on desktop */}
      {!isMobile && (
        <div 
          className={cn(
            "fixed top-0 left-0 z-40 h-screen transition-all duration-300 ease-in-out",
            "border-r bg-card shadow-soft",
            sidebarOpen ? "w-64" : "w-20"
          )}
        >
        <div className="flex flex-col h-full">
          <div>
            <div className={cn(
              "p-6 mb-2 flex items-center",
              !sidebarOpen && !isMobile && "justify-center p-4"
            )}>
              <h1 className={cn(
                "font-bold flex items-center",
                sidebarOpen || isMobile ? "text-xl" : "text-base"
              )}>
                <span className="bg-primary text-primary-foreground rounded-md w-8 h-8 flex items-center justify-center mr-2">
                  F
                </span>
                {(sidebarOpen || isMobile) && "Finance Zen"}
              </h1>
            </div>
          </div>
          
          <nav className="flex-grow px-3">
            <ul className="space-y-1.5">
              {navItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      to={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                        isActive 
                          ? "bg-primary text-primary-foreground" 
                          : "text-foreground hover:bg-secondary",
                        !sidebarOpen && !isMobile && "justify-center px-2"
                      )}
                      onClick={() => isMobile && setSidebarOpen(false)}
                      title={!sidebarOpen && !isMobile ? item.label : undefined}
                    >
                      <div className="relative">
                        {item.icon}
                        {item.label === 'Notifications' && (
                          <NotificationBadge count={unreadCount ?? 0} />
                        )}
                      </div>
                      {(sidebarOpen || isMobile) && <span>{item.label}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          
          <div className={cn(
            "border-t mt-auto",
            sidebarOpen || isMobile ? "p-4" : "p-2"
          )}>
            <div className="flex justify-between mb-3">
              <ThemeToggle />
              
              {!isMobile && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleSidebar}
                  className="transition-all"
                  title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
                >
                  {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
                </Button>
              )}
            </div>
            
            {(sidebarOpen || isMobile) ? (
              <Link to="/profile" className="flex items-center mb-4 px-2 py-3 rounded-md hover:bg-secondary transition-colors cursor-pointer">
                <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-primary mr-3">
                  <UserCircle size={20} />
                </div>
                <div>
                  <p className="text-sm font-medium">{profile?.display_name || 'User'}</p>
                  <p className="text-xs text-muted-foreground">{user?.email || 'user@example.com'}</p>
                </div>
              </Link>
            ) : (
              <Link to="/profile" className="flex justify-center mb-4">
                <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center text-primary">
                  <UserCircle size={24} />
                </div>
              </Link>
            )}
            
            <div className={cn(
              "flex",
              sidebarOpen || isMobile ? "gap-2" : "flex-col gap-2"
            )}>
              <Button 
                size="sm" 
                variant="outline" 
                className={cn(
                  "gap-1",
                  sidebarOpen || isMobile ? "w-full" : "w-full justify-center px-0"
                )} 
                asChild
              >
                <Link to="/profile">
                  <Settings size={14} />
                  {(sidebarOpen || isMobile) && <span>Profile</span>}
                </Link>
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                className={cn(
                  "gap-1",
                  sidebarOpen || isMobile ? "w-full" : "w-full justify-center px-0"
                )}
                onClick={handleLogout}
              >
                <LogOut size={14} />
                {(sidebarOpen || isMobile) && <span>Logout</span>}
              </Button>
            </div>
          </div>
        </div>
        </div>
      )}
      
      <main 
        onClick={() => {
          if (sidebarOpen && !isMobile) {
            setSidebarOpen(false);
          }
        }}
        className={cn(
          "flex-1 transition-all duration-300 overflow-auto",
          isMobile 
            ? "ml-0 p-4 pb-24" // Extra bottom padding for mobile nav
            : (sidebarOpen ? "ml-64 p-6 md:p-10" : "ml-20 p-6 md:p-10")
        )}
      >
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
      
      {/* Mobile Bottom Navigation */}
      {isMobile && <MobileBottomNav />}
    </div>
  );
};

export default Layout;