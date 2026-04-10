"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LuUser as User } from "react-icons/lu";
import { ProfilePanel } from "./ProfilePanel";
import type { DashLang, DashStrings } from "./dashboard-strings";

type ProfileModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  t: DashStrings;
  lang: DashLang;
  onHeroSaved?: () => void;
};

export function ProfileModal({
  open,
  onOpenChange,
  t,
  lang,
  onHeroSaved,
}: ProfileModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(100vw-1.5rem,520px)] sm:max-w-xl max-h-[min(90vh,720px)] overflow-y-auto border border-primary/25 bg-background/98 backdrop-blur-xl p-0 gap-0 shadow-[0_0_60px_-12px_color-mix(in_oklch,var(--primary)_35%,transparent)]">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-primary/15 space-y-1">
          <DialogTitle className="font-display flex items-center gap-2 text-lg tracking-wide">
            <User className="size-5 text-primary shrink-0" strokeWidth={1.5} />
            {t.profilePageTitle}
          </DialogTitle>
          <p className="text-[11px] text-muted-foreground font-normal leading-snug pr-6">
            {t.profileEmailLabel} · {t.profileLevelLabel} · {t.treasury}
          </p>
        </DialogHeader>
        <div className="px-5 py-4">
          <ProfilePanel
            t={t}
            lang={lang}
            active={open}
            onHeroSaved={() => {
              onHeroSaved?.();
              onOpenChange(false);
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
