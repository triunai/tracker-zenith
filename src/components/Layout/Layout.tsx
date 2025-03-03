
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/UI/button';
import { 
  LayoutDashboard, 
  CreditCard, 
  PieChart, 
  Wallet,
  Settings,
  LogOut,
  Menu,
  X,
  UserCircle
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

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
];

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  
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
          isMobile ? (sidebarOpen ? "w-64 translate-x-0" : "w-64 -translate-x-full") : "w-64"
        )}
      >
        <div className="flex flex-col h-full">
          {/* App logo / title */}
          <div className="p-6 mb-2">
            <h1 className="text-xl font-bold flex items-center">
              <span className="bg-primary text-primary-foreground rounded-md w-8 h-8 flex items-center justify-center mr-2">F</span>
              Finance Zen
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
                          : "text-foreground hover:bg-secondary"
                      )}
                      onClick={() => isMobile && setSidebarOpen(false)}
                    >

                      {item.icon}
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          
          {/* User profile and settings */}
          <div className="p-4 border-t mt-auto">
            <div className="flex items-center mb-4 px-2 py-3 rounded-md hover:bg-secondary transition-colors cursor-pointer">
              <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-primary mr-3">
                <UserCircle size={20} />
              </div>
              <div>
                <p className="text-sm font-medium">Alex Johnson</p>
                <p className="text-xs text-muted-foreground">alex@example.com</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="w-full gap-1" asChild>
                <Link to="/settings">
                  <Settings size={14} />
                  <span>Settings</span>
                </Link>
              </Button>
              <Button size="sm" variant="ghost" className="w-full gap-1">
                <LogOut size={14} />
                <span>Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className={cn(
        "flex-1 p-6 md:p-10 transition-all duration-300",
        isMobile ? "ml-0" : "ml-64"
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
