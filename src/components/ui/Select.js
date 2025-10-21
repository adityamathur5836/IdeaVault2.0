import { cn } from "@/lib/utils";
import { forwardRef } from "react";

const Select = forwardRef(({ 
  className, 
  children,
  error = false,
  disabled = false,
  ...props 
}, ref) => {
  return (
    <select
      className={cn(
        "flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        error && "border-red-500 focus:ring-red-500",
        className
      )}
      ref={ref}
      disabled={disabled}
      {...props}
    >
      {children}
    </select>
  );
});

Select.displayName = "Select";

export { Select };
