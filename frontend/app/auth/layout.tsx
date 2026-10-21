import { BrandPanel } from "@/components/auth/brand-panel";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <BrandPanel />
      <main className="flex items-center justify-center p-5 sm:p-10">{children}</main>
    </div>
  );
}
