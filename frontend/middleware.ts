import type { NextFetchEvent } from "next/server"
import { NextResponse, NextRequest } from "next/server"

const authRequiredPaths = [
  "/planning",
  "/account",
  "/edit-password",
  "/admin-panel"
]
const profileRequiredPaths = [
  "/planning",
  "/account",
  "/edit-password",
  "/admin-panel"
]
const adminRequiredPaths = ["/admin-panel"]

const redirectIfCompletePaths = [
  "/login",
  "/first-login",
  "/password-forgotten",
  "/password-reset",
  "/admin-panel"
]
const redirectIfIncompletePaths = [
  "/account",
  "/edit-password",
  "/login",
  "/password-forgotten",
  "/password-reset",
  "/planning",
  "/admin-panel"
]

interface JwtClaims {
  sub: string
  exp: number
  iat: number
  phone: string
  is_profile_complete: boolean
  is_admin: boolean
}

async function getJwtClaims(req: NextRequest): Promise<JwtClaims | null> {
  try {
    const API_HOST = process.env.NEXT_PUBLIC_API_HOST!
    const API_PORT = process.env.NEXT_PUBLIC_API_PORT
    const API_URL = API_PORT ? `${API_HOST}:${API_PORT}` : API_HOST

    // Forward all cookies from the original request
    const cookieHeader = req.headers.get("cookie")

    const response = await fetch(`${API_URL}/jwt-claims`, {
      method: "GET",
      credentials: "include",
      headers: {
        ...(cookieHeader && { Cookie: cookieHeader })
      }
    })

    if (response.ok) {
      const claims = await response.json()
      return claims as JwtClaims
    }
    const reponse = await response.json()
    console.error(response)
    return null
  } catch (error) {
    console.error("Failed to get JWT claims:", error)
    return null
  }
}

export async function middleware(req: NextRequest, _ev: NextFetchEvent) {
  const { pathname } = req.nextUrl

  // Debug logging
  console.log("Middleware executing for:", pathname)
  console.log("Cookie header:", req.headers.get("cookie"))

  // Use the same method as your navbar
  const claims = await getJwtClaims(req)
  console.log("Claims verified:", !!claims)
  console.log("Claims content:", claims)

  const loggedIn = !!claims
  const complete = !!claims?.is_profile_complete
  const isAdmin = !!claims?.is_admin

  // Check admin routes first
  if (adminRequiredPaths.some(p => pathname.startsWith(p))) {
    if (!loggedIn || !isAdmin) {
      // Redirect non-logged or non-admin users to home page
      const homeUrl = req.nextUrl.clone()
      homeUrl.pathname = "/"
      return NextResponse.redirect(homeUrl)
    }
    // If user is logged in and admin, allow access
    return NextResponse.next()
  }

  // If not logged in, protect authRequiredPaths as before
  if (!loggedIn) {
    if (authRequiredPaths.some(p => pathname.startsWith(p))) {
      const loginUrl = req.nextUrl.clone()
      loginUrl.pathname = "/login"
      return NextResponse.redirect(loginUrl)
    }
    return NextResponse.next()
  }

  // Logged in
  if (loggedIn && complete) {
    // Logged in & complete profile: redirect certain pages to /planning
    if (redirectIfCompletePaths.some(p => pathname === p)) {
      const planningUrl = req.nextUrl.clone()
      planningUrl.pathname = "/planning"
      return NextResponse.redirect(planningUrl)
    }
  } else {
    // Logged in & incomplete profile: redirect certain pages to /first-login
    if (redirectIfIncompletePaths.some(p => pathname === p)) {
      const firstLoginUrl = req.nextUrl.clone()
      firstLoginUrl.pathname = "/first-login"
      return NextResponse.redirect(firstLoginUrl)
    }
    // Also protect planning routes for incomplete profile
    if (profileRequiredPaths.some(p => pathname.startsWith(p))) {
      const firstLoginUrl = req.nextUrl.clone()
      firstLoginUrl.pathname = "/first-login"
      return NextResponse.redirect(firstLoginUrl)
    }
  }

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
