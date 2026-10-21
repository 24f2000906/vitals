"use client";
import { motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const dark = mounted && resolvedTheme === "dark";
  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label="Dark mode"
      onClick={() => setTheme(dark ? "light" : "dark")}
      className="relative flex h-8 w-14 items-center rounded-full border border-border bg-muted px-1 transition-colors"
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 500, damping: 32 }}
        className="grid size-6 place-items-center rounded-full bg-primary text-primary-foreground shadow"
        style={{ marginLeft: dark ? "auto" : 0 }}
      >
        {dark ? <Moon className="size-3.5" /> : <Sun className="size-3.5" />}
      </motion.span>
    </button>
  );
}
