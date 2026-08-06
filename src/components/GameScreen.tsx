import { useRef, useState, useLayoutEffect } from 'react';
import { useLanguage } from '../LanguageContext';
import { Board, ClearingCells, Figure, BOARD_SIZE } from '../gameEngine';
import GameBoard from './GameBoard';
import FigurePool from './FigurePool';
import ScorePanel from './ScorePanel';

interface GameScreenProps {
  board: Board;
  pool: (Figure | null)[];
  score: number;
  best: number;
  lastScore: number;
  clearingCells: ClearingCells;
  isClearing: boolean;
  muted: boolean;
  comboText: { text: string; x: number; y: number; id: number } | null;
  canUndo: boolean;
  onPlace: (figureId: string, boardRow: number, boardCol: number, px: number, py: number) => boolean;
  onNewGame: () => void;
  onToggleMute: () => void;
  onUndo: () => void;
  onOpenSettings: () => void;
}

export default function GameScreen({
  board,
  pool,
  score,
  best,
  lastScore,
  clearingCells,
  isClearing,
  muted,
  comboText,
  canUndo,
  onPlace,
  onNewGame,
  onToggleMute,
  onUndo,
  onOpenSettings,
}: GameScreenProps) {
  const { t } = useLanguage();
  const boardRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [cellSize, setCellSize] = useState(38);

  useLayoutEffect(() => {
    const compute = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const dvh = vh;

      const maxW = Math.min(vw, 480) - 32;
      const maxH = dvh - 85 - 115 - 24;

      const fromW = Math.floor(maxW / BOARD_SIZE);
      const fromH = Math.floor(maxH / BOARD_SIZE);
      const raw = Math.min(fromW, fromH, 52);
      setCellSize(Math.max(raw, 28));
    };
    compute();
    const ro = new ResizeObserver(compute);
    if (containerRef.current) ro.observe(containerRef.current);
    window.addEventListener('resize', compute);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', compute);
    };
  }, []);

  const boardPx = cellSize * BOARD_SIZE;

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100dvh',
        maxHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '16px 20px 14px',
        gap: 16,
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {/* Scanline overlay */}
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.04) 2px, rgba(0,0,0,0.04) 4px)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      {/* Title */}
      <div style={{
        fontFamily: 'Orbitron, sans-serif',
        fontSize: 'clamp(22px, 6vw, 32px)',
        fontWeight: 900,
        color: '#00CFFF',
        letterSpacing: '0.15em',
        textShadow: '0 0 16px rgba(0,207,255,0.7), 0 0 32px rgba(0,207,255,0.4)',
        textAlign: 'center',
        flexShrink: 0,
        position: 'relative',
        zIndex: 2,
        marginBottom: 2,
      }}>
        CHROMABLOCKS
      </div>

      {/* Score & controls */}
      <div style={{ width: '100%', maxWidth: boardPx, flexShrink: 0, position: 'relative', zIndex: 2, marginBottom: 14 }}>
        <ScorePanel
          score={score}
          best={best}
          lastScore={lastScore}
          muted={muted}
          onToggleMute={onToggleMute}
          onSettingsClick={onOpenSettings}
        />
      </div>

      {/* Board */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        position: 'relative',
        zIndex: 2,
      }}>
        {/* Board glow ring */}
        <div style={{
          position: 'absolute',
          inset: -9,
          borderRadius: 18,
          background: 'linear-gradient(135deg, rgba(0,207,255,0.12), rgba(192,96,255,0.08), rgba(255,26,112,0.06))',
          border: '1px solid rgba(0,207,255,0.36)',
          boxShadow: '0 0 22px rgba(0,207,255,0.24), 0 0 34px rgba(0,90,255,0.14), inset 0 0 30px rgba(0,207,255,0.1)',
          animation: 'neonFramePulse 3s ease-in-out infinite',
          pointerEvents: 'none',
          zIndex: -1,
        }} />
        <GameBoard
          board={board}
          clearingCells={clearingCells}
      
          cellSize={cellSize}
          boardRef={boardRef}
        />
      </div>

      {/* Figure pool */}
      <div style={{ width: '100%', maxWidth: boardPx, flexShrink: 0, position: 'relative', zIndex: 2 }}>
        <FigurePool
          pool={pool}
          board={board}
          boardRef={boardRef}
          cellSize={cellSize}
          isClearing={isClearing}
          onPlace={onPlace}
        />
      </div>

      {/* Bottom actions */}
      <div style={{
        width: '100%',
        maxWidth: boardPx,
        flexShrink: 0,
        display: 'flex',
        gap: 12,
        position: 'relative',
        zIndex: 2,
      }}>
        <button
          className="neon-btn"
          onClick={onUndo}
          disabled={!canUndo}
          style={{
            flex: 1,
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            fontFamily: 'Orbitron, sans-serif',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.15em',
            color: canUndo ? '#00CFFF' : 'rgba(0,207,255,0.35)',
            background: canUndo ? 'rgba(8,14,40,0.6)' : 'rgba(8,14,40,0.3)',
            border: `1px solid ${canUndo ? 'rgba(0,207,255,0.45)' : 'rgba(0,207,255,0.22)'}`,
            borderRadius: 14,
            cursor: canUndo ? 'pointer' : 'not-allowed',
            textTransform: 'uppercase',
            opacity: canUndo ? 1 : 0.55,
            transition: 'all 0.2s ease',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={canUndo ? '#00CFFF' : 'rgba(0,207,255,0.35)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 7v6h6" />
            <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
          </svg>
          {t('undo')}
        </button>
        <button
          className="neon-btn"
          onClick={onNewGame}
          style={{
            flex: 1,
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            fontFamily: 'Orbitron, sans-serif',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.15em',
            color: '#050810',
            background: 'linear-gradient(135deg, #00CFFF 0%, #0070DD 100%)',
            border: 'none',
            borderRadius: 14,
            cursor: 'pointer',
            textTransform: 'uppercase',
            boxShadow: '0 0 20px rgba(0,207,255,0.4), 0 4px 12px rgba(0,0,0,0.4)',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 4v6h-6" />
            <path d="M1 20v-6h6" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          {t('newGame')}
        </button>
      </div>

      {/* Combo text burst */}
      {comboText && (
        <div
          key={comboText.id}
          className="combo-burst"
          style={{
            left: comboText.x,
            top: comboText.y,
            fontSize: 'clamp(18px, 5vw, 26px)',
            color: '#ffdd00',
            fontFamily: 'Orbitron, sans-serif',
            fontWeight: 900,
            textShadow: '0 0 20px #ffdd00, 0 0 40px #ffdd0066',
            letterSpacing: '0.1em',
          }}
        >
          {comboText.text}
        </div>
      )}
    </div>
  );
}