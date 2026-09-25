"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/useUser";
import { useActivity } from "@/lib/useActivity";
import NotificationBell from "./NotificationBell";
import UserMenu from "./UserMenu";

const links = [
  { href: "/food", label: "Food" },
  { href: "/resources", label: "Resources" },
  { href: "/events", label: "Events" },
  { href: "/rewards", label: "Rewards" },
];

export default function Navbar() {
  const { user, loading, refresh } = useUser();
  const router = useRouter();
  const activity = useActivity(Boolean(user));

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    await refresh();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-20 border-b border-[#E8F5E9] bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold text-[#2E7D32]">
          🌱 Reuse &amp; Connect
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-[#1F2937] md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-[#2E7D32]">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          {loading ? (
            <div className="h-8 w-16" />
          ) : user ? (
            <>
              <Link
                href="/messages"
                aria-label={activity.messages > 0 ? `Messages, ${activity.messages} unread` : "Messages"}
                className="relative rounded-full p-2 text-lg hover:bg-[#E8F5E9]"
              >
                💬
                {activity.messages > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                    {activity.messages > 9 ? "9+" : activity.messages}
                  </span>
                )}
              </Link>
              <NotificationBell unread={activity.notifications} />
              <UserMenu user={user} onLogout={logout} />
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-[#2E7D32]">
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-[#2E7D32] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#256428]"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
      <nav className="flex items-center gap-4 overflow-x-auto border-t border-[#E8F5E9] px-4 py-2 text-sm font-medium text-[#1F2937] md:hidden">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="whitespace-nowrap hover:text-[#2E7D32]">
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
