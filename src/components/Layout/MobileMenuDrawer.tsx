import React, { useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Wallet, 
  PieChart, 
  Search, 
  Bell, 
  CreditCard, 
  UserCircle, 
  Settings, 
  LogOut
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useDrag } from '@use-gesture/react';
import ShinyText from '@/components/ui/ShinyText';

interface MobileMenuDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MobileMenuDrawer: React.FC<MobileMenuDrawerProps> = ({ open, onOpenChange }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, user } = useAuth();
  const sheetRef = useRef<HTMLDivElement>(null);
  const [dragOffset, setDragOffset] = React.useState(0);
  const [isClosing, setIsClosing] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);

  // Swipe gesture handler - swipe right to close (menu slides right off screen)
  const bind = useDrag(
    ({ movement: [mx], down, velocity: [vx], direction: [dirX], last }) => {
      // Only allow swipe to the right (positive mx values)
      if (down && mx > 0) {
        setIsDragging(true);
        setDragOffset(mx);
        setIsClosing(false);
      } else if (!down && last) {
        // When finger/mouse is released
        const swipeThreshold = 80; // pixels
        const velocityThreshold = 0.4;
        
        // Close if swiped far enough right or fast enough
        if (mx > swipeThreshold || (vx > velocityThreshold && dirX > 0)) {
          setIsClosing(true);
          setIsDragging(false);
          // Animate all the way off screen (400px should be enough)
          setDragOffset(400);
          // Wait for animation to complete THEN close
          setTimeout(() => {
            onOpenChange(false);
          }, 320);
        } else {
          // Snap back smoothly
          setIsDragging(false);
          setDragOffset(0);
        }
      }
    },
    {
      axis: 'x',
      filterTaps: true,
      pointer: { touch: true },
      rubberband: true,
    }
  );

  // Reset states when Sheet closes
  React.useEffect(() => {
    if (!open) {
      // Wait a bit before resetting to avoid visual jump
      const timer = setTimeout(() => {
        setDragOffset(0);
        setIsClosing(false);
        setIsDragging(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const menuItems = [
    { 
      label: 'Budgets', 
      icon: Wallet, 
      path: '/budgets',
      description: 'Manage your budgets'
    },
    { 
      label: 'Reports', 
      icon: PieChart, 
      path: '/reports',
      description: 'View financial reports'
    },
    { 
      label: 'Smart Search', 
      icon: Search, 
      path: '/test-search',
      description: 'AI-powered search'
    },
    { 
      label: 'Notifications', 
      icon: Bell, 
      path: '/notifications',
      description: 'Your alerts and updates'
    },
    { 
      label: 'Payment Methods', 
      icon: CreditCard, 
      path: '/payment-methods',
      description: 'Manage payment methods'
    },
    { 
      label: 'Profile', 
      icon: UserCircle, 
      path: '/profile',
      description: 'Account settings'
    },
  ];

  const handleNavigate = (path: string) => {
    navigate(path);
    onOpenChange(false);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Logged out successfully');
      navigate('/');
      onOpenChange(false);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Logout failed');
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="right" 
        ref={sheetRef}
        className="w-[240px] sm:w-[280px] p-0 bg-background/40 backdrop-blur-xl supports-[backdrop-filter]:bg-background/30 border-l border-border/30 flex flex-col"
        style={{
          transform: `translateX(${dragOffset}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          willChange: 'transform',
        }}
        {...bind()}
      >
        <SheetHeader className="px-6 pt-6 pb-2 flex-shrink-0">
          <SheetTitle className="text-2xl font-bold">Menu</SheetTitle>
          {/* Swipe hint - centered below Menu title */}
          <div className="text-xs text-center font-semibold mt-1" style={{ color: '#C0C0C0' }}>
            <ShinyText 
              text="Swipe right or tap outside to close"
              speed={3}
              className="inline-block"
            />
          </div>
        </SheetHeader>

        <div className="px-4 py-2 flex-shrink-0">
          <Separator />
        </div>

        {/* Scrollable nav container with padding for logout button */}
        <nav className="flex-1 overflow-y-auto px-4 py-2 pb-24">
          <div className="flex flex-col space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              // Show user's name for Profile menu item
              const displayLabel = item.path === '/profile' 
                ? (user?.display_name || user?.email || 'Profile')
                : item.label;
              
              return (
                <button
                  key={item.path}
                  onClick={() => handleNavigate(item.path)}
                  className={cn(
                    "flex items-start gap-3 rounded-lg px-3 py-3 text-left transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    isActive && "bg-primary/10 text-primary font-medium"
                  )}
                >
                  <Icon className={cn(
                    "h-5 w-5 mt-0.5 flex-shrink-0",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{displayLabel}</div>
                    <div className="text-xs mt-0.5" style={{ color: '#C0C0C0' }}>
                      <ShinyText 
                        text={item.description}
                        speed={3}
                        className="inline-block"
                      />
                    </div>
                  </div>
                </button>
              );
            })}

            {/* Theme Toggle - Always at the bottom of nav items */}
            {/* NOTE: This will always render last, regardless of new menu items added above */}
            <div className="pt-2 mt-2 border-t border-border/30">
              <div className="flex items-center justify-between p-3 rounded-lg bg-accent/50">
                <span className="text-sm font-medium">Theme</span>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </nav>

        {/* Fixed logout button at bottom */}
        <div className="px-4 py-4 flex-shrink-0 bg-background/95 backdrop-blur-sm border-t border-border/50">
          <Button
            variant="destructive"
            size="lg"
            onClick={handleLogout}
            className="w-full gap-2"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileMenuDrawer;

