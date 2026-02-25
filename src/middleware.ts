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
  // If Clerk isn't configured, let all requests pass (demo mode)
  if (!isClerkConfigured) {
    return NextResponse.next();
  }

  try {
    const { clerkMiddleware } = await import("@clerk/nextjs/server");

    const handler = clerkMiddleware(async (auth, request) => {
      const { userId } = await auth();
      const { pathname } = request.nextUrl;

      // Redirect unauthenticated users from protected pages to sign-in
      if (!userId && isProtectedRoute(pathname)) {
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
