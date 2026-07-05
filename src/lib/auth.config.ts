import type { NextAuthConfig } from "next-auth"

export const authConfig = {
  pages: {
    signIn: "/auth/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard") ||
        nextUrl.pathname.startsWith("/medicines") ||
        nextUrl.pathname.startsWith("/assistant") ||
        nextUrl.pathname.startsWith("/guardian") ||
        nextUrl.pathname.startsWith("/doctor") ||
        nextUrl.pathname.startsWith("/emergency") ||
        nextUrl.pathname.startsWith("/hospitals") ||
        nextUrl.pathname.startsWith("/records") ||
        nextUrl.pathname.startsWith("/appointments") ||
        nextUrl.pathname.startsWith("/profile") ||
        nextUrl.pathname.startsWith("/prescriptions") ||
        nextUrl.pathname.startsWith("/sos")

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
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as { role?: string }).role || "PATIENT"
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
  },
  providers: [],
} satisfies NextAuthConfig
