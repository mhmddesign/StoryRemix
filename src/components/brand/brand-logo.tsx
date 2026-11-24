import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}

export function BrandLogo({ className, showText = true, size = "md" }: BrandLogoProps) {
  const iconSizes = {
    sm: "w-7 h-7",
    md: "w-9 h-9",
    lg: "w-12 h-12",
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  };

  return (
    <Link href="/" className={cn("flex items-center gap-2.5 group select-none", className)}>
      <div
        className={cn(
          iconSizes[size],
          "rounded-xl bg-gradient-to-br from-amber-500/15 via-amber-700/15 to-amber-950/20 border border-amber-600/30 flex items-center justify-center p-1.5 shadow-sm group-hover:scale-105 group-hover:border-amber-500/50 transition-all duration-200"
        )}
      >
        <svg viewBox="0 0 512 512" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="bl-gold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="50%" stopColor="#d97706" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>
            <linearGradient id="bl-accent" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#92400e" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
          </defs>
          {/* Left Vane */}
          <path
            d="M 256 96 C 202 140 152 195 152 265 C 152 305 182 335 226 365 C 242 345 238 285 256 220 Z"
            fill="url(#bl-accent)"
          />
          {/* Right Vane */}
          <path
            d="M 256 96 C 310 130 360 180 360 250 C 360 290 330 320 286 350 C 270 330 274 270 256 220 Z"
            fill="url(#bl-gold)"
          />
          {/* Center Spine */}
          <line x1="256" y1="90" x2="256" y2="380" stroke="#fffbeb" strokeWidth="12" strokeLinecap="round" />
          {/* Golden Nib */}
          <path d="M 256 376 L 274 402 L 262 440 L 256 452 L 250 440 L 238 402 Z" fill="#f59e0b" stroke="#fde68a" strokeWidth="4" />
          <circle cx="256" cy="402" r="6" fill="#1c1917" />
          <line x1="256" y1="402" x2="256" y2="442" stroke="#1c1917" strokeWidth="4" strokeLinecap="round" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className={cn("font-serif font-bold tracking-tight text-[var(--foreground)]", textSizes[size])}>
            Story<span className="text-amber-800 dark:text-amber-400">Remix</span>
          </span>
          <span className="text-[10px] text-[var(--muted-foreground)] tracking-wider uppercase font-medium -mt-0.5">
            Collaborative Fiction
          </span>
        </div>
      )}
    </Link>
  );
}
