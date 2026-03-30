import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: ["/quiz/:path*", "/history/:path*", "/stats/:path*", "/dashboard/:path*"],
};