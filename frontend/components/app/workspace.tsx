"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api } from "@/lib/api";
import type { MemberInput } from "@/lib/schemas";
import type { FamilyMember, VaultDocument } from "@/lib/types";
import { useAuth } from "../auth-provider";

interface Workspace {
  members: FamilyMember[];
  documents: VaultDocument[];
  loading: boolean;
  /** null = the account holder */
  activeMemberId: number | null;
  setActiveMemberId: (id: number | null) => void;
  activeName: string;
  visibleDocuments: VaultDocument[];
  memberName: (id: number | null) => string;
  addMember: (m: MemberInput) => Promise<FamilyMember>;
  refreshDocuments: () => Promise<void>;
}

const Ctx = createContext<Workspace | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [documents, setDocuments] = useState<VaultDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMemberId, setActiveMemberId] = useState<number | null>(null);

  const refreshDocuments = useCallback(async () => setDocuments(await api.listDocuments()), []);

  useEffect(() => {
    Promise.all([api.listMembers(), api.listDocuments()])
      .then(([m, d]) => {
        setMembers(m);
        setDocuments(d);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Poll while any document is still being extracted.
  const pending = documents.some((d) => d.status === "Extracting");
  useEffect(() => {
    if (!pending) return;
    const t = setInterval(() => void refreshDocuments().catch(() => {}), 2500);
    return () => clearInterval(t);
  }, [pending, refreshDocuments]);

  const addMember = useCallback(async (m: MemberInput) => {
    const created = await api.addMember(m);
    setMembers((prev) => [...prev, created]);
    return created;
  }, []);

  const value = useMemo<Workspace>(() => {
    const first = user?.full_name?.split(" ")[0] ?? "You";
    const memberName = (id: number | null) => (id === null ? first : (members.find((m) => m.id === id)?.name ?? "Member"));
    return {
      members,
      documents,
      loading,
      activeMemberId,
      setActiveMemberId,
      activeName: memberName(activeMemberId),
      visibleDocuments: documents.filter((d) => d.member_id === activeMemberId),
      memberName,
      addMember,
      refreshDocuments,
    };
  }, [members, documents, loading, activeMemberId, user, addMember, refreshDocuments]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useWorkspace() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useWorkspace must be used inside WorkspaceProvider");
  return ctx;
}
