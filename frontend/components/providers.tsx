"use client";
import { MotionConfig } from "framer-motion";
import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";
import { AmbientBackground } from "./ambient-background";
import { AuthProvider } from "./auth-provider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <MotionConfig reducedMotion="user">
        <AuthProvider>
          <AmbientBackground />
          {children}
        </AuthProvider>
      </MotionConfig>
    </ThemeProvider>
  );
}
