import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { generateOtp, hashOtp, sendVerificationEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email) return NextResponse.json({ error: "Email is required." }, { status: 400 });

  const { data: user } = await supabase.from("users").select("id, name, email, email_verified, email_verification_sent_at").ilike("email", email).maybeSingle();
  if (!user) return NextResponse.json({ error: "No account found for this email." }, { status: 404 });
  if (user.email_verified) return NextResponse.json({ error: "This email is already verified." }, { status: 400 });

  if (user.email_verification_sent_at && Date.now() - new Date(user.email_verification_sent_at).getTime() < 60_000) {
    return NextResponse.json({ error: "Please wait 60 seconds before requesting another code." }, { status: 429 });
  }

  const otp = generateOtp();
  const { error } = await supabase.from("users").update({
    email_verification_code_hash: hashOtp(otp),
    email_verification_expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    email_verification_sent_at: new Date().toISOString(),
    email_verification_attempts: 0,
  }).eq("id", user.id);
  if (error) return NextResponse.json({ error: "Could not create a new verification code." }, { status: 500 });

  const sent = await sendVerificationEmail(user.email, user.name, otp);
  if (!sent.ok) return NextResponse.json({ error: sent.error ?? "Could not send verification email." }, { status: 503 });
  return NextResponse.json({ ok: true });
}
