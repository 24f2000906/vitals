"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { useAuth } from "@/components/auth-provider";
import { AuthCard } from "@/components/auth/auth-card";
import { blankMember, MemberFields } from "@/components/app/member-fields";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { api, setupStore, toMemberPayload } from "@/lib/api";
import { COUNTRY_CODES } from "@/lib/countries";
import { setupSchema, type SetupValues } from "@/lib/schemas";
import { cn } from "@/lib/utils";

const STEPS = ["About you", "Family"];
const slide = {
  enter: (dir: number) => ({ x: dir * 32, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir * -32, opacity: 0 }),
};

export default function SetupPage() {
  const router = useRouter();
  const { status, user, startSession } = useAuth();
  const [[step, dir], setStep] = useState<[number, number]>([0, 1]);
  const [formError, setFormError] = useState("");
  const [done, setDone] = useState(false);

  const form = useForm<SetupValues>({
    resolver: zodResolver(setupSchema),
    mode: "onTouched",
    defaultValues: {
      full_name: "",
      date_of_birth: "",
      gender: "" as never,
      phone_country_code: "+1",
      phone: "",
      family_members: [],
    },
  });
  const { register, control, handleSubmit, trigger, formState } = form;
  const { errors, isSubmitting } = formState;
  const members = useFieldArray({ control, name: "family_members" });

  // Need either the setup token from signup or an existing session (signed in with setup unfinished).
  useEffect(() => {
    if (status === "loading" || done) return;
    if (status === "authed" && user?.setup_complete) router.replace("/dashboard");
    else if (status === "anon" && !setupStore.get()) router.replace("/auth/signup");
  }, [status, user, router, done]);

  async function next() {
    if (await trigger(["full_name", "date_of_birth", "gender", "phone_country_code", "phone"])) setStep([1, 1]);
  }

  async function onSubmit(v: SetupValues) {
    setFormError("");
    try {
      const pair = await api.setup(
        {
          user: {
            full_name: v.full_name,
            date_of_birth: v.date_of_birth,
            gender: v.gender,
            phone_country_code: v.phone_country_code,
            phone: v.phone,
          },
          family_members: v.family_members.map(toMemberPayload),
        },
        setupStore.get(),
      );
      setDone(true);
      setupStore.clear();
      startSession(pair);
      router.push("/dashboard");
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Something went wrong");
    }
  }

  return (
    <AuthCard
      wide
      title={step === 0 ? "Tell us about you" : "Add your family"}
      subtitle={step === 0 ? "This helps us keep your records and reference ranges accurate." : "Optional. You can add or change family members later from the sidebar."}
    >
      <ol className="mb-6 flex gap-2" aria-label="Progress">
        {STEPS.map((label, i) => (
          <li key={label} className="flex-1" aria-current={i === step ? "step" : undefined}>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <motion.div className="h-full bg-primary" initial={false} animate={{ width: i <= step ? "100%" : "0%" }} transition={{ type: "spring", stiffness: 120, damping: 20 }} />
            </div>
            <span className={cn("mt-1.5 block text-xs", i === step ? "font-medium" : "text-muted-foreground")}>{label}</span>
          </li>
        ))}
      </ol>

      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (step === 0) void next();
          else void handleSubmit(onSubmit)(e);
        }}
      >
        <div className="relative">
          <AnimatePresence mode="wait" custom={dir} initial={false}>
            <motion.div
              key={step}
              custom={dir}
              variants={slide}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 220, damping: 28 }}
              className="px-0.5 pb-1"
            >
              {step === 0 ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Full name" htmlFor="full_name" error={errors.full_name?.message} className="sm:col-span-2">
                    <Input id="full_name" autoComplete="name" aria-invalid={!!errors.full_name} {...register("full_name")} />
                  </Field>
                  <Field label="Date of birth" htmlFor="dob" error={errors.date_of_birth?.message}>
                    <Controller
                      control={control}
                      name="date_of_birth"
                      render={({ field }) => <DatePicker id="dob" value={field.value} onChange={field.onChange} invalid={!!errors.date_of_birth} />}
                    />
                  </Field>
                  <Field label="Gender" htmlFor="gender-male" error={errors.gender?.message}>
                    <div role="radiogroup" aria-label="Gender" className="grid h-11 grid-cols-3 gap-1.5">
                      {(["male", "female", "other"] as const).map((g) => (
                        <label key={g} className="cursor-pointer">
                          <input type="radio" value={g} id={`gender-${g}`} className="peer sr-only" {...register("gender")} />
                          <span className="grid h-11 place-items-center rounded-xl border border-input bg-card/70 text-sm capitalize transition-colors peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-ring">
                            {g}
                          </span>
                        </label>
                      ))}
                    </div>
                  </Field>
                  <Field label="Phone number" htmlFor="phone" error={errors.phone?.message ?? errors.phone_country_code?.message} className="sm:col-span-2">
                    <div className="flex gap-2">
                      <div className="w-32 shrink-0">
                        <Select aria-label="Country code" {...register("phone_country_code")}>
                          {COUNTRY_CODES.map((c) => (
                            <option key={c.code} value={c.code}>
                              {c.label}
                            </option>
                          ))}
                        </Select>
                      </div>
                      <Input id="phone" inputMode="numeric" autoComplete="tel-national" aria-invalid={!!errors.phone} {...register("phone")} />
                    </div>
                  </Field>
                </div>
              ) : (
                <div className="space-y-4">
                  <AnimatePresence initial={false}>
                    {members.fields.map((f, i) => (
                      <motion.fieldset
                        key={f.id}
                        layout
                        initial={{ opacity: 0, y: 16, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        className="rounded-2xl border border-border bg-card/60 p-4"
                      >
                        <legend className="sr-only">Family member {i + 1}</legend>
                        <div className="mb-3 flex items-center justify-between">
                          <span className="text-sm font-medium">Family member {i + 1}</span>
                          <Button size="sm" variant="ghost" onClick={() => members.remove(i)} aria-label={`Remove family member ${i + 1}`}>
                            <Trash2 /> Remove
                          </Button>
                        </div>
                        <MemberFields control={control} register={register} errors={errors} path={`family_members.${i}`} idPrefix={`fm${i}`} />
                      </motion.fieldset>
                    ))}
                  </AnimatePresence>
                  {members.fields.length === 0 && (
                    <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                      No family members yet. Add a spouse, child, parent or sibling to keep their records here too.
                    </p>
                  )}
                  <Button variant="outline" onClick={() => members.append(blankMember)}>
                    <Plus /> Add family member
                  </Button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {formError && (
          <p role="alert" className="mt-4 rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">
            {formError}
          </p>
        )}
        <div className="mt-7 flex items-center justify-between gap-3">
          {step === 1 ? (
            <Button variant="ghost" onClick={() => setStep([0, -1])}>
              <ArrowLeft /> Back
            </Button>
          ) : (
            <span />
          )}
          {step === 0 ? (
            <Button type="submit" size="lg">
              Continue <ArrowRight />
            </Button>
          ) : (
            <Button type="submit" size="lg" loading={isSubmitting}>
              Finish setup
            </Button>
          )}
        </div>
      </form>
    </AuthCard>
  );
}
