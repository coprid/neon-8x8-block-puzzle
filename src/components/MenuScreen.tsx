import { useLanguage } from '../LanguageContext';

interface MenuScreenProps {
  best: number;
  onStart: () => void;
}

function NeonLogo() {
  type Cell = { color: string; on: boolean };
  const C = (color: string): Cell => ({ color, on: true });
  const O: Cell = { color: '', on: false };

  const grid: Cell[][] = [
    [C('#00CFFF'), C('#00CFFF'), O,          C('#FF1A70'), C('#FF1A70')],
    [C('#00CFFF'), O,           O,           O,            C('#FF1A70')],
    [O,           O,           C('#C060FF'), O,            O           ],
    [C('#32FF00'), O,           O,           O,            C('#FFE000')],
    [C('#32FF00'), C('#32FF00'), O,          C('#FFE000'), C('#FFE000')],
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 24px)',
        gridTemplateRows: 'repeat(5, 24px)',
        gap: 3,
      }}
    >
      {grid.flatMap((row, r) =>
        row.map((cell, c) => (
          <div
            key={`${r}-${c}`}
            style={{
              width: 24,
              height: 24,
              borderRadius: 5,
              background: cell.on
                ? `radial-gradient(ellipse 80% 55% at 50% 12%, rgba(255,255,255,0.35) 0%, transparent 60%), linear-gradient(135deg, ${cell.color}44, ${cell.color})`
                : 'transparent',
              border: cell.on ? `1px solid ${cell.color}` : '1px solid transparent',
              boxShadow: cell.on
                ? `0 0 10px ${cell.color}aa, 0 0 20px ${cell.color}55, inset 0 1px 2px rgba(255,255,255,0.35), inset 0 -2px 3px rgba(0,0,0,0.4)`
                : 'none',
            }}
          />
        ))
      )}
    </div>
  );
}

const TIP_KEYS: Array<'tip1' | 'tip2' | 'tip3' | 'tip4' | 'tip5'> = [
  'tip1', 'tip2', 'tip3', 'tip4', 'tip5',
];

export default function MenuScreen({ best, onStart }: MenuScreenProps) {
  const { t } = useLanguage();

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 380,
        background: 'linear-gradient(145deg, rgba(8,12,30,0.94), rgba(10,22,48,0.9))',
        borderRadius: 24,
        border: '1px solid rgba(0,207,255,0.34)',
        boxShadow: [
          '0 0 0 1px rgba(0,207,255,0.12)',
          '0 0 18px rgba(0,207,255,0.18)',
          '0 0 44px rgba(0,80,255,0.12)',
          'inset 0 0 22px rgba(0,207,255,0.06)',
          'inset 0 1px 0 rgba(255,255,255,0.07)',
        ].join(', '),
        position: 'relative',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          padding: '36px 24px 28px',
          gap: 0,
          textAlign: 'center',
        }}
      >
        {/* Logo */}
        <div style={{ marginBottom: 24 }}>
          <NeonLogo />
        </div>

        {/* Title */}
        <h1
          className="title-glow"
          style={{
            fontFamily: 'Orbitron, sans-serif',
            fontSize: 'clamp(22px, 6vw, 34px)',
            fontWeight: 900,
            color: '#00CFFF',
            letterSpacing: '0.08em',
            margin: '0 0 6px',
            lineHeight: 1,
          }}
        >
          CHROMABLOCKS
        </h1>

        {/* Best score */}
        {best > 0 && (
          <div
            style={{
              background: 'linear-gradient(145deg, rgba(20,17,8,0.9), rgba(8,12,30,0.9))',
              border: '1px solid rgba(255,224,0,0.42)',
              borderRadius: 14,
              padding: '10px 36px',
              marginBottom: 24,
              marginTop: 20,
              boxShadow: '0 0 0 1px rgba(255,224,0,0.12), 0 0 20px rgba(255,224,0,0.18), inset 0 0 18px rgba(255,224,0,0.05)',
            }}
          >
            <div style={{
              fontFamily: 'Orbitron, sans-serif',
              fontSize: 9,
              color: '#2A4A7A',
              letterSpacing: '0.3em',
              marginBottom: 3,
              textTransform: 'uppercase',
            }}>
              {t('bestScore')}
            </div>
            <div style={{
              fontFamily: 'Orbitron, sans-serif',
              fontSize: 32,
              fontWeight: 700,
              color: '#FFE000',
              textShadow: '0 0 12px rgba(255,224,0,0.7)',
            }}>
              {best.toLocaleString()}
            </div>
          </div>
        )}

        {/* Play button */}
        <button
          className="neon-btn"
          onClick={onStart}
          style={{
            fontFamily: 'Orbitron, sans-serif',
            fontSize: 15,
            fontWeight: 700,
            letterSpacing: '0.2em',
            color: '#050810',
            background: 'linear-gradient(135deg, #00CFFF 0%, #0080FF 100%)',
            border: 'none',
            borderRadius: 14,
            padding: '16px 60px',
            cursor: 'pointer',
            textTransform: 'uppercase',
            boxShadow: '0 0 30px rgba(0,207,255,0.62), 0 0 70px rgba(0,207,255,0.28), 0 4px 12px rgba(0,0,0,0.4)',
            marginBottom: 36,
          }}
        >
          {t('play')}
        </button>

        {/* How to play card */}
        <div
          style={{
            background: 'linear-gradient(145deg, rgba(8,12,30,0.84), rgba(10,22,48,0.76))',
            border: '1px solid rgba(0,207,255,0.32)',
            borderRadius: 14,
            padding: '16px 20px',
            width: '100%',
            backdropFilter: 'blur(4px)',
            boxShadow: '0 0 0 1px rgba(0,207,255,0.1), 0 0 22px rgba(0,207,255,0.14), inset 0 0 18px rgba(0,207,255,0.05)',
          }}
        >
          <div style={{
            fontFamily: 'Orbitron, sans-serif',
            fontSize: 9,
            color: '#2A4A7A',
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            marginBottom: 12,
          }}>
            {t('howToPlay')}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {TIP_KEYS.map((key, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, textAlign: 'left' }}>
                <span style={{ color: '#00CFFF', fontSize: 10, marginTop: 2, flexShrink: 0 }}>✦</span>
                <span style={{
                  fontFamily: 'Rajdhani, sans-serif',
                  fontSize: 13,
                  color: '#5A78AA',
                  lineHeight: 1.4,
                }}>
                  {t(key)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}