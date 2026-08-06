import { useLanguage } from '../LanguageContext';

interface GameOverlayProps {
  score: number;
  best: number;
  onReplay: () => void;
  onMenu: () => void;
}

export default function GameOverlay({ score, best, onReplay, onMenu }: GameOverlayProps) {
  const { t } = useLanguage();
  const isNewHigh = score > 0 && score >= best;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 500,
        backdropFilter: 'blur(8px)',
        background: 'rgba(4, 6, 18, 0.88)',
        padding: '0 20px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 340,
          background: 'linear-gradient(160deg, #0C1228 0%, #070B1A 100%)',
          border: '1px solid rgba(0,207,255,0.52)',
          borderRadius: 24,
          padding: '36px 28px',
          textAlign: 'center',
          boxShadow: [
            '0 0 0 1px rgba(0,207,255,0.2)',
            '0 0 48px rgba(0,207,255,0.3)',
            '0 0 92px rgba(0,80,255,0.16)',
            '0 24px 48px rgba(0,0,0,0.6)',
            'inset 0 0 40px rgba(0,207,255,0.06)',
          ].join(', '),
          position: 'relative',
          overflow: 'hidden',
          animation: 'fadeInScaleUp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        }}
      >
        {/* Top glow */}
        <div style={{
          position: 'absolute',
          top: -60,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 200,
          height: 120,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(255,26,112,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Game Over title */}
        <div style={{
          fontFamily: 'Orbitron, sans-serif',
          fontSize: 'clamp(24px, 6vw, 32px)',
          fontWeight: 900,
          color: '#FF1A70',
          textShadow: '0 0 16px rgba(255,26,112,0.7), 0 0 32px rgba(255,26,112,0.4)',
          letterSpacing: '0.12em',
          marginBottom: 8,
          position: 'relative',
        }}>
          {t('gameOver')}
        </div>

        {/* No moves subtitle */}
        <div style={{
          fontFamily: 'Orbitron, sans-serif',
          fontSize: 11,
          color: '#5A78AA',
          letterSpacing: '0.15em',
          marginBottom: 24,
        }}>
          {t('noMoves')}
        </div>

        {/* Score display */}
        <div style={{
          background: 'linear-gradient(145deg, rgba(7,10,26,0.96), rgba(8,18,42,0.92))',
          border: '1px solid rgba(0,207,255,0.38)',
          borderRadius: 16,
          padding: '16px 20px',
          marginBottom: 20,
          boxShadow: '0 0 0 1px rgba(0,207,255,0.12), 0 0 14px rgba(0,207,255,0.18), inset 0 0 14px rgba(0,207,255,0.06)',
        }}>
          <div style={{
            fontFamily: 'Orbitron, sans-serif',
            fontSize: 11,
            color: '#5A78AA',
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            marginBottom: 6,
          }}>
            {t('score')}
          </div>
          <div style={{
            fontFamily: 'Orbitron, sans-serif',
            fontSize: 36,
            fontWeight: 900,
            color: '#00CFFF',
            textShadow: '0 0 16px rgba(0,207,255,0.7)',
            lineHeight: 1,
          }}>
            {score.toLocaleString()}
          </div>
        </div>

        {/* Best score */}
        <div style={{
          fontFamily: 'Orbitron, sans-serif',
          fontSize: 12,
          color: isNewHigh ? '#FFE000' : '#5A78AA',
          letterSpacing: '0.1em',
          marginBottom: 28,
          textShadow: isNewHigh ? '0 0 12px rgba(255,224,0,0.5)' : 'none',
        }}>
          {isNewHigh ? t('newHighScore') : `${t('best')}: ${best.toLocaleString()}`}
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            className="neon-btn"
            onClick={onReplay}
            style={{
              width: '100%',
              height: 48,
              fontFamily: 'Orbitron, sans-serif',
              fontSize: 12,
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
            {t('playAgain')}
          </button>
          <button
            className="neon-btn"
            onClick={onMenu}
            style={{
              width: '100%',
              height: 44,
              fontFamily: 'Orbitron, sans-serif',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.15em',
              color: '#4A6AA0',
              background: 'rgba(30,46,90,0.4)',
              border: '1px solid rgba(30,58,138,0.5)',
              borderRadius: 14,
              cursor: 'pointer',
              textTransform: 'uppercase',
              transition: 'all 0.2s ease',
            }}
          >
            {t('menu')}
          </button>
        </div>
      </div>
    </div>
  );
}