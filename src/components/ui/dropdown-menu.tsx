"use client";

import * as React from "react";
import * as DropdownPrimitive from "@radix-ui/react-dropdown-menu";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const DropdownMenu = DropdownPrimitive.Root;
export const DropdownMenuTrigger = DropdownPrimitive.Trigger;
export const DropdownMenuSub = DropdownPrimitive.Sub;

const contentClass =
  "z-[80] min-w-[200px] overflow-hidden rounded-xl border border-white/10 bg-[#16161f]/95 p-1 text-sm shadow-2xl backdrop-blur-xl animate-pop-in";

export const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownPrimitive.Content>
>(({ className, sideOffset = 6, ...props }, ref) => (
  <DropdownPrimitive.Portal>
    <DropdownPrimitive.Content ref={ref} sideOffset={sideOffset} className={cn(contentClass, className)} {...props} />
  </DropdownPrimitive.Portal>
));
DropdownMenuContent.displayName = "DropdownMenuContent";

const itemClass =
  "relative flex cursor-pointer select-none items-center gap-2 rounded-lg px-2 py-1.5 outline-none transition-colors data-[highlighted]:bg-white/[0.08] data-[disabled]:pointer-events-none data-[disabled]:opacity-40 [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted";

export const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownPrimitive.Item> & { destructive?: boolean }
>(({ className, destructive, ...props }, ref) => (
  <DropdownPrimitive.Item
    ref={ref}
    className={cn(
      itemClass,
      destructive && "text-red-400 data-[highlighted]:bg-red-500/10 [&_svg]:text-red-400",
      className,
    )}
    {...props}
  />
));
DropdownMenuItem.displayName = "DropdownMenuItem";

export const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownPrimitive.SubTrigger>
>(({ className, children, ...props }, ref) => (
  <DropdownPrimitive.SubTrigger ref={ref} className={cn(itemClass, "data-[state=open]:bg-white/[0.08]", className)} {...props}>
    {children}
    <ChevronRight className="ml-auto" />
  </DropdownPrimitive.SubTrigger>
));
DropdownMenuSubTrigger.displayName = "DropdownMenuSubTrigger";

export const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <DropdownPrimitive.Portal>
    <DropdownPrimitive.SubContent ref={ref} className={cn(contentClass, "min-w-0", className)} {...props} />
  </DropdownPrimitive.Portal>
));
DropdownMenuSubContent.displayName = "DropdownMenuSubContent";

export function DropdownMenuSeparator({ className }: { className?: string }) {
  return <DropdownPrimitive.Separator className={cn("my-1 h-px bg-white/[0.08]", className)} />;
}

export function DropdownMenuLabel({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <DropdownPrimitive.Label
      className={cn("px-2 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted", className)}
      {...props}
    />
  );
}

export function DropdownMenuShortcut({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn("ml-auto pl-4 text-[11px] text-muted", className)} {...props} />;
}
