'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { 
  AlertTriangle, 
  RefreshCw, 
  Home, 
  Bug,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('App Error Boundary caught an error:', error, errorInfo);
    }

    // In production, you might want to send this to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error, { extra: errorInfo });
    }
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      retryCount: prevState.retryCount + 1
    }));
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  toggleDetails = () => {
    this.setState(prevState => ({
      showDetails: !prevState.showDetails
    }));
  };

  getErrorType = () => {
    const error = this.state.error;
    if (!error) return 'Unknown Error';

    if (error.message.includes('ChunkLoadError') || error.message.includes('Loading chunk')) {
      return 'Resource Loading Error';
    }
    if (error.message.includes('Network') || error.message.includes('fetch')) {
      return 'Network Error';
    }
    if (error.message.includes('Supabase') || error.message.includes('database')) {
      return 'Database Configuration Error';
    }
    if (error.message.includes('Clerk') || error.message.includes('auth')) {
      return 'Authentication Error';
    }
    if (error.message.includes('Gemini') || error.message.includes('API key')) {
      return 'AI Service Error';
    }
    return 'Application Error';
  };

  getErrorSuggestion = () => {
    const errorType = this.getErrorType();
    
    switch (errorType) {
      case 'Resource Loading Error':
        return 'This usually happens when the app is updated. Try refreshing the page.';
      case 'Network Error':
        return 'Check your internet connection and try again.';
      case 'Database Configuration Error':
        return 'Database configuration is required. Please contact your administrator.';
      case 'Authentication Error':
        return 'Authentication service is not properly configured. Please contact support.';
      case 'AI Service Error':
        return 'AI service configuration is required. Please check your API keys.';
      default:
        return 'An unexpected error occurred. Try refreshing the page or contact support if the problem persists.';
    }
  };

  render() {
    if (this.state.hasError) {
      const errorType = this.getErrorType();
      const suggestion = this.getErrorSuggestion();
      const isConfigError = errorType.includes('Configuration') || errorType.includes('AI Service');

      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full">
            <CardContent className="p-8">
              <div className="text-center">
                {/* Error Icon */}
                <div className="flex justify-center mb-6">
                  {isConfigError ? (
                    <div className="p-4 bg-amber-100 rounded-full">
                      <AlertTriangle className="h-12 w-12 text-amber-600" />
                    </div>
                  ) : (
                    <div className="p-4 bg-red-100 rounded-full">
                      <Bug className="h-12 w-12 text-red-600" />
                    </div>
                  )}
                </div>

                {/* Error Title */}
                <h1 className="text-3xl font-bold text-slate-900 mb-2">
                  {isConfigError ? 'Configuration Required' : 'Something went wrong'}
                </h1>
                
                {/* Error Type */}
                <div className="inline-flex items-center px-3 py-1 bg-slate-100 rounded-full text-sm font-medium text-slate-700 mb-4">
                  {errorType}
                </div>

                {/* Error Description */}
                <p className="text-slate-600 mb-6 leading-relaxed">
                  {suggestion}
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
                  <Button 
                    onClick={this.handleRetry}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={this.handleReload}
                    className="border-slate-300 text-slate-700 hover:bg-slate-50"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Page
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={this.handleGoHome}
                    className="border-slate-300 text-slate-700 hover:bg-slate-50"
                  >
                    <Home className="h-4 w-4 mr-2" />
                    Go Home
                  </Button>
                </div>

                {/* Configuration Help */}
                {isConfigError && (
                  <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200 text-left">
                    <h3 className="font-semibold text-blue-900 mb-2">Setup Required</h3>
                    <p className="text-sm text-blue-800 mb-3">
                      This application requires proper environment configuration to function correctly.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open('/docs/setup', '_blank')}
                      className="border-blue-300 text-blue-700 hover:bg-blue-100"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View Setup Guide
                    </Button>
                  </div>
                )}

                {/* Error Details (Development) */}
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <div className="text-left">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={this.toggleDetails}
                      className="text-slate-600 hover:text-slate-800 mb-3"
                    >
                      {this.state.showDetails ? (
                        <>
                          <ChevronUp className="h-4 w-4 mr-1" />
                          Hide Error Details
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4 mr-1" />
                          Show Error Details
                        </>
                      )}
                    </Button>

                    {this.state.showDetails && (
                      <div className="bg-slate-100 rounded-lg p-4 text-left">
                        <h4 className="font-semibold text-slate-900 mb-2">Error Details (Development)</h4>
                        <div className="space-y-3">
                          <div>
                            <h5 className="font-medium text-slate-800 text-sm">Error Message:</h5>
                            <pre className="text-xs bg-white p-2 rounded border overflow-auto">
                              {this.state.error.toString()}
                            </pre>
                          </div>
                          {this.state.errorInfo && (
                            <div>
                              <h5 className="font-medium text-slate-800 text-sm">Component Stack:</h5>
                              <pre className="text-xs bg-white p-2 rounded border overflow-auto max-h-32">
                                {this.state.errorInfo.componentStack}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Retry Count */}
                {this.state.retryCount > 0 && (
                  <p className="text-xs text-slate-500 mt-4">
                    Retry attempts: {this.state.retryCount}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AppErrorBoundary;
