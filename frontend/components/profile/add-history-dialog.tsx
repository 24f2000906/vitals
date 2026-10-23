"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { historySchema, type HistoryInput } from "@/lib/schemas";
import type { HistoryKind } from "@/lib/types";

const PLACEHOLDER: Record<HistoryKind, string> = {
  condition: "e.g. Type 2 diabetes, asthma, appendicitis",
  treatment: "e.g. Metformin 500 mg, knee surgery, physiotherapy",
  allergy: "e.g. Penicillin, peanuts",
};

const blank = (kind: HistoryKind): HistoryInput => ({ kind, title: "", status: "active", start_date: "", end_date: "", notes: "" });

export function AddHistoryDialog({
  open,
  kind,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  kind: HistoryKind;
  onOpenChange: (o: boolean) => void;
  onSave: (v: HistoryInput) => Promise<void>;
}) {
  const [error, setError] = useState("");
  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<HistoryInput>({ resolver: zodResolver(historySchema), mode: "onTouched", defaultValues: blank(kind) });

  useEffect(() => {
    if (open) {
      reset(blank(kind));
      setError("");
    }
  }, [open, kind, reset]);

  const k = watch("kind");
  const status = watch("status");

  async function submit(v: HistoryInput) {
    setError("");
    try {
      await onSave(v);
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save this entry");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Add to medical history" description="Only add what you're comfortable keeping in this vault.">
        <form onSubmit={handleSubmit(submit)} noValidate className="space-y-4">
          <Field label="Type" htmlFor="h-kind" error={errors.kind?.message}>
            <Select id="h-kind" {...register("kind")}>
              <option value="condition">Condition or disease</option>
              <option value="treatment">Treatment or medication</option>
              <option value="allergy">Allergy</option>
            </Select>
          </Field>
          <Field label="Name" htmlFor="h-title" error={errors.title?.message}>
            <Input id="h-title" autoComplete="off" placeholder={PLACEHOLDER[k]} aria-invalid={!!errors.title} {...register("title")} />
          </Field>
          {k !== "allergy" && (
            <Field label="Status" htmlFor="h-status">
              <Select id="h-status" {...register("status")}>
                <option value="active">Ongoing</option>
                <option value="resolved">{k === "treatment" ? "Completed" : "Resolved"}</option>
              </Select>
            </Field>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={k === "allergy" ? "First noticed (optional)" : "Started (optional)"} htmlFor="h-start">
              <Controller control={control} name="start_date" render={({ field }) => <DatePicker id="h-start" value={field.value} onChange={field.onChange} />} />
            </Field>
            {k !== "allergy" && status === "resolved" && (
              <Field label="Ended (optional)" htmlFor="h-end" error={errors.end_date?.message}>
                <Controller control={control} name="end_date" render={({ field }) => <DatePicker id="h-end" value={field.value} onChange={field.onChange} invalid={!!errors.end_date} />} />
              </Field>
            )}
          </div>
          <Field label="Notes (optional)" htmlFor="h-notes" error={errors.notes?.message}>
            <textarea
              id="h-notes"
              rows={3}
              maxLength={500}
              aria-invalid={!!errors.notes}
              placeholder="Dose, doctor, reaction, anything a clinician should know"
              className="w-full resize-none rounded-xl border border-input bg-card/70 px-3.5 py-2.5 text-sm placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring aria-[invalid=true]:border-danger"
              {...register("notes")}
            />
          </Field>
          {error && (
            <p role="alert" className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Save entry
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}