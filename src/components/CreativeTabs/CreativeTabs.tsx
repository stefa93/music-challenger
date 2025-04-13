import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@/lib/utils";

const CreativeTabs = TabsPrimitive.Root;

const CreativeTabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
      // Add creative border/shadow to the list container? Optional.
      // "border-2 border-foreground shadow-creative shadow-foreground",
      className
    )}
    {...props}
  />
));
CreativeTabsList.displayName = TabsPrimitive.List.displayName;

const CreativeTabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
      // Apply creative styles
      "font-handwritten text-base", // Use handwritten font, maybe slightly larger
      // Style the active state similar to CreativeButton (border, shadow, background)
      "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-creative-button data-[state=active]:shadow-foreground data-[state=active]:border-2 data-[state=active]:border-foreground data-[state=active]:relative data-[state=active]:translate-x-[-1px] data-[state=active]:translate-y-[-1px]", // Simplified active effect
      // Custom shadow applied above, removing potential default shadcn active shadow if any existed implicitly
      className
    )}
    {...props}
  />
));
CreativeTabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const CreativeTabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
));
CreativeTabsContent.displayName = TabsPrimitive.Content.displayName;

export { CreativeTabs, CreativeTabsList, CreativeTabsTrigger, CreativeTabsContent };