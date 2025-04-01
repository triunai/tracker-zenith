import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/UI/badge';
import { 
  Home, Utensils, Car, Tv, ShoppingBag, Zap, 
  Briefcase, TrendingUp, Gift, HelpCircle 
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { budgetApi } from '@/lib/api/budgetApi';
import { ExpenseCategory } from '@/interfaces/expense-interface';

interface CategoryBadgeProps {
  category: string;
  className?: string;
}

// Default colors for categories if not found
const DEFAULT_COLORS: Record<string, string> = {
  'Housing': '#8E9BC7',
  'Food': '#93C0DA',
  'Transport': '#D6A99A',
  'Entertainment': '#92C1B8',
  'Shopping': '#B7A7CC',
  'Utilities': '#D8B78E',
  'Healthcare': '#7AADC8',
  'Education': '#D48A9B',
  'Miscellaneous': '#A4B494',
  'default': '#888888'
};

// Default icons for categories if not found
const getCategoryIcon = (categoryName: string) => {
  const lowerName = categoryName.toLowerCase();
  
  if (lowerName.includes('hous') || lowerName.includes('rent') || lowerName.includes('mortgage')) {
    return <Home size={14} />;
  } else if (lowerName.includes('food') || lowerName.includes('grocer') || lowerName.includes('restaurant')) {
    return <Utensils size={14} />;
  } else if (lowerName.includes('car') || lowerName.includes('transport') || lowerName.includes('gas')) {
    return <Car size={14} />;
  } else if (lowerName.includes('entertain') || lowerName.includes('tv') || lowerName.includes('movie')) {
    return <Tv size={14} />;
  } else if (lowerName.includes('shop') || lowerName.includes('cloth')) {
    return <ShoppingBag size={14} />;
  } else if (lowerName.includes('util') || lowerName.includes('electric') || lowerName.includes('water')) {
    return <Zap size={14} />;
  } else if (lowerName.includes('work') || lowerName.includes('office')) {
    return <Briefcase size={14} />;
  } else if (lowerName.includes('invest') || lowerName.includes('saving')) {
    return <TrendingUp size={14} />;
  } else if (lowerName.includes('gift') || lowerName.includes('present')) {
    return <Gift size={14} />;
  } else {
    return <HelpCircle size={14} />;
  }
};

const CategoryBadge = ({ category, className }: CategoryBadgeProps) => {
  const { data: categories = [] } = useQuery({
    queryKey: ['expenseCategories'],
    queryFn: budgetApi.getCategories,
  });
  
  const icon = getCategoryIcon(category);
  const matchedCategory = categories.find(c => c.name === category);
  const color = matchedCategory ? 
    // Generate a color from category name if needed
    `#${category.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0).toString(16).padEnd(6, '0').slice(0, 6)}` : 
    (DEFAULT_COLORS[category] || DEFAULT_COLORS.default);
  
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
