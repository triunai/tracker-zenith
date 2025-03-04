import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

interface CalendarProps {
  mode: "single" | "multiple" | "range"
  selected?: Date | Date[]
  onSelect: (date: Date | Date[] | undefined) => void
  initialFocus?: boolean
}

export const Calendar: React.FC<CalendarProps> = ({
  mode,
  selected,
  onSelect,
  initialFocus,
}) => {
  const [currentMonth, setCurrentMonth] = React.useState(new Date())

  const handleDayClick = (date: Date) => {
    if (mode === "single") {
      onSelect(date)
    } else if (mode === "multiple") {
      const newSelected = Array.isArray(selected) ? [...selected] : []
      if (newSelected.includes(date)) {
        onSelect(newSelected.filter((d) => d !== date))
      } else {
        onSelect([...newSelected, date])
      }
    } else if (mode === "range") {
      // Handle range selection logic here
    }
  }

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-2">
        <button
          className={cn(buttonVariants(), "p-2")}
          onClick={() => setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1))}
        >
          <ChevronLeft />
        </button>
        <span className="font-medium">{currentMonth.toLocaleString("default", { month: "long", year: "numeric" })}</span>
        <button
          className={cn(buttonVariants(), "p-2")}
          onClick={() => setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1))}
        >
          <ChevronRight />
        </button>
      </div>
      <DayPicker
        mode={mode}
        selected={selected}
        onDayClick={handleDayClick}
        month={currentMonth}
        onMonthChange={setCurrentMonth}
        initialFocus={initialFocus}
      />
    </div>
  )
}
