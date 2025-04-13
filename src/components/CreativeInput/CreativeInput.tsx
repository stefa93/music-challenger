import * as React from "react";
import { Input } from "@/components/ui/input"; // Import base input
import { cn } from "@/lib/utils";

// Define the props, extending standard input attributes
export interface CreativeInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const CreativeInput = React.forwardRef<HTMLInputElement, CreativeInputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <Input
        type={type}
        className={cn(
          // Apply creative styles
          "font-handwritten border-2 border-foreground focus-visible:ring-ring focus-visible:ring-offset-0 focus-visible:ring-2 h-10 px-3",
          // Allow overriding with passed className
          className
        )}
        ref={ref}
        {...props} // Pass through all other props
      />
    );
  }
);
CreativeInput.displayName = "CreativeInput";

export { CreativeInput };