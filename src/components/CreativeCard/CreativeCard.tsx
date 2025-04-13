import * as React from "react";
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from "@/components/ui/card"; // Import base card and parts
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"; // Import Popover components
import { Button } from "@/components/ui/button"; // Import Button for trigger
import { Info } from "lucide-react"; // Import Info icon
import { cn } from "@/lib/utils";

// Define the props, extending standard div attributes and adding popover props
export interface CreativeCardProps extends React.HTMLAttributes<HTMLDivElement> {
  infoPopoverContent?: React.ReactNode; // Optional content for the info popover
  infoPopoverTitle?: string; // Optional title for the info popover
}

const CreativeCard = React.forwardRef<HTMLDivElement, CreativeCardProps>(
  ({ className, children, infoPopoverContent, infoPopoverTitle, ...props }, ref) => {
    return (
      // Outer div for hover group and positioning context
      // Added 'relative' here to ensure absolute positioning of popover trigger works
      <div className={cn("relative group", className)}>
        {/* Div for border, shadow, and hover effects */}
        <div className="absolute inset-0 bg-card rounded-lg border-2 border-foreground shadow-creative shadow-foreground transition-all duration-300 group-hover:shadow-creative-hover group-hover:translate-x-[-4px] group-hover:translate-y-[-4px]" />

        {/* Optional Info Popover Trigger */}
        {infoPopoverContent && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 z-10 h-6 w-6 text-muted-foreground hover:text-foreground hover:bg-transparent" // Position top-right
                aria-label="More information"
              >
                <Info className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-60" side="top" align="end">
              <div className="space-y-2">
                {infoPopoverTitle && (
                  <h4 className="font-medium leading-none font-handwritten">{infoPopoverTitle}</h4>
                )}
                <div className="text-sm text-muted-foreground">
                  {infoPopoverContent}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}

        {/* Original Card made transparent to show effects behind it */}
        {/* Added 'relative' here as well for stacking context */}
        <Card
          ref={ref}
          className="relative shadow-none border-none bg-transparent" // Make original card transparent
          {...props} // Pass through other Card props
        >
          {children} {/* Render children inside the base Card */}
        </Card>
      </div>
    );
  }
);
CreativeCard.displayName = "CreativeCard";

// Re-export Card sub-components for convenience
export { CardHeader, CardContent, CardFooter, CardTitle, CardDescription };

export { CreativeCard };