"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { sortHistory } from "@/lib/profile";
import type { HistoryInput } from "@/lib/schemas";
import type { HistoryEntry } from "@/lib/types";

/** Loads every history entry once and exposes the ones for the selected person (null = account holder). */
export function useHistory(memberId: number | null) {
  const [all, setAll] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .listHistory()
      .then(setAll)
      .catch((e) => setError(e instanceof Error ? e.message : "Couldn't load medical history"))
      .finally(() => setLoading(false));
  }, []);

  const entries = useMemo(() => all.filter((e) => e.member_id === memberId).sort(sortHistory), [all, memberId]);

  const add = useCallback(
    async (input: HistoryInput) => {
      const created = await api.addHistory(memberId, input);
      setAll((prev) => [created, ...prev]);
    },
    [memberId],
  );

  const remove = useCallback(async (id: number) => {
    await api.deleteHistory(id);
    setAll((prev) => prev.filter((e) => e.id !== id));
  }, []);

  return { entries, loading, error, add, remove };
}