import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { SPIN, TILT } from "./layout";

const p3d: CSSProperties = { transformStyle: "preserve-3d" };

/** A point on the floor (x, y) lifted by z. Children are laid out in floor space. */
export function Anchor({ x, y, z = 0, children, className }: { x: number; y: number; z?: number; children: ReactNode; className?: string }) {
  return (
    <div className={cn("absolute left-0 top-0", className)} style={{ ...p3d, transform: `translate3d(${x}px, ${y}px, ${z}px)` }}>
      {children}
    </div>
  );
}

/** Stands upright on its anchor point and always faces the camera (sprite). */
export function Billboard({
  x,
  y,
  z = 0,
  children,
  className,
  style,
}: {
  x: number;
  y: number;
  z?: number;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <Anchor x={x} y={y} z={z}>
      <div
        className={cn("absolute bottom-0 left-0", className)}
        style={{
          transformOrigin: "50% 100%",
          transform: `translateX(-50%) rotateZ(${-SPIN}deg) rotateX(${-TILT}deg)`,
          ...style,
        }}
      >
        {children}
      </div>
    </Anchor>
  );
}

/** A solid box sitting on the floor. Only the camera-facing faces are drawn. */
export function Box3D({
  x,
  y,
  z = 0,
  w,
  d,
  h,
  top,
  front,
  side,
  className,
  children,
}: {
  x: number;
  y: number;
  z?: number;
  w: number;
  d: number;
  h: number;
  top: string;
  front: string;
  side: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div className={cn("absolute", className)} style={{ ...p3d, left: x, top: y, width: w, height: d, transform: `translateZ(${z}px)` }}>
      <div className="absolute inset-0" style={{ background: top, transform: `translateZ(${h}px)`, ...p3d }}>
        {children}
      </div>
      <div className="absolute left-0" style={{ top: d - h, width: w, height: h, background: front, transformOrigin: "bottom", transform: "rotateX(-90deg)" }} />
      <div className="absolute top-0" style={{ left: -h, width: h, height: d, background: side, transformOrigin: "right", transform: "rotateY(90deg)" }} />
    </div>
  );
}

/** Back wall standing on the y=0 edge of its parent. Content is upright and readable. */
export function BackWall({ width, height, className, children, style }: { width: number; height: number; className?: string; children?: ReactNode; style?: CSSProperties }) {
  return (
    <div
      className={cn("absolute left-0", className)}
      style={{ top: -height, width, height, transformOrigin: "bottom", transform: "rotateX(-90deg)", ...p3d, ...style }}
    >
      {children}
    </div>
  );
}

/** Side wall standing on the x=offset edge. Children get an upright, readable box of `depth × height`. */
export function SideWall({ offset, depth, height, className, children, style }: { offset: number; depth: number; height: number; className?: string; children?: ReactNode; style?: CSSProperties }) {
  return (
    <div
      className={cn("absolute top-0", className)}
      style={{ left: offset, width: height, height: depth, transformOrigin: "left", transform: "rotateY(-90deg)", ...p3d, ...style }}
    >
      <div className="absolute left-0 top-0" style={{ width: depth, height, transformOrigin: "0 0", transform: `translateX(${height}px) rotate(90deg)` }}>
        {children}
      </div>
    </div>
  );
}

/** The thick edge under a raised floor (front + left faces hanging down). */
export function PlatformEdge({ width, depth, thickness, front, side }: { width: number; depth: number; thickness: number; front: string; side: string }) {
  return (
    <>
      <div className="absolute left-0" style={{ top: depth, width, height: thickness, background: front, transformOrigin: "top", transform: "rotateX(-90deg)" }} />
      <div className="absolute top-0" style={{ left: 0, width: thickness, height: depth, background: side, transformOrigin: "left", transform: "rotateY(90deg)" }} />
    </>
  );
}
