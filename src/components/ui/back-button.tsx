import { useNavigate } from 'react-router-dom';
import { Button } from './button';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  className?: string;
}

export function BackButton({ className }: BackButtonProps) {
  const navigate = useNavigate();

  return (
    <Button
      variant="ghost"
      className={className}
      onClick={() => navigate(-1)}
    >
      <ArrowLeft className="mr-2 h-4 w-4" />
      Back
    </Button>
  );
} 