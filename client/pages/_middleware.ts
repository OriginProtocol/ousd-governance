import { NextResponse, NextRequest } from "next/server";
//import { claimIsOpen } from "utils";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const homeRegEx = /^\/$/;

  // until we unlock proposals just redirect all homepage traffic to claim
  if (homeRegEx.test(pathname)) {
    // Redirect everything to /claim
    const claimUrl = req.nextUrl.clone();
    claimUrl.pathname = "/claim";

    return NextResponse.redirect(claimUrl);
  }

  return NextResponse.next();
}
