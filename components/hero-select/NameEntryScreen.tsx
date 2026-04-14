"use client";
import { cn } from "@/lib/utils";
import type { HeroStrings } from "./hero-strings";

interface NameEntryScreenProps {
  t: HeroStrings;
  playerName: string;
  setPlayerName: (v: string) => void;
  isChecking?: boolean;
  onEnter: () => void;
}

export function NameEntryScreen({
  t,
  playerName,
  setPlayerName,
  isChecking = false,
  onEnter,
}: NameEntryScreenProps) {

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(playerName.trim());
  const filled = emailValid;

  return (
    <div className="flex flex-col items-center justify-center gap-6 sm:gap-7 py-[clamp(28px,6vh,72px)] px-[clamp(14px,3.5vw,32px)] animate-fade-up bg-background">

      {/* TITLE */}
      <div className="text-center max-w-2xl">

        <p
          className="font-heritage italic uppercase mb-3 opacity-70"
          style={{
            color: "var(--gold)",
            fontSize: "clamp(10px,1vw,12px)",
            letterSpacing: "clamp(0.25em,0.5vw,0.4em)",
          }}
        >
          {t.gameTagline}
        </p>

        <h1
          className="font-display font-black leading-tight"
          style={{
            fontSize: "clamp(28px,5vw,52px)",
            color: "var(--gold-bright)",
            textShadow: "0 0 40px rgba(255,240,197,0.5)",
          }}
        >
          {t.gameTitle1}{" "}
          <span className="text-gradient-gold">{t.gameTitle2}</span>
        </h1>

      </div>

      <Ornament />

      {/* INPUT */}
      <div className="flex flex-col gap-2 w-full max-w-md">

        <InputField
          type="email"
          placeholder={t.emailPlaceholder ?? "И-мэйл хаяг"}
          value={playerName}
          onChange={setPlayerName}
          onEnter={() => filled && !isChecking && onEnter()}
          isValid={playerName.trim().length === 0 ? undefined : emailValid}
          disabled={isChecking}
        />

        <p
          className="text-center tracking-wide"
          style={{
            color: "var(--muted-foreground)",
            fontSize: "clamp(11px,1vw,13px)",
          }}
        >
          {t.emailHint ?? "Бүртгэлтэй бол шууд тоглоомд орно"}
        </p>

      </div>

      {/* BUTTON */}
      <button
        disabled={!filled || isChecking}
        onClick={onEnter}
        className={cn(
          "relative font-display uppercase transition-all duration-300 overflow-hidden",
          filled && !isChecking
            ? "hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(200,168,75,0.35)] cursor-pointer"
            : "opacity-30 cursor-not-allowed",
        )}
        style={{
          background: "var(--gold)",
          border: "1px solid var(--gold-main)",
          color: "var(--foreground)",
          minWidth: "clamp(160px,20vw,220px)",
          padding: "clamp(12px,1.5vw,18px) clamp(30px,4vw,48px)",
          fontSize: "clamp(10px,0.9vw,12px)",
          letterSpacing: "clamp(0.2em,0.4vw,0.35em)",
        }}
      >
        {isChecking ? (
          <span className="flex items-center justify-center gap-2">
            <span
              className="rounded-full border-2 border-t-transparent animate-spin"
              style={{
                width: "clamp(12px,1vw,14px)",
                height: "clamp(12px,1vw,14px)",
                borderColor: "rgba(200,168,75,0.6)",
                borderTopColor: "transparent",
              }}
            />
            <span className="opacity-90">
              {t.checkingEmail ?? "Шалгаж байна..."}
            </span>
          </span>
        ) : (
          t.enterBtn
        )}
      </button>

      <Ornament />

    </div>
  );
}

function InputField({
  type,
  placeholder,
  value,
  maxLength,
  onChange,
  onEnter,
  isValid,
  disabled,
}: {
  type: string;
  placeholder: string;
  value: string;
  maxLength?: number;
  onChange: (v: string) => void;
  onEnter: () => void;
  isValid?: boolean;
  disabled?: boolean;
}) {

  const borderColor =
    isValid === true
      ? "rgb(14,206,101)"
      : isValid === false
      ? "rgb(255,0,0)"
      : "rgb(255,191,0)";

  const hairlineColor =
    isValid === true ? "rgba(100,220,120,0.6)" : "var(--gold-light)";

  return (
    <div className="relative w-full">

      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: `linear-gradient(80deg,transparent,${hairlineColor},transparent)` }}
      />

      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{ background: `linear-gradient(90deg,transparent,${hairlineColor},transparent)` }}
      />

      <input
        type={type}
        maxLength={maxLength}
        autoComplete={type === "email" ? "email" : "off"}
        spellCheck={false}
        placeholder={placeholder}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onEnter()}
        className="w-full text-center font-display outline-none transition-all duration-300 disabled:opacity-40"
        style={{
          fontSize: "clamp(11px,1.2vw,16px)",
          letterSpacing: "clamp(0.08em,0.2vw,0.15em)",
          padding: "clamp(14px,1.5vw,18px) clamp(16px,2vw,24px)",
          background: "var(--muted)",
          color: "var(--foreground)",
          border: "none",
          borderLeft: `1px solid ${borderColor}`,
          borderRight: `1px solid ${borderColor}`,
        }}
      />

      {isValid !== undefined && (
        <div
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full"
          style={{
            width: "clamp(6px,0.6vw,8px)",
            height: "clamp(6px,0.6vw,8px)",
            background: isValid ? "rgba(100,220,120,0.8)" : "rgba(220,80,80,0.7)",
            boxShadow: isValid
              ? "0 0 6px rgba(100,220,120,0.6)"
              : "0 0 6px rgba(220,80,80,0.5)",
          }}
        />
      )}

    </div>
  );
}

function Ornament() {
  return (
    <div className="flex items-center gap-4 w-[clamp(140px,30vw,260px)] opacity-90">
      <div className="flex-1 h-px" style={{ background: "var(--gold)" }} />
      <span
        className="font-display"
        style={{
          color: "var(--gold)",
          fontSize: "clamp(12px,1vw,16px)",
        }}
      >
        ✦
      </span>
      <div className="flex-1 h-px" style={{ background: "var(--gold)" }} />
    </div>
  );
}