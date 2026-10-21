"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Loader2, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { PasswordStrength } from "@/components/ui/password-strength";
import { api, ApiError, setupStore } from "@/lib/api";
import { useEmailAvailability } from "@/lib/hooks";
import { signupSchema, type SignupValues } from "@/lib/schemas";

export default function SignupPage() {
  const router = useRouter();
  const [formError, setFormError] = useState("");
  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    mode: "onChange",
    defaultValues: { email: "", password: "", confirmPassword: "" },
  });
  const email = watch("email");
  const availability = useEmailAvailability(errors.email ? "" : email);

  const emailError = errors.email?.message ?? (availability === "taken" ? "An account with this email already exists" : undefined);

  async function onSubmit(values: SignupValues) {
    setFormError("");
    if (availability === "taken") return;
    try {
      const res = await api.signup({ email: values.email, password: values.password });
      setupStore.set(res.setup_token);
      router.push("/auth/setup");
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) setError("email", { message: e.message });
      else setFormError(e instanceof Error ? e.message : "Something went wrong");
    }
  }

  return (
    <AuthCard
      float
      title="Create your account"
      subtitle="Start with your email and a password. You'll add your details and family next."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/auth/signin" className="font-medium text-primary underline-offset-4 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <Field label="Email" htmlFor="email" error={emailError}>
          <div className="relative">
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              aria-invalid={!!emailError}
              aria-describedby={emailError ? "email-error" : undefined}
              className="pr-10"
              {...register("email")}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2" aria-hidden>
              {availability === "checking" && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
              {availability === "available" && !errors.email && <Check className="size-4 text-ok" />}
              {availability === "taken" && <X className="size-4 text-danger" />}
            </span>
          </div>
        </Field>
        <Field label="Password" htmlFor="password" error={errors.password?.message}>
          <PasswordInput id="password" autoComplete="new-password" aria-invalid={!!errors.password} {...register("password")} />
          <div className="pt-1">
            <PasswordStrength value={watch("password")} />
          </div>
        </Field>
        <Field label="Confirm password" htmlFor="confirmPassword" error={errors.confirmPassword?.message}>
          <PasswordInput id="confirmPassword" autoComplete="new-password" aria-invalid={!!errors.confirmPassword} {...register("confirmPassword")} />
        </Field>
        {formError && (
          <p role="alert" className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">
            {formError}
          </p>
        )}
        <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
          Create account
        </Button>
      </form>
    </AuthCard>
  );
}
