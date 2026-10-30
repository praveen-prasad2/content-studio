import { CalendarDays, Camera, ChartLine, Clapperboard, Settings, Workflow, type LucideIcon } from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon };

export const NAV_ITEMS: NavItem[] = [
  { href: "/workspace", label: "Workspace", icon: Workflow },
  { href: "/reels", label: "Reels", icon: Clapperboard },
  { href: "/instagram", label: "Instagram", icon: Camera },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/analytics", label: "Analytics", icon: ChartLine },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
