import * as React from "react"
import {
  Root,
  type ToggleGroupProps,
  type ToggleGroupSingleProps,
  type ToggleGroupMultipleProps,
  Item,
  type ToggleGroupItemProps,
  type ToggleGroupItemImplProps,
} from "@radix-ui/react-toggle-group"

import { cn } from "@/lib/utils"
import { Toggle } from "@/components/ui/toggle"

const ToggleGroup = React.forwardRef<
  HTMLDivElement,
  ToggleGroupProps
>(({ className, ...props }, ref) => (
  <Root
    ref={ref}
    className={cn("flex items-center space-x-1", className)}
    {...props}
  />
))
ToggleGroup.displayName = "ToggleGroup"

const ToggleGroupItem = React.forwardRef<
  HTMLButtonElement,
  ToggleGroupItemProps
>(({ className, ...props }, ref) => (
  <Item
    {...props}
    ref={ref}
    className={cn("bg-secondary text-secondary-foreground data-[state=on]:bg-accent data-[state=on]:text-accent-foreground", className)}
  />
))
ToggleGroupItem.displayName = "ToggleGroupItem"


export { ToggleGroup, ToggleGroupItem }
