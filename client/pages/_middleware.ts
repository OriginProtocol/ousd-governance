import { NextResponse, NextRequest } from "next/server";
import { claimIsOpen } from "utils";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const regEx = /\.(.*)$/;
  const hasExtension = regEx.test(pathname);

  // If the claim hasn't started
  if (!hasExtension && pathname !== "/claim" && claimIsOpen()) {
    // Redirect everything to /claim
    const claimUrl = req.nextUrl.clone();
    claimUrl.pathname = "/claim";

    return NextResponse.redirect(claimUrl);
  }

  return NextResponse.next();
}
