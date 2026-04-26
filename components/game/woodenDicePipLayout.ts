/**
 * 3×3 cell indices [row, col] 0..2 (standard d6 pips) for values 1…6.
 * Shared by 2D readout and 3D face geometry.
 */
export const DICE_PIP_CELLS: Record<1 | 2 | 3 | 4 | 5 | 6, [number, number][]> =
  {
    1: [[1, 1]],
    2: [
      [0, 0],
      [2, 2],
    ],
    3: [
      [0, 0],
      [1, 1],
      [2, 2],
    ],
    4: [
      [0, 0],
      [0, 2],
      [2, 0],
      [2, 2],
    ],
    5: [
      [0, 0],
      [0, 2],
      [1, 1],
      [2, 0],
      [2, 2],
    ],
    6: [
      [0, 0],
      [0, 1],
      [0, 2],
      [2, 0],
      [2, 1],
      [2, 2],
    ],
  };

const HALF = 0.24;
const FACE = HALF + 0.0012;
const G = 0.075;

export function pipCenters3D(
  out: "+y" | "-y" | "+x" | "-x" | "+z" | "-z",
  n: 1 | 2 | 3 | 4 | 5 | 6,
): [number, number, number][] {
  const cells = DICE_PIP_CELLS[n] ?? DICE_PIP_CELLS[1];
  return cells.map(([r, c]) => {
    const u = (c - 1) * G; // -G, 0, +G
    const t = (1 - r) * G; // row0 -> +, row2 -> -
    switch (out) {
      case "+y":
        return [u, FACE, t] as [number, number, number];
      case "-y":
        return [u, -FACE, t] as [number, number, number];
      case "+x":
        return [FACE, t, u] as [number, number, number];
      case "-x":
        return [-FACE, t, u] as [number, number, number];
      case "+z":
        return [u, t, FACE] as [number, number, number];
      case "-z":
        return [u, t, -FACE] as [number, number, number];
    }
  });
}
