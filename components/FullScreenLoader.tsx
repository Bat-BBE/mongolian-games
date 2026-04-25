"use client";

import { Spinner } from "./ui/spinner";
import { useApp } from "@/components/AppContext";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
};

/**
 * Full-view loading: navigation / Suspense fallbacks. Copy explains wait is normal.
 */
export default function FullScreenLoader({ className }: Props) {
  const { language } = useApp();
  const title = language === "mn" ? "Ачаалж байна" : "Loading";
  const sub =
    language === "mn"
      ? "Өгөгдөл ачаалж байна, түрхэн хүлээнэ үү…"
      : "Preparing the page, please wait…";

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn(
        "flex min-h-dvh w-full flex-col items-center justify-center gap-5",
        "bg-background px-4",
        className,
      )}
    >
      <Spinner className="size-10 text-amber-500/90 sm:size-12" />
      <div className="max-w-sm text-center">
        <p className="text-base font-semibold tracking-wide text-foreground">
          {title}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {sub}
        </p>
      </div>
    </div>
  );
}
