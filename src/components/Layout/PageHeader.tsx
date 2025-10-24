import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  className?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({ 
  title, 
  showBack = false, 
  onBack,
  className 
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      // Use browser history to go back
      navigate(-1);
    }
  };

  return (
    <div className={cn(
      "fixed top-0 left-0 right-0 z-40 bg-background/40 backdrop-blur-xl supports-[backdrop-filter]:bg-background/30",
      "border-b border-border/30",
      "lg:hidden", // Only show on mobile/tablet
      className
    )}>
      <div className="flex items-center h-16 px-4">
        {showBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="mr-2 h-10 w-10"
            aria-label="Go back"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
        )}
        
        <h1 className={cn(
          "text-xl sm:text-2xl font-bold truncate",
          showBack ? "" : "ml-0"
        )}>
          {title}
        </h1>
      </div>
    </div>
  );
};

export default PageHeader;

