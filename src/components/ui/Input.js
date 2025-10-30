import { cn } from "@/lib/utils";
import { forwardRef } from "react";

const Input = forwardRef(({ 
  className, 
  type = "text", 
  error = false,
  disabled = false,
  ...props 
}, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        error && "border-red-500 focus:ring-red-500",
        className
      )}
      ref={ref}
      disabled={disabled}
      {...props}
    />
  );
});

Input.displayName = "Input";

export { Input };
