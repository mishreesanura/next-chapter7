import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-[transform,background,box-shadow,border-color,color] duration-200 ease-out focus-visible:outline-none focus-visible:shadow-focus disabled:pointer-events-none disabled:opacity-50 enabled:hover:scale-[1.02] enabled:active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "border border-transparent bg-primary text-primary-foreground hover:bg-primary-hover",
        secondary: "border border-[var(--disabled)] bg-card text-foreground hover:border-[var(--muted-ink)] hover:bg-surface",
        ghost: "border border-transparent bg-transparent text-muted-foreground hover:bg-[var(--hover-tint)] hover:text-foreground",
        outline: "border border-border bg-card text-foreground shadow-soft hover:border-[var(--muted-ink)] hover:bg-surface",
        destructive: "border border-[var(--danger-soft)] bg-card text-destructive hover:bg-[var(--danger-soft)]"
      },
      size: {
        default: "h-12 px-6",
        sm: "h-9 px-4 text-[13px]",
        icon: "h-10 w-10 rounded-md p-0"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
