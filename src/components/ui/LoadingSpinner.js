import { cn } from "@/lib/utils";

export function LoadingSpinner({ className, size = "default" }) {
  const sizeClasses = {
    sm: "h-4 w-4",
    default: "h-6 w-6",
    lg: "h-8 w-8",
    xl: "h-12 w-12",
  };

  return (
    <svg
      className={cn(
        "animate-spin text-slate-600",
        sizeClasses[size],
        className
      )}
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
  );
}

export function LoadingPage({ message = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <LoadingSpinner size="xl" />
      <p className="text-slate-600 text-lg">{message}</p>
    </div>
  );
}

export function LoadingOverlay({ message = "Loading..." }) {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 flex flex-col items-center space-y-4">
        <LoadingSpinner size="xl" />
        <p className="text-slate-600 text-lg">{message}</p>
      </div>
    </div>
  );
}
