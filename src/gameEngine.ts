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

export function calcScore(rowsCleared: number, colsCleared: number, cellsPlaced: number): number {
  const linesTotal = rowsCleared + colsCleared;
  let base = cellsPlaced * 10;
  if (linesTotal === 1) base += 80;
  else if (linesTotal === 2) base += 200;
  else if (linesTotal === 3) base += 400;
  else if (linesTotal >= 4) base += 800 + (linesTotal - 4) * 200;
  return base;
}