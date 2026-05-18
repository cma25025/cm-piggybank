"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { COMING_SOON } from "@/lib/coming-soon-manifest";

const MAIN_NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "●" },
  { href: "/buckets/spend", label: "Buckets", icon: "○", matchPrefix: "/buckets" },
  { href: "/activity", label: "Activity", icon: "○" },
  { href: "/funders", label: "Funders", icon: "○" },
];

const SETUP_NAV = [{ href: "/settings", label: "Settings", icon: "○" }];

const COMING_SOON_ITEMS = Object.values(COMING_SOON);

interface SidebarProps {
  kidName: string | null;
  kidAvatarEmoji: string | null;
  caretakerEmail: string | null;
}

export function Sidebar({ kidName, kidAvatarEmoji, caretakerEmail }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string, matchPrefix?: string) => {
    if (matchPrefix) return pathname.startsWith(matchPrefix);
    return pathname === href;
  };

  return (
    <aside className="hidden md:flex md:flex-col md:w-60 bg-card border-r border-line-soft p-4 gap-1">
      <Link href="/dashboard" className="flex items-center gap-2 px-2 pb-6">
        <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center text-lg">
          🐷
        </div>
        <span className="font-display font-bold text-xl text-brand-deep tracking-tight">
          Piggybank
        </span>
      </Link>

      <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted px-2 pt-2 pb-1">
        Manage
      </div>
      {MAIN_NAV.map((item) => (
        <NavLink
          key={item.href}
          href={item.href}
          label={item.label}
          icon={item.icon}
          active={isActive(item.href, item.matchPrefix)}
        />
      ))}

      <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted px-2 pt-4 pb-1">
        Setup
      </div>
      {SETUP_NAV.map((item) => (
        <NavLink
          key={item.href}
          href={item.href}
          label={item.label}
          icon={item.icon}
          active={isActive(item.href)}
        />
      ))}

      <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted px-2 pt-4 pb-1">
        Coming soon
      </div>
      {COMING_SOON_ITEMS.map((item) => (
        <NavLink
          key={item.slug}
          href={`/coming-soon/${item.slug}`}
          label={item.label}
          icon={item.emoji}
          comingSoon
          active={pathname === `/coming-soon/${item.slug}`}
        />
      ))}

      {kidName ? (
        <div className="mt-auto rounded-xl bg-line-soft p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-brand text-white flex items-center justify-center text-lg">
            {kidAvatarEmoji ?? "🐷"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold truncate">{kidName}</div>
            <div className="text-[11px] text-ink-muted truncate">
              {caretakerEmail ?? ""}
            </div>
          </div>
        </div>
      ) : null}
    </aside>
  );
}

function NavLink({
  href,
  label,
  icon,
  active,
  comingSoon,
}: {
  href: string;
  label: string;
  icon: string;
  active: boolean;
  comingSoon?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-2 py-2 rounded-lg text-sm font-medium transition",
        active
          ? "bg-brand-soft text-brand-deep"
          : "text-ink hover:bg-line-soft",
        comingSoon && "text-ink-muted",
      )}
    >
      <span className="w-5 text-center opacity-70" aria-hidden>
        {icon}
      </span>
      <span className="flex-1">{label}</span>
      {comingSoon ? (
        <span className="text-[10px] uppercase tracking-wide bg-line-soft text-ink-muted px-1.5 py-0.5 rounded">
          soon
        </span>
      ) : null}
    </Link>
  );
}
