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
  ChevronRight
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { ThemeToggle } from '@/components/ui/theme-toggle.tsx';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/components/ui/use-toast.ts';
import { NotificationBadge } from '@/components/ui/notification-badge';

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
    label: 'Reports ( Demo )', 
    icon: <PieChart size={20} />, 
    href: '/reports' 
  },
  { 
    label: 'Notifications ( Demo )', 
    icon: <Bell size={20} />, 
    href: '/notifications' 
  },
];

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const { user, profile, signOut } = useAuth();
  const { toast } = useToast();
  
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  // Store sidebar state in localStorage
  React.useEffect(() => {
    if (!isMobile) {
      const storedSidebarState = localStorage.getItem('sidebar-collapsed');
      if (storedSidebarState) {
        setSidebarOpen(storedSidebarState === 'false');
      }
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
      {/* Mobile sidebar toggle */}
      {isMobile && (
        <Button 
          variant="ghost" 
          size="icon" 
          className="fixed top-4 left-4 z-50" 
          onClick={toggleSidebar}
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </Button>
      )}
      
      {/* Sidebar */}
      <div 
        className={cn(
          "fixed top-0 left-0 z-40 h-screen transition-all duration-300 ease-in-out",
          "border-r bg-card shadow-soft",
          isMobile 
            ? (sidebarOpen ? "w-64 translate-x-0" : "w-64 -translate-x-full") 
            : (sidebarOpen ? "w-64" : "w-20")
        )}
      >
        <div className="flex flex-col h-full">
          {/* App logo / title */}
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
          
          {/* Navigation */}
          <nav className="flex-1 px-3">
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
          
          {/* User profile and settings */}
          <div className={cn(
            "border-t mt-auto",
            sidebarOpen || isMobile ? "p-4" : "p-2"
          )}>
            {/* Theme toggle and sidebar collapse */}
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
            
            {/* User profile */}
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
            
            {/* Action buttons */}
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
      
      {/* Main content */}
      <div className={cn(
        "flex-1 p-6 md:p-10 transition-all duration-300",
        isMobile 
          ? "ml-0" 
          : (sidebarOpen ? "ml-64" : "ml-20")
      )}>
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </div>
      
      {/* Overlay for mobile */}
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
