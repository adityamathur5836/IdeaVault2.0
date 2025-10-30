import { cn } from "@/lib/utils";
import { forwardRef } from "react";

const Textarea = forwardRef(({ 
  className, 
  error = false,
  disabled = false,
  ...props 
}, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        error && "border-red-500 focus:ring-red-500",
        className
      )}
      ref={ref}
      disabled={disabled}
      {...props}
    />
  );
});

Textarea.displayName = "Textarea";

export { Textarea };
