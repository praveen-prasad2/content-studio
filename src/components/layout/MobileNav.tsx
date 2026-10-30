"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { isActive, NAV_ITEMS } from "./nav";

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Main navigation"
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-white/[0.08] bg-[#0d0d14]/90 px-2 pb-[max(env(safe-area-inset-bottom),6px)] pt-1.5 backdrop-blur-xl md:hidden"
    >
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 text-[10px] font-medium transition-colors",
              active ? "text-foreground" : "text-muted",
            )}
          >
            <Icon className={cn("h-5 w-5", active && "text-accent")} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
