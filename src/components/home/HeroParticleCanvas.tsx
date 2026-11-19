import React, { useEffect, useRef } from "react";
import { useUserPreferences } from "../../context/UserPreferencesContext";
import { ACCENT_THEMES } from "../../utils/userPreferences";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
}

export function HeroParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { prefs, particleSpeed, isReducedMotion } = useUserPreferences();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId = 0;
    let width = 0;
    let height = 0;
    const mouse = { x: -9999, y: -9999, active: false };

    const accentTheme = ACCENT_THEMES[prefs.accent];
    const [r, g, b] = accentTheme.cssVars["--accent-rgb"].split(" ").map(Number);
    const [r2, g2, b2] = accentTheme.cssVars["--accent-secondary-rgb"]
      .split(" ")
      .map(Number);
    const isDark = prefs.mode === "dark";

    const resize = () => {
      const parent = canvas.parentElement;
      width = parent ? parent.clientWidth : window.innerWidth;
      height = parent ? parent.clientHeight : 640;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();

    const count = Math.min(48, Math.max(22, Math.floor((width * height) / 26000)));
    const particles: Particle[] = Array.from({ length: count }, (_, idx) => {
      const angle = (idx * 2.39996) % (Math.PI * 2);
      const speed = 0.25 + (idx % 5) * 0.1;
      return {
        x: ((idx * 137.5) % 100) * 0.01 * width,
        y: ((idx * 73.1) % 100) * 0.01 * height,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 1.4 + (idx % 3) * 0.65,
        alpha: isDark ? 0.35 + (idx % 4) * 0.12 : 0.25 + (idx % 4) * 0.1,
      };
    });

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (x >= 0 && y >= 0 && x <= rect.width && y <= rect.height) {
        mouse.x = x;
        mouse.y = y;
        mouse.active = true;
      } else {
        mouse.active = false;
      }
    };

    const handleMouseLeave = () => {
      mouse.active = false;
    };

    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mouseleave", handleMouseLeave);

    const drawFrame = (animate: boolean) => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (animate && particleSpeed > 0) {
          p.x += p.vx * particleSpeed;
          p.y += p.vy * particleSpeed;

          if (mouse.active) {
            const dx = mouse.x - p.x;
            const dy = mouse.y - p.y;
            const distSq = dx * dx + dy * dy;
            if (distSq < 28000 && distSq > 16) {
              const dist = Math.sqrt(distSq);
              const force = ((170 - dist) / 170) * 0.65 * particleSpeed;
              p.x += (dx / dist) * force;
              p.y += (dy / dist) * force;
            }
          }

          if (p.x < -10) p.x = width + 10;
          if (p.x > width + 10) p.x = -10;
          if (p.y < -10) p.y = height + 10;
          if (p.y > height + 10) p.y = -10;
        }

        // Connect nearby particles
        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const dx = p.x - q.x;
          const dy = p.y - q.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 135) {
            const lineAlpha = (1 - dist / 135) * (isDark ? 0.22 : 0.16);
            ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${lineAlpha.toFixed(3)})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
          }
        }

        // Connect to mouse pointer
        if (mouse.active) {
          const mdx = p.x - mouse.x;
          const mdy = p.y - mouse.y;
          const mdist = Math.hypot(mdx, mdy);
          if (mdist < 165) {
            const alpha = (1 - mdist / 165) * (isDark ? 0.42 : 0.28);
            ctx.strokeStyle = `rgba(${r2}, ${g2}, ${b2}, ${alpha.toFixed(3)})`;
            ctx.lineWidth = 1.15;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();
          }
        }

        ctx.fillStyle = `rgba(${i % 2 === 0 ? r : r2}, ${i % 2 === 0 ? g : g2}, ${i % 2 === 0 ? b : b2}, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (isReducedMotion || prefersReduced || particleSpeed === 0) {
      drawFrame(false);
    } else {
      const loop = () => {
        drawFrame(true);
        animId = window.requestAnimationFrame(loop);
      };
      animId = window.requestAnimationFrame(loop);
    }

    return () => {
      if (animId) window.cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [prefs.accent, prefs.mode, particleSpeed, isReducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}
