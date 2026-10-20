"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface BannerItem {
  id: string;
  image_url: string;
  title: string | null;
  subtitle: string | null;
}

interface HeroSliderProps {
  banners: BannerItem[];
  overlayStyle?: React.CSSProperties;
  overlayClass?: string;
  children?: React.ReactNode;
  className?: string;
}

function optimizeUrl(url: string): string {
  if (url.includes("unsplash.com")) {
    const base = url.split("?")[0];
    return `${base}?w=1280&q=60&auto=format&fit=crop&fm=webp`;
  }
  return url;
}

export function HeroSlider({
  banners,
  overlayStyle,
  overlayClass = "",
  children,
  className = "",
}: HeroSliderProps) {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = useCallback((index: number) => {
    setCurrent(index);
  }, []);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % banners.length);
  }, [banners.length]);

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + banners.length) % banners.length);
  }, [banners.length]);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (banners.length > 1) {
      timerRef.current = setInterval(next, 5000);
    }
  }, [next, banners.length]);

  useEffect(() => {
    resetTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [resetTimer]);

  useEffect(() => {
    banners.forEach((banner) => {
      const img = new window.Image();
      img.src = optimizeUrl(banner.image_url);
    });
  }, [banners]);

  if (banners.length === 0) return null;

  const isCleanMode = !children;

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={isCleanMode ? { height: "clamp(300px, 50vw, 600px)" } : undefined}
    >
      {/* Current slide image */}
      <div className="absolute inset-0" style={{ zIndex: 1 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={banners[current].id}
          src={optimizeUrl(banners[current].image_url)}
          alt={banners[current].title ?? "Banner"}
          className="w-full h-full object-cover object-center"
          loading="eager"
          decoding="async"
        />
      </div>

      {/* Overlay */}
      {children && (
        <div
          className={`absolute inset-0 z-[2] ${overlayClass}`}
          style={overlayStyle ?? { background: "rgba(0,0,0,0.55)" }}
        />
      )}

      {/* Content */}
      {children && (
        <div className="relative z-[3] w-full h-full">{children}</div>
      )}

      {/* Prev / Next arrows */}
      {banners.length > 1 && (
        <>
          <button
            onClick={() => { prev(); resetTimer(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-[4] w-11 h-11 rounded-full bg-white/80 hover:bg-white text-gray-800 flex items-center justify-center transition-colors duration-150 shadow-lg"
            aria-label="Previous banner"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            onClick={() => { next(); resetTimer(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-[4] w-11 h-11 rounded-full bg-white/80 hover:bg-white text-gray-800 flex items-center justify-center transition-colors duration-150 shadow-lg"
            aria-label="Next banner"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>

          {/* Dots */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-[4] flex items-center gap-2 bg-black/20 backdrop-blur-sm rounded-full px-3 py-1.5">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => { goTo(index); resetTimer(); }}
                className="rounded-full transition-all duration-200"
                style={{
                  width: index === current ? "24px" : "8px",
                  height: "8px",
                  backgroundColor: index === current ? "white" : "rgba(255,255,255,0.5)",
                }}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
