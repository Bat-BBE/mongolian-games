/**
 * Тоглоомын модал доторх нэгдсэн «chrome»: шидэх/эхлэх товч, панел, үр дүн.
 * Шинэ товч / панел нэмэхэд эндхийн class-уудыг дахин ашиглана.
 */
export const GAME_UI_FONT_FAMILY =
  "var(--font-inter), -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif";

/** Модалын дээд мөр — тоглоомын нэр (урт нэр багтана, нэг мөр) */
export const GAME_MODAL_TITLE_CLASS =
  "min-w-0 flex-1 truncate text-left font-[family-name:var(--font-inter)] font-semibold tracking-tight text-amber-100/95 text-[clamp(0.78rem,2.6vw,0.9rem)] leading-tight";

/** 3D / Canvas тоглоом — толгой мөрийг саармаг, бага анхаарал татах */
export const GAME_MODAL_TITLE_IMMERSIVE_CLASS =
  "min-w-0 flex-1 truncate text-left font-[family-name:var(--font-inter)] font-medium tracking-tight text-zinc-200/95 text-[clamp(0.78rem,2.6vw,0.9rem)] leading-tight";

/** Панелийн дээд жижиг overline (жиш. «ШАГАЙ НААДАМ») */
export const GAME_PANEL_OVERLINE_CLASS =
  "block w-full truncate text-center font-[family-name:var(--font-inter)] text-[0.625rem] font-semibold uppercase tracking-[0.18em] text-zinc-500";

/** Панелийн гол нэр — том биш, дэлгэцэнд багтана */
export const GAME_PANEL_TITLE_CLASS =
  "block w-full truncate text-balance text-center font-[family-name:var(--font-inter)] font-semibold uppercase tracking-[0.1em] text-amber-200/92 text-[clamp(0.75rem,2.8vw,0.875rem)] leading-snug";

/** Панел доторх том тоо (цаг, оноо г.м.) */
export const GAME_PANEL_STAT_NUMBER_CLASS =
  "font-[family-name:var(--font-inter)] font-bold tabular-nums text-[clamp(0.9rem,3.5vw,1.1rem)] leading-none tracking-tight text-stone-100";

/** Sheet / дүрмийн гарчиг */
export const GAME_SHEET_TITLE_CLASS =
  "min-w-0 flex-1 truncate pr-2 text-left font-[family-name:var(--font-inter)] text-xs font-bold uppercase tracking-[0.14em] text-[#c8a030] sm:text-[0.8125rem]";

/** Гол үйлдэл: шидэх, Roll, Эхлэх г.м. */
export const GAME_CTA_PRIMARY =
  "inline-flex w-full min-h-[2.75rem] items-center justify-center gap-2 rounded-xl border border-amber-400/55 bg-gradient-to-b from-[#e4c24f] via-[#c8a030] to-[#7a5f18] px-4 py-2.5 text-center text-sm font-bold uppercase tracking-wide text-[#140c00] shadow-[0_4px_22px_rgba(200,160,48,0.42)] transition enabled:hover:brightness-105 enabled:active:scale-[0.99] disabled:cursor-not-allowed disabled:border-zinc-700/55 disabled:from-zinc-800 disabled:via-zinc-800 disabled:to-zinc-950 disabled:text-zinc-500 disabled:shadow-none";

/** Дахин эхлэх, туслах товч */
export const GAME_CTA_SECONDARY =
  "inline-flex w-full min-h-[2.25rem] items-center justify-center gap-1.5 rounded-xl border border-amber-500/45 bg-amber-950/55 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-amber-50/95 shadow-sm transition hover:bg-amber-900/45 hover:border-amber-400/55";

/** Плавающ панелийн суурь (inline style-тай хослуулна) */
export const GAME_PANEL_CHROME = {
  background: "rgba(6,4,2,0.92)",
  border: "1px solid rgba(200,160,48,0.3)",
  borderRadius: 16,
  backdropFilter: "blur(16px)",
  boxShadow: "0 8px 40px rgba(0,0,0,0.72)",
  fontFamily: GAME_UI_FONT_FAMILY,
} as const;

/** 3D сцен дээр — илүү тунгалаг «glass», саармаг ирмэг, UI-г сценээс салгахгүй */
export const GAME_PANEL_CHROME_GLASS = {
  background: "rgba(15, 15, 18, 0.52)",
  border: "1px solid rgba(255, 255, 255, 0.09)",
  borderRadius: 22,
  backdropFilter: "blur(22px) saturate(1.15)",
  WebkitBackdropFilter: "blur(22px) saturate(1.15)",
  boxShadow:
    "0 16px 48px rgba(0,0,0,0.38), inset 0 1px 0 rgba(255,255,255,0.05)",
  fontFamily: GAME_UI_FONT_FAMILY,
} as const;

/** Панел доторх суурь өнгө (inline `color`-той хослуулна) */
export const GAME_PANEL_TEXT_COLOR = "rgba(228, 228, 231, 0.94)";

// —— Текст: бүх тоглоомд ижил хэмжээ, уншихад товч —— //

/** Панел — үндсэн унших текст */
export const GAME_TEXT_BODY =
  "font-[family-name:var(--font-inter)] text-xs leading-relaxed text-zinc-200/95 sm:text-[0.8125rem]";

/** Гарчгийн доорх нэг мөр (subtitle) */
export const GAME_TEXT_SUBTITLE =
  "font-[family-name:var(--font-inter)] text-[0.6875rem] leading-snug text-zinc-500 sm:text-xs";

/** Жижиг шошго, таблын толгой */
export const GAME_TEXT_META =
  "font-[family-name:var(--font-inter)] text-[0.6875rem] font-medium leading-snug text-zinc-500 sm:text-xs";

