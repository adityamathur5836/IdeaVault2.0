import { SignIn } from '@clerk/nextjs';
import Link from 'next/link';
import { Lightbulb } from 'lucide-react';

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="flex justify-center items-center">
          <Lightbulb className="h-12 w-12 text-slate-900" />
          <span className="ml-3 text-2xl font-bold text-slate-900">IdeaVault</span>
        </Link>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-slate-900">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Or{' '}
          <Link
            href="/sign-up"
            className="font-medium text-slate-900 hover:text-slate-700"
          >
            create a new account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm rounded-lg sm:px-10">
          <SignIn
            appearance={{
              elements: {
                formButtonPrimary:
                  "bg-slate-900 hover:bg-slate-800 text-sm normal-case",
                card: "shadow-none",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                socialButtonsBlockButton:
                  "border border-slate-300 hover:bg-slate-50 text-slate-700",
                socialButtonsBlockButtonText: "font-medium",
                formFieldInput:
                  "border-slate-300 focus:border-slate-900 focus:ring-slate-900",
                footerActionLink: "text-slate-900 hover:text-slate-700"
              }
            }}
            signUpUrl="/sign-up"
            forceRedirectUrl="/dashboard"
            fallbackRedirectUrl="/dashboard"
          />
        </div>
      </div>
    </div>
  );
}
