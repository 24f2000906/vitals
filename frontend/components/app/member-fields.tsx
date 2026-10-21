"use client";
import {
  Controller,
  get,
  type Control,
  type FieldErrors,
  type FieldValues,
  type Path,
  type UseFormRegister,
} from "react-hook-form";
import { DatePicker } from "@/components/ui/date-picker";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { COUNTRY_CODES } from "@/lib/countries";
import type { MemberInput } from "@/lib/schemas";

/** Blank starting values; "" renders the placeholder option in each select. */
export const blankMember = {
  name: "",
  relationship: "",
  date_of_birth: "",
  gender: "",
  email: "",
  phone_country_code: "+1",
  phone: "",
} as unknown as MemberInput;

/**
 * Shared by the onboarding wizard (path = `family_members.${i}`) and the Add member dialog (path = `member`).
 */
export function MemberFields<T extends FieldValues>({
  control,
  register,
  errors,
  path,
  idPrefix,
}: {
  control: Control<T>;
  register: UseFormRegister<T>;
  errors: FieldErrors<T>;
  path: string;
  idPrefix: string;
}) {
  const p = (k: keyof MemberInput) => `${path}.${k}` as Path<T>;
  const e = (get(errors, path) ?? {}) as FieldErrors<MemberInput>;
  const id = (k: string) => `${idPrefix}-${k}`;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Name" htmlFor={id("name")} error={e.name?.message}>
        <Input id={id("name")} autoComplete="off" aria-invalid={!!e.name} {...register(p("name"))} />
      </Field>
      <Field label="Relationship" htmlFor={id("relationship")} error={e.relationship?.message}>
        <Select id={id("relationship")} aria-invalid={!!e.relationship} {...register(p("relationship"))}>
          <option value="" disabled>
            Select
          </option>
          <option value="spouse">Spouse</option>
          <option value="child">Child</option>
          <option value="parent">Parent</option>
          <option value="sibling">Sibling</option>
          <option value="other">Other</option>
        </Select>
      </Field>
      <Field label="Date of birth" htmlFor={id("dob")} error={e.date_of_birth?.message}>
        <Controller
          control={control}
          name={p("date_of_birth")}
          render={({ field }) => <DatePicker id={id("dob")} value={field.value as string} onChange={field.onChange} invalid={!!e.date_of_birth} />}
        />
      </Field>
      <Field label="Gender" htmlFor={id("gender")} error={e.gender?.message}>
        <Select id={id("gender")} aria-invalid={!!e.gender} {...register(p("gender"))}>
          <option value="" disabled>
            Select
          </option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </Select>
      </Field>
      <Field label="Personal email (optional)" htmlFor={id("email")} error={e.email?.message}>
        <Input id={id("email")} type="email" autoComplete="off" aria-invalid={!!e.email} {...register(p("email"))} />
      </Field>
      <Field label="Phone (optional)" htmlFor={id("phone")} error={e.phone?.message ?? e.phone_country_code?.message}>
        <div className="flex gap-2">
          <div className="w-[7.5rem] shrink-0">
            <Select aria-label="Country code" {...register(p("phone_country_code"))}>
              {COUNTRY_CODES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </Select>
          </div>
          <Input id={id("phone")} inputMode="numeric" autoComplete="off" aria-invalid={!!e.phone} {...register(p("phone"))} />
        </div>
      </Field>
    </div>
  );
}
