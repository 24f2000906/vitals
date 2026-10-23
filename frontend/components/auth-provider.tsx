"use client";
import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, tokenStore } from "@/lib/api";
import type { TokenPair, User } from "@/lib/types";

type Status = "loading" | "authed" | "anon";

interface AuthContextValue {
  user: User | null;
  status: Status;
  signIn: (email: string, password: string) => Promise<User>;
  startSession: (pair: TokenPair) => void;
  signOut: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    if (!tokenStore.get()) {
      setStatus("anon");
      return;
    }
    api
      .me()
      .then((u) => {
        setUser(u);
        setStatus("authed");
      })
      .catch(() => {
        tokenStore.clear();
        setStatus("anon");
      });
  }, []);

  const startSession = useCallback((pair: TokenPair) => {
    tokenStore.set(pair);
    setUser(pair.user);
    setStatus("authed");
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const pair = await api.login({ email, password });
      startSession(pair);
      return pair.user;
    },
    [startSession],
  );

  const signOut = useCallback(() => {
    tokenStore.clear();
    setUser(null);
    setStatus("anon");
    router.replace("/auth/signin");
  }, [router]);

  const refreshUser = useCallback(async () => {
    try {
      const u = await api.me();
      setUser(u);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(
    () => ({ user, status, signIn, startSession, signOut, refreshUser }),
    [user, status, signIn, startSession, signOut, refreshUser],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
