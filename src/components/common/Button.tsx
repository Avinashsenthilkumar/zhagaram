import { Link } from "@tanstack/react-router";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-medium transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50 whitespace-nowrap",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground hover:bg-secondary shadow-[0_1px_0_rgb(255_255_255/0.08)_inset]",
        secondary:
          "bg-card text-foreground ring-1 ring-[#D4AF37] hover:bg-light-grey",
        ghost: "text-primary hover:text-secondary hover:bg-primary/5",
        outline:
          "bg-white text-primary ring-1 ring-primary/20 hover:bg-light-grey",
        gold: "bg-accent text-dark-navy hover:brightness-95",
        dark: "bg-dark-navy text-white hover:bg-primary",
      },
      size: {
        sm: "h-10 px-4 text-sm rounded-md",
        md: "h-11 px-5 text-sm rounded-lg",
        lg: "h-12 px-6 text-base rounded-lg",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    href?: string;
    children: ReactNode;
  };

export function Button({
  href,
  variant,
  size,
  className,
  children,
  ...props
}: ButtonProps) {
  const classes = cn(buttonVariants({ variant, size }), className);
  if (href) {
    return (
      <Link to={href} preload="intent" className={classes}>
        {children}
      </Link>
    );
  }
  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
