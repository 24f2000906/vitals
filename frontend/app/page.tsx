"use client";
import {
  animate,
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import {
  ArrowRight,
  FileSearch,
  HeartPulse,
  Lock,
  ShieldCheck,
  Stethoscope,
  UploadCloud,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { Logo } from "@/components/logo";
import { Reveal } from "@/components/reveal";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

function useCta() {
  const { status, user } = useAuth();
  const authed = status === "authed";
  return {
    authed,
    href: authed ? (user?.setup_complete ? "/dashboard" : "/auth/setup") : "/auth/signup",
    label: authed ? "Open your vault" : "Create your vault",
  };
}

const spring = { type: "spring", stiffness: 100, damping: 20 } as const;

/* ------------------------------------------------------------------ */
/* navigation                                                          */
/* ------------------------------------------------------------------ */

function Nav() {
  const cta = useCta();
  const links = [
    ["Why Vitals", "#purpose"],
    ["How it works", "#how"],
    ["Features", "#features"],
    ["Safety", "#safety"],
  ];
  return (
    <div className="flex justify-center top-0">
      <header className="glass fixed top-2 z-40 w-9/10 backdrop-blur-2xl rounded-2xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
          <Link href="/" aria-label="VITALS home">
            <Logo />
          </Link>
          <nav aria-label="Sections" className="hidden items-center gap-7 text-sm md:flex">
            {links.map(([label, href]) => (
              <a key={href} href={href} className="text-muted-foreground transition-colors hover:text-foreground">
                {label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {!cta.authed && (
              <Button asChild variant="ghost" className="hidden sm:inline-flex">
                <Link href="/auth/signin">Sign in</Link>
              </Button>
            )}
            <Button asChild size="sm" className="h-10">
              <Link href={cta.href}>{cta.authed ? "Open vault" : "Get started"}</Link>
            </Button>
          </div>
        </div>
      </header>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* hero                                                                */
/* ------------------------------------------------------------------ */

function CountUp({ to, decimals = 1 }: { to: number; decimals?: number }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const c = animate(0, to, { duration: 1.4, delay: 0.6, ease: "easeOut", onUpdate: setV });
    return () => c.stop();
  }, [to]);
  return <>{v.toFixed(decimals)}</>;
}

function PreviewCard() {
  const [parsed, setParsed] = useState(false);
  useEffect(() => {
    const t = setInterval(() => setParsed((p) => !p), 2600);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="glass w-full max-w-md rounded-4xl p-6 shadow-2xl shadow-black/10 sm:p-7">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">AR</span>
          <div>
            <p className="text-sm font-medium">Asha&apos;s overview</p>
            <p className="text-xs text-muted-foreground">3 reports on file</p>
          </div>
        </div>
        <AnimatePresence mode="wait" initial={false}>
          <motion.span key={String(parsed)} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
            {parsed ? <Badge tone="ok">Parsed</Badge> : <Badge tone="neutral">Extracting</Badge>}
          </motion.span>
        </AnimatePresence>
      </div>

      <div className="mt-6 rounded-2xl bg-background/60 p-5">
        <div className="flex items-start justify-between">
          <p className="text-sm text-muted-foreground">HbA1c</p>
          <Badge tone="warn">Borderline</Badge>
        </div>
        <p className="mt-2 font-display text-5xl font-bold tabular-nums">
          <CountUp to={6.1} />
          <span className="ml-1 text-base font-medium text-muted-foreground">%</span>
        </p>
        <svg viewBox="0 0 160 44" className="mt-3 h-12 w-full" aria-hidden>
          <motion.path
            d="M4 36 L44 30 L84 32 L124 18 L156 12"
            fill="none"
            stroke="var(--warn)"
            strokeWidth="2.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.4, delay: 0.6, ease: "easeOut" }}
          />
          <motion.circle cx="156" cy="12" r="4.5" fill="var(--warn)" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.9, type: "spring" }} />
        </svg>
      </div>

      <ul className="mt-4 space-y-2 text-sm">
        {[
          ["Blood pressure", "138/88 mmHg", "warn", "Borderline"],
          ["Total cholesterol", "214 mg/dL", "warn", "Borderline"],
          ["Resting heart rate", "68 bpm", "ok", "In range"],
        ].map(([k, v, tone, label], i) => (
          <motion.li
            key={k}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...spring, delay: 1 + i * 0.12 }}
            className="flex items-center justify-between rounded-xl px-1 py-1.5"
          >
            <span className="text-muted-foreground">{k}</span>
            <span className="flex items-center gap-2.5">
              <span className="font-medium tabular-nums">{v}</span>
              <Badge tone={tone as "ok" | "warn"}>{label}</Badge>
            </span>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

function Hero() {
  const cta = useCta();
  const reduce = useReducedMotion();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 90, damping: 18 });
  const sy = useSpring(my, { stiffness: 90, damping: 18 });
  const rotateY = useTransform(sx, [-0.5, 0.5], [-7, 7]);
  const rotateX = useTransform(sy, [-0.5, 0.5], [6, -6]);

  const container = { hidden: {}, show: { transition: { staggerChildren: 0.12 } } };
  const item = { hidden: { opacity: 0, y: 28 }, show: { opacity: 1, y: 0, transition: spring } };

  return (
    <section
      className="mx-auto grid max-w-6xl items-center gap-14 px-5 pb-20 pt-14 sm:px-8 lg:grid-cols-[1.1fr_1fr] lg:pt-24"
      onPointerMove={(e) => {
        if (reduce) return;
        const r = e.currentTarget.getBoundingClientRect();
        mx.set((e.clientX - r.left) / r.width - 0.5);
        my.set((e.clientY - r.top) / r.height - 0.5);
      }}
      onPointerLeave={() => {
        mx.set(0);
        my.set(0);
      }}
    >
      <motion.div variants={container} initial="hidden" animate="show">
        <motion.h1 variants={item} className="font-display text-5xl font-bold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
          Your family&apos;s health history, finally in one place.
        </motion.h1>
        <motion.p variants={item} className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
          Keep lab reports, prescriptions and scans for everyone you care for. VITALS reads them, tracks your numbers over time and explains what changed in plain language.
        </motion.p>
        <motion.div variants={item} className="mt-9 flex flex-wrap items-center gap-3">
          <Button asChild size="lg">
            <Link href={cta.href}>
              {cta.label} <ArrowRight />
            </Link>
          </Button>
          {!cta.authed && (
            <Button asChild size="lg" variant="outline">
              <Link href="/auth/signin">Sign in</Link>
            </Button>
          )}
        </motion.div>
        <motion.p variants={item} className="mt-5 text-sm text-muted-foreground">
          Free to set up. Upload a PDF or a photo to see your first trend in a minute.
        </motion.p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ ...spring, delay: 0.3 }}
        className="flex justify-center lg:justify-end"
        style={{ perspective: 1200 }}
      >
        <motion.div style={reduce ? undefined : { rotateX, rotateY, transformStyle: "preserve-3d" }} className="w-full max-w-md">
          <motion.div animate={reduce ? undefined : { y: [0, -8, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}>
            <PreviewCard />
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}

function PulseDivider() {
  return (
    <div aria-hidden className="mx-auto max-w-6xl px-5 sm:px-8">
      <svg viewBox="0 0 1200 60" preserveAspectRatio="none" className="h-14 w-full">
        <path d="M0 30H1200" stroke="var(--border)" strokeWidth="1.5" strokeDasharray="3 8" />
        <motion.path
          d="M0 30H420L440 30L456 10L478 52L498 4L514 30H640L654 22L668 30H1200"
          fill="none"
          stroke="var(--primary)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 2.2, ease: "easeInOut" }}
        />
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* purpose: scattered records converge into one vault (scroll-driven)  */
/* ------------------------------------------------------------------ */

const CHIPS = [
  { label: "HbA1c report.pdf", from: [-230, -120, -9], to: [-14, -22, -4] },
  { label: "Prescription.jpg", from: [210, -140, 8], to: [12, -12, 3] },
  { label: "Lipid panel.pdf", from: [-250, 40, 6], to: [-8, 0, -2] },
  { label: "Discharge summary.pdf", from: [230, 30, -7], to: [10, 10, 2] },
  { label: "Vaccination card.png", from: [-150, 150, -5], to: [-12, 22, -3] },
  { label: "Blood pressure log.jpg", from: [160, 160, 10], to: [8, 32, 4] },
] as const;

function Chip({ chip, progress }: { chip: (typeof CHIPS)[number]; progress: MotionValue<number> }) {
  const x = useTransform(progress, [0, 1], [chip.from[0], chip.to[0]]);
  const y = useTransform(progress, [0, 1], [chip.from[1], chip.to[1]]);
  const rotate = useTransform(progress, [0, 1], [chip.from[2], chip.to[2]]);
  return (
    <motion.div
      style={{ x, y, rotate }}
      className="glass absolute left-1/2 top-1/2 -ml-22 -mt-5 flex h-10 w-44 items-center gap-2 rounded-xl px-3 text-xs font-medium shadow-md"
    >
      <FileSearch className="size-3.5 shrink-0 text-primary" />
      <span className="truncate">{chip.label}</span>
    </motion.div>
  );
}

function Purpose() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 85%", "center 50%"] });
  const raw = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const smooth = useSpring(raw, { stiffness: 90, damping: 22 });
  const progress = reduce ? useMotionValue(1) : smooth; // eslint-disable-line react-hooks/rules-of-hooks
  const vaultOpacity = useTransform(progress, [0.3, 1], [0.15, 1]);

  return (
    <section id="purpose" className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-24 sm:px-8 lg:grid-cols-2">
      <Reveal>
        <h2 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">Right now, your records are everywhere.</h2>
        <p className="mt-5 max-w-lg text-lg leading-relaxed text-muted-foreground">
          A lab PDF in one inbox, a prescription photo in your camera roll, a parent&apos;s results in a drawer. When a doctor asks how your numbers have moved, nobody can say.
        </p>
        <p className="mt-4 max-w-lg text-lg leading-relaxed text-muted-foreground">
          VITALS pulls everything into a private vault for each person in your family, so the history is there when you need it.
        </p>
      </Reveal>

      <div ref={ref} className="relative mx-auto h-104 w-full max-w-lg overflow-hidden">
        <motion.div
          style={{ opacity: vaultOpacity }}
          className="absolute left-1/2 top-1/2 grid h-60 w-72 -translate-x-1/2 -translate-y-1/2 place-items-end rounded-4xl border-2 border-dashed border-accent bg-muted/50 p-4"
        >
          <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Lock className="size-3.5" /> Asha&apos;s vault
          </span>
        </motion.div>
        {CHIPS.map((c) => (
          <Chip key={c.label} chip={c} progress={progress} />
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* how it works: a real three-step sequence                            */
/* ------------------------------------------------------------------ */

const STEPS = [
  {
    icon: UploadCloud,
    title: "Drop in a report",
    body: "Upload a PDF or a photo of a lab result, prescription or discharge summary. Choose whose it is.",
  },
  {
    icon: FileSearch,
    title: "VITALS reads it",
    body: "Values like HbA1c, blood pressure and cholesterol are pulled out and checked against typical adult ranges.",
  },
  {
    icon: HeartPulse,
    title: "See what changed",
    body: "Trends build up report by report, and anything outside the usual range is flagged with the reason.",
  },
];

function HowItWorks() {
  return (
    <section id="how" className="mx-auto max-w-6xl px-5 py-24 sm:px-8">
      <Reveal>
        <h2 className="max-w-2xl font-display text-4xl font-bold tracking-tight sm:text-5xl">From a crumpled PDF to a clear picture in three steps.</h2>
      </Reveal>
      <div className="relative mt-14 grid gap-6 md:grid-cols-3">
        <svg aria-hidden className="absolute left-0 right-0 top-9 hidden h-1 w-full md:block" preserveAspectRatio="none" viewBox="0 0 100 1">
          <motion.line
            x1="16" y1="0.5" x2="84" y2="0.5"
            stroke="var(--accent)" strokeWidth="1" strokeDasharray="1.5 1.5" vectorEffect="non-scaling-stroke"
            initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 1.6, ease: "easeInOut" }}
          />
        </svg>
        {STEPS.map(({ icon: Icon, title, body }, i) => (
          <Reveal key={title} delay={i * 0.12}>
            <div className="relative flex h-full flex-col rounded-3xl bg-card/70 p-7">
              <span className="relative z-10 mb-6 grid size-18 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                <Icon className="size-8" />
              </span>
              <h3 className="font-display text-2xl font-semibold tracking-tight">
                {i + 1}. {title}
              </h3>
              <p className="mt-3 leading-relaxed text-muted-foreground">{body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* features: varied bento                                              */
/* ------------------------------------------------------------------ */

function Features() {
  const people = ["AR", "KR", "MR", "SR"];
  return (
    <section id="features" className="mx-auto max-w-6xl px-5 py-24 sm:px-8">
      <Reveal>
        <h2 className="max-w-2xl font-display text-4xl font-bold tracking-tight sm:text-5xl">Built around how families actually manage health.</h2>
      </Reveal>

      <div className="mt-14 grid gap-5 md:grid-cols-6">
        <Reveal className="md:col-span-4">
          <div className="glass h-full rounded-3xl p-8">
            <Users className="size-6 text-primary" />
            <h3 className="mt-4 font-display text-2xl font-semibold tracking-tight">One vault, the whole family</h3>
            <p className="mt-2 max-w-md text-muted-foreground">
              Add a spouse, children and parents. Tap a person in the sidebar and every page, metric and report switches to them.
            </p>
            <div className="mt-7 flex items-center">
              {people.map((p, i) => (
                <motion.span
                  key={p}
                  initial={{ opacity: 0, scale: 0.6 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ ...spring, delay: 0.2 + i * 0.1 }}
                  className={`-ml-2 grid size-12 place-items-center rounded-full border-2 border-card text-sm font-semibold first:ml-0 ${i === 0 ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                >
                  {p}
                </motion.span>
              ))}
              <span className="ml-3 grid size-12 place-items-center rounded-full border border-dashed border-input text-muted-foreground">+</span>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.1} className="md:col-span-2">
          <div className="h-full rounded-3xl bg-primary p-8 text-primary-foreground">
            <h3 className="font-display text-2xl font-semibold tracking-tight">Trends, not just numbers</h3>
            <p className="mt-2 text-sm leading-relaxed opacity-85">Each report adds a point. See whether HbA1c, blood pressure and cholesterol are heading the right way.</p>
            <svg viewBox="0 0 160 60" className="mt-6 h-16 w-full" aria-hidden>
              <motion.path
                d="M4 48 L34 40 L64 44 L94 26 L124 30 L156 10"
                fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 1.5, ease: "easeOut" }}
              />
            </svg>
          </div>
        </Reveal>

        <Reveal delay={0.05} className="md:col-span-2">
          <div className="glass h-full rounded-3xl p-8">
            <Stethoscope className="size-6 text-primary" />
            <h3 className="mt-4 font-display text-xl font-semibold tracking-tight">Plain-language summaries</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              &ldquo;Blood pressure of 138/88 is above 130/80. Worth raising at your next visit.&rdquo; No jargon, and the original document sits right beside it.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.1} className="md:col-span-2">
          <div className="glass h-full rounded-3xl p-8">
            <h3 className="font-display text-xl font-semibold tracking-tight">Colors that mean something</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Status colors follow clinical meaning, separate from the brand green.</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Badge tone="ok">In range</Badge>
              <Badge tone="warn">Borderline</Badge>
              <Badge tone="danger">Above range</Badge>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.15} className="md:col-span-2">
          <div className="glass h-full rounded-3xl p-8">
            <Lock className="size-6 text-primary" />
            <h3 className="mt-4 font-display text-xl font-semibold tracking-tight">Private to your account</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Only you can open the files you upload, and only the family members you add appear in your vault.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* safety                                                              */
/* ------------------------------------------------------------------ */

function Safety() {
  const does = [
    "Reads values from your reports and shows them over time",
    "Flags values outside typical adult reference ranges",
    "Shows the original document next to what it extracted",
    "Sends emergency wording straight to a clear warning",
  ];
  const leaves = [
    "Diagnosing a condition",
    "Recommending or changing medication",
    "Deciding what a result means for you",
    "Replacing a conversation with your doctor",
  ];
  return (
    <section id="safety" className="mx-auto max-w-6xl px-5 py-24 sm:px-8">
      <Reveal>
        <div className="glass rounded-4xl p-8 sm:p-12">
          <ShieldCheck className="size-8 text-primary" />
          <h2 className="mt-4 max-w-2xl font-display text-4xl font-bold tracking-tight sm:text-5xl">Built to inform, not to diagnose.</h2>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            VITALS helps you walk into an appointment prepared. Reference ranges are typical for adults, so your doctor&apos;s judgement always comes first. In an emergency, call your local emergency number.
          </p>
          <div className="mt-10 grid gap-8 md:grid-cols-2">
            <div>
              <h3 className="font-display text-xl font-semibold">What VITALS does</h3>
              <ul className="mt-4 space-y-3">
                {does.map((t, i) => (
                  <motion.li key={t} initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ ...spring, delay: i * 0.08 }} className="flex gap-3 text-muted-foreground">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-ok" /> {t}
                  </motion.li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-display text-xl font-semibold">What it leaves to your doctor</h3>
              <ul className="mt-4 space-y-3">
                {leaves.map((t, i) => (
                  <motion.li key={t} initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ ...spring, delay: i * 0.08 }} className="flex gap-3 text-muted-foreground">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-danger" /> {t}
                  </motion.li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* closing call to action + footer                                     */
/* ------------------------------------------------------------------ */

function Closing() {
  const cta = useCta();
  return (
    <section className="mx-auto max-w-6xl px-5 pb-24 pt-8 sm:px-8">
      <Reveal>
        <div className="relative overflow-hidden rounded-4xl bg-primary px-8 py-16 text-center text-primary-foreground sm:px-16">
          <motion.div
            aria-hidden
            className="absolute -right-24 -top-24 size-80 rounded-full bg-white/10 blur-2xl"
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <h2 className="relative mx-auto max-w-2xl font-display text-4xl font-bold tracking-tight sm:text-5xl">Start with one report.</h2>
          <p className="relative mx-auto mt-4 max-w-xl text-lg opacity-90">
            Upload a single lab result and see what VITALS pulls out. Add the rest of the family whenever you&apos;re ready.
          </p>
          <div className="relative mt-9">
            <Button asChild size="lg" className="bg-white text-[#263329] hover:bg-white hover:brightness-95">
              <Link href={cta.href}>
                {cta.label} <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function Footer() {
  const cta = useCta();
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 sm:px-8 md:flex-row md:items-center md:justify-between">
        <div>
          <Logo />
          <p className="mt-3 max-w-md text-xs leading-relaxed text-muted-foreground">
            VITALS summarises your records. It can&apos;t diagnose conditions or replace your doctor.
          </p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <Link href="/privacy" className="hover:text-foreground">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-foreground">
            Terms of Service
          </Link>
          {!cta.authed && (
            <Link href="/auth/signin" className="hover:text-foreground">
              Sign in
            </Link>
          )}
          <Link href={cta.href} className="hover:text-foreground">
            {cta.authed ? "Open vault" : "Create account"}
          </Link>
        </nav>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ */

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <PulseDivider />
        <Purpose />
        <HowItWorks />
        <Features />
        <Safety />
        <Closing />
      </main>
      <Footer />
    </>
  );
}