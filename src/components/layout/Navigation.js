'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser, UserButton } from '@clerk/nextjs';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import {
  Lightbulb,
  Search,
  BarChart3,
  Users,
  Settings,
  Menu,
  X,
  Target
} from 'lucide-react';
import { useState } from 'react';

const navigationItems = [
  {
    name: 'Generate Ideas',
    href: '/generate',
    icon: Lightbulb,
    description: 'Create new business ideas'
  },
  {
    name: 'Explore Ideas',
    href: '/explore',
    icon: Search,
    description: 'Browse curated ideas'
  },
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: BarChart3,
    description: 'Your saved ideas and progress',
    requiresAuth: true
  },
  {
    name: 'Milestones',
    href: '/milestones',
    icon: Target,
    description: 'Track your idea progress',
    requiresAuth: true
  },
  {
    name: 'Community',
    href: '/community',
    icon: Users,
    description: 'Validate and discuss ideas'
  }
];

export default function Navigation() {
  const pathname = usePathname();
  const { isSignedIn, user } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const filteredNavItems = navigationItems.filter(item =>
    !item.requiresAuth || isSignedIn
  );

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and primary navigation */}
          <div className="flex">
            <Link href="/" className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <Lightbulb className="h-8 w-8 text-slate-900" />
                <span className="ml-2 text-xl font-semibold text-slate-900">
                  IdeaVault
                </span>
              </div>
            </Link>
            
            {/* Desktop navigation */}
            <div className="hidden md:ml-8 md:flex md:space-x-8">
              {filteredNavItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors",
                      isActive
                        ? "border-slate-900 text-slate-900"
                        : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
                    )}
                  >
                    <item.icon className="h-4 w-4 mr-2" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right side - Auth and mobile menu */}
          <div className="flex items-center space-x-4">
            {isSignedIn ? (
              <div className="flex items-center space-x-4">
                <Link href="/settings">
                  <Button variant="ghost" size="icon">
                    <Settings className="h-4 w-4" />
                  </Button>
                </Link>
                <UserButton 
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: "h-8 w-8"
                    }
                  }}
                />
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-4">
                <Link href="/sign-in">
                  <Button variant="ghost">Sign In</Button>
                </Link>
                <Link href="/sign-up">
                  <Button>Get Started</Button>
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden">
          <div className="pt-2 pb-3 space-y-1 bg-white border-t border-slate-200">
            {filteredNavItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors",
                    isActive
                      ? "bg-slate-50 border-slate-900 text-slate-900"
                      : "border-transparent text-slate-500 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-700"
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="flex items-center">
                    <item.icon className="h-5 w-5 mr-3" />
                    <div>
                      <div>{item.name}</div>
                      <div className="text-sm text-slate-400">{item.description}</div>
                    </div>
                  </div>
                </Link>
              );
            })}
            
            {!isSignedIn && (
              <div className="pt-4 pb-3 border-t border-slate-200">
                <div className="flex items-center px-4 space-x-3">
                  <Link href="/sign-in" className="flex-1">
                    <Button variant="outline" className="w-full">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/sign-up" className="flex-1">
                    <Button className="w-full">
                      Get Started
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
