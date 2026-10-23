import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Lock, ShieldCheck, UserCheck } from "lucide-react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How VITALS protects your personal medical records and family health data with zero-knowledge security and privacy-first AI.",
};

export default function PrivacyPage() {
  const lastUpdated = "October 23, 2026";

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
      {/* Navigation Header */}
      <header className="glass sticky top-0 z-40 border-b border-border/40 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-6">
            <Link href="/" className="transition hover:opacity-80" aria-label="VITALS home">
              <Logo />
            </Link>
            <div className="hidden h-5 w-px bg-border/60 sm:block" />
            <Link
              href="/"
              className="hidden items-center gap-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground sm:inline-flex"
            >
              <ArrowLeft className="size-3.5" /> Back to Home
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/terms" className="text-xs font-medium text-muted-foreground hover:text-foreground">
              Terms of Service
            </Link>
            <ThemeToggle />
            <Button asChild size="sm" variant="outline">
              <Link href="/auth/signin">Sign In</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-8 sm:py-16">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <ShieldCheck className="size-3.5" /> Privacy-First Health Vault
          </div>
          <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground">Last updated: {lastUpdated}</p>
        </div>

        {/* Commitment Highlight Box */}
        <div className="glass mt-8 rounded-2xl border border-primary/20 bg-primary/5 p-6 sm:p-8">
          <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-foreground">
            <Lock className="size-5 text-primary" /> Our Core Privacy Commitment
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            VITALS was engineered under a strict privacy-by-design architecture. Your medical records, lab panels, and clinical histories are sensitive personal health information. We do not sell your data, we never use your health documents to train public AI models, and document access is protected by private signed tokens that expire in minutes.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="flex items-center gap-2 text-xs font-medium text-foreground">
              <CheckCircle2 className="size-4 shrink-0 text-primary" /> No public AI model training
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-foreground">
              <CheckCircle2 className="size-4 shrink-0 text-primary" /> 100% user data ownership
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-foreground">
              <CheckCircle2 className="size-4 shrink-0 text-primary" /> Permanent cascading deletion
            </div>
          </div>
        </div>

        {/* Legal Sections */}
        <article className="prose prose-neutral dark:prose-invert mt-12 max-w-none space-y-10 text-sm leading-relaxed text-muted-foreground sm:text-base">
          <section className="space-y-3">
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">1. Introduction</h2>
            <p>
              This Privacy Policy explains how VITALS (&quot;we&quot;, &quot;our&quot;, or &quot;the platform&quot;) collects, processes, and protects your personal and medical information when you access our digital health locker, upload medical documents, and interact with our AI summarization tools.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">2. Information We Collect</h2>
            <p>We only collect information required to organize your health records and provide longitudinal clinical timelines:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong className="text-foreground">Account & Demographic Data:</strong> Email address, hashed password, full name, date of birth, biological sex/gender, and phone number.
              </li>
              <li>
                <strong className="text-foreground">Family Member Profiles:</strong> Names, birthdates, relationships, and contact details entered by the primary account holder to manage family member vaults.
              </li>
              <li>
                <strong className="text-foreground">Medical Records & Documents:</strong> Uploaded digital files (PDF, JPEG, PNG, WEBP), including blood panels, diagnostic lab tests, prescriptions, and discharge summaries.
              </li>
              <li>
                <strong className="text-foreground">Parsed Clinical Metrics:</strong> Structured biomarkers extracted from documents (e.g., HbA1c, fasting glucose, lipid profiles, blood pressure, creatinine) and user-recorded medical history entries (diagnoses, treatments, allergies).
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">3. How Your Information is Used</h2>
            <p>We process your data exclusively for the following functionality:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>Building longitudinal health profiles and tracking biomarker trends over time.</li>
              <li>Extracting text and normalizing lab values using vision and OCR technology.</li>
              <li>Generating isolated vector embeddings to allow instant semantic search and question answering over your records.</li>
              <li>Synthesizing professional, concise medical summaries powered by enterprise-grade NVIDIA AI models.</li>
              <li>Generating downloadable single-page clinician summaries (PDFs) upon your explicit request.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">4. NVIDIA AI & Vector Store Safeguards</h2>
            <p>
              VITALS integrates NVIDIA AI (Nemotron models) and ChromaDB vector collections under strict confidentiality standards:
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong className="text-foreground">Zero Model Training:</strong> Your medical excerpts sent to AI completion APIs are strictly ephemeral and are never retained or utilized to train, retrain, or improve public foundational models.
              </li>
              <li>
                <strong className="text-foreground">Member Isolation:</strong> Vector embeddings in ChromaDB are tagged with strict ownership identifiers. Family members cannot access or retrieve chunks belonging to other members unless assigned to that specific profile.
              </li>
              <li>
                <strong className="text-foreground">Deterministic Guardrails:</strong> The AI documentation assistant is strictly restricted from diagnosing conditions, prescribing treatments, or modifying medication plans.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">5. Secure Storage & Signed Document Access</h2>
            <p>
              Original raw PDFs and medical images are stored in secure cloud storage under private access permissions. Files cannot be accessed through public URLs:
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>Document previews use cryptographically signed URLs valid for 15 minutes only.</li>
              <li>Document downloads use signed attachment URLs that automatically expire within 5 minutes.</li>
              <li>Database sessions use authenticated JSON Web Tokens (JWT) with automatic short-lived token rotation.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">6. Multi-Member Family Vault Privacy</h2>
            <p>
              When an account holder adds family members (e.g., parents, children, spouses), each member is treated as a distinct individual entity:
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>Each document must be explicitly assigned to an individual member.</li>
              <li>Biomarker trends, clinical records, and AI summaries are strictly segregated per member.</li>
              <li>If a family member has no uploaded documents, no synthetic AI summary is generated for that member.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">7. Right to Erasure & Permanent Deletion</h2>
            <p>
              You maintain total sovereignty over your health data. When you delete a document or remove a record:
            </p>
            <p>
              VITALS executes an immediate, synchronized cascading deletion:
            </p>
            <ol className="list-decimal space-y-1 pl-5">
              <li>The vector embeddings are permanently wiped from the ChromaDB index.</li>
              <li>The original file asset is permanently purged from cloud storage.</li>
              <li>The metadata record is deleted from the relational database.</li>
              <li>Any cached AI medical summaries referencing that document are invalidated immediately.</li>
            </ol>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">8. Contact & Data Protection Officer</h2>
            <p>
              If you have questions regarding this Privacy Policy, your rights under regional data protection laws, or wish to export your vault records, please contact our privacy team at:
            </p>
            <p className="font-mono text-xs text-foreground">privacy@vitals.ai</p>
          </section>
        </article>

        {/* Footer Navigation */}
        <div className="mt-16 border-t border-border pt-8 text-center sm:flex sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            &copy; 2026 VITALS AI. All rights reserved.
          </p>
          <div className="mt-4 flex justify-center gap-6 text-xs text-muted-foreground sm:mt-0">
            <Link href="/" className="hover:text-foreground">Home</Link>
            <Link href="/terms" className="hover:text-foreground">Terms of Service</Link>
            <Link href="/auth/signin" className="hover:text-foreground">Account Access</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
