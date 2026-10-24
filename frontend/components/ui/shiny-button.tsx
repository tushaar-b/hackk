"use client"

import type React from "react"

export interface ShinyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
  className?: string
  size?: "sm" | "md" | "lg"
  shape?: "rounded" | "pill"
  variant?: "primary" | "brand" | "emerald" | "outline" | "danger"
  fullWidth?: boolean
  disabled?: boolean
  type?: "button" | "submit" | "reset"
}

export function ShinyButton({
  children,
  onClick,
  className = "",
  size = "md",
  shape = "rounded",
  variant = "brand",
  fullWidth = false,
  disabled = false,
  type = "button",
  ...props
}: ShinyButtonProps) {
  return (
    <>
      <style jsx>{`
        @property --gradient-angle {
          syntax: "<angle>";
          initial-value: 0deg;
          inherits: false;
        }

        @property --gradient-angle-offset {
          syntax: "<angle>";
          initial-value: 0deg;
          inherits: false;
        }

        @property --gradient-percent {
          syntax: "<percentage>";
          initial-value: 5%;
          inherits: false;
        }

        @property --gradient-shine {
          syntax: "<color>";
          initial-value: rgba(255, 255, 255, 0.9);
          inherits: false;
        }

        .shiny-cta {
          --animation: gradient-angle linear infinite;
          --duration: 3.5s;
          --shadow-size: 2px;
          --transition: 400ms cubic-bezier(0.25, 1, 0.5, 1);
          
          isolation: isolate;
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          cursor: pointer;
          font-family: var(--font-inter), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          font-weight: 600;
          border: 1px solid transparent;
          color: var(--shiny-cta-fg);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          background: 
            linear-gradient(var(--shiny-cta-bg), var(--shiny-cta-bg)) padding-box,
            conic-gradient(
              from calc(var(--gradient-angle) - var(--gradient-angle-offset)),
              transparent,
              var(--shiny-cta-highlight) var(--gradient-percent),
              var(--gradient-shine) calc(var(--gradient-percent) * 2),
              var(--shiny-cta-highlight) calc(var(--gradient-percent) * 3),
              transparent calc(var(--gradient-percent) * 4)
            ) border-box;
          box-shadow: 
            var(--shiny-cta-glow),
            0 2px 6px -1px rgba(0, 0, 0, 0.2),
            inset 0 1px 1px rgba(255, 255, 255, 0.18),
            inset 0 0 0 1px var(--shiny-cta-bg-subtle);
          transition: var(--transition);
          transition-property: --gradient-angle-offset, --gradient-percent, --gradient-shine, box-shadow, transform, opacity;
        }

        /* Shapes */
        .shiny-cta.shape-rounded {
          border-radius: 0.625rem;
        }

        .shiny-cta.shape-pill {
          border-radius: 9999px;
        }

        /* Color Variants */
        .shiny-cta.variant-brand {
          --shiny-cta-bg: #1B729E;
          --shiny-cta-bg-subtle: rgba(56, 189, 248, 0.3);
          --shiny-cta-fg: #ffffff;
          --shiny-cta-highlight: #38bdf8;
          --shiny-cta-highlight-subtle: #bae6fd;
          --shiny-cta-glow: 0 4px 18px -2px rgba(27, 114, 158, 0.45);
        }

        .shiny-cta.variant-primary {
          --shiny-cta-bg: rgba(8, 15, 30, 0.88);
          --shiny-cta-bg-subtle: rgba(56, 189, 248, 0.25);
          --shiny-cta-fg: #f8fafc;
          --shiny-cta-highlight: #0284c7;
          --shiny-cta-highlight-subtle: #38bdf8;
          --shiny-cta-glow: 0 6px 24px -3px rgba(2, 132, 199, 0.4);
        }

        .shiny-cta.variant-emerald {
          --shiny-cta-bg: #059669;
          --shiny-cta-bg-subtle: rgba(110, 231, 183, 0.35);
          --shiny-cta-fg: #ffffff;
          --shiny-cta-highlight: #34d399;
          --shiny-cta-highlight-subtle: #a7f3d0;
          --shiny-cta-glow: 0 4px 18px -2px rgba(5, 150, 105, 0.45);
        }

        .shiny-cta.variant-outline {
          --shiny-cta-bg: #ffffff;
          --shiny-cta-bg-subtle: #e2e8f0;
          --shiny-cta-fg: #334155;
          --shiny-cta-highlight: #94a3b8;
          --shiny-cta-highlight-subtle: #cbd5e1;
          --shiny-cta-glow: 0 2px 8px -1px rgba(0, 0, 0, 0.06);
        }

        .shiny-cta.variant-danger {
          --shiny-cta-bg: #dc2626;
          --shiny-cta-bg-subtle: rgba(252, 165, 165, 0.35);
          --shiny-cta-fg: #ffffff;
          --shiny-cta-highlight: #f87171;
          --shiny-cta-highlight-subtle: #fecaca;
          --shiny-cta-glow: 0 4px 18px -2px rgba(220, 38, 38, 0.4);
        }

        /* Size Variants */
        .shiny-cta.size-sm {
          padding: 0.45rem 1rem;
          font-size: 0.75rem;
          gap: 0.4rem;
        }

        .shiny-cta.size-md {
          padding: 0.65rem 1.45rem;
          font-size: 0.8125rem;
          gap: 0.5rem;
        }

        .shiny-cta.size-lg {
          padding: 0.85rem 2rem;
          font-size: 0.9375rem;
          gap: 0.6rem;
        }

        /* Full width */
        .shiny-cta.is-full {
          width: 100%;
        }

        .shiny-cta::before,
        .shiny-cta::after,
        .shiny-cta span::before {
          content: "";
          pointer-events: none;
          position: absolute;
          inset-inline-start: 50%;
          inset-block-start: 50%;
          translate: -50% -50%;
          z-index: -1;
        }

        .shiny-cta:not(:disabled):active {
          transform: scale(0.98) translateY(1px);
        }

        /* Ambient Micro-dots pattern */
        .shiny-cta::before {
          --size: calc(100% - var(--shadow-size) * 3);
          --position: 2px;
          --space: calc(var(--position) * 2);
          width: var(--size);
          height: var(--size);
          background: radial-gradient(
            circle at var(--position) var(--position),
            rgba(255, 255, 255, 0.5) calc(var(--position) / 4),
            transparent 0
          ) padding-box;
          background-size: var(--space) var(--space);
          background-repeat: space;
          mask-image: conic-gradient(
            from calc(var(--gradient-angle) + 45deg),
            black,
            transparent 10% 90%,
            black
          );
          border-radius: inherit;
          opacity: 0.2;
          z-index: -1;
        }

        /* Inner shimmer sweep */
        .shiny-cta::after {
          --animation: shimmer linear infinite;
          width: 100%;
          aspect-ratio: 1;
          background: linear-gradient(
            -50deg,
            transparent,
            var(--shiny-cta-highlight),
            transparent
          );
          mask-image: radial-gradient(circle at bottom, transparent 40%, black);
          opacity: 0.45;
        }

        .shiny-cta .shiny-content {
          position: relative;
          z-index: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: inherit;
        }

        .shiny-cta .shiny-content::before {
          content: "";
          position: absolute;
          --size: calc(100% + 1rem);
          width: var(--size);
          height: var(--size);
          box-shadow: inset 0 -1ex 1.5rem 2px var(--shiny-cta-highlight);
          opacity: 0;
          transition: opacity var(--transition);
          animation: calc(var(--duration) * 1.5) breathe linear infinite;
        }

        /* Animation states */
        .shiny-cta:not(:disabled),
        .shiny-cta:not(:disabled)::before,
        .shiny-cta:not(:disabled)::after {
          animation: var(--animation) var(--duration),
            var(--animation) calc(var(--duration) / 0.4) reverse paused;
          animation-composition: add;
        }

        .shiny-cta:not(:disabled):is(:hover, :focus-visible) {
          --gradient-percent: 22%;
          --gradient-angle-offset: 95deg;
          --gradient-shine: var(--shiny-cta-highlight-subtle);
          box-shadow: 
            var(--shiny-cta-glow),
            0 0 16px 2px var(--shiny-cta-highlight-subtle),
            inset 0 1px 1px rgba(255, 255, 255, 0.3),
            inset 0 0 0 1px var(--shiny-cta-highlight);
          transform: translateY(-1px);
        }

        .shiny-cta:not(:disabled):is(:hover, :focus-visible),
        .shiny-cta:not(:disabled):is(:hover, :focus-visible)::before,
        .shiny-cta:not(:disabled):is(:hover, :focus-visible)::after {
          animation-play-state: running;
        }

        .shiny-cta:not(:disabled):is(:hover, :focus-visible) .shiny-content::before {
          opacity: 1;
        }

        /* Disabled state */
        .shiny-cta:disabled {
          opacity: 0.45;
          cursor: not-allowed;
          filter: grayscale(0.2);
          box-shadow: none;
        }

        @keyframes gradient-angle {
          to {
            --gradient-angle: 360deg;
          }
        }

        @keyframes shimmer {
          to {
            rotate: 360deg;
          }
        }

        @keyframes breathe {
          from, to {
            scale: 1;
          }
          50% {
            scale: 1.15;
          }
        }
      `}</style>

      <button
        type={type}
        disabled={disabled}
        onClick={onClick}
        className={`shiny-cta shape-${shape} variant-${variant} size-${size} ${fullWidth ? 'is-full' : ''} ${className}`}
        {...props}
      >
        <span className="shiny-content">{children}</span>
      </button>
    </>
  )
}
