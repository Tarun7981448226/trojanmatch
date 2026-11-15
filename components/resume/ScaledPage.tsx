"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

// Shows a full 816x1056 resume page shrunk to whatever width its box has.
export function ScaledPage({ children }: { children: ReactNode }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.25);
  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const observer = new ResizeObserver(([entry]) => setScale(entry.contentRect.width / 816));
    observer.observe(box);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={boxRef} className="relative w-full overflow-hidden bg-white" style={{ aspectRatio: "816 / 1056" }}>
      <div className="pointer-events-none absolute left-0 top-0" style={{ width: 816, transform: `scale(${scale})`, transformOrigin: "top left" }}>
        {children}
      </div>
    </div>
  );
}
