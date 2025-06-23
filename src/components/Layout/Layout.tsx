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
  LogOut,
  Menu,
  UserCircle
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/components/ui/use-toast.ts';
import { NotificationBadge } from '@/components/ui/notification-badge';
import { Sidebar } from '@/components/ui/sidebar.tsx';

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
    href: '/' 
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
    label: 'Notifications', 
    icon: <Bell size={20} />, 
    href: '/notifications' 
  },
];

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = React.useState(!isMobile);
  const { user, profile, signOut } = useAuth();
  const { toast } = useToast();
  
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  React.useEffect(() => {
    if (!isMobile) {
      const storedSidebarState = localStorage.getItem('sidebar-collapsed');
      setSidebarOpen(storedSidebarState ? storedSidebarState === 'false' : true);
    } else {
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
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
        variant: "default",
      });
      navigate('/login');
    } catch (error: unknown) {
      toast({
        title: "Logout failed",
        description: error instanceof Error ? error.message : "An error occurred during logout.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="flex min-h-screen bg-background">
      {isMobile && (
        <Button 
          variant="ghost" 
          size="icon" 
          className="fixed top-4 left-4 z-50" 
          onClick={toggleSidebar}
        >
          <Menu size={20} />
        </Button>
      )}
      
      <Sidebar open={sidebarOpen} onOpenChange={setSidebarOpen}>
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
                      onClick={() => {
                        if (isMobile) {
                          setSidebarOpen(false);
                        }
                      }}
                      title={!sidebarOpen && !isMobile ? item.label : undefined}
                    >
                      <div className="relative">
                        {item.icon}
                        {item.label === 'Notifications' && (
                          <NotificationBadge count={2} />
                        )}
                      </div>
                      {(sidebarOpen || isMobile) && <span>{item.label}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          
          <div className="mt-auto p-3">
            <div className="border-t -mx-3 pt-3">
              <div className={cn(
                "flex items-center gap-3 px-3 py-2",
                !sidebarOpen && !isMobile && "justify-center px-2"
              )}>
                <UserCircle size={36} className="text-muted-foreground" />
                {(sidebarOpen || isMobile) && (
                  <div className="flex-grow">
                    <p className="font-semibold text-sm">{user?.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {profile?.display_name || 'User'}
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            <Button 
              variant="ghost" 
              className={cn(
                "w-full justify-start mt-2",
                !sidebarOpen && !isMobile && "justify-center px-2"
              )}
              onClick={handleLogout}
            >
              <LogOut size={20} className={cn(sidebarOpen || isMobile ? "mr-3" : "mr-0")} />
              {(sidebarOpen || isMobile) && 'Logout'}
            </Button>
          </div>
        </div>
      </Sidebar>
      
      <main className={cn(
        "flex-1 p-6 md:p-10 transition-all duration-300",
        isMobile 
          ? "ml-0" 
          : (sidebarOpen ? "ml-64" : "ml-20")
      )}>
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
      
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
};

export default Layout;