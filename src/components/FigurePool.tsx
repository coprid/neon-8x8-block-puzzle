import React, { useRef, useCallback, useState, useEffect } from 'react';
import { Figure, Board, canPlaceFigure, BOARD_SIZE } from '../gameEngine';
import { getShapeCells, ShapeMatrix, ColorKey } from '../gameShapes';
import FigurePreview from './FigurePreview';

const POOL_CELL = 26;       // Cell size in pool tray
const DRAG_CELL = 40;       // Cell size when dragging (slightly larger)
const LIFT_Y   = -68;       // How many px the ghost lifts above pointer (positive = above)

interface HoverState {
  figureId: string;
  matrix: ShapeMatrix;
  boardRow: number;
  boardCol: number;
  valid: boolean;
}

interface FigurePoolProps {
  pool: (Figure | null)[];
  board: Board;
  boardRef: React.RefObject<HTMLDivElement | null>;
  cellSize: number;
  isClearing: boolean;
  onPlace: (figureId: string, boardRow: number, boardCol: number, px: number, py: number) => boolean;
  onHoverChange: (state: HoverState | null) => void;
}

interface DragState {
  figureId: string;
  matrix: ShapeMatrix;
  colorKey: ColorKey;
  currentX: number;
  currentY: number;
  slotIndex: number;
}

function figureSize(matrix: ShapeMatrix, cs: number): { w: number; h: number } {
  const cols = matrix[0]?.length ?? 1;
  const rows = matrix.length;
  return {
    w: cols * cs + Math.max(0, cols - 1) * 2,
    h: rows * cs + Math.max(0, rows - 1) * 2,
  };
}

