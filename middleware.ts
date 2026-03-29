export { default } from "next-auth/middleware";

export const config = {
  matcher: ["/quiz/:path*", "/history/:path*", "/stats/:path*", "/dashboard/:path*"],
};