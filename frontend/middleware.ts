import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname === "/confirm") {
    const hasLoginFlag = request.cookies.get("loginAttempt")?.value === "true"

    if (!hasLoginFlag) {
      return NextResponse.redirect(new URL("/login", request.url))
    }

    const response = NextResponse.next()

    response.cookies.set({
      name: "loginAttempt",
      value: "",
      maxAge: 0,
      path: "/"
    })

    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/confirm"]
}
