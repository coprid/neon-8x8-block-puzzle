import { useState, useCallback, useRef, useEffect } from 'react';
import { generateFigurePool, getShapeCells, ColorKey, ShapeMatrix } from './gameShapes';

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

function createEmptyBoard(): Board {
  return Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null));
}

export function canPlaceFigure(board: Board, matrix: ShapeMatrix, boardRow: number, boardCol: number): boolean {
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

function getLinesToClear(board: Board): { rows: number[]; cols: number[] } {
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

function clearLines(board: Board, rows: number[], cols: number[]): Board {
  const newBoard = board.map(row => [...row]);
  for (const r of rows) {
    for (let c = 0; c < BOARD_SIZE; c++) newBoard[r][c] = null;
  }
  for (const c of cols) {
    for (let r = 0; r < BOARD_SIZE; r++) newBoard[r][c] = null;
  }
  return newBoard;
}

function calcScore(rowsCleared: number, colsCleared: number, cellsPlaced: number): number {
  const linesTotal = rowsCleared + colsCleared;
  let base = cellsPlaced * 10;
  if (linesTotal === 1) base += 80;
  else if (linesTotal === 2) base += 200;
  else if (linesTotal === 3) base += 400;
  else if (linesTotal >= 4) base += 800 + (linesTotal - 4) * 200;
  return base;
}

export function useGameLogic() {
  const [screen, setScreen] = useState<GameScreen>('menu');
  const [board, setBoard] = useState<Board>(createEmptyBoard());
  const [pool, setPool] = useState<(Figure | null)[]>([null, null, null]);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => {
    try { return parseInt(localStorage.getItem('blockpuzzle_best') || '0', 10) || 0; } catch { return 0; }
  });
  const [clearingCells, setClearingCells] = useState<ClearingCells>({ rows: new Set(), cols: new Set() });
  const [isClearing, setIsClearing] = useState(false);
  const [lastScore, setLastScore] = useState(0);
  const [comboText, setComboText] = useState<{ text: string; x: number; y: number; id: number } | null>(null);
  const [muted, setMuted] = useState(() => {
    try { return localStorage.getItem('blockpuzzle_muted') === 'true'; } catch { return false; }
  });

  // Keep mutable refs for use in async callbacks
  const boardRef = useRef<Board>(createEmptyBoard());
  const poolRef = useRef<(Figure | null)[]>([null, null, null]);
  const scoreRef = useRef(0);
  const isClearingRef = useRef(false);

  // FIX 1: added gameOverTimerRef
  const gameOverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // FIX 2: added comboTimerRef
  const comboTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mutedRef = useRef(muted);

  const audioCtx = useRef<AudioContext | null>(null);

  // FIX 3: cleanup all timers on unmount
  useEffect(() => {
    return () => {
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
      if (gameOverTimerRef.current) clearTimeout(gameOverTimerRef.current);
      if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
    };
  }, []);

  // FIX 4: removed `mutedRef.current = muted` from render body
  // It is now updated inside toggleMute

  // ── Audio helpers ──
  const getAudio = useCallback((): AudioContext | null => {
    if (mutedRef.current) return null;
    if (!audioCtx.current) {
      try { audioCtx.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)(); } catch { return null; }
    }
    return audioCtx.current;
  }, []);

  const playTone = useCallback((freq: number, type: OscillatorType, duration: number, vol = 0.18, delay = 0) => {
    const ctx = getAudio();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
      gain.gain.setValueAtTime(vol, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + duration);
    } catch { /* silent */ }
  }, [getAudio]);

  const playPlace = useCallback(() => {
    playTone(280, 'sine', 0.1, 0.15);
    playTone(380, 'sine', 0.07, 0.1, 0.05);
  }, [playTone]);

  const playClear = useCallback((lines: number) => {
    const base = lines >= 3 ? 660 : lines === 2 ? 550 : 440;
    playTone(base, 'sine', 0.25, 0.25);
    playTone(base * 1.5, 'sine', 0.2, 0.2, 0.1);
    if (lines >= 2) playTone(base * 2, 'sine', 0.18, 0.18, 0.2);
    if (lines >= 3) playTone(base * 2.5, 'triangle', 0.15, 0.15, 0.3);
  }, [playTone]);

  const playGameOver = useCallback(() => {
    playTone(220, 'sawtooth', 0.3, 0.2);
    playTone(165, 'sawtooth', 0.3, 0.2, 0.2);
    playTone(110, 'sawtooth', 0.4, 0.2, 0.4);
  }, [playTone]);

  const toggleMute = useCallback(() => {
    setMuted(m => {
      const next = !m;
      mutedRef.current = next; // FIX 4: update ref here instead of render body
      try { localStorage.setItem('blockpuzzle_muted', String(next)); } catch { /* silent */ }
      return next;
    });
  }, []);

  // ── Start / Reset game ──
  const startGame = useCallback(() => {
    // FIX 5: clear all timers on restart
    if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
    if (gameOverTimerRef.current) clearTimeout(gameOverTimerRef.current);
    if (comboTimerRef.current) clearTimeout(comboTimerRef.current);

    const emptyBoard = createEmptyBoard();
    const newPool = generateFigurePool(3);
    boardRef.current = emptyBoard;
    poolRef.current = newPool;
    scoreRef.current = 0;
    isClearingRef.current = false;
    setBoard(emptyBoard);
    setPool(newPool);
    setScore(0);
    setLastScore(0);
    setClearingCells({ rows: new Set(), cols: new Set() });
    setIsClearing(false);
    setComboText(null);
    setScreen('game');
  }, []);

  // ── Add score helper ──
  const addScore = useCallback((gained: number) => {
    scoreRef.current += gained;
    const next = scoreRef.current;
    setScore(next);
    setLastScore(gained);
    setBest(b => {
      if (next > b) {
        try { localStorage.setItem('blockpuzzle_best', String(next)); } catch { /* silent */ }
        return next;
      }
      return b;
    });
  }, []);

  // ── Game Over check ──
  const checkGameOver = useCallback((checkBoard: Board, checkPool: (Figure | null)[]) => {
    const activeFigures = checkPool.filter(Boolean) as Figure[];
    if (activeFigures.length === 0) return; // pool will regenerate
    const canMove = activeFigures.some(fig => canFigureFitAnywhere(checkBoard, fig.matrix));
    if (!canMove) {
      // FIX 1: store timer ID so we can cancel it on restart
      gameOverTimerRef.current = setTimeout(() => {
        playGameOver();
        setScreen('gameover');
      }, 150);
    }
  }, [playGameOver]);

  // ── Place a figure ──
  const placeFigure = useCallback((
    figureId: string,
    boardRow: number,
    boardCol: number,
    pointerX?: number,
    pointerY?: number,
  ): boolean => {
    if (isClearingRef.current) return false;

    const currentBoard = boardRef.current;
    const currentPool = poolRef.current;

    const figIdx = currentPool.findIndex(f => f?.id === figureId);
    if (figIdx === -1) return false;
    const figure = currentPool[figIdx];
    if (!figure) return false;

    if (!canPlaceFigure(currentBoard, figure.matrix, boardRow, boardCol)) return false;

    playPlace();

    // Place blocks on board
    const newBoard = currentBoard.map(row => [...row]);
    const cells = getShapeCells(figure.matrix);
    for (const [dr, dc] of cells) {
      newBoard[boardRow + dr][boardCol + dc] = { colorKey: figure.colorKey, figureId: figure.id };
    }
    boardRef.current = newBoard;
    setBoard(newBoard);

    // Update pool
    const newPool = [...currentPool];
    newPool[figIdx] = null;

    // Check if all used → regenerate
    const allUsed = newPool.every(f => f === null);
    const finalPool = allUsed ? generateFigurePool(3) : newPool;
    poolRef.current = finalPool;
    setPool(finalPool);

    // Detect lines
    const { rows, cols } = getLinesToClear(newBoard);
    const linesTotal = rows.length + cols.length;

    // Score for placed cells
    const gained = calcScore(rows.length, cols.length, cells.length);
    addScore(gained);

    if (linesTotal > 0) {
      playClear(linesTotal);

      // Combo text
      if (linesTotal >= 2) {
        const labels: Record<number, string> = { 2: 'DOUBLE!', 3: 'TRIPLE!', 4: 'QUAD!' };
        const txt = linesTotal >= 4 ? `${linesTotal}× COMBO!` : (labels[linesTotal] ?? `${linesTotal}× COMBO!`);
        setComboText({ text: txt, x: pointerX ?? window.innerWidth / 2, y: pointerY ?? 200, id: Date.now() });
        
        // FIX 2: clear previous combo timer before setting new one
        if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
        comboTimerRef.current = setTimeout(() => setComboText(null), 950);
      }

      // Flash animation
      setClearingCells({ rows: new Set(rows), cols: new Set(cols) });
      setIsClearing(true);
      isClearingRef.current = true;

      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
      clearTimerRef.current = setTimeout(() => {
        const clearedBoard = clearLines(newBoard, rows, cols);
        boardRef.current = clearedBoard;
        setClearingCells({ rows: new Set(), cols: new Set() });
        setIsClearing(false);
        isClearingRef.current = false;
        setBoard(clearedBoard);
        checkGameOver(clearedBoard, finalPool);
      }, 520);
    } else {
      checkGameOver(newBoard, finalPool);
    }

    return true;
  }, [addScore, checkGameOver, playPlace, playClear]);

  return {
    screen,
    board,
    pool,
    score,
    best,
    lastScore,
    clearingCells,
    isClearing,
    comboText,
    muted,
    startGame,
    placeFigure,
    toggleMute,
    setScreen,
  };
}