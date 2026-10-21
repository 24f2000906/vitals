"use client";
import { AnimatePresence, motion } from "framer-motion";
import { ShieldAlert, Sparkles, SendHorizonal } from "lucide-react";
import { useState } from "react";
import { useWorkspace } from "@/components/app/workspace";
import { Button } from "@/components/ui/button";
import { askAssistant, DISCLAIMER, type AssistantReply } from "@/lib/assistant";
import { cn } from "@/lib/utils";

const SUGGESTIONS = ["How have my numbers changed?", "Which values are out of range?", "What should I ask my doctor?"];

export function AskAI() {
  const { visibleDocuments, activeName } = useWorkspace();
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [reply, setReply] = useState<AssistantReply | null>(null);

  async function ask(question: string) {
    if (!question.trim() || busy) return;
    setBusy(true);
    setReply(await askAssistant(question, visibleDocuments, activeName));
    setBusy(false);
  }

  return (
    <section aria-labelledby="ask-title" className="glass rounded-3xl p-6 sm:p-8">
      <h2 id="ask-title" className="flex items-center gap-2 font-display text-2xl font-semibold tracking-tight">
        <Sparkles className="size-5 text-primary" /> Ask about {activeName}&apos;s records
      </h2>
      <form
        className="mt-5 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void ask(q);
        }}
      >
        <label htmlFor="ask" className="sr-only">
          Your question
        </label>
        <input
          id="ask"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Ask about a result, a trend or a report"
          className="h-12 min-w-0 flex-1 rounded-xl border border-input bg-card/70 px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <Button type="submit" size="lg" loading={busy} aria-label="Send question">
          <SendHorizonal />
        </Button>
      </form>
      <div className="mt-3 flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => {
              setQ(s);
              void ask(s);
            }}
            className="rounded-full bg-muted px-3.5 py-1.5 text-xs font-medium transition-colors hover:bg-accent/30"
          >
            {s}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        {reply && (
          <motion.div
            key={reply.text}
            role="status"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={cn("mt-5 rounded-2xl p-4 text-sm leading-relaxed", reply.urgent ? "bg-danger-soft text-danger" : "bg-muted")}
          >
            {reply.urgent && <ShieldAlert className="mb-2 size-5" />}
            {reply.text}
          </motion.div>
        )}
      </AnimatePresence>
      <p className="mt-5 flex items-start gap-2 text-xs text-muted-foreground">
        <ShieldAlert className="mt-0.5 size-3.5 shrink-0" /> {DISCLAIMER}
      </p>
    </section>
  );
}
