import type { NextAuthConfig } from "next-auth"

const protectedPaths = [
  "/dashboard", "/medicines", "/assistant", "/guardian", "/doctor",
  "/emergency", "/hospitals", "/records", "/appointments", "/profile",
  "/prescriptions", "/sos", "/interactions", "/lifestyle",
]

export const authConfig = {
  pages: {
    signIn: "/auth/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnDashboard = protectedPaths.some(p => nextUrl.pathname.startsWith(p))
      const isOnAuth = nextUrl.pathname.startsWith("/auth")

      if (isOnDashboard) {
        if (isLoggedIn) return true
        return false
      }

      if (isOnAuth) {
        if (isLoggedIn) {
          return Response.redirect(new URL("/dashboard", nextUrl))
        }
        return true
      }

      return true
    },
  },
  providers: [],
} satisfies NextAuthConfig
