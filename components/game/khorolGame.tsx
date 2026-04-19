"use client";

import { useApp } from "@/components/AppContext";
import { useMemo, type CSSProperties } from "react";
import {
  LuLayers as IconLayers,
  LuUsers as IconUsers,
  LuSparkles as IconSparkles,
} from "react-icons/lu";

const GOLD = "#c8a030";
const GOLD_DIM = "rgba(200,160,48,0.35)";
const BG_CARD = "rgba(20,16,10,0.92)";

const HAND_PIECES = [
  { name: "Чандмань", count: 4 },
  { name: "Хорол", count: 4 },
  { name: "Өлзий / Арслан", count: 4 },
];

const GROUND_PIECES = [
  { name: "Луу", count: 4 },
  { name: "Могой", count: 4 },
  { name: "Морь", count: 4 },
  { name: "Хонь", count: 4 },
  { name: "Бич", count: 4 },
  { name: "Тахиа", count: 4 },
  { name: "Нохой", count: 4 },
  { name: "Гахай", count: 4 },
  { name: "Хулгана", count: 4 },
  { name: "Үхэр", count: 4 },
  { name: "Бар", count: 4 },
  { name: "Туулай", count: 4 },
];

/** Дээрээс доош — хамгийн томоос хамгийн бага руу */
const HIERARCHY_LADDER = [
  "Чандмань",
  "Хорол",
  "Өлзий / Арслан",
  "Луу",
  "Могой",
  "Морь",
  "Хонь",
  "Бич",
  "Тахиа",
  "Нохой",
  "Гахай",
  "Хулгана",
  "Үхэр",
  "Бар",
  "Туулай",
];

type Copy = {
  title: string;
  subtitle: string;
  intro: string;
  handTitle: string;
  groundTitle: string;
  hierarchyTitle: string;
  hierarchyNote: string;
  playTitle: string;
  playLead: string;
  evenTitle: string;
  evenBody: string[];
  oddTitle: string;
  oddBody: string[];
  jinTitle: string;
  jinBody: string[];
  horsesTitle: string;
  horsesBody: string[];
  closing: string;
  footnote: string;
};

