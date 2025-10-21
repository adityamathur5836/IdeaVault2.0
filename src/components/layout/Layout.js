import Head from 'next/head';
import Navigation from './Navigation';
import Footer from './Footer';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { ToastProvider } from '@/components/ui/Toast';

export default function Layout({ 
  children, 
  title = "IdeaVault - AI-Powered Business Idea Discovery",
  description = "Discover, validate, and develop business ideas with AI-powered insights and community feedback.",
  className = ""
}) {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        
        {/* Open Graph */}
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={process.env.NEXT_PUBLIC_APP_URL} />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
      </Head>

      <ToastProvider>
        <div className="min-h-screen bg-slate-50 flex flex-col">
          <Navigation />
          
          <main className={`flex-1 ${className}`}>
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </main>
          
          <Footer />
        </div>
      </ToastProvider>
    </>
  );
}
