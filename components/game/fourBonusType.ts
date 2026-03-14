// ═══════════════════════════════════════════════
//  four-bones-types.ts  –  Дөрвөн бэрх тоглоомын логик
// ═══════════════════════════════════════════════

export type ShagaiSide = "horse" | "sheep" | "goat" | "camel"

export interface ShagaiThrow {
  id:       number
  side:     ShagaiSide
  settled:  boolean
}

export interface RoundResult {
  sides:       ShagaiSide[]   // 4 шагайн үр дүн
  isDorvenBerkh: boolean      // Бүгд өөр өөр тал гарсан уу
  throwNumber:   number
}

export interface GameState {
  phase:       "idle" | "throwing" | "settling" | "result"
  throws:      ShagaiThrow[]          // 4 шагайн одоогийн байдал
  history:     RoundResult[]
  totalThrows: number
  wins:        number                  // Дөрвөн бэрх гарсан удаа
  streak:      number                  // Дараалсан дөрвөн бэрх
  bestStreak:  number
}

export const SHAGAI_INFO: Record<ShagaiSide, {
  name:    string
  symbol:  string
  color:   string
  glow:    string
  mongol:  string
}> = {
  horse: { name: "Морь",  symbol: "🐴", color: "#f0c040", glow: "rgba(240,192,64,0.6)",  mongol: "ᠮᠣᠷᠢ"  },
  sheep: { name: "Хонь",  symbol: "🐑", color: "#90d890", glow: "rgba(144,216,144,0.6)", mongol: "ᠬᠣᠨᠢ"  },
  goat:  { name: "Ямаа",  symbol: "🐐", color: "#c8956a", glow: "rgba(200,149,106,0.6)", mongol: "ᠢᠮᠠᠭ᠎ᠠ" },
  camel: { name: "Тэмээ", symbol: "🐫", color: "#e0a050", glow: "rgba(224,160,80,0.6)",  mongol: "ᠲᠡᠮᠡᠭᠡ"  },
}

// Нэг шагайн тал тодорхойлох
export function detectSide(rotX: number, rotZ: number): ShagaiSide {
  const norm = (a: number) => ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)
  const rx = norm(rotX)
  const rz = norm(rotZ)
  const xFlat = rx < 0.45 || rx > 5.83
  const xFlip = rx > 2.70 && rx < 3.58
  const zFlip = rz > 2.70 && rz < 3.58
  if (xFlat && !xFlip) return "horse"
  if (xFlip && zFlip)  return "camel"
  if (zFlip && !xFlip) return "sheep"
  return "goat"
}

// Дөрвөн бэрх шалгах: 4 өөр тал гарсан уу
export function isDorvenBerkh(sides: ShagaiSide[]): boolean {
  if (sides.length < 4) return false
  const set = new Set(sides)
  return set.size === 4
}

// Үр дүнгийн мэдэгдэл
export function getResultMessage(sides: ShagaiSide[], isWin: boolean): string {
  if (isWin) {
    return "🎊 ДӨРВӨН БЭРХ! Бүх 4 тал гарлаа — их аз!"
  }
  const counts: Record<string, number> = {}
  sides.forEach(s => { counts[s] = (counts[s] || 0) + 1 })
  const dupes = Object.entries(counts).filter(([,v]) => v > 1)
  if (dupes.length) {
    const names = dupes.map(([k]) => SHAGAI_INFO[k as ShagaiSide].name).join(", ")
    return `${names} давхарласан. Дахин шидэ!`
  }
  return "Дахин оролдоорой!"
}

export const INITIAL_STATE: GameState = {
  phase:       "idle",
  throws:      [],
  history:     [],
  totalThrows: 0,
  wins:        0,
  streak:      0,
  bestStreak:  0,
}