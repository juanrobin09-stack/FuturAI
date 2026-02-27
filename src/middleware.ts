import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
const isClerkConfigured =
  publishableKey.startsWith("pk_") &&
  !publishableKey.includes("placeholder");

// Routes that require authentication when Clerk is configured
const protectedPaths = [
  "/profile",
  "/settings",
  "/ideas/submit",
  "/projects/create",
  "/challenges/create",
  "/admin",
];

// Routes that should redirect authenticated users away
const authRoutes = ["/sign-in", "/sign-up"];

// Public profile pages /profile/[id] are NOT protected
const publicProfilePattern = /^\/profile\/[a-zA-Z0-9_-]+$/;

function isProtectedRoute(pathname: string): boolean {
  if (publicProfilePattern.test(pathname)) return false;
  return protectedPaths.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

function isAuthRoute(pathname: string): boolean {
  return authRoutes.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

export default async function middleware(req: NextRequest) {
  // If Clerk isn't configured
  if (!isClerkConfigured) {
    // In production, block protected routes and API if Clerk isn't configured
    if (process.env.NODE_ENV === "production") {
      const { pathname } = req.nextUrl;
      if (isProtectedRoute(pathname) || pathname.startsWith("/api/")) {
        console.error(
          "CRITICAL: Clerk is not configured in production. Blocking protected route:",
          pathname
        );
        return NextResponse.json(
          { error: "Service unavailable" },
          { status: 503 }
        );
      }
    }
    // In development, let all requests pass (demo mode)
    return NextResponse.next();
  }

  // Check if Clerk has an active session cookie — if no session cookie exists,
  // the user has never signed in via Clerk, so we're likely in demo mode.
  // Only redirect to sign-in if a Clerk session existed (user was previously signed in).
  const hasClerkSession = req.cookies.has("__session") || req.cookies.has("__client_uat");

  try {
    const { clerkMiddleware } = await import("@clerk/nextjs/server");

    const handler = clerkMiddleware(async (auth, request) => {
      let userId: string | null = null;
      try {
        const authResult = await auth();
        userId = authResult.userId;
      } catch {
        // Clerk auth failed (API down, invalid key, etc.) — allow through
        return NextResponse.next();
      }

      const { pathname } = request.nextUrl;

      // Redirect unauthenticated users from protected pages to sign-in
      // Only redirect if user had a Clerk session (not first-time/demo visitors)
      if (!userId && isProtectedRoute(pathname) && hasClerkSession) {
        const signInUrl = new URL("/sign-in", request.url);
        signInUrl.searchParams.set("redirect_url", request.url);
        return NextResponse.redirect(signInUrl);
      }

      // Redirect authenticated users away from sign-in/sign-up pages
      if (userId && isAuthRoute(pathname)) {
        return NextResponse.redirect(new URL("/", request.url));
      }

      return NextResponse.next();
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Clerk middleware expects NextFetchEvent
    return handler(req, {} as unknown as import("next/server").NextFetchEvent);
  } catch {
    // Clerk import failed — pass through (demo mode)
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
