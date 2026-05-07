"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
      <DialogContent className="w-[min(100vw-1.25rem,56rem)] sm:max-w-5xl max-h-[min(92vh,860px)] overflow-y-auto border border-[color:var(--map-ui-border)] bg-[color:var(--map-ui-surface-2)] backdrop-blur-xl p-0 gap-0 shadow-[0_24px_70px_-30px_rgba(0,0,0,0.55)]">
        <DialogHeader className="sticky top-0 z-10 px-5 pt-5 pb-3 border-b border-[color:var(--map-ui-border)] bg-[color-mix(in_srgb,var(--map-ui-base)_78%,transparent)] space-y-1 backdrop-blur-md">
          <DialogTitle className="font-display flex items-center justify-center gap-2 text-lg tracking-wide">
            {t.profilePageTitle}
          </DialogTitle>
          <p className="text-[11px] text-muted-foreground font-normal leading-snug pr-6 flex items-center justify-center gap-1">
            {t.profileEmailLabel} · {t.profileLevelLabel} · {t.treasury}
          </p>
        </DialogHeader>
        <div className="px-4 py-4 sm:px-5 sm:py-5">
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
