import type { NextFetchEvent } from "next/server"
import { NextResponse, NextRequest } from "next/server"
import { jwtVerify } from "jose"

const protectedPaths = ["/planning", "/account", "/edit-password"]
const authRequiredPaths = ["/planning", "/account", "/edit-password"]
const profileRequiredPaths = ["/planning", "/account", "/edit-password"]

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
  
  // Check if the current path requires authentication
  const requiresAuth = authRequiredPaths.some(p => pathname.startsWith(p))
  
  if (requiresAuth) {
    const token = req.cookies.get("auth_token")?.value
    
    // Not logged in (no JWT)
    if (!token) {
      const loginUrl = req.nextUrl.clone()
      loginUrl.pathname = "/login"
      return NextResponse.redirect(loginUrl)
    }
    
    // Verify the JWT and check profile completion
    const claims = await verifyJwt(token)
    
    if (!claims) {
      // Invalid or expired JWT - redirect to login
      const loginUrl = req.nextUrl.clone()
      loginUrl.pathname = "/login"
      return NextResponse.redirect(loginUrl)
    }
    
    // Logged in but incomplete profile
    const requiresProfile = profileRequiredPaths.some(p => pathname.startsWith(p))
    
    if (requiresProfile && !claims.is_profile_complete) {
      const firstLoginUrl = req.nextUrl.clone()
      firstLoginUrl.pathname = "/first-login"
      return NextResponse.redirect(firstLoginUrl)
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ["/planning/:path*", "/account", "/edit-password"]
}
