'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

/**
 * Global Error Boundary with Auto-Recovery
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRetrying: false
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[Error Boundary] Caught error:', error);
    console.error('[Error Boundary] Error info:', errorInfo);

    this.setState({
      error,
      errorInfo,
      hasError: true
    });

    // Log error to system
    this.logError(error, errorInfo);

    // Auto-retry for certain types of errors
    if (this.shouldAutoRetry(error)) {
      this.autoRetry();
    }
  }

  shouldAutoRetry(error) {
    const retryableErrors = [
      'ChunkLoadError',
      'Loading chunk',
      'Network Error',
      'Failed to fetch'
    ];

    return retryableErrors.some(errorType => 
      error.message?.includes(errorType) || error.name?.includes(errorType)
    ) && this.state.retryCount < 3;
  }

  autoRetry = () => {
    if (this.state.retryCount >= 3) return;

    console.log(`[Error Boundary] Auto-retry attempt ${this.state.retryCount + 1}`);
    
    this.setState({ isRetrying: true });

    setTimeout(() => {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1,
        isRetrying: false
      }));
    }, 2000 + (this.state.retryCount * 1000)); // Exponential backoff
  };

  handleManualRetry = () => {
    console.log('[Error Boundary] Manual retry triggered');
    
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRetrying: false
    });
  };

  handleReportError = () => {
    const errorReport = {
      error: this.state.error?.message,
      stack: this.state.error?.stack,
      componentStack: this.state.errorInfo?.componentStack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString()
    };

    // Copy error report to clipboard
    navigator.clipboard.writeText(JSON.stringify(errorReport, null, 2))
      .then(() => {
        alert('Error report copied to clipboard. Please share this with support.');
      })
      .catch(() => {
        console.error('Failed to copy error report');
      });
  };

  logError = async (error, errorInfo) => {
    try {
      await fetch('/api/system-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: 'error_boundary',
          status: 'error',
          message: error.message,
          error_details: {
            name: error.name,
            stack: error.stack,
            componentStack: errorInfo.componentStack
          },
          metadata: {
            userAgent: navigator.userAgent,
            url: window.location.href,
            retryCount: this.state.retryCount
          }
        }),
      });
    } catch (logError) {
      console.error('[Error Boundary] Failed to log error:', logError);
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-2xl text-red-900">
                {this.state.isRetrying ? 'Recovering...' : 'Something went wrong'}
              </CardTitle>
              <CardDescription>
                {this.state.isRetrying ? (
                  'Attempting to recover automatically...'
                ) : (
                  'An unexpected error occurred. We\'re working to fix this.'
                )}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {this.state.isRetrying ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : (
                <>
                  {/* Error Details */}
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h3 className="font-semibold text-red-900 mb-2">Error Details</h3>
                    <p className="text-red-800 text-sm font-mono">
                      {this.state.error?.message || 'Unknown error'}
                    </p>
                    {this.state.retryCount > 0 && (
                      <p className="text-red-700 text-sm mt-2">
                        Auto-retry attempts: {this.state.retryCount}/3
                      </p>
                    )}
                  </div>

                  {/* Recovery Actions */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button 
                      onClick={this.handleManualRetry}
                      className="flex-1"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Try Again
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      onClick={() => window.location.href = '/'}
                      className="flex-1"
                    >
                      <Home className="h-4 w-4 mr-2" />
                      Go Home
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      onClick={this.handleReportError}
                      className="flex-1"
                    >
                      <Bug className="h-4 w-4 mr-2" />
                      Report Error
                    </Button>
                  </div>

                  {/* Troubleshooting Tips */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 mb-2">Troubleshooting Tips</h3>
                    <ul className="text-blue-800 text-sm space-y-1">
                      <li>• Refresh the page or try again</li>
                      <li>• Check your internet connection</li>
                      <li>• Clear your browser cache and cookies</li>
                      <li>• Try using a different browser</li>
                      <li>• Contact support if the problem persists</li>
                    </ul>
                  </div>

                  {/* Development Info */}
                  {process.env.NODE_ENV === 'development' && (
                    <details className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <summary className="font-semibold text-gray-900 cursor-pointer">
                        Development Details
                      </summary>
                      <pre className="text-xs text-gray-700 mt-2 overflow-auto">
                        {this.state.error?.stack}
                      </pre>
                      <pre className="text-xs text-gray-700 mt-2 overflow-auto">
                        {this.state.errorInfo?.componentStack}
                      </pre>
                    </details>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook for error boundary integration
 */
export function useErrorHandler() {
  const handleError = (error, errorInfo = {}) => {
    console.error('[Error Handler]', error);
    
    // Log error to system
    fetch('/api/system-logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        operation: 'client_error',
        status: 'error',
        message: error.message,
        error_details: {
          name: error.name,
          stack: error.stack,
          ...errorInfo
        },
        metadata: {
          userAgent: navigator.userAgent,
          url: window.location.href,
          timestamp: new Date().toISOString()
        }
      }),
    }).catch(logError => {
      console.error('[Error Handler] Failed to log error:', logError);
    });
  };

  return { handleError };
}

export default ErrorBoundary;
