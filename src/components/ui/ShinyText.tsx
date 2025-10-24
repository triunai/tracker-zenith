import React from 'react';

interface ShinyTextProps {
  text: string;
  disabled?: boolean;
  speed?: number;
  className?: string;
}

const ShinyText: React.FC<ShinyTextProps> = ({ 
  text, 
  disabled = false, 
  speed = 5, 
  className = '' 
}) => {
  const animationDuration = `${speed}s`;

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Base text with normal color */}
      <span className="text-muted-foreground">
        {text}
      </span>
      
      {/* Shine overlay */}
      {!disabled && (
        <span
          className="absolute inset-0 animate-shine"
          style={{
            background: 'linear-gradient(120deg, rgba(255, 255, 255, 0) 40%, rgba(255, 255, 255, 0.8) 50%, rgba(255, 255, 255, 0) 60%)',
            backgroundSize: '200% 100%',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            animationDuration: animationDuration,
            color: 'transparent'
          }}
        >
          {text}
        </span>
      )}
    </div>
  );
};

export default ShinyText;
