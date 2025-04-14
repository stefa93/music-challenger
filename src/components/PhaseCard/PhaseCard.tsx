import * as React from "react";
import {
  CreativeCard,
  CardHeader,
  CardContent,
  CardFooter,
  CardTitle,
  CardDescription,
} from "@/components/CreativeCard/CreativeCard";

export interface PhaseCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title: React.ReactNode;
  description?: React.ReactNode;
  infoPopoverContent?: React.ReactNode;
  infoPopoverTitle?: string;
  timerDisplay?: React.ReactNode;
  footerContent?: React.ReactNode;
  children: React.ReactNode;
}

const PhaseCard = React.forwardRef<HTMLDivElement, PhaseCardProps>(
  (
    {
      className,
      title,
      description,
      infoPopoverContent,
      infoPopoverTitle,
      timerDisplay,
      footerContent,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <CreativeCard
        ref={ref}
        className={
          // Responsive max width, prevent overflow, allow vertical scroll for content
          "w-full max-w-2xl mx-auto my-4 overflow-visible " +
          (className || "")
        }
        infoPopoverContent={infoPopoverContent}
        infoPopoverTitle={infoPopoverTitle}
        {...props}
      >
        <CardHeader
          className="flex flex-col items-start gap-2 pb-2 relative"
          // Ensure header does not overflow
        >
          <div className="flex w-full items-center justify-between gap-2">
            <CardTitle className="text-2xl font-handwritten break-words pr-2">
              {title}
            </CardTitle>
            {timerDisplay && (
              <div className="shrink-0 flex items-center ml-auto">
                {timerDisplay}
              </div>
            )}
          </div>
          {description && (
            <CardDescription className="text-base break-words">
              {description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent
          className="relative max-h-[50vh] overflow-y-auto py-2"
          // Main content area is scrollable if it overflows
        >
          {children}
        </CardContent>
        {footerContent && (
          <CardFooter className="pt-2">{footerContent}</CardFooter>
        )}
      </CreativeCard>
    );
  }
);

PhaseCard.displayName = "PhaseCard";

export { PhaseCard };