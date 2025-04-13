import * as React from "react";
import { Button, buttonVariants } from "@/components/ui/button"; // Import base button
import type { VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Define the props, extending the base button props
export interface CreativeButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const CreativeButton = React.forwardRef<HTMLButtonElement, CreativeButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        variant={variant} // Pass through original variants
        size={size}
        asChild={asChild}
        className={cn(
          // Apply creative styles
          "font-handwritten text-lg relative border-2 border-foreground transition-all duration-300 shadow-creative-button shadow-foreground hover:shadow-creative-button-hover hover:translate-x-[-2px] hover:translate-y-[-2px] active:translate-x-[0px] active:translate-y-[0px] active:shadow-creative-button text-black dark:text-white bg-background hover:bg-accent hover:text-accent-foreground", // Added default bg/hover from 'ghost' variant style
          // Allow overriding with passed className
          className
        )}
        {...props} // Pass through all other props
      />
    );
  }
);
CreativeButton.displayName = "CreativeButton";

export { CreativeButton };