import type { NextFetchEvent } from "next/server"
import { NextResponse, NextRequest } from "next/server"
import { jwtVerify, type JWTPayload } from "jose"

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
  "admin-panel"
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

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET

  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not defined")
  }

  return new TextEncoder().encode(secret)
}

interface JwtClaims extends JWTPayload {
  sub: string
  exp: number
  iat: number
  phone: string
  is_profile_complete: boolean
  is_admin: boolean
}

// Type guard function for runtime validation
function isJwtClaims(payload: JWTPayload): payload is JwtClaims {
  return (
    typeof payload.sub === "string" &&
    typeof payload.exp === "number" &&
    typeof payload.iat === "number" &&
    typeof payload.phone === "string" &&
    typeof payload.is_profile_complete === "boolean" &&
    typeof payload.is_admin === "boolean"
  )
}

async function verifyJwt(token: string): Promise<JwtClaims | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret())

    if (isJwtClaims(payload)) {
      return payload
    } else {
      console.error("JWT payload missing expected custom claims")
      return null
    }
  } catch (error) {
    console.error("JWT verification failed:", error)

    return null
  }
}

export async function middleware(req: NextRequest, _ev: NextFetchEvent) {
  const { pathname } = req.nextUrl

  // Debug logging
  console.log("Middleware executing for:", pathname)
  console.log("JWT_SECRET available:", !!process.env.JWT_SECRET)
  console.log("Cookie header:", req.headers.get("cookie"))

  const token = req.cookies.get("auth_token")?.value
  console.log("Token found:", !!token)
  console.log("Token value (first 20 chars):", token?.substring(0, 20))

  const claims = token ? await verifyJwt(token) : null
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
