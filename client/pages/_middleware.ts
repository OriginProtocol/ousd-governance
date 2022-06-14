import { NextResponse, NextRequest } from "next/server";
import { claimOpenTimestampPassed } from "utils";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // If the claim hasn't started
  if (pathname !== "/claim" && !claimOpenTimestampPassed()) {
    // Redirect everything to /claim
    const claimUrl = req.nextUrl.clone();
    claimUrl.pathname = "/claim";

    return NextResponse.redirect(claimUrl);
  }

  return NextResponse.next();
}
