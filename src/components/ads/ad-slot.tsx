"use client";

import React, { useEffect, useRef } from "react";

interface AdSlotProps {
  slotId: string;
  format?: "auto" | "rectangle" | "horizontal";
  responsive?: boolean;
  className?: string;
  label?: string;
}

declare global {
  interface Window {
    adsbygoogle?: any[];
  }
}

/**
 * StoryRemix Clean AdSense Integration Component
 *
 * Guidelines & Invariants:
 * 1. Disabled by default via NEXT_PUBLIC_ADSENSE_ENABLED !== "true".
 * 2. When disabled, zero external requests, zero third-party trackers, zero DOM clutter.
 * 3. Strict CLS prevention: Reserves min-height before script execution.
 * 4. Transparent labeling: Complies with Google AdSense Publisher Terms.
 * 5. Intrusive-free: Never placed inside active voting rounds or interactive forms.
 */
export function AdSlot({
  slotId,
  format = "auto",
  responsive = true,
  className = "",
  label = "ADVERTISEMENT",
}: AdSlotProps) {
  const isEnabled = process.env.NEXT_PUBLIC_ADSENSE_ENABLED === "true";
  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || "";
  const adRef = useRef<HTMLModElement>(null);
  const isPushed = useRef(false);

  useEffect(() => {
    if (!isEnabled || !clientId || isPushed.current) return;

    try {
      if (typeof window !== "undefined") {
        window.adsbygoogle = window.adsbygoogle || [];
        window.adsbygoogle.push({});
        isPushed.current = true;
      }
    } catch (err) {
      // Gracefully catch blocked ad-blocker errors
      console.debug("AdSense script load blocked or unavailable:", err);
    }
  }, [isEnabled, clientId]);

  // When disabled in production/testing, render nothing
  if (!isEnabled || !clientId) {
    return null;
  }

  // Min-height reservations to prevent Cumulative Layout Shift (CLS)
  const minHeightClass =
    format === "horizontal"
      ? "min-h-[90px]"
      : format === "rectangle"
      ? "min-h-[250px]"
      : "min-h-[100px]";

  return (
    <div
      className={`w-full my-6 flex flex-col items-center justify-center overflow-hidden rounded-xl bg-[var(--background)]/40 border border-[var(--border)]/50 p-2 text-center ${minHeightClass} ${className}`}
      aria-label={label}
    >
      <span className="text-[9px] uppercase tracking-wider text-[var(--muted-foreground)]/60 font-mono mb-1 select-none">
        {label}
      </span>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: "block", width: "100%", textAlign: "center" }}
        data-ad-client={clientId}
        data-ad-slot={slotId}
        data-ad-format={format}
        data-full-width-responsive={responsive ? "true" : "false"}
      />
    </div>
  );
}
