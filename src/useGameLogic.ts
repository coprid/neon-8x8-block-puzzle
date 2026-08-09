import { useState, useCallback, useRef, useEffect } from 'react';
import { generateFigurePool, getShapeCells } from './gameShapes';
import { useAudio } from './hooks/useAudio';
import { initYandexSdk, loadCloudBest, saveCloudBest } from './yandexSdk';
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
  placeFigureOnBoard,
  withFigureRemoved,
  calcScore,
} from './gameEngine';

// ⚠ CLEAR_ANIM_MS держать равным длительности @keyframes cellFlash в index.css (сейчас 0.52s)
const TIMING = {
  CLEAR_ANIM_MS: 520,
  COMBO_TEXT_MS: 950,
  GAME_OVER_DELAY_MS: 150,
} as const;

interface PrevState {
  board: Board;
  pool: (Figure | null)[];
  score: number;
  streak: number;
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
  const [volume, setVolumeState] = useState(() => {
    try {
      const s = parseFloat(localStorage.getItem('blockpuzzle_volume') ?? '1');
      return Number.isFinite(s) ? Math.min(1, Math.max(0, s)) : 1;
    } catch { return 1; }
  });
  const [hasSnapshot, setHasSnapshot] = useState(false);
  // Audio hook
  const { playPlace, playClear, playGameOver } = useAudio(muted, volume);

  // Mutable refs for async callbacks
  const boardRef = useRef<Board>(createEmptyBoard());
  const poolRef = useRef<(Figure | null)[]>([null, null, null]);
  const scoreRef = useRef(0);
  const streakRef = useRef(0);
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
  // Достаём рекорд из облака Яндекса и объединяем с местным (побеждает больший)
  useEffect(() => {
    let cancelled = false;
    initYandexSdk().then(loadCloudBest).then((cloudBest) => {
      if (cancelled || cloudBest == null) return;
      setBest(b => {
        const merged = Math.max(b, cloudBest);
        if (merged > b) {
          try { localStorage.setItem('blockpuzzle_best', String(merged)); } catch { /* silent */ }
        }
        return merged;
      });
    });
    return () => { cancelled = true; };
  }, []);
   const toggleMute = useCallback(() => {
    setMuted(m => {
      const next = !m;
      try { localStorage.setItem('blockpuzzle_muted', String(next)); } catch { /* silent */ }
      return next;
    });
  }, []);
  const setVolume = useCallback((v: number) => {
    const clamped = Math.min(1, Math.max(0, v));
    setVolumeState(clamped);
    try { localStorage.setItem('blockpuzzle_volume', String(clamped)); } catch { /* silent */ }
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
    streakRef.current = 0;
    isClearingRef.current = false;
    prevStateRef.current = null;
    setHasSnapshot(false);
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
        saveCloudBest(next); // рекорд дублируется в облако Яндекса
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
      }, TIMING.GAME_OVER_DELAY_MS);
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
    streakRef.current = prev.streak;
    setBoard(prev.board);
    setPool(prev.pool);
    setScore(prev.score);
    setClearingCells({ rows: new Set(), cols: new Set() });
    setIsClearing(false);
    isClearingRef.current = false;
  setComboText(null);
  setLastScore(0);
  prevStateRef.current = null;
  setHasSnapshot(false);
  }, []);

  const canUndo = hasSnapshot && !isClearing;
  // ── Revive after game over («второе дыхание») ──
