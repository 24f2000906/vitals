import { Cake, CalendarDays, FolderLock, HeartHandshake, Mail, Phone, UserRound, VenusAndMars } from "lucide-react";
import type { ProfileData } from "@/lib/profile";
import { formatDate } from "@/lib/utils";

export function DetailsGrid({ profile, documentCount }: { profile: ProfileData; documentCount: number }) {
  const items = [
    { icon: UserRound, label: "Full name", value: profile.name },
    { icon: Cake, label: "Age", value: profile.age },
    { icon: CalendarDays, label: "Date of birth", value: profile.dob ? formatDate(profile.dob) : null },
    { icon: VenusAndMars, label: "Gender", value: profile.gender },
    { icon: Mail, label: "Email", value: profile.email },
    { icon: Phone, label: "Phone", value: profile.phone },
    { icon: HeartHandshake, label: "Relationship", value: profile.relationship },
    { icon: FolderLock, label: "Documents on file", value: String(documentCount) },
  ];
  return (
    <section aria-labelledby="details-title" className="space-y-4">
      <h2 id="details-title" className="font-display text-2xl font-semibold tracking-tight">
        Personal details
      </h2>
      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {items.map(({ icon: Icon, label, value }) => (
          <div key={label} className="glass rounded-2xl p-4">
            <dt className="flex items-center gap-2 text-xs text-muted-foreground">
              <Icon className="size-3.5" aria-hidden /> {label}
            </dt>
            <dd className={value ? "mt-1.5 truncate text-sm font-medium" : "mt-1.5 text-sm text-muted-foreground"} title={value ?? undefined}>
              {value ?? "Not provided"}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}