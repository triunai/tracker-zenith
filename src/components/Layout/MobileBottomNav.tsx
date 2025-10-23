import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Wallet, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import CentralButton from './CentralButton';
import MobileMenuDrawer from './MobileMenuDrawer';

const MobileBottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { 
      id: 'budgets', 
      icon: Wallet, 
      label: 'Budgets',
      path: '/budgets' 
    },
    { 
      id: 'center', 
      icon: null, 
      label: 'Scan',
      path: null // Handled by CentralButton
    },
    { 
      id: 'menu', 
      icon: Menu, 
      label: 'Menu',
      path: null // Opens menu drawer
    },
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleNavClick = (item: typeof navItems[0]) => {
    if (item.id === 'menu') {
      setMenuOpen(true);
    } else if (item.path) {
      navigate(item.path);
    }
  };

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/40 backdrop-blur-xl border-t border-border/30 shadow-elevated pb-safe lg:hidden supports-[backdrop-filter]:bg-background/30">
        <div className="relative flex items-center justify-around h-20 max-w-screen-xl mx-auto px-4">
          {navItems.map((item) => {
            if (item.id === 'center') {
              return <CentralButton key={item.id} />;
            }

            const Icon = item.icon!;
            const active = item.path ? isActive(item.path) : false;

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all duration-200",
                  "active:scale-95 touch-manipulation",
                  active 
                    ? "text-primary" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div className="relative">
                  <Icon 
                    className={cn(
                      "transition-all duration-200",
                      active ? "h-6 w-6" : "h-5 w-5"
                    )} 
                  />
                </div>
                <span 
                  className={cn(
                    "text-xs font-medium transition-all duration-200",
                    active && "font-semibold"
                  )}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <MobileMenuDrawer open={menuOpen} onOpenChange={setMenuOpen} />
    </>
  );
};

export default MobileBottomNav;

