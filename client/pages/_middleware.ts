import { NextResponse, NextRequest } from "next/server";
import { claimIsOpen } from "utils";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const homeRegEx = /^\/$/;

  // If the claim hasn't started
  if (homeRegEx.test(pathname) && claimIsOpen()) {
    // Redirect everything to /claim
    const claimUrl = req.nextUrl.clone();
    claimUrl.pathname = "/claim";

    return NextResponse.redirect(claimUrl);
  }

  return NextResponse.next();
}
