"use client";

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { ShinyButton } from '@/components/ui/shiny-button';
import { ArrowRight } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export default function LandingPage({ onLaunch }: { onLaunch: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // 1. Initialize Lenis for buttery-smooth momentum scrolling
    const lenis = new Lenis({
      duration: 1.4,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1.1,
      touchMultiplier: 1.8,
    });

    // Sync Lenis scroll updates with GSAP ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update);

    const updateLenis = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(updateLenis);
    gsap.ticker.lagSmoothing(0);

    let ctx = gsap.context(() => {
      const video = videoRef.current;
      if (!video) return;

      const initScrollScrub = () => {
        const dur = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 10.0;
        const playhead = { time: 0 };
        let isSeekingFrame = false;
        let pendingTime = 0;

        // GSAP tween for the playhead - scrub: 1.0 creates silky smooth inertia
        gsap.to(playhead, {
          time: dur,
          ease: "none",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top top",
            end: "bottom bottom",
            scrub: 1.0,
          },
          onUpdate: () => {
            pendingTime = playhead.time;
            if (!isSeekingFrame) {
              isSeekingFrame = true;
              requestAnimationFrame(() => {
                if (video && Number.isFinite(pendingTime)) {
                  video.currentTime = pendingTime;
                }
                isSeekingFrame = false;
              });
            }
          }
        });

        // Launch button animation at the end of the scroll
        gsap.fromTo(
          ".launch-btn-container",
          { opacity: 0, scale: 0.85, y: 60, pointerEvents: "none" },
          {
            opacity: 1,
            scale: 1,
            y: 0,
            pointerEvents: "auto",
            ease: "power2.out",
            scrollTrigger: {
              trigger: containerRef.current,
              start: "bottom 135%",
              end: "bottom bottom",
              scrub: 0.8,
            }
          }
        );
      };

      if (video.readyState >= 1 && Number.isFinite(video.duration)) {
        initScrollScrub();
      } else {
        video.addEventListener('loadedmetadata', initScrollScrub, { once: true });
      }
    }, containerRef);

    return () => {
      gsap.ticker.remove(updateLenis);
      lenis.destroy();
      ctx.revert();
    };
  }, []);

  const handleLaunch = () => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    onLaunch();
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full select-none bg-black"
      style={{ height: "650vh" }}
    >
      {/* Sticky Fullscreen Video Player */}
      <div className="sticky top-0 h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-black">
        <video
          ref={videoRef}
          src="/landing.mp4"
          className="w-full h-full object-cover pointer-events-none"
          muted
          playsInline
          preload="auto"
          autoPlay={false}
        />

        {/* Launch Website Button Overlay */}
        <div className="absolute bottom-12 md:bottom-16 w-full flex flex-col items-center justify-center launch-btn-container z-30">
          <ShinyButton
            onClick={handleLaunch}
            size="md"
            className="shadow-[0_8px_30px_0_rgba(2,132,199,0.35)]"
          >
            <span>Launch Forensic Suite</span>
            <ArrowRight className="w-3.5 h-3.5 opacity-80 group-hover:translate-x-0.5 transition-transform duration-200" />
          </ShinyButton>
        </div>
      </div>
    </div>
  );
}
