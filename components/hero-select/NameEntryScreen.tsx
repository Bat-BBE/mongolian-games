"use client";
import { cn } from "@/lib/utils";
import type { HeroStrings } from "./hero-strings";

interface NameEntryScreenProps {
  t: HeroStrings;
  playerName: string;
  setPlayerName: (v: string) => void;
  // email: string;
  // setEmail: (v: string) => void;
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
  const filled     = emailValid;

  return (
    <div className="flex flex-col items-center justify-center gap-8 py-16 px-6 animate-fade-up bg-background">
      <div className="text-center">
        <p
          className="font-heritage italic text-xs tracking-[0.4em] uppercase mb-3 opacity-70"
          style={{ color: "var(--gold)" }}
        >
          {t.gameTagline}
        </p>
        <h1
          className="font-display font-black leading-tight"
          style={{
            fontSize: "clamp(28px,5vw,50px)",
            color: "var(--gold-bright)",
            textShadow: "0 0 40px rgba(255, 240, 197, 0.5)",
          }}
        >
          {t.gameTitle1}{" "}
          <span className="text-gradient-gold">{t.gameTitle2}</span>
        </h1>
      </div>

      <Ornament />

      <div className="flex flex-col gap-1 w-100">
        <InputField
          type="email"
          placeholder={t.emailPlaceholder ?? "И-мэйл хаяг"}
          value={playerName}
          onChange={setPlayerName}
          onEnter={() => filled && !isChecking && onEnter()}
          isValid={playerName.trim().length === 0 ? undefined : emailValid}
          disabled={isChecking}
        />

        <p className="text-center text-[12px] tracking-wide transition-all duration-300"
          style={{ color: "var(--muted-foreground)" }}>
          {t.emailHint ?? "Бүртгэлтэй бол шууд тоглоомд орно"}
        </p>
      </div>

      <button
        disabled={!filled || isChecking}
        onClick={onEnter}
        className={cn(
          "relative font-display text-xs tracking-[0.3em] uppercase px-12 py-4 transition-all duration-300 overflow-hidden",
          filled && !isChecking
            ? "hover:-translate-y-0.5 hover:shadow-[0_0_30px_rgba(200,168,75,0.35)] cursor-pointer"
            : "opacity-30 cursor-not-allowed",
        )}
        style={{
          background: "var(--gold)",
          border: "1px solid var(--gold-main)",
          color: "var(--foreground)",
          minWidth: "180px",
        }}
      >
        {isChecking ? (
          <span className="flex items-center justify-center gap-2">
            <span
              className="w-3.5 h-3.5 rounded-full border-2 border-t-transparent animate-spin inline-block"
              style={{ borderColor: "rgba(200,168,75,0.6)", borderTopColor: "transparent" }}
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
      ? "rgb(14, 206, 101)"
      : isValid === false
      ? "rgb(255, 0, 0)"
      : "rgb(255, 191, 0)";

  const hairlineColor =
    isValid === true ? "rgba(100,220,120,0.6)" : "var(--gold-light)";

  return (
    <div className="relative w-full">
      <div
        className="absolute top-0 left-0 right-0 h-px transition-all duration-300"
        style={{ background: `linear-gradient(80deg, transparent, ${hairlineColor}, transparent)` }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 h-px transition-all duration-300"
        style={{ background: `linear-gradient(90deg, transparent, ${hairlineColor}, transparent)` }}
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
        className="w-full text-center font-display text-base tracking-[0.15em] py-4 px-5 outline-none text-foreground placeholder:foreground/50 transition-all duration-300 disabled:opacity-40"
        style={{
          background: "var(--muted)",
          border: "none",
          borderLeft: `1px solid ${borderColor}`,
          borderRight: `1px solid ${borderColor}`,
        }}
      />

      {isValid !== undefined && (
        <div
          className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full transition-all duration-300"
          style={{
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
    <div className="flex items-center gap-4 w-64 opacity-90">
      <div className="flex-1 h-px" style={{ background: "var(--gold)" }} />
      <span className="font-display" style={{ color: "var(--gold)" }}>✦</span>
      <div className="flex-1 h-px" style={{ background: "var(--gold)" }} />
    </div>
  );
}