function useCopy(): Copy {
  const { language } = useApp();
  return useMemo(() => {
    if (language === "mn") {
      return {
        title: "Хорол",
        subtitle: "Зэндмэнэ · 60 мод",
        intro:
          "Хорол буюу Зэндмэнэ нь гарын болон газрын мод гэсэн хоёр хэсэгтэй, нийт 60 ширхэг модтой уламжлалт тоглоом. Хамгийн том нь Чандмань, хамгийн бага нь Туулай. Дээр бичсэн дарааллаар мод бүр доорх бүх модыг ахална (жишээ нь: Луу нь Могойноос эхлэн Туулай хүртэлх бүх модыг ахална).",
        handTitle: "Гарын мод (12)",
        groundTitle: "Газрын мод (48)",
        hierarchyTitle: "Ахалтын дараалал",
        hierarchyNote:
          "Дээд тал нь доод талдаа илүү хүчтэй. Туулай хамгийн бага мод.",
        playTitle: "Ерөнхий тоглолт",
        playLead:
          "Эхний тоглогч модоо дангаар эсвэл ижилсүүлэн гаргана. Дараагийнх нь ахлах эсвэл дагуулан өгөх журмаар үргэлжилнэ.",
        evenTitle: "Тэгш тоотой тоглогч (талцаж тоглох)",
        evenBody: [
          "Жишээ нь 6 хүн: модоо доош харуулан холиод 5, 5-аар давхарлан дугуйлан тавина. Нэг хүн 2 гэр буюу 10 модоор тоглоно.",
          "Хэн эхэлж сөхөхийг талцаана. Сөхөхгүй тал нь жин хэлнэ.",
          "Жинг хэлэхдээ мориноос дооших амьтны аль нэгийг сонгоно. Тэр нь тухайн тоглолтын хамгийн том «жин» мод болно.",
          "Жин нь Чандманийг хүртэл ахалдаг.",
          "Тоглоом дуусахад олон гэр барьсан тал хожино.",
        ],
        oddTitle: "Сондгой тоотой тоглогч (цай хураах)",
        oddBody: [
          "Жишээ нь 5 хүн: цай авахдаа Чандмань, Хорол, Өлзий/Арслан, Луу, Могойноос тус бүр 2-ыг авч нийт 10 цай болгоно; нэг хүнд 2-ыг тараана.",
          "Үлдсэн 50 модыг доош харуулан холиод 5, 5-аар давхарлан дугуйлан тавина (нэг хүн 10 мод).",
          "Хамгийн ахмад настай хүн эхэлж сөхөнө. Ахмадын баруун гар талд суусан хүн жин хэлнэ (мориноос доош амьтан).",
          "Тоглоом дуусахад хамгийн олон цай (10 цай) хураасан хүн хожино.",
        ],
        jinTitle: "Жин",
        jinBody: [
          "Жин нь тухайн тоглолтын хамгийн том мод; доорх бүх «дундаж» модыг ахална.",
          "Жингийн дүрэм нь Чандманийг хүртэл үйлчилнэ.",
        ],
        horsesTitle: "Азын дөрвөн морь",
        horsesBody: [
          "Нэг тоглогчид зэрэг 4 морь ирвэл «азын 4 морь» гэж тооцогдоно.",
          "Дөрвөн морь өөр ямар ч модыг ахалдаггүй; дөрвөн морьгоор зэрэг дөрвөн гэр барьж болно.",
        ],
        closing:
          "Энэ дэлгэц нь уламжлалт дүрмийн товч тайлбар. Бүрэн дижитал тоглолт хөгжүүлэгдэж байна.",
        footnote:
          "Сондгой тоотой хувилбар нь даалууны цай хураах тоглоомтой ойролцоо.",
      };
    }
    return {
      title: "Khorol",
      subtitle: "Zendmene · 60 wooden pieces",
      intro:
        "Khorol (Zendmene) is a traditional Mongolian game with 60 pieces: twelve “hand” pieces and forty-eight “ground” pieces. Chandman is strongest; Rabbit is weakest. Each piece outranks every piece listed below it (e.g. Dragon outranks Snake through Rabbit).",
      handTitle: "Hand pieces (12)",
      groundTitle: "Ground pieces (48)",
      hierarchyTitle: "Strength order",
      hierarchyNote: "Higher beats lower. Rabbit is the weakest.",
      playTitle: "How a trick flows",
      playLead:
        "The leader plays singles or multiples of the same rank. The next players must beat or follow according to house rules.",
      evenTitle: "Even number of players (team / gers)",
      evenBody: [
        "Example with six players: pieces face down, shuffled, stacked in fives in a circle. Each player holds two “gers” (10 pieces).",
        "Sides compete for who cuts first. The side that does not cut names the trump (jin).",
        "Trump is chosen from the ground animals below Horse. That rank becomes the top trump for the deal; trump ranks up to Chandman.",
        "The side that builds more gers wins.",
      ],
      oddTitle: "Odd number of players (tea scoring)",
      oddBody: [
        "Example with five players: “tea” is dealt from Chandman, Khorol, Olzii/Arslan, Dragon, and Snake — two of each (10 tea), two per person.",
        "The remaining 50 pieces are shuffled face down and stacked in fives as usual (10 pieces per player).",
        "The eldest player cuts first; the person to their right names trump (an animal below Horse).",
        "When the game ends, the player who collected the most tea (e.g. all 10) wins.",
      ],
      jinTitle: "Trump (jin)",
      jinBody: [
        "Jin is the strongest rank for that round among the regular pieces.",
        "The jin rules extend up through Chandman.",
      ],
      horsesTitle: "Lucky four horses",
      horsesBody: [
        "If one player is dealt four Horses at once, it counts as “lucky four horses.”",
        "Those four Horses outrank nothing else, but may take four gers at once.",
      ],
      closing:
        "This screen summarizes the traditional rules. A full digital table is planned.",
      footnote:
        "The odd-player tea variant is similar to collecting tea in daaluu.",
    };
  }, [language]);
}

function SectionTitle({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <h2
      className="flex items-center gap-2 text-base font-semibold tracking-wide mt-8 mb-3"
      style={{ color: GOLD, fontFamily: "var(--font-inter), system-ui" }}
    >
      <span className="opacity-90">{icon}</span>
      {children}
    </h2>
  );
}

