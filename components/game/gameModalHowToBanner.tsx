"use client";

import type { CSSProperties } from "react";
import { useApp } from "@/components/AppContext";
import { LuInfo as IconInfo } from "react-icons/lu";

const BANNER_STYLE: CSSProperties = {
  flexShrink: 0,
  margin: "0 0.5rem 0.5rem",
  padding: "0.5rem 0.75rem",
  borderRadius: 10,
  width: "90%",
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
      "60 мод Чандмань-аас Туулай хүртэл дараалалтай байрлана, гар ба газрын мод, жин болон тэгш/сондгойг зүүнээс баруун чиглэлд уншиж ойлгоно. Одоогоор энэ нь дүрмийн товч тайлбар бөгөөд бүрэн ширээний хувилбар хөгжүүлэгдэж байна.",
    ],
    en: [
      "There are 60 pieces arranged from Chandmanh to Rabbit, and you read hand/ground, trumps, and even/odd from left to right. This is currently a rule summary while the full table version is in development.",
    ],
  },

  "modon-onis": {
    mn: [
      "Таны зорилго бол дүрсийг зөв угсрах бөгөөд хэсгүүдийг зөвхөн заасан дарааллаар (1→2→3) түгжиж байрлуулна. Хэсгийг чирж байрлуулаад тавихад түгжигдэх ба Q/E товчоор эргүүлж болно.",
    ],
    en: [
      "Your goal is to assemble the shape by locking pieces strictly in order (1→2→3). Drag a piece into place to lock it, and use Q/E to rotate.",
    ],
  },

  puzzle: {
    mn: [
      "4x4 харьцаатай 16-н ширхэг картыг нээж хосуудыг олно. 4н ижил хос байгаа ч түүний зөвхөн 2н хоорондоо хос байна гэдгийг санаарай.",
    ],
    en: [
      "Flip over 16 cards arranged in a 4x4 grid and find matching pairs. Although there are 4 identical cards, only 2 of them form a valid pair.",
    ],
  },

  "stone-cairn": {
    mn: [
      "Дэлгэц дээр харагдах дарааллыг санаж яг ижил дарааллаар давтах ёстой бөгөөд алхам бүрт дараалал уртасна. Нэг удаа алдаа гарвал тоглоом дуусаж, 10 дарааллыг зөв давтвал ялна.",
    ],
    en: [
      "You must remember and repeat the shown pattern, which grows each round. One mistake ends the game, and completing 10 sequences wins.",
    ],
  },

  "seven-shagai": {
    mn: [
      "Долоон шагайг ижил тал буусан байгаа хосуудын хооронд нясалж нэгийг сонгож авна. Нэг шагай үлдэхэд та хожих болно.",
    ],
    en: [
      "Flick one of the shagai between pairs that have landed on the same side. Continue until only one shagai remains — then you win.",
    ],
  },

  "twelve-shagai": {
    mn: [
      "4 шагайгаар 4 удаа, 3 шагайгаар 3 удаа, бусад үед 2 шагайгаар шидэж оноо авна. Морь буувал 1 оноо бөгөөд хамгийн түрүүнд 12 хүрсэн тоглогч ялна.",
    ],
    en: [
      "You throw 4 shagai for 4 rounds, then 3 for 3 rounds, and continue with 2 shagai. Each horse side gives 1 point, and the first to reach 12 wins.",
    ],
  },

  "berkh-12-shagai": {
    mn: [
      "2–4 тоглогч 12 шагайг зэрэг шиднэ. Морь буувал оноо авч, тэмээгээр төлбөр хийнэ. Нийт 48 оноог бүрдүүлсэн тоглогч ялна.",
    ],
    en: [
      "2–4 players throw 12 shagai at once. Horses earn points, while camels are used for payment. The first player to collect all 48 points wins.",
    ],
  },

  shagai: {
    mn: [
      "Та шагай шидэж оноо цуглуулан тоглох бөгөөд онлайн горимд 4 хүртэл тоглогч хамт оролцоно.",
    ],
    en: ["You throw shagai to score points, with up to 4 players online."],
  },

  "shagai-guess": {
    mn: ["Нуусан талыг зөв тааж ялалт байгуулна."],
    en: ["Guess the hidden side to win."],
  },

  "stone-guess": {
    mn: ["Та сонголтоо хийж өрсөлдөгчөөс илүү байж ялна."],
    en: ["Make your choice and beat your opponent to win."],
  },

  "four-bones": {
    mn: ["Дөрвөн шагайгаар ээлжлэн тоглож зорилгодоо хүрнэ."],
    en: ["Play turn-based with four bones to reach the goal."],
  },

  "horse-race": {
    mn: ["Оноогоо нэмсээр хамгийн түрүүнд барианд хүрсэн нь ялна."],
    en: ["Increase your score and be the first to reach 20 to win."],
  },

  "four-powers": {
    mn: [
      "Морь, тэмээ, үхэр, хонь нь дараалсан циклээр бие биеэ даран раунд бүрт оноо цуглуулж, хамгийн түрүүнд 7 хүрсэн нь ялна.",
    ],
    en: [
      "Horse, camel, ox, and sheep form a cycle that beats each other, and players gain points each round until someone reaches 7 to win.",
    ],
  },

  "wooden-dice": {
    mn: [
      "Гурван шооны нийлбэрийг харьцуулж их оноотой нь раунд хожин, хамгийн түрүүнд 5 ялалт авсан нь ялна.",
    ],
    en: [
      "Compare the sum of three dice each round, and the higher score wins the round, with the first to 5 wins taking the match.",
    ],
  },

  default: {
    mn: [
      "Тоглоомын дүрэм болон явцыг дэлгэц дээрх панелаас харж ойлгон, онлайн тоглоход автоматаар өрөөнд холбогдоно.",
    ],
    en: [
      "Follow the game rules from the on-screen panel, and the game will automatically connect you to an online room.",
    ],
  },
};

type Props = { gameType: string };

export function GameModalHowToBanner({ gameType }: Props) {
  const { language } = useApp();
  const isMn = language === "mn";
  const entry = HOW[gameType] ?? HOW["default"]!;
  const lines = isMn ? entry.mn : entry.en;

  return (
    <aside
      style={BANNER_STYLE}
      aria-label={isMn ? "Тоглохыг эхлүүлэх" : "How to start"}
    >
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
