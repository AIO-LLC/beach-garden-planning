import type { NextFetchEvent } from "next/server"

import { NextResponse, NextRequest } from "next/server"

const protectedPaths = ["/planning", "/account"]

export function middleware(req: NextRequest, _ev: NextFetchEvent) {
  const { pathname } = req.nextUrl

  if (protectedPaths.some(p => pathname.startsWith(p))) {
    const token = req.cookies.get("auth_token")?.value

    if (!token) {
      const loginUrl = req.nextUrl.clone()

      loginUrl.pathname = "/login"

      return NextResponse.redirect(loginUrl)
    }
    // (Optional) server-side verify JWT here; if invalid, clear cookie and redirect
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/planning", "/account"]
}
