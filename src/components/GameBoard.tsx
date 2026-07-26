import { useMemo, type RefObject } from 'react';
import { Board, ClearingCells, BOARD_SIZE } from '../useGameLogic';
import { getShapeCells, ShapeMatrix } from '../gameShapes';

interface HoverState {
  figureId: string;
  matrix: ShapeMatrix;
  boardRow: number;
  boardCol: number;
  valid: boolean;
}

interface GameBoardProps {
  board: Board;
  clearingCells: ClearingCells;
  hoverState: HoverState | null;
  cellSize: number;
  boardRef: RefObject<HTMLDivElement | null>;
}

const COLOR_CLASSES: Record<string, string> = {
  blue:   'cell-blue',
  green:  'cell-green',
  pink:   'cell-pink',
  yellow: 'cell-yellow',
  orange: 'cell-orange',
  purple: 'cell-purple',
};

export default function GameBoard({ board, clearingCells, hoverState, cellSize, boardRef }: GameBoardProps) {
  const hoveredCells = useMemo<Map<string, boolean>>(() => {
    const map = new Map<string, boolean>();
    if (!hoverState) return map;
    const cells = getShapeCells(hoverState.matrix);
    for (const [dr, dc] of cells) {
      const r = hoverState.boardRow + dr;
      const c = hoverState.boardCol + dc;
      if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
        map.set(`${r},${c}`, hoverState.valid);
      }
    }
    return map;
  }, [hoverState]);

  return (
    <div
      ref={boardRef}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${BOARD_SIZE}, ${cellSize}px)`,
        gridTemplateRows: `repeat(${BOARD_SIZE}, ${cellSize}px)`,
        borderRadius: 10,
        overflow: 'hidden',
        background: 'linear-gradient(145deg, #050816 0%, #081229 100%)',
        border: '1px solid rgba(0,207,255,0.52)',
        boxShadow: [
          '0 0 0 1px rgba(0,207,255,0.25)',
          '0 0 18px rgba(0,207,255,0.32)',
          '0 0 54px rgba(0,80,255,0.22)',
          '0 10px 36px rgba(0,0,0,0.58)',
          'inset 0 0 28px rgba(0,207,255,0.08)',
        ].join(', '),
        position: 'relative',
        animation: 'neonFramePulse 3.2s ease-in-out infinite',
      }}
    >
      {board.map((row, r) =>
        row.map((cell, c) => {
          const key = `${r},${c}`;
          const isClearing = clearingCells.rows.has(r) || clearingCells.cols.has(c);
          const hoverValid = hoveredCells.get(key);
          const isHovered = hoverValid !== undefined;

          let className = '';

          if (cell) {
            className = COLOR_CLASSES[cell.colorKey] || 'cell-blue';
            if (isClearing) className += ' cell-clearing';
          } else if (isHovered) {
            className = hoverValid ? 'cell-hover-valid' : 'cell-hover-invalid';
          } else {
            className = 'cell-empty';
          }

          return (
            <div
              key={key}
              className={className}
              style={{ width: cellSize, height: cellSize }}
            />
          );
        })
      )}
    </div>
  );
}