import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-cyan-900/60 text-cyan-200 border-cyan-700/50",
        secondary:
          "border-transparent bg-slate-800 text-slate-300 border-slate-700",
        destructive:
          "border-transparent bg-red-950/60 text-red-300 border-red-800/50",
        outline: "text-slate-300 border-slate-700",
        critical:
          "border-red-600/50 bg-red-950/80 text-red-300 font-bold animate-pulse",
        high:
          "border-amber-600/50 bg-amber-950/80 text-amber-300 font-semibold",
        medium:
          "border-yellow-600/50 bg-yellow-950/60 text-yellow-300",
        low:
          "border-emerald-600/50 bg-emerald-950/60 text-emerald-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
