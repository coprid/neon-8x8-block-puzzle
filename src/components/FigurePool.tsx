import React, { useRef, useCallback, useState, useEffect } from 'react';
import { Figure, Board, canPlaceFigure, BOARD_SIZE } from '../gameEngine';
import { getShapeCells, ShapeMatrix, ColorKey } from '../gameShapes';
import FigurePreview from './FigurePreview';

const POOL_CELL = 26;       // Cell size in pool tray
const DRAG_CELL = 40;       // Cell size when dragging (slightly larger)
const LIFT_Y   = -68;       // How many px the ghost lifts above pointer (positive = above)

interface HoverOverlay {
  matrix: ShapeMatrix;
  boardRow: number;
  boardCol: number;
  valid: boolean;
  left: number;
  top: number;
}

interface FigurePoolProps {
  pool: (Figure | null)[];
  board: Board;
  boardRef: React.RefObject<HTMLDivElement | null>;
  cellSize: number;
  isClearing: boolean;
  onPlace: (figureId: string, boardRow: number, boardCol: number, px: number, py: number) => boolean;
 
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
  const gap = Math.max(1, Math.round(cs * 0.07)); // та же формула, что внутри самой фигуры
  return {
    w: cols * cs + Math.max(0, cols - 1) * gap,
    h: rows * cs + Math.max(0, rows - 1) * gap,
  };
}

export default function FigurePool({
  pool,
  board,
  boardRef,
  cellSize,
  isClearing,
  onPlace,
}: FigurePoolProps) {
  const [dragging, setDragging] = useState<DragState | null>(null);
  const [shakingSlot, setShakingSlot] = useState<number | null>(null);
  const [hover, setHover] = useState<HoverOverlay | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const ghostRef = useRef<HTMLDivElement | null>(null);
  const hoverKeyRef = useRef('');

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
    const clearHover = () => { if (hoverKeyRef.current !== '') { hoverKeyRef.current = ''; setHover(null); } };
    const tl = getDropCell(clientX, clientY, drag.matrix);
    const boardEl = boardRef.current;
    if (!tl || !boardEl) { clearHover(); return; }
    const [boardRow, boardCol] = tl;
    const cells = getShapeCells(drag.matrix);
    const anyOnBoard = cells.some(([dr, dc]) => {
      const r = boardRow + dr;
      const c = boardCol + dc;
      return r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE;
    });
    if (!anyOnBoard) { clearHover(); return; }
    const valid = canPlaceFigure(board, drag.matrix, boardRow, boardCol);
    const key = `${boardRow},${boardCol},${valid ? 1 : 0}`;
    if (key === hoverKeyRef.current) return;
    hoverKeyRef.current = key;
    const rect = boardEl.getBoundingClientRect();
    setHover({ matrix: drag.matrix, boardRow, boardCol, valid, left: rect.left, top: rect.top });
  }, [board, boardRef, getDropCell]);

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
    // Ghost moves via direct DOM write (transform) — no React re-render per move
    if (ghostRef.current) {
      const dx = e.clientX - drag.currentX;
      const dy = e.clientY - drag.currentY;
      ghostRef.current.style.transform = `translate(${dx}px, ${dy}px)`;
    }
    updateHover(e.clientX, e.clientY, drag);
  }, [updateHover]);

  const handlePointerUp = useCallback((e: PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    e.preventDefault();
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
    hoverKeyRef.current = '';
    setHover(null);
  }, [getDropCell, onPlace]);

// Если систему прервали — просто возвращаем фигуру в лоток
const handlePointerCancel = useCallback(() => {
  dragRef.current = null;
  setDragging(null);
  hoverKeyRef.current = '';
  setHover(null);
}, []);

useEffect(() => {
  const opts = { passive: false } as AddEventListenerOptions;
  window.addEventListener('pointermove', handlePointerMove, opts);
  window.addEventListener('pointerup',   handlePointerUp,   opts);
  window.addEventListener('pointercancel', handlePointerCancel);
  return () => {
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup',   handlePointerUp);
    window.removeEventListener('pointercancel', handlePointerCancel);
  };
}, [handlePointerMove, handlePointerUp, handlePointerCancel]);

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
         ref={ghostRef}
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
   {/* Hover overlay on board (owned here, not in GameBoard) */}
   {hover && (() => {
     const cells = getShapeCells(hover.matrix);
     const size = BOARD_SIZE * cellSize;
     return (
       <div
         style={{
           position: 'fixed',
           left: hover.left,
           top: hover.top,
           width: size,
           height: size,
           pointerEvents: 'none',
           zIndex: 3,
           borderRadius: 10,
           overflow: 'hidden',
         }}
       >
         {cells.map(([dr, dc]) => {
           const r = hover.boardRow + dr;
           const c = hover.boardCol + dc;
           if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) return null;
           return (
             <div
               key={`${r}-${c}`}
               style={{
                 position: 'absolute',
                 left: c * cellSize,
                 top: r * cellSize,
                 width: cellSize,
                 height: cellSize,
                 borderRadius: Math.max(4, Math.round(cellSize * 0.18)),
                 background: hover.valid ? 'rgba(0,207,255,0.26)' : 'rgba(255,26,112,0.2)',
                 border: `1px solid ${hover.valid ? 'rgba(0,207,255,0.85)' : 'rgba(255,26,112,0.78)'}`,
                 boxShadow: hover.valid
                   ? 'inset 0 0 12px rgba(0,207,255,0.38), 0 0 8px rgba(0,207,255,0.45)'
                   : 'inset 0 0 10px rgba(255,26,112,0.3), 0 0 8px rgba(255,26,112,0.35)',
               }}
             />
           );
         })}
       </div>
     );
   })()}
 </>
);
}