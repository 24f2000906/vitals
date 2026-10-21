import type { DocumentType, FamilyMember, TokenPair, User, VaultDocument } from "./types";
import type { MemberInput } from "./schemas";

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";
const PREFIX = "/api/v1";
const SESSION_KEY = "vitals.session";
const SETUP_KEY = "vitals.setup";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

type Tokens = { access_token: string; refresh_token: string };

export const tokenStore = {
  get(): Tokens | null {
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY) ?? "null");
    } catch {
      return null;
    }
  },
  set(t: Tokens) {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ access_token: t.access_token, refresh_token: t.refresh_token }));
  },
  clear() {
    localStorage.removeItem(SESSION_KEY);
  },
};

export const setupStore = {
  get: () => (typeof window === "undefined" ? null : sessionStorage.getItem(SETUP_KEY)),
  set: (t: string) => sessionStorage.setItem(SETUP_KEY, t),
  clear: () => sessionStorage.removeItem(SETUP_KEY),
};

async function errorMessage(res: Response): Promise<string> {
  try {
    const body = await res.json();
    const d = body?.detail;
    if (typeof d === "string") return d;
    if (Array.isArray(d) && d.length) {
      const first = d[0];
      const field = Array.isArray(first.loc) ? first.loc.filter((p: unknown) => p !== "body").join(".") : "";
      return field ? `${field}: ${first.msg}` : first.msg;
    }
  } catch {
    /* fall through */
  }
  return res.status >= 500 ? "The server hit a problem. Try again in a moment." : `Request failed (${res.status})`;
}

let refreshing: Promise<boolean> | null = null;

async function refreshTokens(): Promise<boolean> {
  refreshing ??= (async () => {
    const t = tokenStore.get();
    if (!t) return false;
    try {
      const res = await fetch(`${BASE}${PREFIX}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: t.refresh_token }),
      });
      if (!res.ok) return false;
      tokenStore.set(await res.json());
      return true;
    } catch {
      return false;
    }
  })().finally(() => {
    refreshing = null;
  });
  return refreshing;
}

interface Opts {
  method?: string;
  json?: unknown;
  form?: FormData;
  /** Skip the stored session (login, signup...) */
  anonymous?: boolean;
  /** Use this bearer token instead of the stored session (setup step) */
  token?: string | null;
  signal?: AbortSignal;
}

async function raw(path: string, opts: Opts = {}): Promise<Response> {
  const send = (token: string | null) =>
    fetch(`${BASE}${PREFIX}${path}`, {
      method: opts.method ?? (opts.json || opts.form ? "POST" : "GET"),
      headers: {
        ...(opts.json ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: opts.json ? JSON.stringify(opts.json) : opts.form,
      signal: opts.signal,
    });

  const session = opts.anonymous || opts.token ? null : tokenStore.get();
  let res: Response;
  try {
    res = await send(opts.token ?? session?.access_token ?? null);
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") throw e;
    throw new ApiError(0, "Can't reach the VITALS server. Check that the backend is running.");
  }
  if (res.status === 401 && session && (await refreshTokens())) {
    res = await send(tokenStore.get()?.access_token ?? null);
  }
  if (!res.ok) throw new ApiError(res.status, await errorMessage(res));
  return res;
}

async function request<T>(path: string, opts?: Opts): Promise<T> {
  return (await raw(path, opts)).json();
}

export const api = {
  emailAvailable: (email: string, signal?: AbortSignal) =>
    request<{ available: boolean }>(`/auth/email-available?email=${encodeURIComponent(email)}`, { anonymous: true, signal }),
  signup: (body: { email: string; password: string }) =>
    request<{ setup_token: string }>("/auth/signup", { json: body, anonymous: true }),
  setup: (body: unknown, setupToken: string | null) =>
    request<TokenPair>("/auth/setup", { json: body, token: setupToken }),
  login: (body: { email: string; password: string }) => request<TokenPair>("/auth/login", { json: body, anonymous: true }),
  me: () => request<User>("/auth/me"),
  requestOtp: (email: string) =>
    request<{ message: string; dev_otp?: string | null }>("/auth/forgot-password/request-otp", {
      json: { email },
      anonymous: true,
    }),
  resetPassword: (body: { email: string; otp: string; new_password: string }) =>
    request<{ message: string }>("/auth/forgot-password/verify-reset", { json: body, anonymous: true }),

  listMembers: () => request<FamilyMember[]>("/family/members"),
  addMember: (m: MemberInput) => request<FamilyMember>("/family/members", { json: toMemberPayload(m) }),

  listDocuments: () => request<VaultDocument[]>("/documents/all"),
  uploadDocument: (file: File, memberId: number | null, meta?: { title?: string; documentType?: DocumentType }) => {
    const form = new FormData();
    form.append("file", file);
    if (memberId !== null) form.append("member_id", String(memberId));
    if (meta?.title) form.append("title", meta.title);
    if (meta?.documentType) form.append("document_type", meta.documentType);
    return request<VaultDocument>("/documents/upload", { form });
  },
  documentBlob: async (id: string) => (await raw(`/documents/${id}/file`)).blob(),
  /** Short-lived (15 min) signed Cloudinary link to the file. The UI previews via documentBlob instead. */
  documentViewUrl: (id: string) => request<{ view_url: string; file_mime_type: string }>(`/documents/${id}/view`),
  /** Short-lived (5 min) signed Cloudinary link that downloads the file as an attachment. */
  documentDownloadUrl: (id: string) => request<{ download_url: string }>(`/documents/${id}/download`),
  /** Permanently removes the file, its search index and its record. */
  deleteDocument: (id: string) => request<{ status: "deleted"; document_id: string }>(`/documents/${id}`, { method: "DELETE" }),
};

/** Empty optional fields become null for the API. */
export function toMemberPayload(m: MemberInput) {
  return {
    ...m,
    email: m.email || null,
    phone: m.phone || null,
    phone_country_code: m.phone ? m.phone_country_code : null,
  };
}
