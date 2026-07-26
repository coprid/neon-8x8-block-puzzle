import { useEffect, useState } from 'react';
import { useLanguage } from '../useLanguage';

interface GameOverlayProps {
  score: number;
  best: number;
  onReplay: () => void;
  onMenu: () => void;
}

function AnimatedNumber({ target }: { target: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (target === 0) { setDisplay(0); return; }
    const steps = 24;
    const duration = 600;
    const interval = duration / steps;
    let step = 0;
    const t = setInterval(() => {
      step++;
      const progress = step / steps;
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(target * eased));
      if (step >= steps) clearInterval(t);
    }, interval);
    return () => clearInterval(t);
  }, [target]);

  return <>{display.toLocaleString()}</>;
}

export default function GameOverlay({ score, best, onReplay, onMenu }: GameOverlayProps) {
  const { t } = useLanguage();
  const isNewBest = score > 0 && score > best;
  const [show, setShow] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 60);
    return () => clearTimeout(t);
  }, []);

  if (!show) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 500,
        backdropFilter: 'blur(6px)',
        background: 'rgba(4, 6, 18, 0.85)',
        padding: '0 20px',
      }}
    >
      <div
        className="gameover-anim"
        style={{
          width: '100%',
          maxWidth: 340,
          background: 'linear-gradient(160deg, #0C1228 0%, #070B1A 100%)',
          border: '1px solid rgba(255,26,112,0.72)',
          borderRadius: 24,
          padding: '36px 28px',
          textAlign: 'center',
          boxShadow: [
            '0 0 0 1px rgba(255,26,112,0.24)',
            '0 0 48px rgba(255,26,112,0.36)',
            '0 0 92px rgba(255,26,112,0.16)',
            '0 24px 48px rgba(0,0,0,0.6)',
            'inset 0 0 40px rgba(255,26,112,0.05)',
          ].join(', '),
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Top glow blob */}
        <div style={{
          position: 'absolute',
          top: -60,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 220,
          height: 120,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(255,26,112,0.18) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* GAME OVER heading */}
        <div style={{
          fontFamily: 'Orbitron, sans-serif',
          fontSize: 'clamp(26px,7vw,36px)',
          fontWeight: 900,
          color: '#FF1A70',
          textShadow: '0 0 20px rgba(255,26,112,0.8), 0 0 40px rgba(255,26,112,0.4)',
          letterSpacing: '0.1em',
          marginBottom: 6,
          position: 'relative',
        }}>
          {t('gameOver')}
        </div>
        <div style={{
          fontFamily: 'Rajdhani, sans-serif',
          fontSize: 12,
          color: '#2A4060',
          letterSpacing: '0.28em',
          textTransform: 'uppercase',
          marginBottom: 28,
        }}>
          {t('noMoves')}
        </div>

        {/* Score boxes */}
        <div style={{ display: 'flex', gap: 12, marginBottom: isNewBest ? 16 : 28 }}>
          {/* Score */}
          <div style={{
            flex: 1,
            background: 'rgba(8,12,30,0.9)',
            border: '1px solid rgba(0,207,255,0.36)',
            borderRadius: 14,
            padding: '14px 12px',
            boxShadow: '0 0 0 1px rgba(0,207,255,0.1), 0 0 16px rgba(0,207,255,0.16), inset 0 0 14px rgba(0,207,255,0.05)',
          }}>
            <div style={{
              fontFamily: 'Orbitron, sans-serif',
              fontSize: 9,
              color: '#2A4A7A',
              letterSpacing: '0.25em',
              marginBottom: 5,
              textTransform: 'uppercase',
            }}>{t('score')}</div>
            <div style={{
              fontFamily: 'Orbitron, sans-serif',
              fontSize: 'clamp(20px,5vw,28px)',
              fontWeight: 700,
              color: '#00CFFF',
              textShadow: '0 0 10px rgba(0,207,255,0.6)',
            }}>
              <AnimatedNumber target={score} />
            </div>
          </div>

          {/* Best */}
          <div style={{
            flex: 1,
            background: 'rgba(8,12,30,0.9)',
            border: `1px solid ${isNewBest ? 'rgba(255,224,0,0.72)' : 'rgba(0,207,255,0.36)'}`,
            borderRadius: 14,
            padding: '14px 12px',
            boxShadow: isNewBest
              ? '0 0 0 1px rgba(255,224,0,0.14), 0 0 18px rgba(255,224,0,0.28), inset 0 0 14px rgba(255,224,0,0.06)'
              : '0 0 0 1px rgba(0,207,255,0.1), 0 0 16px rgba(0,207,255,0.16), inset 0 0 14px rgba(0,207,255,0.05)',
            transition: 'all 0.3s ease',
          }}>
            <div style={{
              fontFamily: 'Orbitron, sans-serif',
              fontSize: 9,
              color: isNewBest ? '#AA8800' : '#2A4A7A',
              letterSpacing: '0.25em',
              marginBottom: 5,
              textTransform: 'uppercase',
            }}>
              {isNewBest ? `★ ${t('best')}` : t('best')}
            </div>
            <div style={{
              fontFamily: 'Orbitron, sans-serif',
              fontSize: 'clamp(20px,5vw,28px)',
              fontWeight: 700,
              color: isNewBest ? '#FFE000' : '#00CFFF',
              textShadow: isNewBest
                ? '0 0 10px rgba(255,224,0,0.6)'
                : '0 0 10px rgba(0,207,255,0.6)',
            }}>
              <AnimatedNumber target={best} />
            </div>
          </div>
        </div>

        {/* New best badge */}
        {isNewBest && (
          <div style={{
            fontFamily: 'Orbitron, sans-serif',
            fontSize: 11,
            fontWeight: 700,
            color: '#FFE000',
            textShadow: '0 0 10px rgba(255,224,0,0.8)',
            letterSpacing: '0.2em',
            marginBottom: 24,
            animation: 'titleGlow 1.5s ease-in-out infinite',
          }}>
            {t('newHighScore')}
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="neon-btn"
            onClick={onReplay}
            style={{
              flex: 2,
              fontFamily: 'Orbitron, sans-serif',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.15em',
              color: '#050810',
              background: 'linear-gradient(135deg, #00CFFF 0%, #0070DD 100%)',
              border: 'none',
              borderRadius: 12,
              padding: '14px 0',
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
              flex: 1,
              fontFamily: 'Orbitron, sans-serif',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.12em',
              color: '#4A6AA0',
              background: 'rgba(30,46,90,0.4)',
              border: '1px solid rgba(30,58,138,0.5)',
              borderRadius: 12,
              padding: '14px 0',
              cursor: 'pointer',
              textTransform: 'uppercase',
            }}
          >
            {t('menu')}
          </button>
        </div>
      </div>
    </div>
  );
}