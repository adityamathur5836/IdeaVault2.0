"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { 
  Loader2, 
  Brain, 
  Database, 
  Sparkles, 
  FileText, 
  CheckCircle,
  Clock,
  Zap
} from "lucide-react";

/**
 * Dynamic loader with progress steps and estimated time
 */
export function DynamicLoader({ 
  type = "idea", // "idea" or "report"
  steps = [],
  currentStep = 0,
  estimatedTime = 30,
  onComplete = null,
  className = ""
}) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Default steps for different types
  const defaultSteps = {
    idea: [
      { id: "search", label: "Searching similar ideas", icon: Database, duration: 5 },
      { id: "analyze", label: "Analyzing market trends", icon: Brain, duration: 8 },
      { id: "generate", label: "Generating unique concepts", icon: Sparkles, duration: 12 },
      { id: "refine", label: "Refining and formatting", icon: Zap, duration: 5 }
    ],
    report: [
      { id: "fetch", label: "Loading idea data", icon: Database, duration: 3 },
      { id: "analyze", label: "Analyzing business concept", icon: Brain, duration: 10 },
      { id: "market", label: "Researching market intelligence", icon: FileText, duration: 12 },
      { id: "strategy", label: "Developing product strategy", icon: Sparkles, duration: 10 },
      { id: "finalize", label: "Finalizing report sections", icon: CheckCircle, duration: 5 }
    ]
  };

  const processSteps = steps.length > 0 ? steps : defaultSteps[type] || defaultSteps.idea;

  // Timer: increases elapsed time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Allow external control via `currentStep` prop
  useEffect(() => {
    if (currentStep !== undefined && currentStep !== currentStepIndex) {
      setCurrentStepIndex(currentStep);
    }
  }, [currentStep]);

  // Auto-advance steps based on elapsed time
  useEffect(() => {
    let cumulativeTime = 0;
    for (let i = 0; i < processSteps.length; i++) {
      cumulativeTime += processSteps[i].duration;
      if (elapsedTime < cumulativeTime) {
        setCurrentStepIndex(prev => (prev !== i ? i : prev)); // prevents infinite re-renders
        break;
      }
    }

    // Trigger completion callback when done
    if (elapsedTime >= estimatedTime && onComplete) {
      onComplete();
    }
  }, [elapsedTime, processSteps, estimatedTime, onComplete]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const getProgressPercentage = () => {
    return Math.min((elapsedTime / estimatedTime) * 100, 100);
  };

  const getRemainingTime = () => {
    const remaining = Math.max(estimatedTime - elapsedTime, 0);
    return remaining;
  };

  return (
    <Card className={`w-full max-w-md mx-auto ${className}`}>
      <CardContent className="p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-3">
            <div className="relative">
              <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse" />
              </div>
            </div>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">
            {type === "idea" ? "Generating Ideas" : "Creating Report"}
          </h3>
          <p className="text-sm text-slate-600">
            AI is working on your request...
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-slate-600 mb-2">
            <span>Progress</span>
            <span>{Math.round(getProgressPercentage())}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
        </div>

        {/* Time Info */}
        <div className="flex justify-between items-center mb-6 p-3 bg-slate-50 rounded-lg">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-slate-500" />
            <span className="text-slate-600">Elapsed: {formatTime(elapsedTime)}</span>
          </div>
          <div className="text-sm text-slate-600">
            ~{formatTime(getRemainingTime())} remaining
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-3">
          {processSteps.map((step, index) => {
            const isActive = index === currentStepIndex;
            const isCompleted = index < currentStepIndex;
            const IconComponent = step.icon;

            return (
              <div 
                key={step.id}
                className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 ${
                  isActive 
                    ? "bg-indigo-50 border border-indigo-200" 
                    : isCompleted 
                      ? "bg-green-50 border border-green-200" 
                      : "bg-slate-50 border border-slate-200"
                }`}
              >
                <div className={`flex-shrink-0 ${
                  isActive 
                    ? "text-indigo-600" 
                    : isCompleted 
                      ? "text-green-600" 
                      : "text-slate-400"
                }`}>
                  {isCompleted ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : isActive ? (
                    <IconComponent className="h-5 w-5 animate-pulse" />
                  ) : (
                    <IconComponent className="h-5 w-5" />
                  )}
                </div>
                
                <div className="flex-1">
                  <p className={`text-sm font-medium ${
                    isActive 
                      ? "text-indigo-900" 
                      : isCompleted 
                        ? "text-green-900" 
                        : "text-slate-600"
                  }`}>
                    {step.label}
                  </p>
                  {isActive && (
                    <p className="text-xs text-indigo-600 mt-1">Processing...</p>
                  )}
                  {isCompleted && (
                    <p className="text-xs text-green-600 mt-1">Completed</p>
                  )}
                </div>

                {isActive && (
                  <div className="flex-shrink-0">
                    <Loader2 className="h-4 w-4 text-indigo-600 animate-spin" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500">
            {type === "idea" 
              ? "Generating unique ideas based on your preferences..." 
              : "Creating comprehensive business analysis..."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Simple loading spinner with message
 */
export function SimpleLoader({ message = "Loading...", className = "" }) {
  return (
    <div className={`flex items-center justify-center p-8 ${className}`}>
      <div className="text-center">
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin mx-auto mb-3" />
        <p className="text-slate-600">{message}</p>
      </div>
    </div>
  );
}

/**
 * Inline loader for buttons
 */
export function InlineLoader({ size = "sm", className = "" }) {
  const sizeClasses = {
    xs: "h-3 w-3",
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6"
  };

  return (
    <Loader2 className={`${sizeClasses[size]} animate-spin ${className}`} />
  );
}

export default DynamicLoader;
