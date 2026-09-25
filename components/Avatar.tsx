/* eslint-disable @next/next/no-img-element -- avatars come from Supabase Storage; the host isn't known at build time */

interface AvatarProps {
  name: string;
  url?: string | null;
  size?: number;
  className?: string;
}

export default function Avatar({ name, url, size = 40, className = "" }: AvatarProps) {
  const initial = (name.trim()[0] ?? "?").toUpperCase();
  const style = { width: size, height: size, fontSize: Math.max(12, Math.round(size * 0.4)) };

  if (url) {
    return (
      <img
        src={url}
        alt={`${name}'s profile photo`}
        style={style}
        className={`shrink-0 rounded-full object-cover ${className}`}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      style={style}
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-[#E8F5E9] font-semibold text-[#2E7D32] ${className}`}
    >
      {initial}
    </span>
  );
}
