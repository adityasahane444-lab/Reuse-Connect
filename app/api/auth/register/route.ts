import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { hashPassword } from "@/lib/auth";
import { Role } from "@/lib/types";
import { generateOtp, hashOtp, sendVerificationEmail } from "@/lib/email";

const VALID_ROLES: Role[] = ["student", "teacher", "individual", "organization", "business"];

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const { name, email, password, role } = body ?? {};

  if (!name || !email || !password || !role) {
    return NextResponse.json({ error: "Please fill in all fields." }, { status: 400 });
  }
  if (String(password).length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
  }
  if (!VALID_ROLES.includes(role)) {
    return NextResponse.json({ error: "Invalid role." }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .ilike("email", String(email).trim())
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  const { hash, salt } = hashPassword(password);
  const otp = generateOtp();
  const otpHash = hashOtp(otp);
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  const { data: user, error } = await supabase
    .from("users")
    .insert({
      name: String(name).trim(),
      email: String(email).trim(),
      password_hash: hash,
      password_salt: salt,
      role,
      email_verified: false,
      email_verification_code_hash: otpHash,
      email_verification_expires_at: otpExpires,
      email_verification_sent_at: new Date().toISOString(),
      email_verification_attempts: 0,
    })
    .select()
    .single();

  if (error || !user) {
    console.error("REGISTER ERROR:", error);
    return NextResponse.json(
      { error: error?.message || "Could not create account." },
      { status: 500 }
    );
  }

  const emailResult = await sendVerificationEmail(user.email, user.name, otp);
  if (!emailResult.ok) {
    await supabase.from("users").delete().eq("id", user.id);
    return NextResponse.json({ error: emailResult.error ?? "Could not send verification email." }, { status: 503 });
  }

  return NextResponse.json({ requiresVerification: true, email: user.email });
}