export default function FigurePool({
  pool,
  board,
  boardRef,
  cellSize,
  isClearing,
  onPlace,
  onHoverChange,
}: FigurePoolProps) {
  const [dragging, setDragging] = useState<DragState | null>(null);
  const [shakingSlot, setShakingSlot] = useState<number | null>(null);
  const dragRef = useRef<DragState | null>(null);

  /** Compute board [row, col] that the figure's top-left would land on */
  const getDropCell = useCallback((
    clientX: number,
    clientY: number,
    matrix: ShapeMatrix,
  ): [number, number] | null => {
    const boardEl = boardRef.current;
    if (!boardEl) return null;
    const rect = boardEl.getBoundingClientRect();

    // Ghost top-left position
    const { w } = figureSize(matrix, DRAG_CELL);
    const ghostLeft = clientX - w / 2;
    const ghostTop  = clientY + LIFT_Y;

    // Convert ghost's position to board-relative coordinates
    const relLeft = ghostLeft - rect.left;
    const relTop  = ghostTop  - rect.top;

    // Round to nearest cell
    const col = Math.round(relLeft / cellSize);
    const row = Math.round(relTop  / cellSize);

    return [row, col];
  }, [boardRef, cellSize]);

  const updateHover = useCallback((clientX: number, clientY: number, drag: DragState) => {
    const tl = getDropCell(clientX, clientY, drag.matrix);
    if (!tl) { onHoverChange(null); return; }
    const [boardRow, boardCol] = tl;

    // Check if any cell of the figure overlaps the board grid
    const cells = getShapeCells(drag.matrix);
    const anyOnBoard = cells.some(([dr, dc]) => {
      const r = boardRow + dr;
      const c = boardCol + dc;
      return r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE;
    });

    if (anyOnBoard) {
      const valid = canPlaceFigure(board, drag.matrix, boardRow, boardCol);
      onHoverChange({ figureId: drag.figureId, matrix: drag.matrix, boardRow, boardCol, valid });
    } else {
      onHoverChange(null);
    }
  }, [board, getDropCell, onHoverChange]);

  const handlePointerDown = useCallback((
    e: React.PointerEvent,
    figure: Figure,
    slotIndex: number,
  ) => {
    if (isClearing) return;
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    const state: DragState = {
      figureId: figure.id,
      matrix: figure.matrix,
      colorKey: figure.colorKey,
      currentX: e.clientX,
      currentY: e.clientY,
      slotIndex,
    };
    dragRef.current = state;
    setDragging({ ...state });
    updateHover(e.clientX, e.clientY, state);
  }, [isClearing, updateHover]);

  const handlePointerMove = useCallback((e: PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    e.preventDefault();
    const updated = { ...drag, currentX: e.clientX, currentY: e.clientY };
    dragRef.current = updated;
    setDragging({ ...updated });
    updateHover(e.clientX, e.clientY, updated);
  }, [updateHover]);

  const handlePointerUp = useCallback((e: PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    e.preventDefault();
    onHoverChange(null);

    const tl = getDropCell(e.clientX, e.clientY, drag.matrix);
    let placed = false;
    if (tl) {
      const [boardRow, boardCol] = tl;
      placed = onPlace(drag.figureId, boardRow, boardCol, e.clientX, e.clientY);
    }

    if (!placed) {
      setShakingSlot(drag.slotIndex);
      setTimeout(() => setShakingSlot(null), 400);
    }

    dragRef.current = null;
    setDragging(null);
  }, [getDropCell, onHoverChange, onPlace]);

  useEffect(() => {
    const opts = { passive: false } as AddEventListenerOptions;
    window.addEventListener('pointermove', handlePointerMove, opts);
    window.addEventListener('pointerup',   handlePointerUp,   opts);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup',   handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  return (
    <>
      {/* Tray */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          width: '100%',
          padding: '12px 10px',
          background: 'linear-gradient(145deg, rgba(8, 12, 30, 0.94), rgba(9, 18, 42, 0.9))',
          borderRadius: 16,
          border: '1px solid rgba(0,207,255,0.34)',
          boxShadow: [
            '0 0 0 1px rgba(0,207,255,0.12)',
            '0 0 18px rgba(0,207,255,0.18)',
            '0 0 44px rgba(0,80,255,0.12)',
            'inset 0 0 22px rgba(0,207,255,0.06)',
            'inset 0 1px 0 rgba(255,255,255,0.07)',
          ].join(', '),
          minHeight: 96,
          gap: 6,
          backdropFilter: 'blur(8px)',
          marginTop: 8,
        }}
      >
        {pool.map((figure, idx) => {
          if (!figure) {
            return (
              <div
                key={`empty-${idx}`}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 72,
                  opacity: 0.2,
                }}
              >
                {/* Used slot indicator */}
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  border: '1px dashed rgba(0,207,255,0.38)',
                  boxShadow: '0 0 10px rgba(0,207,255,0.12), inset 0 0 10px rgba(0,207,255,0.06)',
                }} />
              </div>
            );
          }

          const isDraggingThis = dragging?.slotIndex === idx;
          const { w: pw, h: ph } = figureSize(figure.matrix, POOL_CELL);

          return (
            <div
              key={figure.id}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 72,
              }}
            >
              <div
                className={`figure-appear${shakingSlot === idx ? ' shake-anim' : ''}`}
                onPointerDown={(e) => handlePointerDown(e, figure, idx)}
                style={{
                  cursor: isDraggingThis ? 'grabbing' : 'grab',
                  touchAction: 'none',
                  width: pw,
                  height: ph,
                  opacity: isDraggingThis ? 0.2 : 1,
                  transform: isDraggingThis ? 'scale(0.88)' : 'scale(1)',
                  transition: 'opacity 0.15s ease, transform 0.15s ease',
                  willChange: 'transform',
                  filter: isDraggingThis ? 'blur(1px)' : 'none',
                }}
              >
                <FigurePreview
                  matrix={figure.matrix}
                  colorKey={figure.colorKey}
                  cellSize={POOL_CELL}
                  glowing
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Drag ghost */}
      {dragging && (() => {
        const { w, h } = figureSize(dragging.matrix, DRAG_CELL);
        const ghostX = dragging.currentX - w / 2;
        const ghostY = dragging.currentY + LIFT_Y;
        return (
          <div
            className="drag-ghost"
            style={{ left: ghostX, top: ghostY, width: w, height: h }}
          >
            <FigurePreview
              matrix={dragging.matrix}
              colorKey={dragging.colorKey}
              cellSize={DRAG_CELL}
              glowing
            />
          </div>
        );
      })()}
    </>
  );
}