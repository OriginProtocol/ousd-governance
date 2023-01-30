import { NextResponse, NextRequest } from "next/server";
import { governanceEnabled } from "utils";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const homeRegEx = /^\/$/;

  // until we unlock proposals just redirect all homepage traffic to claim
  if (homeRegEx.test(pathname) && !governanceEnabled()) {
    // Redirect everything to /claim
    const claimUrl = req.nextUrl.clone();
    claimUrl.pathname = "/claim";

    return NextResponse.redirect(claimUrl);
  }

  return NextResponse.next();
}
