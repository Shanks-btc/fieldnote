"use client";

import { useEffect, useRef, useState } from "react";

/** Fires once, the first time the element is at least `threshold` visible. Disconnects afterwards. */
export function useInView<T extends Element>(threshold = 0.3) {
  const ref = useRef<T | null>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;

    // No IntersectionObserver (very old browsers): show everything.
    if (!("IntersectionObserver" in window)) {
      setSeen(true);
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [seen, threshold]);

  return [ref, seen] as const;
}
