"use client";

import Link from "next/link";
import { useState, type ComponentProps } from "react";

// Prefetches only once the link is hovered. Next's default prefetches every link
// as it scrolls into view, and each of those requests can run a Vercel function.
export default function HoverPrefetchLink({
  onMouseEnter,
  ...props
}: ComponentProps<typeof Link>) {
  const [active, setActive] = useState(false);

  return (
    <Link
      {...props}
      prefetch={active ? null : false}
      onMouseEnter={(e) => {
        setActive(true);
        onMouseEnter?.(e);
      }}
    />
  );
}
