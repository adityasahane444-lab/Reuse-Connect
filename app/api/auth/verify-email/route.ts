import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { createSession } from "@/lib/auth";
import { hashOtp } from "@/lib/email";
import { toPublicUser } from "@/lib/types";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const otp = typeof body?.otp === "string" ? body.otp.trim() : "";
  if (!email || !/^\d{6}$/.test(otp)) {
    return NextResponse.json({ error: "Enter the 6-digit verification code." }, { status: 400 });
  }

  const { data: user } = await supabase.from("users").select("*").ilike("email", email).maybeSingle();
  if (!user) return NextResponse.json({ error: "Verification request not found." }, { status: 404 });
  if (user.email_verified) {
    return NextResponse.json({ alreadyVerified: true });
  }

  if ((user.email_verification_attempts ?? 0) >= 5) {
    return NextResponse.json({ error: "Too many incorrect attempts. Request a new code." }, { status: 429 });
  }
  if (!user.email_verification_code_hash || !user.email_verification_expires_at || new Date(user.email_verification_expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: "This code has expired. Request a new code." }, { status: 410 });
  }

  if (hashOtp(otp) !== user.email_verification_code_hash) {
    await supabase.from("users").update({ email_verification_attempts: (user.email_verification_attempts ?? 0) + 1 }).eq("id", user.id);
    return NextResponse.json({ error: "Incorrect verification code." }, { status: 400 });
  }

  const { data: updated, error } = await supabase.from("users").update({
    email_verified: true,
    email_verification_code_hash: null,
    email_verification_expires_at: null,
    email_verification_sent_at: null,
    email_verification_attempts: 0,
  }).eq("id", user.id).select().single();
  if (error || !updated) return NextResponse.json({ error: "Could not verify your email." }, { status: 500 });

  await createSession(user.id);
  return NextResponse.json({ user: toPublicUser(updated) });
}
