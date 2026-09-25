import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth";
import { AVATAR_BUCKET, AVATAR_MAX_BYTES } from "@/lib/constants";
import { badRequest, serverError, unauthorized } from "@/lib/http";
import { toPublicUser } from "@/lib/types";

const TYPES: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };

/** Path inside the bucket from a public URL we generated earlier. */
function storagePathFromUrl(url: string | null): string | null {
  if (!url) return null;
  const marker = `/${AVATAR_BUCKET}/`;
  const i = url.indexOf(marker);
  return i === -1 ? null : decodeURIComponent(url.slice(i + marker.length).split("?")[0]);
}

/** POST multipart/form-data with a `file` field (PNG/JPEG/WebP, max 2 MB). */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return badRequest("Please choose an image.");

  // Trust neither the filename nor the client-declared type blindly: check the type against an
  // allow-list and sniff the file's magic bytes.
  const ext = TYPES[file.type];
  if (!ext) return badRequest("Use a PNG, JPEG or WebP image.");
  if (file.size > AVATAR_MAX_BYTES) return badRequest("Image must be 2 MB or smaller.");

  const bytes = Buffer.from(await file.arrayBuffer());
  const isPng = bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const isJpg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isWebp = bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP";
  if (!(isPng || isJpg || isWebp)) return badRequest("That file doesn't look like a valid image.");

  const path = `${user.id}/${Date.now()}.${ext}`;
  const { error: uploadError } = await supabase.storage.from(AVATAR_BUCKET).upload(path, bytes, {
    contentType: file.type,
    upsert: false,
  });
  if (uploadError) {
    console.error("avatar upload failed:", uploadError);
    return serverError("Could not upload your photo. Has the 'avatars' storage bucket been created?");
  }

  const { data: pub } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
  const { data, error } = await supabase
    .from("users")
    .update({ avatar_url: pub.publicUrl })
    .eq("id", user.id)
    .select("*")
    .single();
  if (error || !data) return serverError("Could not save your photo.");

  const old = storagePathFromUrl(user.avatar_url);
  if (old) await supabase.storage.from(AVATAR_BUCKET).remove([old]);

  return NextResponse.json({ user: toPublicUser(data) });
}

/** DELETE — remove my avatar. */
export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const old = storagePathFromUrl(user.avatar_url);
  const { data, error } = await supabase.from("users").update({ avatar_url: null }).eq("id", user.id).select("*").single();
  if (error || !data) return serverError();
  if (old) await supabase.storage.from(AVATAR_BUCKET).remove([old]);
  return NextResponse.json({ user: toPublicUser(data) });
}