/** Раунд/тоо — monospace (жиш. дөрвөн эрхэ) */
export const GAME_TEXT_MONO_META =
  "font-mono text-[0.6875rem] font-medium leading-snug text-slate-500 sm:text-xs";

/** Алтлаг заавар (lead) */
export const GAME_TEXT_LEAD =
  "font-[family-name:var(--font-inter)] text-xs leading-snug text-amber-100/88 sm:text-[0.8125rem]";

/** Идэвхгүй төлөв / хүлээлт — lead-тэй ижил хэмжээ, саармаг */
export const GAME_TEXT_LEAD_MUTED =
  "font-[family-name:var(--font-inter)] text-xs leading-snug text-zinc-500 sm:text-[0.8125rem]";

/** Панелийн H2 гарчиг */
export const GAME_PANEL_HEADING_CLASS =
  "font-display text-sm font-bold tracking-wide text-amber-200/95 drop-shadow-[0_0_12px_rgba(200,160,48,0.2)] sm:text-[0.9375rem]";

/** Хэсгийн шошго (жиш. «Нэг удаад шагай») */
export const GAME_TEXT_SECTION_LABEL =
  "font-[family-name:var(--font-inter)] text-xs font-semibold tracking-wide text-zinc-500";

/** Дүрмийн жагсаалт (тоо) */
export const GAME_RULES_OL_CLASS =
  "list-decimal space-y-1.5 pl-4 font-[family-name:var(--font-inter)] text-xs leading-relaxed text-zinc-300/95 sm:text-[0.8125rem]";

/** Дүрмийн жагсаалт (цэг) — modal эсвэл sheet доторх `ul` */
export const GAME_RULES_UL_CLASS =
  "list-disc space-y-2.5 pl-4 font-[family-name:var(--font-inter)] text-sm leading-relaxed text-zinc-200/95";

/** Дүрмийн sheet — гулгах бие + `ul`/`ol`-д нэгдсэн хэмжээ */
export const GAME_RULES_SHEET_SCROLL_CLASS =
  "min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-3 font-[family-name:var(--font-inter)] [scrollbar-color:rgba(200,160,48,0.35)_transparent] [scrollbar-width:thin] [&_ul]:list-disc [&_ul]:space-y-2.5 [&_ul]:pl-4 [&_ul]:text-sm [&_ul]:leading-relaxed [&_ul]:text-zinc-200/95 [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:pl-4 [&_ol]:text-sm [&_ol]:leading-relaxed [&_ol]:text-zinc-300/95";

/** Sky анхааруулга хайрцаг */
export const GAME_CALLOUT_SKY =
  "mt-1.5 rounded-lg border border-sky-500/20 bg-sky-950/25 px-2 py-1 font-[family-name:var(--font-inter)] text-xs leading-snug text-sky-100/90 sm:text-[0.8125rem]";

/** Amber анхааруулга */
export const GAME_CALLOUT_AMBER =
  "mt-1.5 rounded-lg border border-amber-500/20 bg-amber-950/25 px-2 py-1 font-[family-name:var(--font-inter)] text-xs leading-snug text-amber-100/92 sm:text-[0.8125rem]";

/** Emerald тэмдэглэгээ (шат г.м.) */
export const GAME_CALLOUT_EMERALD_COMPACT =
  "mt-1.5 rounded-lg border border-emerald-500/20 bg-emerald-950/25 px-2 py-0.5 font-[family-name:var(--font-inter)] text-xs leading-snug text-emerald-100/90 sm:text-[0.8125rem]";

/** Дүрэм нээх товч (FAB) */
export const GAME_RULES_FAB_CLASS =
  "pointer-events-auto flex w-auto min-h-0 items-center gap-1.5 rounded-xl border border-amber-500/45 bg-black/60 px-3 py-2 font-[family-name:var(--font-inter)] text-xs font-bold uppercase tracking-wider text-amber-100/95 shadow-lg backdrop-blur-md transition hover:bg-amber-950/50 hover:border-amber-500/60 sm:text-[0.8125rem]";

/** Лобби / товч тайлбарын дүрсгүй текст */
export const GAME_LOBBY_INTRO_CLASS =
  "font-[family-name:var(--font-inter)] text-sm leading-relaxed text-zinc-200/90";

/** Алдаа / хасагдсан мэдэгдэл */
export const GAME_CALLOUT_ERROR =
  "mb-1.5 rounded-lg border border-rose-500/40 bg-rose-950/50 px-2 py-0.5 text-center font-[family-name:var(--font-inter)] text-xs leading-snug text-rose-200";

/** Модон шооны TripleDiceReadout — жижиг нүүрэнд багтсан шошго */
export const GAME_DICE_READOUT_TITLE =
  "w-full text-center font-[family-name:var(--font-inter)] text-[0.5625rem] font-semibold uppercase tracking-wide text-slate-400";
export const GAME_DICE_READOUT_TITLE_COMPACT =
  "w-full text-center font-[family-name:var(--font-inter)] text-[0.4375rem] font-semibold uppercase leading-tight tracking-wide text-slate-400";
export const GAME_DICE_READOUT_DIE_LABEL =
  "font-[family-name:var(--font-inter)] text-[0.5rem] uppercase text-slate-500";
export const GAME_DICE_READOUT_DIE_LABEL_COMPACT =
  "font-[family-name:var(--font-inter)] text-[0.375rem] uppercase leading-tight text-slate-500";
export const GAME_DICE_READOUT_SUM_LABEL =
  "font-[family-name:var(--font-inter)] text-[0.5625rem] text-slate-500";
export const GAME_DICE_READOUT_SUM_LABEL_COMPACT =
  "font-[family-name:var(--font-inter)] text-[0.4375rem] leading-tight text-slate-500";
