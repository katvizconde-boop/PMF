export { default } from "next-auth/middleware";
export const config = {
  matcher: ["/dashboard/:path*", "/assignments/:path*", "/templates/:path*", "/admin/:path*"],
};
