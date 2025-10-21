import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({
  children,
  variant = "default",
  size = "sm",
  className = "",
  interactive = false,
  ...props
}) {
  const baseClasses = "inline-flex items-center justify-center font-medium transition-all duration-200 select-none";

  const sizeClasses = {
    xs: "px-2 py-0.5 text-xs rounded-md",
    sm: "px-2.5 py-1 text-xs rounded-lg",
    md: "px-3 py-1.5 text-sm rounded-lg",
    lg: "px-4 py-2 text-sm rounded-xl"
  };

  const variants = {
    default: "bg-slate-100 text-slate-800 border border-slate-200/50 hover:bg-slate-150",
    outline: "border-2 border-slate-300 text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-400",

    // Difficulty variants with enhanced contrast
    easy: "bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border border-emerald-200/60 hover:from-emerald-150 hover:to-green-150",
    medium: "bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border border-amber-200/60 hover:from-amber-150 hover:to-yellow-150",
    hard: "bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border border-red-200/60 hover:from-red-150 hover:to-rose-150",

    // Status variants
    success: "bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border border-emerald-200/60 hover:from-emerald-150 hover:to-green-150",
    warning: "bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border border-amber-200/60 hover:from-amber-150 hover:to-yellow-150",
    danger: "bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border border-red-200/60 hover:from-red-150 hover:to-rose-150",

    // Special variants
    secondary: "bg-gradient-to-r from-purple-100 to-violet-100 text-purple-800 border border-purple-200/60 hover:from-purple-150 hover:to-violet-150",
    ai: "bg-gradient-to-r from-purple-100 via-indigo-100 to-blue-100 text-purple-800 border border-purple-200/60 hover:from-purple-150 hover:via-indigo-150 hover:to-blue-150 shadow-sm",
    database: "bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 border border-blue-200/60 hover:from-blue-150 hover:to-cyan-150",

    // Category variants
    productivity: "bg-gradient-to-r from-indigo-100 to-blue-100 text-indigo-800 border border-indigo-200/60",
    health: "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200/60",
    finance: "bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 border border-emerald-200/60",
    education: "bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800 border border-orange-200/60",
    entertainment: "bg-gradient-to-r from-pink-100 to-rose-100 text-pink-800 border border-pink-200/60",
    social: "bg-gradient-to-r from-violet-100 to-purple-100 text-violet-800 border border-violet-200/60",
    business: "bg-gradient-to-r from-slate-100 to-gray-100 text-slate-800 border border-slate-200/60",
    technology: "bg-gradient-to-r from-cyan-100 to-blue-100 text-cyan-800 border border-cyan-200/60"
  };

  const interactiveClasses = interactive
    ? "cursor-pointer hover:scale-105 active:scale-95 hover:shadow-sm"
    : "";

  return (
    <span
      className={cn(
        baseClasses,
        sizeClasses[size],
        variants[variant],
        interactiveClasses,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
