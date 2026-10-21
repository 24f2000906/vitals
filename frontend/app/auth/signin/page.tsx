"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "@/components/auth-provider";
import { AuthCard } from "@/components/auth/auth-card";
import { ForgotPasswordDialog } from "@/components/auth/forgot-password-dialog";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { signinSchema, type SigninValues } from "@/lib/schemas";

export default function SigninPage() {
  const router = useRouter();
  const { status, user, signIn } = useAuth();
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const [forgotOpen, setForgotOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const signingIn = useRef(false);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<SigninValues>({ resolver: zodResolver(signinSchema), defaultValues: { email: "", password: "" } });

  // Already signed in: skip this page. The ref keeps this from racing the exit animation below.
  useEffect(() => {
    if (status === "authed" && !signingIn.current) router.replace(user?.setup_complete ? "/dashboard" : "/auth/setup");
  }, [status, user, router]);

  async function onSubmit(v: SigninValues) {
    setFormError("");
    signingIn.current = true;
    try {
      const u = await signIn(v.email, v.password);
      setLeaving(true);
      setTimeout(() => router.push(u.setup_complete ? "/dashboard" : "/auth/setup"), 450);
    } catch (e) {
      signingIn.current = false;
      setFormError(e instanceof Error ? e.message : "Something went wrong");
    }
  }

  return (
    <>
      <AuthCard
        leaving={leaving}
        title="Welcome back"
        subtitle="Sign in to open your family's health vault."
        footer={
          <>
            New to VITALS?{" "}
            <Link href="/auth/signup" className="font-medium text-primary underline-offset-4 hover:underline">
              Create an account
            </Link>
          </>
        }
      >
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          {notice && (
            <p role="status" className="flex items-start gap-2 rounded-xl bg-ok-soft px-3 py-2 text-sm text-ok">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" /> {notice}
            </p>
          )}
          <Field label="Email" htmlFor="email" error={errors.email?.message}>
            <Input id="email" type="email" autoComplete="email" aria-invalid={!!errors.email} {...register("email")} />
          </Field>
          <Field label="Password" htmlFor="password" error={errors.password?.message}>
            <PasswordInput id="password" autoComplete="current-password" aria-invalid={!!errors.password} {...register("password")} />
          </Field>
          <div className="flex justify-end">
            <button type="button" onClick={() => setForgotOpen(true)} className="text-sm font-medium text-primary underline-offset-4 hover:underline">
              Forgot password?
            </button>
          </div>
          {formError && (
            <p role="alert" className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">
              {formError}
            </p>
          )}
          <Button type="submit" size="lg" className="w-full" loading={isSubmitting || leaving}>
            Sign in
          </Button>
        </form>
      </AuthCard>
      <ForgotPasswordDialog open={forgotOpen} onOpenChange={setForgotOpen} initialEmail={getValues("email")} onDone={setNotice} />
    </>
  );
}
