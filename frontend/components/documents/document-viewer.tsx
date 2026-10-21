import { cn } from "@/lib/utils";

/** Renders a file URL (a blob: URL or a signed link): PDFs in an iframe, everything else as an image. */
export function DocumentViewer({
  viewUrl,
  mimeType,
  title = "Document Preview",
  className,
  imageClassName,
  onError,
}: {
  viewUrl: string;
  mimeType: string;
  title?: string;
  className?: string;
  imageClassName?: string;
  onError?: () => void;
}) {
  if (mimeType === "application/pdf") {
    return <iframe src={viewUrl} className={cn("h-[600px] w-full rounded-lg border", className)} title={title} />;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={viewUrl} alt={title} onError={onError} className={cn("h-auto max-w-full rounded-lg border", className, imageClassName)} />
  );
}
