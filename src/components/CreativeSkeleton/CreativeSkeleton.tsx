import * as React from "react"
import { cn } from "@/lib/utils"

// Define the props, extending standard div attributes
interface CreativeSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * A skeleton component styled according to the "Creative Handwritten" theme.
 * It uses a neutral background and a custom pulsing blue glow animation.
 * Renders a div with the appropriate styles.
 */
const CreativeSkeleton = React.forwardRef<HTMLDivElement, CreativeSkeletonProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          // Apply the creative styles directly to this div
          "bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900 animate-creative-pulse rounded-md",
          className // Allow external overrides/additions
        )}
        {...props} // Pass down other props like style, etc.
      />
    )
  }
)
CreativeSkeleton.displayName = "CreativeSkeleton"

export { CreativeSkeleton }