import { useState } from 'react';
import { useGameLogic } from './useGameLogic';
import MenuScreen from './components/MenuScreen';
import GameScreen from './components/GameScreen';
import GameOverlay from './components/GameOverlay';
import SettingsOverlay from './components/SettingsOverlay';

export default function App() {
  const [settingsOpen, setSettingsOpen] = useState(false);

  const {
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
  } = useGameLogic();

  return (
    <div
      style={{
        width: '100%',
        height: '100dvh',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* ── Ambient background decorations ── */}
      <div
        aria-hidden
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
          overflow: 'hidden',
        }}
      >
        {/* Large blue orb top-left */}
        <div style={{
          position: 'absolute', top: '-15%', left: '-10%',
          width: '65vw', height: '65vw', maxWidth: 550, maxHeight: 550,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,60,220,0.09) 0%, transparent 70%)',
        }} />
        {/* Purple orb bottom-right */}
        <div style={{
          position: 'absolute', bottom: '-20%', right: '-10%',
          width: '55vw', height: '55vw', maxWidth: 480, maxHeight: 480,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(120,0,220,0.07) 0%, transparent 70%)',
        }} />
        {/* Pink orb center */}
        <div style={{
          position: 'absolute', top: '35%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '40vw', height: '40vw', maxWidth: 320, maxHeight: 320,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(200,0,80,0.05) 0%, transparent 70%)',
        }} />
        {/* Subtle grid lines */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: [
            'linear-gradient(rgba(0,207,255,0.06) 1px, transparent 1px)',
            'linear-gradient(90deg, rgba(0,207,255,0.06) 1px, transparent 1px)',
          ].join(', '),
          backgroundSize: '60px 60px',
        }} />
      </div>

      {/* ── App content ── */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: 480,
          height: '100dvh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: screen === 'menu' ? 'center' : 'flex-start',
        }}
      >
        {screen === 'menu' && (
          <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <MenuScreen best={best} onStart={startGame} />
          </div>
        )}

        {(screen === 'game' || screen === 'gameover') && (
          <>
            <GameScreen
              board={board}
              pool={pool}
              score={score}
              best={best}
              lastScore={lastScore}
              clearingCells={clearingCells}
              isClearing={isClearing}
              muted={muted}
              comboText={comboText}
              canUndo={canUndo}
              onPlace={placeFigure}
              onNewGame={startGame}
              onToggleMute={toggleMute}
              onUndo={undo}
              onOpenSettings={() => setSettingsOpen(true)}
            />
            {screen === 'gameover' && (
              <GameOverlay
                score={score}
                best={best}
                onReplay={startGame}
                onMenu={() => setScreen('menu')}
              />
            )}
          </>
        )}
      </div>

      {/* Settings overlay */}
      {settingsOpen && (
        <SettingsOverlay onClose={() => setSettingsOpen(false)} />
      )}
    </div>
  );
}
