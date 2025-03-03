import React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/UI/badge';
import { categories } from '@/lib/mockData';
import { 
  Home, Utensils, Car, Tv, ShoppingBag, Zap, 
  Briefcase, TrendingUp, Gift, HelpCircle 
} from 'lucide-react';

interface CategoryBadgeProps {
  category: string;
  className?: string;
}

const getCategoryIcon = (categoryName: string) => {
  const category = categories.find(c => c.name === categoryName);
  const iconName = category?.icon || 'help-circle';
  
  switch (iconName) {
    case 'home': return <Home size={14} />;
    case 'utensils': return <Utensils size={14} />;
    case 'car': return <Car size={14} />;
    case 'tv': return <Tv size={14} />;
    case 'shopping-bag': return <ShoppingBag size={14} />;
    case 'zap': return <Zap size={14} />;
    case 'briefcase': return <Briefcase size={14} />;
    case 'trending-up': return <TrendingUp size={14} />;
    case 'gift': return <Gift size={14} />;
    default: return <HelpCircle size={14} />;
  }
};

const getCategoryColor = (categoryName: string) => {
  const category = categories.find(c => c.name === categoryName);
  return category?.color || '#888888';
};

const CategoryBadge = ({ category, className }: CategoryBadgeProps) => {
  const icon = getCategoryIcon(category);
  const color = getCategoryColor(category);
  
  return (
    <Badge 
      className={cn(
        "flex items-center gap-1 font-normal",
        className
      )}
      style={{ 
        backgroundColor: `${color}20`, 
        color: color,
        borderColor: `${color}30`
      }}
    >
      {icon}
      <span>{category}</span>
    </Badge>
  );
};

export default CategoryBadge;
