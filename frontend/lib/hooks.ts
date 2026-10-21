"use client";
import { useEffect, useState } from "react";
import { z } from "zod";
import { api } from "./api";

export type Availability = "idle" | "checking" | "available" | "taken";

/** Debounced "is this email free?" check for the signup form. */
export function useEmailAvailability(email: string): Availability {
  const [state, setState] = useState<Availability>("idle");
  useEffect(() => {
    if (!z.string().email().safeParse(email).success) {
      setState("idle");
      return;
    }
    setState("checking");
    const ctrl = new AbortController();
    const timer = setTimeout(() => {
      api
        .emailAvailable(email, ctrl.signal)
        .then((r) => setState(r.available ? "available" : "taken"))
        .catch((e) => e?.name !== "AbortError" && setState("idle"));
    }, 450);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [email]);
  return state;
}
