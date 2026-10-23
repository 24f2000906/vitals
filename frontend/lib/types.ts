export type Gender = "male" | "female" | "other";
export type Relationship = "spouse" | "child" | "parent" | "sibling" | "other";

export interface User {
  id: number;
  email: string;
  full_name: string | null;
  date_of_birth: string | null;
  gender: Gender | null;
  phone_country_code: string | null;
  phone: string | null;
  setup_complete: boolean;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export interface FamilyMember {
  id: number;
  name: string;
  date_of_birth: string;
  gender: Gender;
  email: string | null;
  phone_country_code: string | null;
  phone: string | null;
  relationship: Relationship;
}

export type DocStatus = "Parsed" | "Extracting" | "Flagged";
export type ParamKey = "hba1c" | "systolic" | "diastolic" | "total_cholesterol" | "ldl";

export interface Flag {
  parameter: ParamKey;
  value: number;
  level: "high" | "caution";
  message: string;
}

export interface ExtractedData {
  metadata: Record<string, unknown>;
  values: Partial<Record<ParamKey, number>>;
  flags: Flag[];
  report_date: string | null;
  text_extracted: boolean;
  notes?: string[];
}

export type DocumentType = "prescription" | "lab_report" | "discharge_summary" | "other";

export interface VaultDocument {
  id: string; // UUID
  member_id: number | null;
  title: string;
  document_type: DocumentType;
  filename: string;
  content_type: string;
  size_bytes: number;
  status: DocStatus;
  extracted: ExtractedData;
  created_at: string;
  file_url: string;
}

export type HistoryKind = "condition" | "treatment" | "allergy";
export type HistoryStatus = "active" | "resolved";

export interface HistoryEntry {
  id: number;
  member_id: number | null;
  kind: HistoryKind;
  title: string;
  status: HistoryStatus;
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
  created_at: string;
}