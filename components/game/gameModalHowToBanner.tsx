"use client";

import type { CSSProperties } from "react";
import { useApp } from "@/components/AppContext";
import { LuInfo as IconInfo } from "react-icons/lu";

const BANNER_STYLE: CSSProperties = {
  flexShrink: 0,
  margin: "0 0.5rem 0.5rem",
  padding: "0.5rem 0.75rem",
  borderRadius: 10,
  border: "1px solid rgba(200, 160, 48, 0.28)",
  background: "rgba(22, 18, 10, 0.92)",
  color: "rgba(245, 236, 220, 0.92)",
  fontSize: 12,
  lineHeight: 1.5,
  fontFamily:
    "var(--font-inter), -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
};

const HOW: Record<string, { mn: string[]; en: string[] }> = {
  khorol: {
    mn: [
      "60 мод, «гараас газар» — Чандмань-аас Туулай хүртэл ахилтын дараалалтай.",
      "Доор: гарын/газрын модны жагсаалт, жин, тэгш/сондгой — эхнээс нь зүүнээс баруун уншина уу.",
      "Бүрэн ширээний тоглолт хөгжүүлэгдэж байна; дэлгэц нь дүрмийн нэгдсэн товчоо.",
    ],
    en: [
      "60 pieces, hand to ground: hierarchy from Chandmanh down to Rabbit.",
      "The screen lists hand/ground sets, trumps, even/odd play — read sections top to bottom.",
      "A full table is in development; this is a single reference for the rules.",
    ],
  },
  "modon-onis": {
    mn: [
      "Зорилтот дүрсийг (зарим түвшин) барих — хэсгийг зөвхөн заасан дараалаар «түгждэг».",
      "Хэсгийг дарж сонгож чир, зорилтот алтлаг цэгт ойртуулж хулганы товч тавиад түгжэнэ.",
      "Q/E — нарийвчлалтай эргүүлэх. Дэлгэрийн «Тоглоомын тухай» — бүрэн алхам.",
    ],
    en: [
      "Build the target shape: lock pieces only in the order shown (required).",
      "Select by click, drag near the gold ring, release the mouse to lock. Q/E — fine rotation.",
      "See the in-game «About» for full step-by-step guidance.",
    ],
  },
  puzzle: {
    mn: [
      "Өрөөнд ороход хос ол/оньс — хамтлагчтай нэг тайлбартай, эсвэл 10 с дараа ганц чиглэсэн самбар.",
      "Өрөө үүсгэх/код: дээд «Online/Өрөө», эзэн эхлүүлэх — карт нэг сүлжээнд нээгдэнэ.",
      "Өрөөд олон дүр нэгэн зэрэг идэвхтэй: хамтдаа харж, нэгдэж эхэлнэ.",
    ],
    en: [
      "Puzzle: shared online board with your room, or a solo board after 10s alone.",
      "Use the top Online / Room to create or join; host starts when ready.",
      "All players in the same room see the same board in real time.",
    ],
  },
  "stone-cairn": {
    mn: [
      "Хос оноо: санаа тус бүрт шагайны хоосон зайг хад чулуугөөр (өндөр) дүүргэнэ.",
      "Өргөн → зөв, эсвэл яг нэг санааны дараалал/өндөр. Илүү сайн санаа хожно.",
      "2 тоглогч: Online → өрөө, зүүн эзэн — баруун зочин. Дүрмийн товч: зүүн панел.",
    ],
    en: [
      "Build cairn stacks from memory; wider / exact same pattern scores better on a round.",
      "2 players: Online room, host on the left, guest on the right — use Rules in the game UI.",
    ],
  },
  "seven-shagai": {
    mn: [
      "Даалуунууд (шагай) — зорилт, ээлж, дүрмийг дэлгэц дээрх панелээс нэгтгэн уншина уу.",
      "Дүрмийн / зүүн панел дэх «Rules»-ыг нээн, алхам бүрийг товчлон авна уу.",
    ],
    en: [
      "Follow the on-screen phase labels and the Rules / side panel in the game.",
      "Open the in-game «Rules» sheet for step-by-step play.",
    ],
  },
  shagai: {
    mn: [
      "Хонины шагайг эргүүлж зорилтод оноо цуглуулна. Эхний хөдөлгөөн — «Эхлүүлэх»/зааврын дараа.",
      "Өрөө (Homboroi / Station код): 4 хүртэлх тоглогч, зүүн эзэн, ээлж — дүрмийг панелээс нээнэ.",
    ],
    en: [
      "Flick/throw bones toward the goal. Start from the in-game prompt.",
      "Online: up to 4 players, host left — use the Rules control in the panel.",
    ],
  },
  "shagai-guess": {
    mn: [
      "Доороо нуусан дүрсийг сэрэглэх — санааны ээлж, панел дээрх заавраар.",
      "2 тоглогч онлайн: нэгдэж, эзэн эхлүүлэх.",
    ],
    en: [
      "Guess the hidden side — follow the phase text and Rules in the UI.",
    ],
  },
  "stone-guess": {
    mn: [
      "Гар, чулуу, ялга — ээлж, дүрсийг панелын зааврын дагуу. 2 тоглогч онлайн: өрөө, эзэн эхлүүлэх.",
    ],
    en: [
      "Hand, rock, or guess — use the in-game rules panel. 2p online: room + host start.",
    ],
  },
  "four-bones": {
    mn: [
      "Дөрвөн шагай — ээлж, зорилт. Онлайн: дээд панелын өрөө, 4 тоглогч хүртэл.",
    ],
    en: [
      "Four bones, turns and goal — Online room in the top bar, up to 4 players.",
    ],
  },
  "horse-race": {
    mn: [
      "32 хүртэлх уралдаан — дүрмийг панелын товчоор нээнэ. 4 тоглогчийн өрөөг дээд панеласаар.",
    ],
    en: [
      "Race to 32; open Rules in the game. Online: top bar, up to 4.",
    ],
  },
  "four-powers": {
    mn: [
      "Түрүүлж зургаан эгнээ дүүргэнэ — панелын «Дүрэм»-ийг нээн алхам тутамд нэгтгээрэй.",
    ],
    en: [
      "Fill all six rows first; open the Rules control for a concise guide.",
    ],
  },
  "wooden-dice": {
    mn: [
      "Өнгөний комбо — панелын заавар, 2 тоглогчийн өрөө. Эзэн зүүн, зочин баруун (онлайн).",
    ],
    en: [
      "Colour combos; 2p online, host left — use the in-game help text.",
    ],
  },
  default: {
    mn: [
      "Дүрэм, зорилт, ээлж — тоглоомынхоо панел дээрх «Дүрэм»/заавраар нэгтгээрэй.",
      "Онлайн бол дээд «Online/Өрөө»-г ашиглан найзтай нэгдэнэ; эзэн нь ихэвчлэн тоглолт эхлүүлнэ.",
    ],
    en: [
      "How to play: use the game’s own Rules or side panel, where available.",
      "For Online, use the top room controls to join; the host often starts the match.",
    ],
  },
};

type Props = { gameType: string };

/**
 * Модал нээгдэхэд «яаж тоглохыг» нэг дор ойлгомжтой болгодог богино дүрэм
 * (дэлгэц доторх панелыг дагаж бүрэн дүрмийг уншина).
 */
export function GameModalHowToBanner({ gameType }: Props) {
  const { language } = useApp();
  const isMn = language === "mn";
  const entry = HOW[gameType] ?? HOW["default"]!;
  const lines = isMn ? entry.mn : entry.en;

  return (
    <aside style={BANNER_STYLE} aria-label={isMn ? "Тоглохыг эхлүүлэх" : "How to start"}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 8,
        }}
      >
        <IconInfo
          className="shrink-0 text-amber-400/90"
          size={16}
          style={{ marginTop: 1 }}
          aria-hidden
        />
        <ol style={{ margin: 0, paddingLeft: 16, listStyle: "decimal" }}>
          {lines.map((line, i) => (
            <li key={i} style={{ marginTop: i === 0 ? 0 : 3 }}>
              {line}
            </li>
          ))}
        </ol>
      </div>
    </aside>
  );
}
