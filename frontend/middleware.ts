import type { NextFetchEvent } from "next/server"

import { NextResponse, NextRequest } from "next/server"
import { jwtVerify } from "jose"

const authRequiredPaths = ["/planning", "/account", "/edit-password"]
const profileRequiredPaths = ["/planning", "/account", "/edit-password"]

const redirectIfCompletePaths = [
  "/login",
  "/first-login",
  "/password-forgotten",
  "/password-reset"
]
const redirectIfIncompletePaths = [
  "/account",
  "/edit-password",
  "/login",
  "/password-forgotten",
  "/password-reset",
  "/planning"
]

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET

  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not defined")
  }

  return new TextEncoder().encode(secret)
}

interface JwtClaims {
  sub: string
  exp: number
  iat: number
  phone: string
  is_profile_complete: boolean
}

async function verifyJwt(token: string): Promise<JwtClaims | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret())

    return payload as JwtClaims
  } catch (error) {
    console.error("JWT verification failed:", error)

    return null
  }
}

export async function middleware(req: NextRequest, _ev: NextFetchEvent) {
  const { pathname } = req.nextUrl

  const token = req.cookies.get("auth_token")?.value
  const claims = token ? await verifyJwt(token) : null
  const loggedIn = !!claims
  const complete = !!claims?.is_profile_complete

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
    "/password-reset"
  ]
}
