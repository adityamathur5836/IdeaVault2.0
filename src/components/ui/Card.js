import { cn } from "@/lib/utils";
import { forwardRef } from "react";

const Card = forwardRef(({ className, variant = "default", ...props }, ref) => {
  const variants = {
    default: "rounded-xl border border-slate-200/60 bg-white shadow-sm hover:shadow-md transition-shadow duration-200",
    elevated: "rounded-xl border border-slate-200/60 bg-white shadow-lg hover:shadow-xl transition-all duration-300",
    interactive: "rounded-xl border border-slate-200/60 bg-white shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer",
    gradient: "rounded-xl border border-slate-200/60 bg-gradient-to-br from-white to-slate-50/50 shadow-sm hover:shadow-md transition-shadow duration-200"
  };

  return (
    <div
      ref={ref}
      className={cn(variants[variant], className)}
      {...props}
    />
  );
});
Card.displayName = "Card";

const CardHeader = forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-2 p-6 pb-4", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = forwardRef(({ className, size = "default", ...props }, ref) => {
  const sizes = {
    sm: "text-base font-semibold leading-tight tracking-tight text-slate-900",
    default: "text-lg font-bold leading-tight tracking-tight text-slate-900",
    lg: "text-xl font-bold leading-tight tracking-tight text-slate-900",
    xl: "text-2xl font-bold leading-tight tracking-tight text-slate-900"
  };

  return (
    <h3
      ref={ref}
      className={cn(sizes[size], className)}
      {...props}
    />
  );
});
CardTitle.displayName = "CardTitle";

const CardDescription = forwardRef(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-slate-600 leading-relaxed", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("px-6 pb-6", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
