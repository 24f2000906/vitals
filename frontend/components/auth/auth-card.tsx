"use client";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
  float = false,
  leaving = false,
  wide = false,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  float?: boolean;
  leaving?: boolean;
  wide?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 36, scale: 0.97 }}
      animate={leaving ? { opacity: 0, y: -28, scale: 0.96 } : { opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className={wide ? "w-full max-w-2xl" : "w-full max-w-md"}
    >
      <motion.div
        animate={float && !leaving ? { y: [0, -7, 0] } : { y: 0 }}
        transition={float ? { duration: 6, repeat: Infinity, ease: "easeInOut" } : { duration: 0.2 }}
        className="glass rounded-3xl p-7 shadow-xl shadow-black/5 sm:p-9"
      >
        <h1 className="font-display text-3xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
        <div className="mt-7">{children}</div>
      </motion.div>
      {footer && <div className="mt-5 text-center text-sm text-muted-foreground">{footer}</div>}
    </motion.div>
  );
}
