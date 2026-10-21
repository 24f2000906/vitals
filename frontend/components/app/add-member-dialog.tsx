"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { memberSchema } from "@/lib/schemas";
import { blankMember, MemberFields } from "./member-fields";
import { useWorkspace } from "./workspace";

const schema = z.object({ member: memberSchema });
type Values = z.infer<typeof schema>;

export function AddMemberDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { addMember, setActiveMemberId } = useWorkspace();
  const [error, setError] = useState("");
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), mode: "onTouched", defaultValues: { member: blankMember } });

  async function onSubmit(v: Values) {
    setError("");
    try {
      const created = await addMember(v.member);
      setActiveMemberId(created.id);
      reset({ member: blankMember });
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't add this member");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Add a family member" description="Their documents and metrics get their own view." className="max-w-xl">
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          <MemberFields control={control} register={register} errors={errors} path="member" idPrefix="am" />
          {error && (
            <p role="alert" className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Add member
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
