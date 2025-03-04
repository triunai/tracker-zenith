import * as React from "react"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"

import { cn } from "@/lib/utils"
import { Slot } from "@radix-ui/react-slot"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    className={cn(
      "flex h-full w-[260px] flex-col border-r bg-secondary",
      className
    )}
    ref={ref}
    {...props}
  />
))
Sidebar.displayName = "Sidebar"

const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    className={cn("flex items-center justify-between py-4 px-6", className)}
    ref={ref}
    {...props}
  />
))
SidebarHeader.displayName = "SidebarHeader"

const SidebarTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div className={cn("text-lg font-semibold", className)} ref={ref} {...props} />
))
SidebarTitle.displayName = "SidebarTitle"

const SidebarDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div className={cn("text-sm text-muted-foreground", className)} ref={ref} {...props} />
))
SidebarDescription.displayName = "SidebarDescription"

const SidebarNav = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div className={cn("flex flex-col gap-2 py-4 px-3", className)} ref={ref} {...props} />
))
SidebarNav.displayName = "SidebarNav"

const SidebarNavItem = React.forwardRef<
  HTMLAnchorElement,
  React.HTMLAttributes<HTMLAnchorElement>
>(({ className, active, ...props }, ref) => (
  <a
    href="#"
    className={cn(
      "group flex w-full items-center rounded-md border border-transparent px-3 py-2 text-sm font-medium hover:bg-secondary hover:text-accent-foreground [&.active]:bg-secondary/80 [&.active]:font-semibold",
      active && "active",
      className
    )}
    ref={ref}
    {...props}
  />
))
SidebarNavItem.displayName = "SidebarNavItem"

const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    className={cn(
      "mt-auto border-t py-4 px-6",
      className
    )}
    ref={ref}
    {...props}
  />
))
SidebarFooter.displayName = "SidebarFooter"

const SidebarMenu = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div className={cn("relative", className)} ref={ref} {...props} />
))
SidebarMenu.displayName = "SidebarMenu"

const SidebarMenuItem = React.forwardRef<
  HTMLButtonElement,
  React.HTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => (
  <Button
    variant="ghost"
    size="sm"
    className={cn(
      "h-auto px-2 py-1.5 text-sm",
      className
    )}
    ref={ref}
    {...props}
  />
))
SidebarMenuItem.displayName = "SidebarMenuItem"

const SidebarToggleButton = React.forwardRef<
  HTMLButtonElement,
  React.HTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "absolute right-0 top-0 rounded-none p-1.5 opacity-0 group-hover:opacity-100 data-[state=open]:bg-secondary",
            className
          )}
          ref={ref}
          {...props}
        />
      </TooltipTrigger>
      <TooltipContent side="bottom">Toggle Sidebar</TooltipContent>
    </Tooltip>
  </TooltipProvider>
))
SidebarToggleButton.displayName = "SidebarToggleButton"

export {
  Sidebar,
  SidebarHeader,
  SidebarTitle,
  SidebarDescription,
  SidebarNav,
  SidebarNavItem,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarToggleButton,
}
