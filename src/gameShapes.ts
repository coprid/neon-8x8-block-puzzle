export type ShapeMatrix = (0 | 1)[][];

export interface ShapeDefinition {
  id: string;
  matrix: ShapeMatrix;
  colorKey: ColorKey;
}

export type ColorKey = 'blue' | 'green' | 'pink' | 'yellow' | 'orange' | 'purple';

export const COLOR_KEYS: ColorKey[] = ['blue', 'green', 'pink', 'yellow', 'orange', 'purple'];


// All possible shape matrices (trimmed, no padding)
const SHAPES: ShapeMatrix[] = [
  // ── Monomino ──
  [[1]],

  // ── Dominoes ──
  [[1, 1]],
  [[1], [1]],

  // ── Triominoes ──
  [[1, 1, 1]],
  [[1], [1], [1]],
  [[1, 1], [1, 0]],
  [[1, 1], [0, 1]],
  [[1, 0], [1, 1]],
  [[0, 1], [1, 1]],

  // ── 2×2 Square ──
  [[1, 1], [1, 1]],

  // ── Tetrominoes ──
  // I-piece horizontal
  [[1, 1, 1, 1]],
  // I-piece vertical
  [[1], [1], [1], [1]],
  // L-shape
  [[1, 0], [1, 0], [1, 1]],
  [[0, 1], [0, 1], [1, 1]],
  [[1, 1], [1, 0], [1, 0]],
  [[1, 1], [0, 1], [0, 1]],
  // L-horizontal variants
  [[1, 1, 1], [1, 0, 0]],
  [[1, 1, 1], [0, 0, 1]],
  [[1, 0, 0], [1, 1, 1]],
  [[0, 0, 1], [1, 1, 1]],
  // T-shape
  [[1, 1, 1], [0, 1, 0]],
  [[0, 1, 0], [1, 1, 1]],
  [[1, 0], [1, 1], [1, 0]],
  [[0, 1], [1, 1], [0, 1]],
  // S/Z shapes
  [[0, 1, 1], [1, 1, 0]],
  [[1, 1, 0], [0, 1, 1]],
  [[1, 0], [1, 1], [0, 1]],
  [[0, 1], [1, 1], [1, 0]],

  // ── 3×3 sub-shapes ──
  // 3-line
  [[1, 1, 1], [1, 1, 1]],
  [[1, 1], [1, 1], [1, 1]],

  // ── Pentominoes / 5-cell lines ──
  [[1, 1, 1, 1, 1]],
  [[1], [1], [1], [1], [1]],
];

let shapeIdCounter = 0;

function getRandomShape(): { matrix: ShapeMatrix; colorKey: ColorKey } {
  const matrix = SHAPES[Math.floor(Math.random() * SHAPES.length)];
  const colorKey = COLOR_KEYS[Math.floor(Math.random() * COLOR_KEYS.length)];
  return { matrix, colorKey };
}

export function generateFigurePool(count = 3): Array<{ id: string; matrix: ShapeMatrix; colorKey: ColorKey }> {
  return Array.from({ length: count }, () => {
    const { matrix, colorKey } = getRandomShape();
    return { id: `fig-${++shapeIdCounter}`, matrix, colorKey };
  });
}

/** Get all (row, col) offsets that a shape occupies given its matrix */
export function getShapeCells(matrix: ShapeMatrix): Array<[number, number]> {
  const cells: Array<[number, number]> = [];
  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix[r].length; c++) {
      if (matrix[r][c] === 1) cells.push([r, c]);
    }
  }
  return cells;
}
