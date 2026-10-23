"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Check, Pencil, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { api } from "@/lib/api";
import { COUNTRY_CODES } from "@/lib/countries";
import type { ProfileData } from "@/lib/profile";
import { formatDate } from "@/lib/utils";
import { Cake, CalendarDays, FolderLock, HeartHandshake, Mail, Phone, UserRound, VenusAndMars } from "lucide-react";

const editSchema = z.object({
  full_name: z.string().trim().min(2, "Enter a full name"),
  phone_country_code: z.string().regex(/^\+\d{1,4}$/, "Select a country code"),
  phone: z.union([z.literal(""), z.string().regex(/^\d{6,14}$/, "Enter 6 to 14 digits")]),
});
type EditValues = z.infer<typeof editSchema>;

interface Props {
  profile: ProfileData;
  documentCount: number;
  onProfileUpdated: (updates: { full_name?: string; phone?: string; phone_country_code?: string }) => void;
}

export function EditableDetailsGrid({ profile, documentCount, onProfileUpdated }: Props) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      full_name: profile.name,
      phone_country_code: profile.phone?.split(" ")[0] ?? "+1",
      phone: profile.phone?.split(" ").slice(1).join("") ?? "",
    },
  });

  async function onSubmit(values: EditValues) {
    setSaving(true);
    setSaveError("");
    try {
      await api.updateMe({
        full_name: values.full_name,
        phone_country_code: values.phone ? values.phone_country_code : undefined,
        phone: values.phone || undefined,
      });
      onProfileUpdated({
        full_name: values.full_name,
        phone: values.phone ? `${values.phone_country_code} ${values.phone}` : undefined,
        phone_country_code: values.phone_country_code,
      });
      setEditing(false);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Couldn't save changes");
    } finally {
      setSaving(false);
    }
  }

  function cancelEdit() {
    reset({
      full_name: profile.name,
      phone_country_code: profile.phone?.split(" ")[0] ?? "+1",
      phone: profile.phone?.split(" ").slice(1).join("") ?? "",
    });
    setEditing(false);
    setSaveError("");
  }

  const readOnlyItems = [
    { icon: Cake, label: "Age", value: profile.age },
    { icon: CalendarDays, label: "Date of birth", value: profile.dob ? formatDate(profile.dob) : null },
    { icon: VenusAndMars, label: "Gender", value: profile.gender },
    { icon: Mail, label: "Email", value: profile.email },
    { icon: HeartHandshake, label: "Relationship", value: profile.relationship },
    { icon: FolderLock, label: "Documents on file", value: String(documentCount) },
  ];

  return (
    <section aria-labelledby="details-title" className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 id="details-title" className="font-display text-2xl font-semibold tracking-tight">
          Personal details
        </h2>
        {profile.isSelf && !editing && (
          <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
            <Pencil className="size-3.5" /> Edit
          </Button>
        )}
      </div>

      {editing ? (
        <motion.form
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="glass rounded-2xl p-5 space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" htmlFor="edit-name" error={errors.full_name?.message} className="sm:col-span-2">
              <Input
                id="edit-name"
                autoComplete="name"
                aria-invalid={!!errors.full_name}
                {...register("full_name")}
              />
            </Field>
            <Field label="Phone number" htmlFor="edit-phone" error={errors.phone?.message ?? errors.phone_country_code?.message} className="sm:col-span-2">
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
                <Input
                  id="edit-phone"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  aria-invalid={!!errors.phone}
                  placeholder="Optional"
                  {...register("phone")}
                />
              </div>
            </Field>
          </div>

          {saveError && (
            <p role="alert" className="text-sm text-danger">
              {saveError}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" size="sm" variant="ghost" onClick={cancelEdit}>
              <X className="size-3.5" /> Cancel
            </Button>
            <Button type="submit" size="sm" loading={saving}>
              <Check className="size-3.5" /> Save changes
            </Button>
          </div>
        </motion.form>
      ) : (
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="glass rounded-2xl p-4">
            <dt className="flex items-center gap-2 text-xs text-muted-foreground">
              <UserRound className="size-3.5" aria-hidden /> Full name
            </dt>
            <dd className={profile.name ? "mt-1.5 truncate text-sm font-medium" : "mt-1.5 text-sm text-muted-foreground"}>
              {profile.name || "Not provided"}
            </dd>
          </div>
          <div className="glass rounded-2xl p-4">
            <dt className="flex items-center gap-2 text-xs text-muted-foreground">
              <Phone className="size-3.5" aria-hidden /> Phone
            </dt>
            <dd className={profile.phone ? "mt-1.5 truncate text-sm font-medium" : "mt-1.5 text-sm text-muted-foreground"}>
              {profile.phone || "Not provided"}
            </dd>
          </div>
          {readOnlyItems.map(({ icon: Icon, label, value }) => (
            <div key={label} className="glass rounded-2xl p-4">
              <dt className="flex items-center gap-2 text-xs text-muted-foreground">
                <Icon className="size-3.5" aria-hidden /> {label}
              </dt>
              <dd
                className={value ? "mt-1.5 truncate text-sm font-medium" : "mt-1.5 text-sm text-muted-foreground"}
                title={value ?? undefined}
              >
                {value ?? "Not provided"}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
