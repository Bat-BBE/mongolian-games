"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export type RewardChestItem = {
  icon: string;
  label: string;
  value: string;
  tone?: "positive" | "negative" | "neutral";
};

type RewardChestDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lang: "mn" | "en";
  title?: string;
  introText?: string;
  items: RewardChestItem[];
};

export function RewardChestDialog({
  open,
  onOpenChange,
  lang,
  title,
  introText,
  items,
}: RewardChestDialogProps) {
  const [opening, setOpening] = useState(false);
  const [revealed, setRevealed] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm border-primary/20">
        <DialogHeader>
          <DialogTitle className="font-display text-base">
            {title ?? (lang === "mn" ? "Шагналын авдар" : "Reward chest")}
          </DialogTitle>
        </DialogHeader>

        {!revealed ? (
          <div className="space-y-3">
            <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-3">
              <p className="text-xs text-amber-100/85">
                {introText ??
                  (lang === "mn"
                    ? "Үйлдэл амжилттай. Авдрыг нээгээд шинэ өөрчлөлтөө харна уу."
                    : "Action complete. Open the chest to reveal the result.")}
              </p>
            </div>

            <div className="flex flex-col items-center gap-2 py-1">
              <div
                className={cn(
                  "select-none text-5xl transition-transform duration-300",
                  opening && "scale-110",
                )}
                aria-hidden
              >
                {opening ? "✨" : "📦"}
              </div>
              <Button
                type="button"
                className="h-9 w-full bg-amber-600 text-white hover:bg-amber-600/95"
                disabled={opening}
                onClick={() => {
                  setOpening(true);
                  window.setTimeout(() => {
                    setOpening(false);
                    setRevealed(true);
                  }, 650);
                }}
              >
                {opening
                  ? lang === "mn"
                    ? "Нээж байна..."
                    : "Opening..."
                  : lang === "mn"
                    ? "Нээх"
                    : "Open"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-2 rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3">
              {items.length > 0 ? (
                items.map((it, i) => (
                  <div
                    key={`${it.label}-${i}`}
                    className="flex items-center justify-between gap-2 text-sm"
                  >
                    <span className="flex items-center gap-2 text-foreground/95">
                      <span className="text-lg" aria-hidden>
                        {it.icon}
                      </span>
                      <span>{it.label}</span>
                    </span>
                    <span
                      className={cn(
                        "tabular-nums font-semibold",
                        it.tone === "negative"
                          ? "text-rose-200"
                          : it.tone === "neutral"
                            ? "text-foreground/90"
                            : "text-emerald-100",
                      )}
                    >
                      {it.value}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-foreground/85">
                  {lang === "mn" ? "Шагналын мэдээлэл алга." : "No reward details."}
                </p>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => onOpenChange(false)}
            >
              {lang === "mn" ? "Хаах" : "Close"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

