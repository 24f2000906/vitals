"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { PasswordStrength } from "@/components/ui/password-strength";
import { api } from "@/lib/api";
import { otpRequestSchema, resetSchema } from "@/lib/schemas";

type EmailValues = z.infer<typeof otpRequestSchema>;
type ResetValues = z.infer<typeof resetSchema>;

export function ForgotPasswordDialog({
  open,
  onOpenChange,
  initialEmail,
  onDone,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initialEmail?: string;
  onDone: (message: string) => void;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [error, setError] = useState("");

  const emailForm = useForm<EmailValues>({ resolver: zodResolver(otpRequestSchema), defaultValues: { email: initialEmail ?? "" } });
  const resetForm = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
    mode: "onTouched",
    defaultValues: { otp: "", newPassword: "", confirmPassword: "" },
  });

  function handleOpenChange(o: boolean) {
    onOpenChange(o);
    if (!o) {
      setTimeout(() => {
        setStep(1);
        setError("");
        setDevOtp(null);
        resetForm.reset();
      }, 200);
    }
  }

  async function sendCode({ email }: EmailValues) {
    setError("");
    try {
      const res = await api.requestOtp(email);
      setEmail(email);
      setDevOtp(res.dev_otp ?? null);
      setStep(2);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't send the code");
    }
  }

  async function reset(v: ResetValues) {
    setError("");
    try {
      const res = await api.resetPassword({ email, otp: v.otp, new_password: v.newPassword });
      onDone(res.message);
      handleOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't reset the password");
    }
  }

  const er = emailForm.formState.errors;
  const rr = resetForm.formState.errors;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        title="Reset your password"
        description={step === 1 ? "Enter your email and we'll send a 6-digit code." : `Enter the code sent to ${email} and choose a new password.`}
      >
        <AnimatePresence mode="wait" initial={false}>
          {step === 1 ? (
            <motion.form
              key="s1"
              initial={{ x: -40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -40, opacity: 0 }}
              onSubmit={emailForm.handleSubmit(sendCode)}
              noValidate
              className="space-y-5"
            >
              <Field label="Email" htmlFor="fp-email" error={er.email?.message}>
                <Input id="fp-email" type="email" autoComplete="email" aria-invalid={!!er.email} {...emailForm.register("email")} />
              </Field>
              {error && <p role="alert" className="text-sm text-danger">{error}</p>}
              <Button type="submit" className="w-full" loading={emailForm.formState.isSubmitting}>
                Send code
              </Button>
            </motion.form>
          ) : (
            <motion.form
              key="s2"
              initial={{ x: 40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 40, opacity: 0 }}
              onSubmit={resetForm.handleSubmit(reset)}
              noValidate
              className="space-y-5"
            >
              {devOtp && (
                <p className="rounded-xl bg-warn-soft px-3 py-2 text-xs text-warn">
                  Development mode: no email is sent. Your code is <strong className="font-mono text-sm">{devOtp}</strong>.
                </p>
              )}
              <Field label="6-digit code" htmlFor="fp-otp" error={rr.otp?.message}>
                <Input id="fp-otp" inputMode="numeric" maxLength={6} autoComplete="one-time-code" aria-invalid={!!rr.otp} className="font-mono tracking-[0.4em]" {...resetForm.register("otp")} />
              </Field>
              <Field label="New password" htmlFor="fp-new" error={rr.newPassword?.message}>
                <PasswordInput id="fp-new" autoComplete="new-password" aria-invalid={!!rr.newPassword} {...resetForm.register("newPassword")} />
                <div className="pt-1">
                  <PasswordStrength value={resetForm.watch("newPassword")} />
                </div>
              </Field>
              <Field label="Confirm new password" htmlFor="fp-confirm" error={rr.confirmPassword?.message}>
                <PasswordInput id="fp-confirm" autoComplete="new-password" aria-invalid={!!rr.confirmPassword} {...resetForm.register("confirmPassword")} />
              </Field>
              {error && <p role="alert" className="text-sm text-danger">{error}</p>}
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => { setStep(1); setError(""); }}>
                  Back
                </Button>
                <Button type="submit" className="flex-1" loading={resetForm.formState.isSubmitting}>
                  Update password
                </Button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
