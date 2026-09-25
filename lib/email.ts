import crypto from "crypto";

const MAILJET_SEND_API = "https://api.mailjet.com/v3.1/send";

export function generateOtp() {
  return crypto.randomInt(100000, 1000000).toString();
}

export function hashOtp(otp: string) {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

export async function sendVerificationEmail(to: string, name: string, otp: string) {
  const apiKey = process.env.MAILJET_API_KEY;
  const secretKey = process.env.MAILJET_SECRET_KEY;
  const fromEmail = process.env.MAILJET_FROM_EMAIL;
  const fromName = process.env.MAILJET_FROM_NAME || "Reuse & Connect";

  if (!apiKey || !secretKey || !fromEmail) {
    if (process.env.NODE_ENV !== "production" && process.env.DEV_LOG_OTP === "true") {
      console.log(`[Reuse-Connect] Verification OTP for ${to}: ${otp}`);
      return { ok: true };
    }
    return { ok: false, error: "Email service is not configured." };
  }

  const auth = Buffer.from(`${apiKey}:${secretKey}`).toString("base64");

  try {
    const res = await fetch(MAILJET_SEND_API, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        Messages: [
          {
            From: {
              Email: fromEmail,
              Name: fromName,
            },
            To: [
              {
                Email: to,
                Name: name,
              },
            ],
            Subject: "Verify your Reuse & Connect account",
            TextPart: `Hi ${name},\n\nYour Reuse & Connect verification code is ${otp}.\n\nThis code expires in 10 minutes. If you did not create this account, you can ignore this email.`,
            HTMLPart: `
              <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:24px;color:#1f2937">
                <h2 style="color:#2e7d32">🌱 Reuse &amp; Connect</h2>
                <p>Hi ${escapeHtml(name)},</p>
                <p>Use the verification code below to verify your email address:</p>
                <div style="font-size:32px;font-weight:700;letter-spacing:8px;background:#e8f5e9;padding:18px;text-align:center;border-radius:12px;color:#256428">${otp}</div>
                <p style="margin-top:20px">This code expires in <strong>10 minutes</strong>. If you did not create this account, you can ignore this email.</p>
              </div>`,
          },
        ],
      }),
    });

    if (!res.ok) {
      const responseText = await res.text().catch(() => "");
      console.error("Mailjet email error:", responseText);
      return { ok: false, error: "Could not send verification email." };
    }

    return { ok: true };
  } catch (error) {
    console.error("Mailjet email request failed:", error);
    return { ok: false, error: "Could not send verification email." };
  }
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[ch] ?? ch);
}
