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
      "Зорилт: өгөгдсөн этгээд (зарим түвшин) — дэлгэц дээрх дүрсийг бодитоор бүрдүүлнэ.",
      "Маш чухал: зөвхөн заасан дараалаар (1 → 2 → 3 …) «түгждэг»; дарааллыг алхам алхмаар дагахгүй бол гүйцэхгүй.",
      "Хэсгийг дарж сонгоод чирнэ, одтой тойрогт ойртуулж, хулганы товч тавиад түгжинэ. Q/E — нарийвчлалтай эргүүлэх.",
      "Алхам, эргэлт, түгжилт — зүүн панелын «Тоглоомын тухай»/About дээр бүрэн тайлбартай. Оноо/дуусах нь түвшинд.",
    ],
    en: [
      "Goal: assemble the 3D shape for the current level, piece by piece (see the level title on screen).",
      "You must lock pieces only in the order shown (1, 2, 3…). Skipping or wrong order will block progress.",
      "Click a piece to select, drag it near the gold target ring, release the mouse to lock. Q/E — small rotations.",
      "All steps, controls, and win/lose are also in the in-game «About the game» panel (left / bottom).",
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
      "«Чулуун овоо» — 5 товч/байрлал: эхлээд дэлгэц дээр дараалал «гялс» харагдана, дараа нь тэр дарааллыг дарж давтана (санах тоглоом, Simon-ийн нэг төрөл).",
      "Алхам бүрт нэг шинэ товч нэмэгдэнэ; нэг нь ч буруу бол дуусна. 10 алхамтай (10 дараалал) дарааллыг алдаагүй явуулсан = ялалт.",
      "2 тоглогч (онлайн): өрөөнд нэгдэж, эзэн эхлүүлнэ. Зүүн=эзэн, баруун=зочин. Оноо хоёр талд ялгаатай — тоглолт доторхи самбар зарлагаа харуулна.",
      "Доор: чулуу 1–5, «Эхлэх», үе фаз. Дэлгэрийн товч, заавар доороо.",
    ],
    en: [
      "“Stone cairn memory”: 5 stone buttons. A pattern flashes; you must repeat it in the same order (like Simon / memory).",
      "Each successful round, the pattern grows by one new step. One wrong tap and the run ends. Complete a 10-step sequence to win the solo run.",
      "2-player online: join a room, host starts; host = left, guest = right. Scores and winner follow the in-game match UI.",
      "In-game: numbered stones 1–5, “Start”, phase hints — read the line under the title on the play screen.",
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
  "twelve-shagai": {
    mn: [
      "Хоёр тоглогч ээлжлэн, нар зөв. Нэг удаа 2, 3 эсвэл 4 шагай сонгоод шиднэ (өөрөө 12 удаа биш — нэг удаа шагайн тоо л сонгогдоно).",
      "Оноо: дээр нь тод гарсан тал нь зөвхөн «морь» (🐴) бол 1 оноо; нэг удаа гарсан морь тутамд 1-ээр нийлгэнэ. Хонь, ямаа, тэмээ — энэ 12 жилд оноо биш.",
      "Хоёр тоглогчийн нийт «морины оноо»-гоор уралдана: анхы 12 морины оноо хүрсэн нь хожино (шидэлтийн тоо бус, нийлбэр оноо).",
      "Нэг дэлгэц / робот: доорхи панел. «Дүрмийн товчоо»-ыг нээн заавраа уншина. Онлайн: дээд «Online» → өрөө, бэлэн — эзэн тоглолт эхлүүлнэ; зүүн=эзэн, баруун=зочин.",
    ],
    en: [
      "Two players, alternating turns. Each turn, choose 2, 3, or 4 shagai to throw in one go (this is the count per throw, not “12 times”).",
      "Scoring: when they stop, only faces showing horse (🐴) count — one horse face = +1 point. Sheep, goat, camel on top do not add points in this 12-goal game.",
      "The running score is your horse-points, not the number of throws. First to reach 12 total horse-points wins the match.",
      "Use the in-game “How it works” box at the bottom. Online: top “Online” → room → Ready, host starts; host = left name, guest = right.",
    ],
  },
  "berkh-12-shagai": {
    mn: [
      "2–4 тоглогч, нар зөв. Нэг ээлжид 12 шагайг зэрэг оруулна. Төвд 48 «морь»-ны сан; эхэнд бүгд 0, авалт/төлбөр эндээс.",
      "Оноо: дээрх тал нь морь бол — гарсан хэднээр (төвд байгаа хүртэл) хувьдаа авна. Хонь, ямаа энэ дүрмэнд тоолохгүй; төлбөр: зөвхөн тэмээ (🐫).",
      "Тэмээ: өөрийнхөөс 1, 1-аар сөрөгдүүдэд, эсрэг нарын дарааллаар. Тийм мориор төлж чадахгүй бол тоглогч хасагдна, үлдсэн нь төвд очиж бусдад шилжинэ.",
      "Хожих: бүх 48-ыг нэгэнд, эсвэл сүүлд ганц тоглогч үлдсэн, эсвэл олон ээлжийг дуусаад хамгийн олон морь — нөхцөл панелд. Хязгаар ээлжийн дараа нийтээр нь хамгийн олонтойд.",
      "Нэг дэлгэц / «Дүрмийн товчоо» доор. Онлайн: дээд өрөө, эзэн эхлүүлнэ.",
    ],
    en: [
      "2–4 players, sunwise. Each turn, throw all 12 shagai. A central pot of 48 “mory” mories; you start with 0 and only move mories to/from the pot and each other as below.",
      "Horses: count horse faces; take that many mory from the pot to your hand (up to what’s left). Sheeps/goat faces don’t add in this simple rule; camels force payment, see next.",
      "Camels: for each camel, pay 1 mory from your pile, one mory to each opponent, counter-sun. If you can’t pay, you are eliminated and your mories go to the pot.",
      "Win: hold all 48, or be the last one standing, or after a long run of turns, the most mory — the bottom panel and “How it works” list the same rules.",
      "Online: top bar room, Ready, host starts. Local: full text in the bottom “How it works” section.",
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
      "Дөрвөн тэмдэг: морь, тэмээ, үхэр, хонь — сүлжээт ялалт: морь → тэмээ → үхэр → хонь → морь (4-аас 4-ийг дарж түрүүлнэ).",
      "Ээлж бүрийг дуусаад оноо нэр дээр нь нэмэгдэнэ (хэн ялснаас хамаарч — тэнцвэр, олноор нэг сонгосон гэх мэт).",
      "Анхы 7 нийт оноог (гадаад тоглолтонд таны/суудлын) хүрсэн нь ялна. Ганцаар: ногоон «Та»; гурван ботын эсрэг.",
      "Доор: ээлж, сонголт, оноо самбар. «Морь → тэмээ → …» мөрийг панелын нэрээр нь унш.",
    ],
    en: [
      "Four emblems: horse, camel, ox, sheep. They form a 4-beat “who beats whom” cycle: horse → camel → ox → sheep → horse (each symbol beats the next in the list).",
      "Each round, all four “seats” pick a symbol, then the game scores the round: who beats whom, ties, and bonus rules—your total increases toward the win target.",
      "Solo: you (green) vs three bots. First to 7 total points on your own counter wins. Online: room with host, same scoring idea on each seat (see the match panel).",
      "In-game: round counter, your pick buttons, and four score columns — the short line under the title restates the cycle in Mongolian or English.",
    ],
  },
  "wooden-dice": {
    mn: [
      "Куб бүрт 1–6 цэг (3 модон шоо, нэг удаа 3-ыг нэгт шиднэ) — нэг тоглолтын (ээлжийн) нийлбэрийн их багийг харьцуулж, тэр ээлжийн оноо авна (өндрийн хосын ялгах).",
      "Үнэлгээ: нэг тоглолт тутам 3×6 талтай 3 шоогийн **нийлбэр** — таных өрсөлдөгчөөс их бол та тэр ээлжид 1 оноо. Хэн хүртэл **5** энэ төрлийн ялалт авсан = тоглолтонд ялна.",
      "2 тоглогч: онлайн — дээд товчоор өрөө, бэлэн, эзэн эхлүүлнэ. Зүүн=эзэн (Та), баруун=зочин. Ганц тоглогч: доороос «Өнгө шидэх»-ээр эхлэх.",
      "3D нь дүрслэл: оноо нь зөвхөн гурван 1–6-ын нийлбэр (хамгийн багадаа 3, хамгийн ихдэ 18).",
    ],
    en: [
      "Three six-sided (wood) dice, rolled at once. Compare the sum of the three dice for you vs the opponent: higher sum wins the round; equal = no one scores that round.",
      "The match is “first to 5 **round** wins” (the small scores under the title: you vs foe), not one big number — every round, both sides roll 3 dice again and compare the sums again.",
      "2-player online: use the top bar — room, Ready, host starts; host = left, guest = right. Solo: you vs the in-game “foe” with the same rule.",
      "The 3D view is for atmosphere; the rule is only the two triples of numbers and which total is higher.",
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
