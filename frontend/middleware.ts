import type { NextFetchEvent } from "next/server"
import { NextResponse, NextRequest } from "next/server"

// Only handle public route redirects, let pages handle their own auth
const publicOnlyPaths = [
  "/login",
  "/first-login",
  "/password-forgotten",
  "/password-reset"
]

export async function middleware(req: NextRequest, _ev: NextFetchEvent) {
  const { pathname } = req.nextUrl

  console.log("Middleware executing for:", pathname)

  // For now, just handle basic redirects
  // Let each page component handle its own authentication

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/planning/:path*",
    "/account",
    "/edit-password",
    "/login",
    "/first-login",
    "/password-forgotten",
    "/password-reset",
    "/admin-panel"
  ]
}