// Награда за рекламу: 3 новые фигуры + сжигание 3 линий подряд.
// Направление (строки/столбцы) выбираем по тому, куда новые фигуры лучше влезают.
const revive = useCallback((): boolean => {
  if (isClearingRef.current) return false;
  const currentBoard = boardRef.current;
  // 1) Кидаем новые фигуры
  const newPool = generateFigurePool(3);
  // 2) Направление: сколько новых фигур влезает в коридор из 3 строк / 3 столбцов
  const fitsRows = newPool.filter(f => f.matrix.length <= 3).length;
  const fitsCols = newPool.filter(f => (f.matrix[0]?.length ?? 0) <= 3).length;
  const useRows = fitsRows >= fitsCols;
  // 3) В выбранном направлении — окно из 3 подряд линий с максимумом блоков
  let bestStart = 0;
  let bestCount = -1;
  for (let start = 0; start <= BOARD_SIZE - 3; start++) {
    let count = 0;
    for (let i = start; i < start + 3; i++) {
      for (let j = 0; j < BOARD_SIZE; j++) {
        if (useRows ? currentBoard[i][j] : currentBoard[j][i]) count += 1;
      }
    }
    if (count > bestCount) {
      bestCount = count;
      bestStart = start;
    }
  }
  if (bestCount <= 0) return false; // жечь нечего — практически невозможно
  const lines = [bestStart, bestStart + 1, bestStart + 2];
  // 4) Отменяем таймеры, отключаем отмену (чтобы нельзя было «вернуть» сожжённое)
  if (gameOverTimerRef.current) clearTimeout(gameOverTimerRef.current);
  prevStateRef.current = null;
  setHasSnapshot(false);
  setLastScore(0);
  setComboText(null);
  // 5) Новые фигуры сразу в лоток
  poolRef.current = newPool;
  setPool(newPool);
  // 6) Сжигаем с той же анимацией, что и обычные линии
  setClearingCells(useRows
    ? { rows: new Set(lines), cols: new Set() }
    : { rows: new Set(), cols: new Set(lines) });
  setIsClearing(true);
  isClearingRef.current = true;
  setScreen('game');
  if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
  clearTimerRef.current = setTimeout(() => {
    const clearedBoard = useRows
      ? clearLines(currentBoard, lines, [])
      : clearLines(currentBoard, [], lines);
    boardRef.current = clearedBoard;
    setClearingCells({ rows: new Set(), cols: new Set() });
    setIsClearing(false);
    isClearingRef.current = false;
    setBoard(clearedBoard);
    // Если ходов всё равно нет — снова игра окончена
    checkGameOver(clearedBoard, newPool);
  }, TIMING.CLEAR_ANIM_MS);
  return true;
}, [checkGameOver]);

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
      streak: streakRef.current,
    };
    setHasSnapshot(true);
    playPlace();

    // Place blocks on board
    const newBoard = placeFigureOnBoard(currentBoard, figure, boardRow, boardCol);
    const cells = getShapeCells(figure.matrix);
    boardRef.current = newBoard;
    setBoard(newBoard);

    // Update pool
    const { pool: nextPool, depleted } = withFigureRemoved(currentPool, figIdx);
    const finalPool = depleted ? generateFigurePool(3) : nextPool;
    poolRef.current = finalPool;
    setPool(finalPool);

  // Detect lines
  const { rows, cols } = getLinesToClear(newBoard);
  const linesTotal = rows.length + cols.length;
  // Streak: сколько ходов подряд чистили линии
  if (linesTotal > 0) streakRef.current += 1; else streakRef.current = 0;
  const streak = streakRef.current;
  const streakMult = streak >= 4 ? 2.5 : streak === 3 ? 2 : streak === 2 ? 1.5 : 1;
  // Score for placed cells, умножаем на бонус серии
  const gained = Math.round(calcScore(rows.length, cols.length, cells.length) * streakMult);
  addScore(gained);
  if (linesTotal > 0) {
    playClear(linesTotal);
    // Combo / streak text
    if (linesTotal >= 2 || streak >= 2) {
      const labels: Record<number, string> = { 2: 'DOUBLE!', 3: 'TRIPLE!', 4: 'QUAD!' };
      let txt = linesTotal >= 2
        ? (linesTotal >= 4 ? `${linesTotal}× COMBO!` : (labels[linesTotal] ?? `${linesTotal}× COMBO!`))
        : 'STREAK!';
      if (streak >= 2) txt += `  ✦  ×${streakMult}`;
      setComboText({ text: txt, x: pointerX ?? window.innerWidth / 2, y: pointerY ?? 200, id: Date.now() });
      if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
      comboTimerRef.current = setTimeout(() => setComboText(null), TIMING.COMBO_TEXT_MS);
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
      }, TIMING.CLEAR_ANIM_MS);
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
    volume,
    setVolume,
    canUndo,
    startGame,
    placeFigure,
    toggleMute,
    undo,
    revive,
    setScreen,
    playPlace,
  };
}