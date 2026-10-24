"use client";
import { motion } from "framer-motion";
import { ArrowLeft, Camera, QrCode, ScanLine, Type } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function extractShareCode(raw: string): string | null {
  const trimmed = raw.trim();
  // Try as URL: .../share/<code>
  try {
    const url = new URL(trimmed);
    const match = url.pathname.match(/\/share\/([a-f0-9]+)$/i);
    if (match) return match[1];
  } catch {
    // not a url
  }
  // Raw hex code (8-32 chars)
  if (/^[a-f0-9]{8,32}$/i.test(trimmed)) return trimmed.toLowerCase();
  return null;
}

export default function ScanPage() {
  const router = useRouter();
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<{ html5QrcodeScanner: unknown } | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState("");
  const [manualCode, setManualCode] = useState("");
  const [manualError, setManualError] = useState("");
  const navigatedRef = useRef(false);

  const handleResult = useCallback(
    (code: string) => {
      if (navigatedRef.current) return;
      const shareCode = extractShareCode(code);
      if (shareCode) {
        navigatedRef.current = true;
        router.push(`/share/${shareCode}`);
      }
    },
    [router],
  );

  // Start / stop camera-based QR scanner
  useEffect(() => {
    if (!scanning) return;

    let scanner: import("html5-qrcode").Html5Qrcode | null = null;
    let stopped = false;

    (async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (stopped) return;
        const containerId = "qr-reader";
        scanner = new Html5Qrcode(containerId);
        const qrbox = (viewfinderWidth: number, viewfinderHeight: number) => {
          const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
          const edge = Math.max(160, Math.floor(minEdge * 0.72));
          return { width: edge, height: edge };
        };
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox },
          (decodedText) => handleResult(decodedText),
          () => {},
        );
      } catch (err) {
        if (!stopped) {
          setScanError(
            err instanceof Error && err.message.includes("Permission")
              ? "Camera access was denied. Allow camera permissions to scan."
              : "Couldn't start the camera. Try entering the code manually below.",
          );
          setScanning(false);
        }
      }
    })();

    return () => {
      stopped = true;
      if (scanner) {
        scanner.stop().catch(() => {});
        scanner.clear();
      }
    };
  }, [scanning, handleResult]);

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    const code = extractShareCode(manualCode);
    if (!code) {
      setManualError("Enter a valid share code or scan URL");
      return;
    }
    router.push(`/share/${code}`);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="glass sticky top-0 z-40 border-b border-border/40 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-4">
            <Link href="/" className="transition hover:opacity-80">
              <Logo />
            </Link>
            <div className="hidden h-5 w-px bg-border/60 sm:block" />
            <Link href="/" className="hidden items-center gap-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground sm:inline-flex">
              <ArrowLeft className="size-3.5" /> Back to Home
            </Link>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-lg px-4 py-12 sm:py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
          className="text-center"
        >
          <div className="mx-auto mb-4 inline-flex items-center justify-center rounded-2xl bg-primary/10 p-4 text-primary">
            <ScanLine className="size-10" />
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Scan Health Profile</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Point your camera at a VITALS QR code to instantly view someone&apos;s health profile. No login required.
          </p>
        </motion.div>

        {/* Camera Scanner */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="mt-8 space-y-4"
        >
          {!scanning ? (
            <Button className="w-full gap-2" size="lg" onClick={() => { setScanError(""); setScanning(true); }}>
              <Camera className="size-5" /> Open Camera Scanner
            </Button>
          ) : (
            <div className="space-y-3">
              <div
                ref={videoContainerRef}
                id="qr-reader"
                className="mx-auto w-full max-w-[340px] sm:max-w-[400px] overflow-hidden rounded-2xl border border-border bg-black shadow-lg"
              />
              <Button variant="outline" className="w-full" onClick={() => setScanning(false)}>
                Stop Scanner
              </Button>
            </div>
          )}
          {scanError && (
            <p role="alert" className="text-center text-sm text-danger">{scanError}</p>
          )}
        </motion.div>

        {/* Divider */}
        <div className="my-8 flex items-center gap-4">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs font-medium text-muted-foreground">OR ENTER CODE MANUALLY</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* Manual entry */}
        <form onSubmit={handleManualSubmit} className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Type className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Paste share code or URL"
                value={manualCode}
                onChange={(e) => { setManualCode(e.target.value); setManualError(""); }}
              />
            </div>
            <Button type="submit" variant="outline">
              <QrCode className="size-4" /> View
            </Button>
          </div>
          {manualError && (
            <p role="alert" className="text-xs text-danger">{manualError}</p>
          )}
        </form>

        {/* Info */}
        <div className="mt-10 rounded-xl border border-border bg-muted/30 px-4 py-3 text-center">
          <p className="text-xs text-muted-foreground">
            VITALS QR codes are permanent and unique to each profile member. Shared profiles display
            health summaries and medical history without exposing login credentials.
          </p>
        </div>
      </main>
    </div>
  );
}