function PieceTable({
  rows,
  accent,
}: {
  rows: { name: string; count: number }[];
  accent: string;
}) {
  return (
    <div
      className="rounded-xl overflow-hidden border text-sm"
      style={{ borderColor: GOLD_DIM, background: BG_CARD }}
    >
      <table className="w-full border-collapse">
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.name}
              className="border-t first:border-t-0"
              style={{ borderColor: GOLD_DIM }}
            >
              <td className="px-3 py-2 text-white/90">{r.name}</td>
              <td
                className="px-3 py-2 text-right tabular-nums font-medium"
                style={{ color: accent }}
              >
                ×{r.count}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function KhorolGame() {
  const c = useCopy();

  const scrollStyle: CSSProperties = {
    height: "100%",
    overflowY: "auto",
    padding: "1.25rem 1.25rem 3rem",
    fontFamily: "var(--font-inter), system-ui, sans-serif",
    color: "rgba(255,255,255,0.88)",
  };

  return (
    <div style={scrollStyle}>
      <header className="text-center mb-6 pt-2">
        <div
          className="text-xs uppercase tracking-[0.35em] mb-2"
          style={{ color: GOLD_DIM }}
        >
          {c.subtitle}
        </div>
        <h1
          className="text-2xl md:text-3xl font-bold tracking-[0.12em]"
          style={{ color: GOLD }}
        >
          {c.title}
        </h1>
        <p className="mt-4 max-w-3xl mx-auto text-sm leading-relaxed text-white/75">
          {c.intro}
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-4 max-w-5xl mx-auto">
        <div>
          <SectionTitle icon={<IconLayers size={18} />}>{c.handTitle}</SectionTitle>
          <PieceTable rows={HAND_PIECES} accent={GOLD} />
        </div>
        <div>
          <SectionTitle icon={<IconLayers size={18} />}>
            {c.groundTitle}
          </SectionTitle>
          <PieceTable rows={GROUND_PIECES} accent="#daa520" />
        </div>
      </div>

      <div className="max-w-5xl mx-auto">
        <SectionTitle icon={<IconSparkles size={18} />}>
          {c.hierarchyTitle}
        </SectionTitle>
        <p className="text-sm text-white/65 mb-3">{c.hierarchyNote}</p>
        <div
          className="flex flex-wrap gap-2 rounded-xl p-4 border"
          style={{ borderColor: GOLD_DIM, background: BG_CARD }}
        >
          {HIERARCHY_LADDER.map((name, i) => (
            <span key={name} className="contents">
              <span
                className="inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-medium"
                style={{
                  background:
                    i === 0
                      ? "rgba(200,160,48,0.25)"
                      : "rgba(255,255,255,0.06)",
                  color: i === 0 ? GOLD : "rgba(255,255,255,0.85)",
                  border: `1px solid ${i === 0 ? GOLD_DIM : "rgba(255,255,255,0.08)"}`,
                }}
              >
                {i + 1}. {name}
              </span>
              {i < HIERARCHY_LADDER.length - 1 && (
                <span className="text-white/25 text-xs self-center">›</span>
              )}
            </span>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto">
        <SectionTitle icon={<IconUsers size={18} />}>{c.playTitle}</SectionTitle>
        <p className="text-sm leading-relaxed text-white/80 mb-6">{c.playLead}</p>

        <h3 className="text-sm font-semibold mb-2" style={{ color: "#8cb4d4" }}>
          {c.evenTitle}
        </h3>
        <ul className="list-disc pl-5 space-y-2 text-sm text-white/75 mb-8">
          {c.evenBody.map((line) => (
            <li key={line.slice(0, 40)}>{line}</li>
          ))}
        </ul>

        <h3 className="text-sm font-semibold mb-2" style={{ color: "#c9a0dc" }}>
          {c.oddTitle}
        </h3>
        <ul className="list-disc pl-5 space-y-2 text-sm text-white/75 mb-8">
          {c.oddBody.map((line) => (
            <li key={line.slice(0, 40)}>{line}</li>
          ))}
        </ul>

        <h3 className="text-sm font-semibold mb-2" style={{ color: GOLD }}>
          {c.jinTitle}
        </h3>
        <ul className="list-disc pl-5 space-y-2 text-sm text-white/75 mb-6">
          {c.jinBody.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>

        <h3 className="text-sm font-semibold mb-2" style={{ color: "#7ec8a3" }}>
          {c.horsesTitle}
        </h3>
        <ul className="list-disc pl-5 space-y-2 text-sm text-white/75 mb-8">
          {c.horsesBody.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>

        <p className="text-xs text-white/45 leading-relaxed border-t border-white/10 pt-4">
          {c.closing}
        </p>
        <p className="text-xs text-white/40 mt-2 italic">{c.footnote}</p>
      </div>
    </div>
  );
}
