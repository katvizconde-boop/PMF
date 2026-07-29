import { NextResponse, type NextRequest } from "next/server";
import { withAuth } from "next-auth/middleware";

// withAuth gates auth-protected routes (existing behaviour).
// We also forward the request pathname as `x-pathname` so server components
// (e.g. the (app) layout's must-change-password guard) can read it reliably.
export default withAuth(
  function middleware(req: NextRequest) {
    const res = NextResponse.next();
    res.headers.set("x-pathname", req.nextUrl.pathname);
    return res;
  },
  { callbacks: { authorized: ({ token }) => !!token } }
);

export const config = {
  // Keep this list to ONLY the routes that previously required middleware-level
  // protection. Other (app) routes (employees, team-compare, etc.) handle auth
  // in the page itself via requireRole — don't add them here or you'll
  // accidentally bounce valid sessions to the sign-in page.
  // /profile is included so the must-change-password layout can read x-pathname.
  matcher: ["/dashboard/:path*", "/assignments/:path*", "/templates/:path*", "/admin/:path*", "/profile/:path*"],
};
