import { buildMetrics, LEVEL_LABEL } from "./metrics";
import type { VaultDocument } from "./types";

export const DISCLAIMER =
  "VITALS summarises your records. It can't diagnose conditions or replace your doctor. In an emergency, call your local emergency number.";

const EMERGENCY = /chest pain|can'?t breathe|trouble breathing|stroke|suicid|overdose|unconscious|severe bleeding|self[- ]harm/i;

export interface AssistantReply {
  urgent: boolean;
  text: string;
}

/**
 * Preview responder: reads back the latest extracted values with the guardrails applied.
 * Replace the body with a call to your LLM endpoint; keep the emergency check and disclaimer.
 */
export async function askAssistant(question: string, docs: VaultDocument[], name: string): Promise<AssistantReply> {
  await new Promise((r) => setTimeout(r, 500));
  if (EMERGENCY.test(question)) {
    return {
      urgent: true,
      text: "This may be urgent. Contact your local emergency number or go to the nearest emergency department now. Don't wait for an app to answer.",
    };
  }
  const lines = buildMetrics(docs)
    .filter((m) => m.latest !== null)
    .map((m) => {
      const value = m.secondary !== null ? `${m.latest}/${m.secondary}` : `${m.latest}`;
      return `${m.label}: ${value} ${m.unit} (${LEVEL_LABEL[m.level!].toLowerCase()})`;
    });
  if (!lines.length) {
    return { urgent: false, text: `There are no lab values in ${name}'s vault yet. Upload a report and I can summarise it.` };
  }
  return {
    urgent: false,
    text: `From ${name}'s latest reports: ${lines.join("; ")}. For what these mean for you, ask your doctor, especially for anything marked above range.`,
  };
}
