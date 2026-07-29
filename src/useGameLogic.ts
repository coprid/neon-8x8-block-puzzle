import { useState, useCallback, useRef, useEffect } from 'react';
import { generateFigurePool, getShapeCells } from './gameShapes';
import { useAudio } from './hooks/useAudio';
import {
  BOARD_SIZE,
  Board,
  Figure,
  GameScreen,
  ClearingCells,
  createEmptyBoard,
  canPlaceFigure,
  canFigureFitAnywhere,
  getLinesToClear,
  clearLines,
  calcScore,
} from './gameEngine';

export type { Board, ClearingCells };
export { BOARD_SIZE };

interface PrevState {
  board: Board;
  pool: (Figure | null)[];
  score: number;
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

  // Audio hook
  const { playPlace, playClear, playGameOver } = useAudio(muted);

  // Mutable refs for async callbacks
  const boardRef = useRef<Board>(createEmptyBoard());
  const poolRef = useRef<(Figure | null)[]>([null, null, null]);
  const scoreRef = useRef(0);
  const isClearingRef = useRef(false);
  const prevStateRef = useRef<PrevState | null>(null);

  const gameOverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const comboTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
      if (gameOverTimerRef.current) clearTimeout(gameOverTimerRef.current);
      if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
    };
  }, []);

  const toggleMute = useCallback(() => {
    setMuted(m => {
      const next = !m;
      try { localStorage.setItem('blockpuzzle_muted', String(next)); } catch { /* silent */ }
      return next;
    });
  }, []);

  // ── Start / Reset game ──
  const startGame = useCallback(() => {
    if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
    if (gameOverTimerRef.current) clearTimeout(gameOverTimerRef.current);
    if (comboTimerRef.current) clearTimeout(comboTimerRef.current);

    const emptyBoard = createEmptyBoard();
    const newPool = generateFigurePool(3);
    boardRef.current = emptyBoard;
    poolRef.current = newPool;
    scoreRef.current = 0;
    isClearingRef.current = false;
    prevStateRef.current = null;
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
    if (activeFigures.length === 0) return;
    const canMove = activeFigures.some(fig => canFigureFitAnywhere(checkBoard, fig.matrix));
    if (!canMove) {
      gameOverTimerRef.current = setTimeout(() => {
        playGameOver();
        setScreen('gameover');
      }, 150);
    }
  }, [playGameOver]);

  // ── Undo (1 step) ──
  const undo = useCallback(() => {
    if (isClearingRef.current) return;
    if (!prevStateRef.current) return;

    // Cancel pending timers
    if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
    if (gameOverTimerRef.current) clearTimeout(gameOverTimerRef.current);
    if (comboTimerRef.current) clearTimeout(comboTimerRef.current);

    const prev = prevStateRef.current;
    boardRef.current = prev.board;
    poolRef.current = prev.pool;
    scoreRef.current = prev.score;

    setBoard(prev.board);
    setPool(prev.pool);
    setScore(prev.score);
    setClearingCells({ rows: new Set(), cols: new Set() });
    setIsClearing(false);
    isClearingRef.current = false;
    setComboText(null);
    setLastScore(0);
    prevStateRef.current = null;

    if (screen === 'gameover') {
      setScreen('game');
    }
  }, [screen]);

  const canUndo = prevStateRef.current !== null && !isClearing;

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

    // Save state for undo (only 1 step)
    prevStateRef.current = {
      board: currentBoard.map(row => [...row]),
      pool: [...currentPool],
      score: scoreRef.current,
    };

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
    canUndo,
    startGame,
    placeFigure,
    toggleMute,
    undo,
    setScreen,
  };
}