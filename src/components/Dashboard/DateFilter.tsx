import React, { useState } from 'react';
import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addMonths, subMonths, getYear, getMonth, setMonth, setYear } from 'date-fns';
import { DateFilter as DateFilterType, DateFilterType as FilterType, useDashboard } from '@/context/DashboardContext';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';

const DateFilter = () => {
  const { dateFilter, setDateFilter, filterOptions, dateRangeText } = useDashboard();
  const [isOpen, setIsOpen] = useState(false);
  
  // For month selector
  const [selectedDate, setSelectedDate] = useState(new Date(dateFilter.year, dateFilter.month || 0));
  
  // Custom filter options without the custom range option
  const availableFilterOptions = filterOptions.filter(option => option.type !== 'custom');
  
  // Handle filter type change
  const handleFilterTypeChange = (value: FilterType) => {
    // Initialize appropriate filter for the new type
    const now = new Date();
    let newFilter: DateFilterType = { 
      ...dateFilter,
      type: value 
    };
    
    switch (value) {
      case 'month':
        newFilter = {
          type: 'month',
          month: now.getMonth(),
          year: now.getFullYear(),
        };
        setSelectedDate(now);
        break;
      case 'quarter':
        const currentQuarter = Math.floor(now.getMonth() / 3) + 1;
        newFilter = {
          type: 'quarter',
          quarter: currentQuarter,
          year: now.getFullYear(),
        };
        break;
      case 'year':
        newFilter = {
          type: 'year',
          year: now.getFullYear(),
        };
        break;
      case 'custom':
        // Keep existing custom range or initialize a new one
        if (!dateFilter.customRange) {
          const startDate = new Date();
          const endDate = new Date();
          startDate.setDate(1); // First day of month
          endDate.setMonth(endDate.getMonth() + 1, 0); // Last day of month
          
          newFilter = {
            type: 'custom',
            year: now.getFullYear(),
            customRange: { startDate, endDate }
          };
        }
        break;
    }
    
    setDateFilter(newFilter);
  };
  
  // Handle month navigation
  const handlePrevMonth = () => {
    const newDate = subMonths(selectedDate, 1);
    setSelectedDate(newDate);
    setDateFilter({
      type: 'month',
      month: getMonth(newDate),
      year: getYear(newDate),
    });
  };
  
  const handleNextMonth = () => {
    const newDate = addMonths(selectedDate, 1);
    setSelectedDate(newDate);
    setDateFilter({
      type: 'month',
      month: getMonth(newDate),
      year: getYear(newDate),
    });
  };
  
  // Handle quarter selection
  const handleQuarterChange = (quarter: string) => {
    setDateFilter({
      ...dateFilter,
      type: 'quarter',
      quarter: parseInt(quarter),
    });
  };
  
  // Handle year selection
  const handleYearChange = (year: string) => {
    const newYear = parseInt(year);
    
    switch (dateFilter.type) {
      case 'month':
        setDateFilter({
          ...dateFilter,
          year: newYear,
        });
        setSelectedDate(setYear(selectedDate, newYear));
        break;
      case 'quarter':
        setDateFilter({
          ...dateFilter,
          year: newYear,
        });
        break;
      case 'year':
        setDateFilter({
          ...dateFilter,
          year: newYear,
        });
        break;
      case 'custom':
        // For custom range, we don't change anything
        break;
    }
  };
  
  // Handle month selection
  const handleMonthChange = (month: string) => {
    const newMonth = parseInt(month);
    setDateFilter({
      ...dateFilter,
      type: 'month',
      month: newMonth,
    });
    setSelectedDate(setMonth(selectedDate, newMonth));
  };
  
  // Handle date range selection
  const handleDateRangeChange = (range: { from: Date | undefined; to: Date | undefined }) => {
    if (range.from && range.to) {
      setDateFilter({
        type: 'custom',
        year: new Date().getFullYear(), // This is required but not used for custom
        customRange: {
          startDate: range.from,
          endDate: range.to,
        },
      });
    }
  };
  
  // Generate quarter options
  const quarterOptions = [1, 2, 3, 4].map(quarter => (
    <SelectItem key={quarter} value={quarter.toString()}>
      Q{quarter}
    </SelectItem>
  ));
  
  // Generate year options (current year and 4 previous years)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i).map(year => (
    <SelectItem key={year} value={year.toString()}>
      {year}
    </SelectItem>
  ));
  
  // Generate month options
  const monthOptions = Array.from({ length: 12 }, (_, i) => i).map(month => (
    <SelectItem key={month} value={month.toString()}>
      {format(new Date(2000, month, 1), 'MMMM')}
    </SelectItem>
  ));
  
  return (
    <div className="mb-6">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            className="flex items-center gap-2 text-sm font-medium" 
            size="sm"
          >
            <Calendar className="h-4 w-4" />
            <span>{dateRangeText}</span>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Card className="border-0 shadow-none">
            <CardContent className="p-3">
              <Tabs 
                defaultValue={dateFilter.type}
                value={dateFilter.type}
                onValueChange={(value) => handleFilterTypeChange(value as FilterType)}
                className="w-full"
              >
                <TabsList className="w-full grid grid-cols-3">
                  {availableFilterOptions.map(option => (
                    <TabsTrigger key={option.type} value={option.type}>
                      {option.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
                
                <TabsContent value="month" className="mt-4">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <Button variant="outline" size="icon" onClick={handlePrevMonth}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <div className="font-medium">
                        {format(selectedDate, 'MMMM yyyy')}
                      </div>
                      <Button variant="outline" size="icon" onClick={handleNextMonth}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Select
                          value={dateFilter.month?.toString() || '0'}
                          onValueChange={handleMonthChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Month" />
                          </SelectTrigger>
                          <SelectContent>
                            {monthOptions}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Select
                          value={dateFilter.year.toString()}
                          onValueChange={handleYearChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Year" />
                          </SelectTrigger>
                          <SelectContent>
                            {yearOptions}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="quarter" className="mt-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Select
                        value={dateFilter.quarter?.toString() || '1'}
                        onValueChange={handleQuarterChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Quarter" />
                        </SelectTrigger>
                        <SelectContent>
                          {quarterOptions}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Select
                        value={dateFilter.year.toString()}
                        onValueChange={handleYearChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Year" />
                        </SelectTrigger>
                        <SelectContent>
                          {yearOptions}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="year" className="mt-4">
                  <div>
                    <Select
                      value={dateFilter.year.toString()}
                      onValueChange={handleYearChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Year" />
                      </SelectTrigger>
                      <SelectContent>
                        {yearOptions}
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>
                
                {/* Custom range is disabled for now */}
                {/* <TabsContent value="custom" className="mt-4">
                  <DatePickerWithRange 
                    initialDateRange={dateFilter.customRange ? {
                      from: dateFilter.customRange.startDate,
                      to: dateFilter.customRange.endDate
                    } : undefined}
                    onUpdate={handleDateRangeChange}
                  />
                </TabsContent> */}
              </Tabs>
              
              <div className="flex justify-end mt-4">
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  Apply
                </Button>
              </div>
            </CardContent>
          </Card>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default DateFilter; 