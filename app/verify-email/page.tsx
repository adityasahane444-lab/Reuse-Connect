"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/lib/useUser";

export default function VerifyEmailPage() {
  const [email, setEmail] = useState("");
  useEffect(() => { setEmail(new URLSearchParams(window.location.search).get("email") ?? ""); }, []);
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const router = useRouter();
  const { refresh } = useUser();

  async function verify(e: FormEvent) {
    e.preventDefault(); setError(""); setMessage(""); setLoading(true);
    const res = await fetch("/api/auth/verify-email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, otp }) });
    const data = await res.json().catch(() => ({})); setLoading(false);
    if (!res.ok) { setError(data.error ?? "Verification failed."); return; }
    await refresh(); router.push("/dashboard"); router.refresh();
  }

  async function resend() {
    setError(""); setMessage(""); setResending(true);
    const res = await fetch("/api/auth/resend-verification", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
    const data = await res.json().catch(() => ({})); setResending(false);
    if (!res.ok) { setError(data.error ?? "Could not resend the code."); return; }
    setMessage("A new verification code has been sent.");
  }

  return <main className="flex flex-1 items-center justify-center bg-green-50 px-6 py-16"><div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">
    <div className="text-center"><Link href="/" className="text-2xl font-bold text-green-700">🌱 Reuse &amp; Connect</Link><h1 className="mt-8 text-3xl font-bold text-gray-900">Verify your email</h1><p className="mt-2 text-gray-600">Enter the 6-digit code sent to your email.</p></div>
    {error && <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
    {message && <p className="mt-6 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">{message}</p>}
    <form onSubmit={verify} className="mt-8 space-y-5">
      <input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-green-500" />
      <input inputMode="numeric" autoComplete="one-time-code" required maxLength={6} pattern="[0-9]{6}" value={otp} onChange={e=>setOtp(e.target.value.replace(/\D/g, "").slice(0,6))} placeholder="6-digit OTP" className="w-full rounded-xl border border-gray-300 px-4 py-3 text-center text-xl tracking-[0.5em] outline-none focus:border-green-500" />
      <button disabled={loading} className="w-full rounded-xl bg-green-600 py-3 font-semibold text-white hover:bg-green-700 disabled:opacity-60">{loading ? "Verifying..." : "Verify Email"}</button>
    </form>
    <button onClick={resend} disabled={resending || !email} className="mt-4 w-full rounded-xl border border-green-600 py-3 font-semibold text-green-700 hover:bg-green-50 disabled:opacity-60">{resending ? "Sending..." : "Resend code"}</button>
    <p className="mt-6 text-center text-sm text-gray-600"><Link href="/login" className="font-semibold text-green-600 hover:underline">Back to login</Link></p>
  </div></main>;
}
