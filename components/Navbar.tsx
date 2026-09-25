"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/useUser";
import { useActivity } from "@/lib/useActivity";
import NotificationBell from "./NotificationBell";
import UserMenu from "./UserMenu";
import InstallAppButton from "./InstallAppButton";

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
      <div className="mx-auto flex min-h-16 w-full max-w-6xl items-center justify-between gap-2 px-3 sm:px-4">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Link
            href="/"
            className="flex min-w-0 shrink items-center gap-1.5 text-base font-bold text-[#2E7D32] sm:gap-2 sm:text-lg"
          >
            <span aria-hidden="true">🌱</span>
            <span className="truncate">Reuse &amp; Connect</span>
          </Link>
          <InstallAppButton />
        </div>

        <nav className="hidden shrink-0 items-center gap-6 text-sm font-medium text-[#1F2937] md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-[#2E7D32]">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-0.5 sm:gap-2">
          {loading ? (
            <div className="h-8 w-12 sm:w-16" />
          ) : user ? (
            <>
              <Link
                href="/messages"
                aria-label={activity.messages > 0 ? `Messages, ${activity.messages} unread` : "Messages"}
                className="relative rounded-full p-1.5 text-lg hover:bg-[#E8F5E9] sm:p-2"
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
              <Link href="/login" className="rounded-full px-2 py-1.5 text-xs font-medium text-[#2E7D32] hover:bg-[#F1F8F2] sm:px-3 sm:text-sm">
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-[#2E7D32] px-2.5 py-1.5 text-xs font-medium text-white hover:bg-[#256428] sm:px-3 sm:text-sm"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
      <nav className="flex w-full items-center gap-5 overflow-x-auto border-t border-[#E8F5E9] px-3 py-2 text-sm font-medium text-[#1F2937] sm:px-4 md:hidden">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="whitespace-nowrap py-0.5 hover:text-[#2E7D32]">
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
