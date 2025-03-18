import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import createClient from "@/lib/supabase/server";

const SESSION_COOKIE_NAME = "sb-access-token";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 1 week

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const redirectTo = request.nextUrl.clone();
  const redirectUrl = searchParams.get("redirectUrl");
  const response = NextResponse.redirect(redirectTo);

  try {
    // Add debug logging
    console.log('Received OTP verification request with params:', searchParams.toString());

    const token_hash = searchParams.get("token_hash");
    const type = searchParams.get("type") as EmailOtpType;
    const next = searchParams.get("next") ?? "/you";

    // Validate required parameters with better error messages
    if (!token_hash) {
      throw new Error("Missing verification token");
    }
    if (!type) {
      throw new Error("Missing verification type");
    }

    // Verify OTP with additional email parameter
    const supabase = await createClient();
    const { data, error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (error || !data.session) {
      throw error || new Error("OTP verification failed");
    }

    // Set secure session cookie
    const response = NextResponse.redirect(
      redirectUrl ? decodeURIComponent(redirectUrl) : next
    );

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: data.session.access_token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: SESSION_MAX_AGE,
      path: "/",
      sameSite: "lax",
    });

    return response;

  } catch (error) {
    console.error("OTP verification error:", error);
    
    // Sanitize redirect URL
    redirectTo.pathname = "/login";
    redirectTo.searchParams.set(
      "message", 
      error instanceof Error ? error.message : "authentication-error"
    );
    
    // Clear any existing session cookie
    response.cookies.delete(SESSION_COOKIE_NAME);
    
    return NextResponse.redirect(redirectTo);
  }
}