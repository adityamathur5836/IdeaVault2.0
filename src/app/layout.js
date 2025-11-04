import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs';
import { ToastProvider } from '@/components/ui/Toast';
import { DashboardProvider } from '@/contexts/DashboardContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { validateEnvironment } from '@/lib/envValidator';
import AppErrorBoundary from '@/components/ui/AppErrorBoundary';

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata = {
  title: "IdeaVault - AI-Powered Business Idea Discovery",
  description: "Discover, validate, and develop business ideas with AI-powered insights and community feedback.",
  keywords: "business ideas, AI, entrepreneurship, startup, innovation, validation",
  authors: [{ name: "IdeaVault Team" }],
  creator: "IdeaVault",
  publisher: "IdeaVault",
  openGraph: {
    title: "IdeaVault - AI-Powered Business Idea Discovery",
    description: "Discover, validate, and develop business ideas with AI-powered insights and community feedback.",
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: "IdeaVault",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "IdeaVault - AI-Powered Business Idea Discovery",
    description: "Discover, validate, and develop business ideas with AI-powered insights and community feedback.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }) {
  // Validate environment on server-side
  if (typeof window === 'undefined') {
    validateEnvironment();
  }

  return (
    <ClerkProvider>
      <html lang="en" className={inter.variable}>
        <body className="font-sans antialiased bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
          <AppErrorBoundary>
            <ThemeProvider>
              <DashboardProvider>
                <ToastProvider>
                  {children}
                </ToastProvider>
              </DashboardProvider>
            </ThemeProvider>
          </AppErrorBoundary>
        </body>
      </html>
    </ClerkProvider>
  );
}
