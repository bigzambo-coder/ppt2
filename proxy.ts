import { NextRequest, NextResponse } from "next/server";

// Simple HTTP Basic Auth gate for the public deployment — the app calls paid AI/search
// APIs, so it shouldn't sit open to the internet. Set ACCESS_CODE in the environment to
// enable it; leaving it unset (e.g. local dev) disables the gate entirely.
export function proxy(request: NextRequest) {
  const accessCode = process.env.ACCESS_CODE;
  if (!accessCode) return NextResponse.next();

  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Basic ")) {
    const decoded = atob(auth.slice(6));
    const [, password] = decoded.split(":");
    if (password === accessCode) return NextResponse.next();
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="ppt2"' },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
