"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import type { PublicUser } from "@/lib/types";
import { useDismiss } from "@/lib/useDismiss";
import Avatar from "./Avatar";

interface Props {
  user: PublicUser;
  onLogout: () => void;
}

export default function UserMenu({ user, onLogout }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(ref, open, close);

  const item = "block px-4 py-2 text-sm text-[#1F2937] hover:bg-gray-50";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Account menu"
        className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 hover:bg-[#E8F5E9] sm:pr-3"
      >
        <Avatar name={user.name} url={user.avatarUrl} size={32} />
        <span className="hidden text-sm font-medium text-[#1F2937] sm:inline">🌱 {user.greenPoints}</span>
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-56 max-w-[calc(100vw-1rem)] overflow-hidden rounded-xl border border-[#E8F5E9] bg-white py-1 shadow-lg">
          <div className="border-b border-[#E8F5E9] px-4 py-2.5">
            <p className="truncate text-sm font-semibold text-[#1F2937]">{user.name}</p>
            <p className="truncate text-xs text-[#6B7280]">{user.email}</p>
          </div>
          <Link href="/profile" onClick={close} className={item}>👤 My profile</Link>
          <Link href="/requests" onClick={close} className={item}>🔄 My exchanges</Link>
          <Link href="/dashboard" onClick={close} className={item}>📊 Dashboard</Link>
          <Link href="/settings" onClick={close} className={item}>⚙️ Settings</Link>
          {user.isAdmin && (
            <Link href="/admin" onClick={close} className={item}>🛡️ Admin</Link>
          )}
          <button
            onClick={() => {
              close();
              onLogout();
            }}
            className={`${item} w-full border-t border-[#E8F5E9] text-left text-red-700`}
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
