"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Focus, Hand, Minus, Plus } from "lucide-react";

type Area = { id: string; title: string; accentColor: string };
export const ROOM_WIDTH = 1860;
export const areaPosition = (index: number) => ({ x: 120 + (index % 3) * 560, y: 180 + Math.floor(index / 3) * 650 });

export function StudioRoom({ areas, children }: { areas: Area[]; children: ReactNode }) {
  const viewport = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: number; x: number; y: number; left: number; top: number } | null>(null);
  const anchor = useRef<{ x: number; y: number } | null>(null);
  const [zoom, setZoom] = useState(0.7);
  const [panning, setPanning] = useState(false);
  const [bounds, setBounds] = useState({ left: 0, top: 0, width: 0, height: 0 });
  const height = Math.max(1, Math.ceil(areas.length / 3)) * 650 + 300;

  const measure = () => {
    const el = viewport.current;
    if (el) setBounds({ left: el.scrollLeft, top: el.scrollTop, width: el.clientWidth, height: el.clientHeight });
  };
  useEffect(() => {
    const el = viewport.current;
    if (!el) return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    measure();
    return () => observer.disconnect();
  }, []);
  useLayoutEffect(() => {
    const el = viewport.current;
    if (el && anchor.current) {
      el.scrollLeft = anchor.current.x * zoom - el.clientWidth / 2;
      el.scrollTop = anchor.current.y * zoom - el.clientHeight / 2;
      anchor.current = null;
    }
    measure();
  }, [zoom, height]);

  const changeZoom = (value: number) => {
    const el = viewport.current;
    if (!el) return;
    anchor.current = { x: (el.scrollLeft + el.clientWidth / 2) / zoom, y: (el.scrollTop + el.clientHeight / 2) / zoom };
    setZoom(Math.min(1.2, Math.max(0.3, value)));
  };
  const visit = (index: number) => {
    const el = viewport.current;
    if (!el) return;
    const position = areaPosition(index);
    el.scrollTo({ left: (position.x + 240) * zoom - el.clientWidth / 2, top: (position.y + 280) * zoom - el.clientHeight / 2, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  };
  const endPan = () => { drag.current = null; setPanning(false); };

  return <div className="room-explorer">
    <div className="room-navigation">
      <span className="room-pan-hint"><Hand size={14} />Drag the floor to explore</span>
      <nav aria-label="Jump to team area" className="room-area-links">{areas.map((area, i) => <button key={area.id} onClick={() => visit(i)}><i style={{ background: area.accentColor }} />{area.title}</button>)}</nav>
      <div className="room-zoom"><button onClick={() => changeZoom(zoom - 0.1)} disabled={zoom <= 0.3} aria-label="Zoom out"><Minus size={14} /></button><output aria-label="Room zoom">{Math.round(zoom * 100)}%</output><button onClick={() => changeZoom(zoom + 0.1)} disabled={zoom >= 1.2} aria-label="Zoom in"><Plus size={14} /></button><button onClick={() => { const el = viewport.current; if (el) { anchor.current = { x: ROOM_WIDTH / 2, y: height / 2 }; setZoom(Math.min(1.2, el.clientWidth / ROOM_WIDTH, el.clientHeight / height)); el.scrollTo(0, 0); } }} aria-label="Show whole room" title="Show whole room"><Focus size={15} /></button></div>
    </div>
    <div className="room-viewport-wrap">
      <div ref={viewport} className="room-viewport scrollbar-thin" data-panning={panning} tabIndex={0} role="region" aria-label="Creative studio room. Drag empty floor, scroll, or use arrow keys to explore."
        onScroll={measure}
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget) return;
          const offsets: Record<string, [number, number]> = { ArrowLeft: [-100, 0], ArrowRight: [100, 0], ArrowUp: [0, -100], ArrowDown: [0, 100] };
          const offset = offsets[event.key];
          if (offset) { event.preventDefault(); event.currentTarget.scrollBy(offset[0], offset[1]); }
        }}
        onPointerDown={(event) => {
          if (event.pointerType === "touch" || event.button !== 0 || (event.target as Element).closest("button,a,input,select,textarea,[role='menuitem']")) return;
          const el = event.currentTarget;
          drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, left: el.scrollLeft, top: el.scrollTop };
          el.setPointerCapture(event.pointerId);
          setPanning(true);
          event.preventDefault();
          el.focus({ preventScroll: true });
        }}
        onPointerMove={(event) => { const start = drag.current; if (!start || start.id !== event.pointerId) return; event.currentTarget.scrollLeft = start.left - (event.clientX - start.x); event.currentTarget.scrollTop = start.top - (event.clientY - start.y); }}
        onPointerUp={(event) => { if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); endPan(); }}
        onPointerCancel={endPan} onLostPointerCapture={endPan}>
        <div className="room-scaled-bounds" style={{ width: ROOM_WIDTH * zoom, height: height * zoom }}>
          <div className="room-scene" style={{ width: ROOM_WIDTH, height, transform: `scale(${zoom})` }}>
            <div className="room-back-wall" aria-hidden="true"><span>CONTENT STUDIO<span>CREATIVE OPERATIONS / FLOOR 01</span></span><i /><i /><i /><i /></div>
            <div className="room-side-wall" aria-hidden="true" />
            <div className="room-corridor" aria-hidden="true"><span>CREATIVE AVENUE</span><i className="room-energy" /></div>
            <div className="room-lounge" aria-hidden="true"><div className="room-sofa" /><div className="room-coffee-table" /><span>THE IDEA LOUNGE</span></div>
            <div className="room-plant room-plant-one" aria-hidden="true">✦</div><div className="room-plant room-plant-two" aria-hidden="true">✦</div>
            {children}
            <div className="room-entry" aria-hidden="true">WELCOME TO YOUR CREATIVE FLOOR <span>↓</span></div>
          </div>
        </div>
      </div>
      <div className="room-minimap" aria-label="Room map"><span>FLOOR 01</span><div className="room-map-plan" style={{ aspectRatio: `${ROOM_WIDTH} / ${height}` }}>
        {areas.map((area, index) => { const p = areaPosition(index); return <button key={area.id} aria-label={`Go to ${area.title} area`} title={area.title} onClick={() => visit(index)} style={{ left: `${p.x / ROOM_WIDTH * 100}%`, top: `${p.y / height * 100}%`, width: `${480 / ROOM_WIDTH * 100}%`, height: `${550 / height * 100}%`, background: area.accentColor }} />; })}
        <div className="room-map-camera" style={{ left: `${bounds.left / zoom / ROOM_WIDTH * 100}%`, top: `${bounds.top / zoom / height * 100}%`, width: `${Math.min(100, bounds.width / zoom / ROOM_WIDTH * 100)}%`, height: `${Math.min(100, bounds.height / zoom / height * 100)}%` }} />
      </div></div>
    </div>
    <p className="room-instructions">Drag to pan · Scroll or swipe in any direction · Use the map to jump between teams</p>
  </div>;
}

