"use client";
import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";

/** Interactive background: a grid revealed around the cursor, a soft spot-glow and two parallax blobs. */
export function AmbientBackground() {
  const reduce = useReducedMotion();
  const mx = useMotionValue(-600);
  const my = useMotionValue(-600);
  const sx = useSpring(mx, { stiffness: 120, damping: 20, mass: 0.4 });
  const sy = useSpring(my, { stiffness: 120, damping: 20, mass: 0.4 });

  useEffect(() => {
    if (reduce) return;
    const move = (e: PointerEvent) => {
      mx.set(e.clientX);
      my.set(e.clientY);
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, [reduce, mx, my]);

  const mask = useMotionTemplate`radial-gradient(280px circle at ${sx}px ${sy}px, #000 0%, transparent 100%)`;
  const glowX = useTransform(sx, (v) => v - 280);
  const glowY = useTransform(sy, (v) => v - 280);
  const blobAX = useTransform(sx, [0, 1920], [-28, 28]);
  const blobAY = useTransform(sy, [0, 1080], [-20, 20]);
  const blobBX = useTransform(sx, [0, 1920], [34, -34]);
  const blobBY = useTransform(sy, [0, 1080], [24, -24]);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <motion.div
        style={{ x: blobAX, y: blobAY, background: "var(--accent)" }}
        className="absolute -left-40 -top-40 size-[30rem] rounded-full opacity-30 blur-3xl dark:opacity-15"
      />
      <motion.div
        style={{ x: blobBX, y: blobBY, background: "var(--primary)" }}
        className="absolute -bottom-48 -right-32 size-[34rem] rounded-full opacity-15 blur-3xl dark:opacity-10"
      />
      {!reduce && (
        <>
          <motion.div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(var(--grid) 1px, transparent 1px), linear-gradient(90deg, var(--grid) 1px, transparent 1px)",
              backgroundSize: "44px 44px",
              WebkitMaskImage: mask,
              maskImage: mask,
            }}
          />
          <motion.div
            className="absolute left-0 top-0 size-[35rem] rounded-full"
            style={{
              x: glowX,
              y: glowY,
              background: "radial-gradient(closest-side, color-mix(in oklab, var(--accent) 24%, transparent), transparent)",
            }}
          />
        </>
      )}
    </div>
  );
}
