import { NextResponse } from "next/server";

export const unauthorized = (msg = "Please log in first.") => NextResponse.json({ error: msg }, { status: 401 });
export const forbidden = (msg = "You don't have permission to do that.") =>
  NextResponse.json({ error: msg }, { status: 403 });
export const notFound = (msg = "Not found.") => NextResponse.json({ error: msg }, { status: 404 });
export const badRequest = (msg: string) => NextResponse.json({ error: msg }, { status: 400 });
export const conflict = (msg: string) => NextResponse.json({ error: msg }, { status: 409 });
export const serverError = (msg = "Something went wrong. Please try again.") =>
  NextResponse.json({ error: msg }, { status: 500 });

export async function readJson(req: Request): Promise<Record<string, unknown>> {
  const body = await req.json().catch(() => null);
  return body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>) : {};
}

export const isUuid = (v: unknown): v is string =>
  typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

export const str = (v: unknown, max = 500) => (typeof v === "string" ? v.trim().slice(0, max) : "");
