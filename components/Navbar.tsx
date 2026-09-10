"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/useUser";

const links = [
  { href: "/food", label: "Food" },
  { href: "/resources", label: "Resources" },
  { href: "/events", label: "Events" },
  { href: "/rewards", label: "Rewards" },
];

export default function Navbar() {
  const { user, loading, refresh } = useUser();
  const router = useRouter();

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

        <div className="flex items-center gap-3">
          {loading ? (
            <div className="h-8 w-16" />
          ) : user ? (
            <>
              <Link
                href="/dashboard"
                className="hidden text-sm font-medium text-[#1F2937] hover:text-[#2E7D32] sm:inline"
              >
                🌱 {user.greenPoints} · {user.name}
              </Link>
              <Link
                href="/dashboard"
                className="text-sm font-medium text-[#1F2937] hover:text-[#2E7D32] sm:hidden"
              >
                👤
              </Link>
              <button
                onClick={logout}
                className="rounded-md border border-[#2E7D32] px-3 py-1.5 text-sm text-[#2E7D32] hover:bg-[#E8F5E9]"
              >
                Logout
              </button>
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
