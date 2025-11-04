'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { getConfigurationStatus } from '@/lib/envValidator';
import {
  AlertTriangle,
  CheckCircle,
  Settings,
  X,
  ChevronDown,
  ChevronUp,
  ExternalLink
} from 'lucide-react';

export function ConfigurationBanner({ onDismiss, className = '' }) {
  const [status, setStatus] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const configStatus = getConfigurationStatus();
    setStatus(configStatus);
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  // Don't show banner if configuration is valid or dismissed
  if (!status || status.isValid || isDismissed) {
    return null;
  }

  const criticalErrors = status.errors.filter(error => error.severity === 'error');
  const warnings = status.errors.filter(error => error.severity === 'warning');

  return (
    <Card className={`border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 shadow-lg ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-amber-900">
                  Configuration Required
                </h3>
                <Badge variant="outline" className="border-amber-300 text-amber-700 bg-amber-100">
                  {criticalErrors.length} critical
                </Badge>
                {warnings.length > 0 && (
                  <Badge variant="outline" className="border-orange-300 text-orange-700 bg-orange-100">
                    {warnings.length} warnings
                  </Badge>
                )}
              </div>
              
              <p className="text-amber-800 text-sm mb-3">
                Some features require additional configuration to work properly.
              </p>

              {/* Feature Status Overview */}
              <div className="flex flex-wrap gap-2 mb-3">
                {Object.entries(status.features).map(([feature, isValid]) => (
                  <div key={feature} className="flex items-center gap-1">
                    {isValid ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <X className="h-4 w-4 text-red-600" />
                    )}
                    <span className={`text-xs font-medium capitalize ${
                      isValid ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {feature}
                    </span>
                  </div>
                ))}
              </div>

              {/* Expandable Details */}
              {status.errors.length > 0 && (
                <div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-amber-700 hover:text-amber-800 hover:bg-amber-100 p-0 h-auto font-medium"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="h-4 w-4 mr-1" />
                        Hide Details
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4 mr-1" />
                        Show Details
                      </>
                    )}
                  </Button>

                  {isExpanded && (
                    <div className="mt-3 space-y-2">
                      {status.errors.map((error, index) => (
                        <div key={index} className="bg-white/60 rounded-lg p-3 border border-amber-200">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-amber-900 capitalize">
                              {error.category}
                            </span>
                            <Badge 
                              variant={error.severity === 'error' ? 'destructive' : 'secondary'}
                              size="xs"
                            >
                              {error.severity}
                            </Badge>
                          </div>
                          <p className="text-sm text-amber-800">{error.issues}</p>
                        </div>
                      ))}
                      
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-start gap-2">
                          <Settings className="h-4 w-4 text-blue-600 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-blue-900 mb-1">
                              Setup Instructions
                            </p>
                            <p className="text-sm text-blue-800 mb-2">
                              Check your <code className="bg-blue-100 px-1 rounded">.env.local</code> file 
                              and ensure all required environment variables are properly configured.
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-blue-300 text-blue-700 hover:bg-blue-100"
                              onClick={() => window.open('/docs/setup', '_blank')}
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              View Setup Guide
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="text-amber-600 hover:text-amber-700 hover:bg-amber-100 p-1 h-auto"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default ConfigurationBanner;
