import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Camera } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useScanner } from '@/context/ScannerContext';

const CentralButton = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { openScanner } = useScanner();
  const [isPressed, setIsPressed] = useState(false);

  // Determine button action based on current page
  const getButtonState = () => {
    const path = location.pathname;
    
    if (path === '/') {
      return {
        icon: Camera,
        label: 'Scan',
        action: () => {
          console.log('[CentralButton] Opening scanner from home');
          openScanner();
        },
        glow: 'from-purple-500 to-indigo-500'
      };
    } else {
      return {
        icon: Home,
        label: 'Home',
        action: () => navigate('/'),
        glow: 'from-purple-500 to-indigo-500'
      };
    }
  };

  const buttonState = getButtonState();
  const Icon = buttonState.icon;

  const handleClick = () => {
    setIsPressed(true);
    setTimeout(() => setIsPressed(false), 150);
    buttonState.action();
  };

  return (
    <div className="relative flex items-center justify-center">
      {/* Outer glow ring - animated pulse */}
      <div 
        className={cn(
          "absolute inset-0 rounded-full blur-2xl animate-glow-pulse",
          `bg-gradient-to-br ${buttonState.glow}`,
          "transition-all duration-500"
        )}
        style={{ width: '85px', height: '85px', margin: 'auto' }}
      />
      
      {/* Middle glow layer */}
      <div 
        className={cn(
          "absolute inset-0 rounded-full blur-xl opacity-70",
          `bg-gradient-to-br ${buttonState.glow}`,
          "transition-all duration-500"
        )}
        style={{ width: '75px', height: '75px', margin: 'auto' }}
      />
      
      {/* Main button with float animation */}
      <button
        onClick={handleClick}
        className={cn(
          "relative flex flex-col items-center justify-center",
          "w-16 h-16 rounded-full",
          "bg-gradient-to-br shadow-2xl",
          buttonState.glow,
          "transition-all duration-300 ease-out",
          "active:scale-90 touch-manipulation",
          "hover:scale-110 hover:shadow-[0_0_40px_rgba(99,102,241,0.5)]",
          location.pathname === '/' && "animate-float",
          isPressed && "scale-90"
        )}
        style={{
          transform: 'translateY(-12px)',
        }}
      >
        {/* Inner shine effect */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/30 to-transparent opacity-50" />
        
        {/* Icon with subtle animation */}
        <Icon 
          className={cn(
            "h-7 w-7 text-white relative z-10 transition-transform duration-200",
            "drop-shadow-lg"
          )} 
          strokeWidth={2.5} 
        />
      </button>

      {/* Label below button */}
      <span 
        className="absolute -bottom-6 text-[10px] font-bold text-foreground/80 whitespace-nowrap tracking-wide"
      >
        {buttonState.label}
      </span>
    </div>
  );
};

export default CentralButton;

