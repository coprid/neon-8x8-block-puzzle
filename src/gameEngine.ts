import { ColorKey, ShapeMatrix, getShapeCells } from './gameShapes';

export const BOARD_SIZE = 8;

export interface CellData {
  colorKey: ColorKey;
  figureId: string;
}

export type Board = (CellData | null)[][];

export interface Figure {
  id: string;
  matrix: ShapeMatrix;
  colorKey: ColorKey;
}

export type GameScreen = 'menu' | 'game' | 'gameover';

export interface ClearingCells {
  rows: Set<number>;
  cols: Set<number>;
}

export function createEmptyBoard(): Board {
  return Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null));
}

export function canPlaceFigure(
  board: Board,
  matrix: ShapeMatrix,
  boardRow: number,
  boardCol: number
): boolean {
  const cells = getShapeCells(matrix);
  for (const [dr, dc] of cells) {
    const r = boardRow + dr;
    const c = boardCol + dc;
    if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) return false;
    if (board[r][c] !== null) return false;
  }
  return true;
}

export function canFigureFitAnywhere(board: Board, matrix: ShapeMatrix): boolean {
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (canPlaceFigure(board, matrix, r, c)) return true;
    }
  }
  return false;
}

export function getLinesToClear(board: Board): { rows: number[]; cols: number[] } {
  const rows: number[] = [];
  const cols: number[] = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    if (board[r].every(cell => cell !== null)) rows.push(r);
  }
  for (let c = 0; c < BOARD_SIZE; c++) {
    if (board.every(row => row[c] !== null)) cols.push(c);
  }
  return { rows, cols };
}

export function clearLines(board: Board, rows: number[], cols: number[]): Board {
  const newBoard = board.map(row => [...row]);
  for (const r of rows) {
    for (let c = 0; c < BOARD_SIZE; c++) newBoard[r][c] = null;
  }
  for (const c of cols) {
    for (let r = 0; r < BOARD_SIZE; r++) newBoard[r][c] = null;
  }
  return newBoard;
}
// Чистая механика размещения: возвращает НОВУЮ доску с фигурой на позиции (row, col).
// Валидность хода здесь НЕ проверяется — это ответственность вызывающего (canPlaceFigure).
export function placeFigureOnBoard(
  board: Board,
  figure: Figure,
  row: number,
  col: number,
): Board {
  const next = board.map(r => [...r]);
  for (const [dr, dc] of getShapeCells(figure.matrix)) {
    next[row + dr][col + dc] = { colorKey: figure.colorKey, figureId: figure.id };
  }
  return next;
}
// Чистая механика пула: обнуляет слот и сообщает, опустел ли пул целиком.
// Регенерацию нового пула здесь НЕ делаем — вызывающий решит сам по флагу depleted.
export function withFigureRemoved(
  pool: ReadonlyArray<Figure | null>,
  index: number,
): { pool: (Figure | null)[]; depleted: boolean } {
  const next = pool.slice();
  next[index] = null;
  return { pool: next, depleted: next.every(f => f === null) };
}
export const SCORING = {
  PER_CELL: 10,
  BONUS_1_LINE: 80,
  BONUS_2_LINES: 200,
  BONUS_3_LINES: 400,
  BONUS_4_LINES: 800,
  PER_EXTRA_LINE: 200, // за каждую линию сверх четырёх
} as const;

export function calcScore(rowsCleared: number, colsCleared: number, cellsPlaced: number): number {
  const linesTotal = rowsCleared + colsCleared;
  let base = cellsPlaced * SCORING.PER_CELL;
  if (linesTotal === 1) base += SCORING.BONUS_1_LINE;
  else if (linesTotal === 2) base += SCORING.BONUS_2_LINES;
  else if (linesTotal === 3) base += SCORING.BONUS_3_LINES;
  else if (linesTotal >= 4) base += SCORING.BONUS_4_LINES + (linesTotal - 4) * SCORING.PER_EXTRA_LINE;
  return base;
}