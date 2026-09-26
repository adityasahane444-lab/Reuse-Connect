import { supabase } from "@/lib/supabase";
import { randomUUID } from "crypto";

export const POST_IMAGE_BUCKET = "post-images";
export const POST_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

const TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export type ListingImageKind = "food" | "resource" | "event";

export async function validateAndReadImage(file: File | null): Promise<{ bytes: Buffer; ext: string } | null> {
  if (!file || file.size === 0) return null;
  const ext = TYPES[file.type];
  if (!ext) throw new Error("Use a JPG, PNG or WebP image.");
  if (file.size > POST_IMAGE_MAX_BYTES) throw new Error("Image must be 5 MB or smaller.");

  const bytes = Buffer.from(await file.arrayBuffer());
  const isPng = bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const isJpg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isWebp = bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP";
  if (!(isPng || isJpg || isWebp)) throw new Error("That file doesn't look like a valid image.");

  return { bytes, ext };
}

export async function uploadListingImage(userId: string, kind: ListingImageKind, file: File | null) {
  const checked = await validateAndReadImage(file);
  if (!checked) return null;

  const path = `${userId}/${kind}/${randomUUID()}.${checked.ext}`;
  const { error } = await supabase.storage.from(POST_IMAGE_BUCKET).upload(path, checked.bytes, {
    contentType: file?.type,
    upsert: false,
    cacheControl: "31536000",
  });
  if (error) {
    console.error("listing image upload failed:", error);
    throw new Error("Could not upload the image. Please try again.");
  }

  const { data } = supabase.storage.from(POST_IMAGE_BUCKET).getPublicUrl(path);
  return { publicUrl: data.publicUrl, path };
}

export function storagePathFromPostImageUrl(url: string | null): string | null {
  if (!url) return null;
  const marker = `/${POST_IMAGE_BUCKET}/`;
  const i = url.indexOf(marker);
  return i === -1 ? null : decodeURIComponent(url.slice(i + marker.length).split("?")[0]);
}

export async function removeListingImage(url: string | null) {
  const path = storagePathFromPostImageUrl(url);
  if (path) await supabase.storage.from(POST_IMAGE_BUCKET).remove([path]);
}

export async function parseListingRequest(req: Request) {
  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const body: Record<string, string> = {};
    for (const [key, value] of form.entries()) {
      if (typeof value === "string") body[key] = value;
    }
    const raw = form.get("image");
    const image = raw instanceof File && raw.size > 0 ? raw : null;
    return { body, image };
  }
  const body = await req.json().catch(() => ({}));
  return { body: (body && typeof body === "object" ? body : {}) as Record<string, unknown>, image: null as File | null };
}
