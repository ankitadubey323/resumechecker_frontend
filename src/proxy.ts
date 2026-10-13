import { NextResponse, type NextRequest } from "next/server";

// Fast redirect for visitors with no session cookie. This only checks that the
// cookie exists; the backend validates the token on every API call.
export function proxy(request: NextRequest) {
  if (!request.cookies.has("access_token")) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/"],
};
