// middleware.ts (or .js)
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define your public routes
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/generate",
  "/explore",
  "/explore/(.*)",
  "/api/ideas/explore(.*)",
  "/api/ideas/public(.*)",
  "/api/test(.*)",
  "/about",
  "/pricing",
  "/contact",
  "/privacy",
  "/terms",
  "/help",
  "/blog",
  "/blog/(.*)",
]);

// Define ignored routes (middleware won"t run here)
const isIgnoredRoute = createRouteMatcher([
  "/api/webhooks(.*)",
  "/_next(.*)",
  "/favicon.ico",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isIgnoredRoute(req)) {
    return; // skip auth
  }

  if (!isPublicRoute(req)) {
    // require auth for all non-public routes
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!.+\\.[\\w]+$|_next).*)",
    "/",
    "/(api|trpc)(.*)",
  ],
};
