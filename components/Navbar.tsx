"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/useUser";
import { useActivity } from "@/lib/useActivity";
import NotificationBell from "./NotificationBell";
import UserMenu from "./UserMenu";
import InstallAppButton from "./InstallAppButton";
import MobileBottomNav from "./MobileBottomNav";
import { MessageCircle } from "./AppIcons";

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
    <>
      <header className="sticky top-0 z-40 border-b border-[#E5EFE7] bg-white/95 backdrop-blur-xl supports-[backdrop-filter]:bg-white/80">
        <div className="navbar-inner mx-auto flex min-h-[4rem] w-full max-w-6xl items-center gap-2 px-3 sm:px-4">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Link
              href="/"
              className="brand-link group flex min-w-0 shrink items-center gap-2 rounded-xl py-1.5 text-base font-bold tracking-tight text-[#166534] outline-none transition hover:text-[#14532D] focus-visible:ring-2 focus-visible:ring-[#2E7D32] sm:gap-2.5 sm:text-lg"
              aria-label="Reuse & Connect home"
            >
              <span className="brand-mark flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#E8F5E9] text-lg shadow-sm transition group-hover:scale-105 sm:h-10 sm:w-10">
                🌱
              </span>
              <span className="truncate">Reuse &amp; Connect</span>
            </Link>
            <div className="mobile-install-slot"><InstallAppButton /></div>
          </div>

          <nav className="hidden shrink-0 items-center gap-6 text-sm font-medium text-[#1F2937] md:flex">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="transition hover:text-[#2E7D32]"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
            {loading ? (
              <div className="h-9 w-16 animate-pulse rounded-full bg-gray-100 sm:w-20" />
            ) : user ? (
              <>
                <Link
                  href="/messages"
                  aria-label={activity.messages > 0 ? `Messages, ${activity.messages} unread` : "Messages"}
                  className="relative flex h-10 w-10 items-center justify-center rounded-xl text-[#4B5563] transition hover:bg-[#F1F8F2] hover:text-[#166534]"
                >
                  <MessageCircle size={20} strokeWidth={2} />
                  {activity.messages > 0 && (
                    <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-bold text-white ring-2 ring-white">
                      {activity.messages > 9 ? "9+" : activity.messages}
                    </span>
                  )}
                </Link>
                <NotificationBell unread={activity.notifications} />
                <UserMenu user={user} onLogout={logout} />
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-xl px-2.5 py-2 text-xs font-semibold text-[#166534] transition hover:bg-[#F1F8F2] sm:px-3 sm:text-sm"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="rounded-xl bg-[#166534] px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#14532D] sm:px-3.5 sm:text-sm"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>

        <nav className="hidden w-full items-center gap-1 overflow-x-auto border-t border-[#E8F5E9] px-3 py-1.5 text-sm font-medium text-[#1F2937] sm:px-4 md:hidden">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="whitespace-nowrap rounded-lg px-3 py-2 hover:bg-[#F1F8F2] hover:text-[#166534]"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </header>
      <MobileBottomNav />
    </>
  );
}
