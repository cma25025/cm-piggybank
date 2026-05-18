"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: string;
  matchPrefix?: string;
}

const ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: "🏠" },
  { href: "/buckets/spend", label: "Buckets", icon: "🪣", matchPrefix: "/buckets" },
  { href: "/activity", label: "Activity", icon: "📋" },
  { href: "/funders", label: "Funders", icon: "👥" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-card border-t border-line-soft flex items-stretch h-16 safe-area-bottom">
      {ITEMS.map((item) => {
        const active = item.matchPrefix
          ? pathname.startsWith(item.matchPrefix)
          : pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-0.5 text-[11px] transition",
              active ? "text-brand-deep" : "text-ink-muted hover:text-ink",
            )}
          >
            <span className="text-lg" aria-hidden>
              {item.icon}
            </span>
            <span className="font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
