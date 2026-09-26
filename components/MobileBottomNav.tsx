"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Home, Recycle, Trophy, Utensils } from "./AppIcons";

const items = [
  { href: "/", label: "Home", icon: Home },
  { href: "/food", label: "Food", icon: Utensils },
  { href: "/resources", label: "Reuse", icon: Recycle },
  { href: "/events", label: "Events", icon: CalendarDays },
  { href: "/rewards", label: "Rewards", icon: Trophy },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const hide = ["/login", "/register", "/verify-email", "/install", "/messages"].some((route) => pathname.startsWith(route));

  if (hide) return null;

  return (
    <nav
      aria-label="Mobile navigation"
      className="mobile-bottom-nav md:hidden"
    >
      <div className="mobile-nav-inner mx-auto grid h-[4.5rem] max-w-lg grid-cols-5 items-center px-1 pb-[env(safe-area-inset-bottom)]">
        {items.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`mobile-nav-item flex min-h-12 min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[11px] font-medium transition ${
                active
                  ? "text-[#166534]"
                  : "text-[#6B7280] hover:bg-[#F1F8F2] hover:text-[#166534]"
              }`}
            >
              <span
                className={`flex h-8 w-10 items-center justify-center rounded-full ${
                  active ? "bg-[#E8F5E9]" : "bg-transparent"
                }`}
              >
                <Icon size={19} strokeWidth={active ? 2.4 : 2} />
              </span>
              <span className="truncate leading-none">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
