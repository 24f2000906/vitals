"use client";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

/** Scroll-in: slides up and scales softly with spring physics. */
export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ type: "spring", stiffness: 100, damping: 20, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
