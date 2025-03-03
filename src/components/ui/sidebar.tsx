// Import the TooltipProvider from the correct location
import * as React from "react"
import { cva } from "class-variance-authority"

import { cn } from "@/lib/utils"
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

const sidebarVariants = cva(
  "fixed inset-y-0 z-50 flex flex-col w-[var(--sidebar-width)] bg-secondary/50 backdrop-blur-sm border-r border-r-secondary/50",
  {
    variants: {
      open: {
        true: "translate-x-0",
        false: "-translate-x-full",
      },
    },
    defaultVariants: {
      open: false,
    },
  }
)

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  ({ className, open, onOpenChange, ...props }, ref) => {
    return (
      <TooltipProvider>
        <Sheet open={open} onOpenChange={onOpenChange}>
          <SheetTrigger asChild>
            <div
              ref={ref}
              className={cn(sidebarVariants({ open, className }))}
              {...props}
            />
          </SheetTrigger>
          <SheetContent side="left" className="p-0">
            <div className="flex flex-col h-full">
              <div className="flex-1 p-4">
                <div className="space-y-2.5">
                  <h2 className="mb-2 text-lg font-semibold tracking-tight">
                    Dashboard
                  </h2>
                  <Separator />
                  <div className="space-y-1">
                    <p className="px-2 text-sm font-medium text-muted-foreground">
                      Quick Actions
                    </p>
                    <Button variant="ghost" className="w-full justify-start">
                      New Task
                    </Button>
                    <Button variant="ghost" className="w-full justify-start">
                      New Event
                    </Button>
                    <Button variant="ghost" className="w-full justify-start">
                      New Contact
                    </Button>
                  </div>
                </div>
              </div>
              <div className="flex-1 p-4">
                <div className="space-y-2.5">
                  <h2 className="mb-2 text-lg font-semibold tracking-tight">
                    Team Members
                  </h2>
                  <Separator />
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="space-y-0.5">
                        <h4 className="text-sm font-semibold">Lucille Ball</h4>
                        <p className="text-xs text-muted-foreground">
                          @lucille.ball
                        </p>
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="ml-auto h-8 w-8"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="h-4 w-4"
                            >
                              <path d="M12 5v14M5 12h14" />
                            </svg>
                            <span className="sr-only">Add</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Add to team</TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="space-y-0.5">
                        <h4 className="text-sm font-semibold">
                          Desi Arnaz
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          @desi.arnaz
                        </p>
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="ml-auto h-8 w-8"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="h-4 w-4"
                            >
                              <path d="M12 5v14M5 12h14" />
                            </svg>
                            <span className="sr-only">Add</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Add to team</TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="space-y-0.5">
                        <h4 className="text-sm font-semibold">Vivian Vance</h4>
                        <p className="text-xs text-muted-foreground">
                          @vivian.vance
                        </p>
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="ml-auto h-8 w-8"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="h-4 w-4"
                            >
                              <path d="M12 5v14M5 12h14" />
                            </svg>
                            <span className="sr-only">Add</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Add to team</TooltipContent>
                      </Tooltip>
                    </div>
                    <Button variant="ghost" className="w-full justify-start">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mr-2 h-4 w-4"
                      >
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                      Add Member
                    </Button>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <div className="space-y-2.5">
                  <h2 className="mb-2 text-lg font-semibold tracking-tight">
                    Search
                  </h2>
                  <Separator />
                  <div className="space-y-1">
                    <Input placeholder="Search..." />
                  </div>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </TooltipProvider>
    )
  }
)
Sidebar.displayName = "Sidebar"

export { Sidebar }
