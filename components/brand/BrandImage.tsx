"use client";

import { useEffect, useRef, useState } from "react";

// Shows an image from public/brand/ that Tarun supplies (USC logo, Tommy
// Trojan) and stays invisible until it has really loaded, so a missing file
// never shows a broken-image icon or its alt text. The mount check covers a
// load or error that finished before React hydrated.
export function BrandImage({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  const ref = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth > 0) setLoaded(true);
  }, []);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      src={src}
      alt={loaded ? alt : ""}
      className={className}
      style={loaded ? undefined : { display: "none" }}
      onLoad={() => setLoaded(true)}
    />
  );
}
