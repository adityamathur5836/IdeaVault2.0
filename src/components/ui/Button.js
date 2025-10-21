import { cn } from "@/lib/utils";
import { forwardRef } from "react";

const buttonVariants = {
  variant: {
    default: "bg-slate-900 text-white hover:bg-slate-800 focus:ring-slate-900",
    destructive: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-600",
    outline: "border border-slate-300 bg-white text-slate-900 hover:bg-slate-50 focus:ring-slate-900",
    secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200 focus:ring-slate-900",
    ghost: "text-slate-900 hover:bg-slate-100 focus:ring-slate-900",
    link: "text-slate-900 underline-offset-4 hover:underline focus:ring-slate-900",
  },
  size: {
    default: "h-10 px-4 py-2 text-sm",
    sm: "h-8 px-3 text-xs",
    lg: "h-12 px-8 text-base",
    icon: "h-10 w-10",
  },
};

const Button = forwardRef(({ 
  className, 
  variant = "default", 
  size = "default", 
  disabled = false,
  loading = false,
  children, 
  ...props 
}, ref) => {
  const baseClasses = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
  
  const variantClasses = buttonVariants.variant[variant] || buttonVariants.variant.default;
  const sizeClasses = buttonVariants.size[size] || buttonVariants.size.default;
  
  return (
    <button
      className={cn(baseClasses, variantClasses, sizeClasses, className)}
      ref={ref}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          className="mr-2 h-4 w-4 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
});

Button.displayName = "Button";

export { Button, buttonVariants };
