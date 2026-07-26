import { ColorKey } from '../gameShapes';

interface FigurePreviewProps {
  matrix: (0 | 1)[][];
  colorKey: ColorKey;
  cellSize: number;
  opacity?: number;
  glowing?: boolean;
}

const COLOR_STYLES: Record<ColorKey, {
  bg: string;
  border: string;
  glow: string;
  glowMid: string;
}> = {
  blue: {
    bg: 'linear-gradient(145deg, #004B99 0%, #0097E0 60%, #00CFFF 100%)',
    border: '#00CFFF',
    glow: 'rgba(0,207,255,0.7)',
    glowMid: 'rgba(0,207,255,0.3)',
  },
  green: {
    bg: 'linear-gradient(145deg, #0D4A00 0%, #1FA800 60%, #32FF00 100%)',
    border: '#32FF00',
    glow: 'rgba(50,255,0,0.7)',
    glowMid: 'rgba(50,255,0,0.3)',
  },
  pink: {
    bg: 'linear-gradient(145deg, #7A0034 0%, #CC0055 60%, #FF1A70 100%)',
    border: '#FF1A70',
    glow: 'rgba(255,26,112,0.7)',
    glowMid: 'rgba(255,26,112,0.3)',
  },
  yellow: {
    bg: 'linear-gradient(145deg, #7A5A00 0%, #D4A000 60%, #FFE000 100%)',
    border: '#FFE000',
    glow: 'rgba(255,224,0,0.7)',
    glowMid: 'rgba(255,224,0,0.3)',
  },
  orange: {
    bg: 'linear-gradient(145deg, #7A2B00 0%, #CC5000 60%, #FF6200 100%)',
    border: '#FF6200',
    glow: 'rgba(255,98,0,0.7)',
    glowMid: 'rgba(255,98,0,0.3)',
  },
  purple: {
    bg: 'linear-gradient(145deg, #3E007A 0%, #8020CC 60%, #C060FF 100%)',
    border: '#C060FF',
    glow: 'rgba(192,96,255,0.7)',
    glowMid: 'rgba(192,96,255,0.3)',
  },
};

export default function FigurePreview({
  matrix,
  colorKey,
  cellSize,
  opacity = 1,
  glowing = false,
}: FigurePreviewProps) {
  const s = COLOR_STYLES[colorKey];
  const rows = matrix.length;
  const cols = matrix[0]?.length ?? 0;
  const gap = Math.max(1, Math.round(cellSize * 0.07));

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
        gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
        gap: `${gap}px`,
        opacity,
      }}
    >
      {matrix.map((row, r) =>
        row.map((val, c) => {
          if (!val) {
            return <div key={`${r}-${c}`} style={{ width: cellSize, height: cellSize }} />;
          }
          return (
 <div
  key={`${r}-${c}`}
  style={{
    width: cellSize,
    height: cellSize,
    borderRadius: Math.max(4, Math.round(cellSize * 0.18)),
    background: `radial-gradient(ellipse 80% 55% at 50% 12%, rgba(255,255,255,0.38) 0%, transparent 60%), ${s.bg}`,
    border: `1px solid ${s.border}`,
    boxShadow: glowing
      ? [
          `0 0 ${Math.round(cellSize * 0.4)}px ${s.glow}`,
          `0 0 ${Math.round(cellSize * 0.8)}px ${s.glowMid}`,
          `0 ${Math.max(1, Math.round(cellSize * 0.08))}px ${Math.round(cellSize * 0.15)}px rgba(0,0,0,0.45)`,
          `inset 0 ${Math.max(1, Math.round(cellSize * 0.06))}px ${Math.round(cellSize * 0.1)}px rgba(255,255,255,0.4)`,
          `inset 0 -${Math.max(1, Math.round(cellSize * 0.08))}px ${Math.round(cellSize * 0.12)}px rgba(0,0,0,0.5)`,
        ].join(', ')
      : [
          `0 0 ${Math.round(cellSize * 0.25)}px ${s.glowMid}`,
          `inset 0 ${Math.max(1, Math.round(cellSize * 0.06))}px ${Math.round(cellSize * 0.1)}px rgba(255,255,255,0.3)`,
          `inset 0 -${Math.max(1, Math.round(cellSize * 0.08))}px ${Math.round(cellSize * 0.12)}px rgba(0,0,0,0.4)`,
        ].join(', '),
  }}
/>
          );
        })
      )}
    </div>
  );
}
