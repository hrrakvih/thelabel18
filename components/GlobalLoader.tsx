"use client";

import { useEffect, useState } from "react";
import { gsap } from "gsap";

export default function GlobalLoader() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const hasLoaded = sessionStorage.getItem("label18_loaded");

    if (hasLoaded) {
      setIsLoading(false);
      return;
    }

    // Set loading duration to exactly 2 seconds
    const timer = setTimeout(() => {
      const el = document.getElementById("global-loader");
      if (!el) {
        setIsLoading(false);
        sessionStorage.setItem("label18_loaded", "true");
        document.body.style.overflow = "";
        return;
      }
      gsap.to(el, {
        opacity: 0,
        duration: 0.35,
        ease: "power2.inOut",
        onComplete: () => {
          setIsLoading(false);
          sessionStorage.setItem("label18_loaded", "true");
          document.body.style.overflow = "";
        },
      });
    }, 2000);

    // Guaranteed safety timeout to ensure website never remains blocked
    const safetyTimer = setTimeout(() => {
      setIsLoading(false);
      sessionStorage.setItem("label18_loaded", "true");
      document.body.style.overflow = "";
    }, 2500);

    return () => {
      clearTimeout(timer);
      clearTimeout(safetyTimer);
      document.body.style.overflow = "";
    };
  }, []);

  if (!isLoading) return null;

  return (
    <>
      <div
        id="global-loader"
        suppressHydrationWarning
        className="fixed inset-0 z-[9999] bg-[#0A0A0A] flex flex-col items-center justify-center pointer-events-auto overflow-hidden text-white selection:bg-[#D4AF37]/30"
      >
        {/* Ambient Gold Halo Glow (Same as Home Page Hero) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] max-w-[600px] max-h-[600px] rounded-full blur-[140px] bg-[#D4AF37]/15" />
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, #D4AF37 1px, transparent 0)`,
              backgroundSize: "28px 28px",
            }}
          />
        </div>

        {/* ONLY LOADING: Dual Concentric Gold Ring Spinner */}
        <div className="relative z-10 w-11 h-11">
          <div className="absolute inset-0 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
          <div
            className="absolute inset-1.5 border-2 border-[#F5E6C8]/60 border-b-transparent rounded-full animate-spin"
            style={{ animationDirection: "reverse", animationDuration: "1.2s" }}
          />
        </div>
      </div>

      {/* Synchronous script to avoid FOUC */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            if (sessionStorage.getItem("label18_loaded")) {
              document.getElementById("global-loader").style.display = "none";
            } else {
              document.body.style.overflow = "hidden";
            }
          `,
        }}
      />
    </>
  );
}
