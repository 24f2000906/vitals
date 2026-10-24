"use client";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Check, Copy, Download, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  shareCode: string;
  name: string;
}

export function ProfileQrCode({ shareCode, name }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dataUrl, setDataUrl] = useState<string>("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!shareCode) return;
    let cancelled = false;

    (async () => {
      try {
        const QRCode = await import("qrcode");
        const url = `${window.location.origin}/share/${shareCode}`;
        const canvas = canvasRef.current;
        if (!canvas || cancelled) return;
        await QRCode.toCanvas(canvas, url, {
          width: 200,
          margin: 2,
          color: { dark: "#1c261d", light: "#ffffff" },
        });
        setDataUrl(canvas.toDataURL("image/png"));
      } catch {
        setError("Couldn't generate QR code");
      }
    })();

    return () => { cancelled = true; };
  }, [shareCode]);

  const [copied, setCopied] = useState(false);

  function copyLink() {
    const url = `${window.location.origin}/share/${shareCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!shareCode) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.15 }}
      className="glass rounded-2xl p-5 text-center"
    >
      <h3 className="flex items-center justify-center gap-2 text-sm font-semibold text-foreground">
        <QrCode className="size-4 text-primary" /> Share Profile QR Code
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Anyone can scan this to view {name}&apos;s health profile
      </p>

      <div className="mt-4 inline-block rounded-xl bg-white p-3 shadow-sm">
        {error ? (
          <p className="text-xs text-danger">{error}</p>
        ) : (
          <canvas ref={canvasRef} className="mx-auto" />
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        {dataUrl && (
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => {
              const a = document.createElement("a");
              a.href = dataUrl;
              a.download = `vitals-qr-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.png`;
              a.click();
            }}
          >
            <Download className="size-3.5" /> Download QR
          </Button>
        )}
        <Button size="sm" variant="outline" className="gap-1.5" onClick={copyLink}>
          {copied ? <Check className="size-3.5 text-ok" /> : <Copy className="size-3.5" />}
          {copied ? "Copied!" : "Copy Link"}
        </Button>
      </div>

      <p className="mt-2 font-mono text-[10px] text-muted-foreground/60 select-all">{shareCode}</p>
    </motion.div>
  );
}
