import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, FileText, Scale } from "lucide-react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms and conditions governing the use of VITALS digital health locker, clinical document parsing, and AI summarization tools.",
};

export default function TermsPage() {
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
            <Link href="/privacy" className="text-xs font-medium text-muted-foreground hover:text-foreground">
              Privacy Policy
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
            <Scale className="size-3.5" /> Legal & Clinical Terms
          </div>
          <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">Terms of Service</h1>
          <p className="text-sm text-muted-foreground">Last updated: {lastUpdated}</p>
        </div>

        {/* Essential Clinical Disclaimer Banner */}
        <div className="mt-8 rounded-2xl border border-danger/30 bg-danger/10 p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-danger/20 p-2.5 text-danger">
              <AlertTriangle className="size-6 shrink-0" />
            </div>
            <div className="space-y-2">
              <h2 className="font-display text-xl font-bold text-danger">
                Mandatory Clinical & Non-Diagnostic Disclaimer
              </h2>
              <p className="text-sm leading-relaxed text-foreground/90">
                <strong>VITALS is not a licensed healthcare provider, medical device, or emergency service.</strong> The platform organizes, extracts, and summarizes information from records you provide. Nothing contained in this service, including AI-generated medical summaries, lab trend indicators, and biomarker reference ranges, constitutes medical diagnosis, treatment planning, prescription advice, or a clinician-patient relationship. Always consult a qualified physician or healthcare provider for medical advice or questions regarding a medical condition.
              </p>
            </div>
          </div>
        </div>

        {/* Legal Sections */}
        <article className="prose prose-neutral dark:prose-invert mt-12 max-w-none space-y-10 text-sm leading-relaxed text-muted-foreground sm:text-base">
          <section className="space-y-3">
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">1. Acceptance of Terms</h2>
            <p>
              By accessing or using VITALS, creating an account, uploading medical documents, or utilizing our health tracking tools, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree to these terms, you must discontinue using the platform immediately.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">2. Description of the Service</h2>
            <p>
              VITALS provides a digital health locker platform enabling users to:
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>Upload and store digital copies of medical records, lab reports, prescriptions, and imaging reports.</li>
              <li>Extract structured clinical metrics using automated vision models and optical character recognition (OCR).</li>
              <li>Organize longitudinal records and track biomarker trends across family member profiles.</li>
              <li>Generate synthetic clinical summaries powered by NVIDIA artificial intelligence models.</li>
              <li>Export consolidated single-page health profiles into PDF format for personal records or clinician reviews.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">3. User Responsibilities & Account Security</h2>
            <p>
              You are responsible for maintaining the confidentiality of your credentials. You agree that:
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>You are at least 18 years of age and possess the legal capacity to enter into these Terms.</li>
              <li>You are the individual whose records are being uploaded, or you are the parent, legal guardian, or authorized caregiver managing records on behalf of a dependent family member.</li>
              <li>All information entered during onboarding and family setup is accurate and kept up to date.</li>
              <li>You will promptly notify VITALS if you suspect any unauthorized access to your account or health vault.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">4. AI-Generated Summaries & OCR Limitations</h2>
            <p>
              VITALS utilizes cutting-edge artificial intelligence, including NVIDIA Nemotron text models and optical character recognition engines. However, automated systems have inherent technical limitations:
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong className="text-foreground">Extraction Accuracy:</strong> Handwritten doctor prescriptions, low-resolution scans, or damaged paper documents may result in parsing discrepancies. You must review extracted metrics against original lab sheets before relying on them.
              </li>
              <li>
                <strong className="text-foreground">Synthetic Summaries:</strong> The AI summary is synthesized solely from text extracted from uploaded documents. If an essential document is missing, the summary will be incomplete.
              </li>
              <li>
                <strong className="text-foreground">No Emergency Use:</strong> VITALS must never be used during a medical emergency. In the event of a medical emergency, call your local emergency medical service immediately.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">5. Ownership of Medical Content</h2>
            <p>
              <strong className="text-foreground">You retain 100% ownership of your medical documents.</strong> VITALS claims no intellectual property rights over the files, lab reports, or clinical data you upload. You grant VITALS a limited, non-exclusive license solely to process, host, parse, and display your documents to deliver platform features to you.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">6. Prohibited Activities</h2>
            <p>You agree not to engage in any of the following prohibited behaviors:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>Uploading fraudulent, forged, or stolen medical documents.</li>
              <li>Attempting to bypass security mechanisms, access control tokens, or signed Cloudinary URL limitations.</li>
              <li>Reverse-engineering, decompiling, or attempting to discover the underlying source code of our AI pipelines.</li>
              <li>Uploading viruses, malware, or corrupted files designed to disrupt the platform.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">7. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by applicable law, VITALS, its developers, affiliates, and partners shall not be liable for any indirect, incidental, consequential, special, or punitive damages, or any loss of health data, diagnostic delay, or personal injury resulting from:
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>Your reliance on any extracted data, biomarker trends, or AI medical summaries provided by the platform.</li>
              <li>Inaccuracies, errors, or omissions resulting from automated OCR parsing of paper or digital documents.</li>
              <li>Unauthorized access or alteration of your medical documents resulting from compromised user credentials.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">8. Termination & Deletion</h2>
            <p>
              You may terminate your account at any time. Upon deletion of your vault or individual documents, all associated data, vector embeddings, and cloud assets are permanently erased in accordance with our Privacy Policy.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">9. Contact Information</h2>
            <p>
              For legal inquiries, terms clarification, or notices under these Terms of Service, please contact our legal team at:
            </p>
            <p className="font-mono text-xs text-foreground">legal@vitals.ai</p>
          </section>
        </article>

        {/* Footer Navigation */}
        <div className="mt-16 border-t border-border pt-8 text-center sm:flex sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            &copy; 2026 VITALS AI. All rights reserved.
          </p>
          <div className="mt-4 flex justify-center gap-6 text-xs text-muted-foreground sm:mt-0">
            <Link href="/" className="hover:text-foreground">Home</Link>
            <Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link>
            <Link href="/auth/signin" className="hover:text-foreground">Account Access</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
