import { useLanguage } from '../LanguageContext';

interface SettingsOverlayProps {
  onClose: () => void;
}

export default function SettingsOverlay({ onClose }: SettingsOverlayProps) {
  const { lang, setLang, t } = useLanguage();

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 600,
        backdropFilter: 'blur(8px)',
        background: 'rgba(4, 6, 18, 0.88)',
        padding: '0 20px',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 320,
          background: 'linear-gradient(160deg, #0C1228 0%, #070B1A 100%)',
          border: '1px solid rgba(0,207,255,0.52)',
          borderRadius: 24,
          padding: '32px 28px',
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
          top: -50,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 180,
          height: 100,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(0,207,255,0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Title */}
        <div style={{
          fontFamily: 'Orbitron, sans-serif',
          fontSize: 'clamp(20px, 5vw, 26px)',
          fontWeight: 900,
          color: '#00CFFF',
          textShadow: '0 0 16px rgba(0,207,255,0.7), 0 0 32px rgba(0,207,255,0.4)',
          letterSpacing: '0.12em',
          marginBottom: 28,
          position: 'relative',
        }}>
          {t('settings')}
        </div>

        {/* Language section */}
        <div style={{ marginBottom: 28 }}>
          <div style={{
            fontFamily: 'Orbitron, sans-serif',
            fontSize: 10,
            color: '#2A4A7A',
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            marginBottom: 14,
          }}>
            {t('language')}
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            {(['en', 'ru'] as const).map((l) => (
              <button
                key={l}
                className="neon-btn"
                onClick={() => setLang(l)}
                style={{
                  flex: 1,
                  height: 44,
                  fontFamily: 'Orbitron, sans-serif',
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  color: lang === l ? '#050810' : '#4A6AA0',
                  background: lang === l
                    ? 'linear-gradient(135deg, #00CFFF 0%, #0070DD 100%)'
                    : 'rgba(30,46,90,0.4)',
                  border: `1px solid ${lang === l ? '#00CFFF' : 'rgba(30,58,138,0.5)'}`,
                  borderRadius: 12,
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  boxShadow: lang === l
                    ? '0 0 20px rgba(0,207,255,0.4), 0 4px 12px rgba(0,0,0,0.4)'
                    : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                {l === 'en' ? 'English' : 'Русский'}
              </button>
            ))}
          </div>
        </div>

        {/* Close button */}
        <button
          className="neon-btn"
          onClick={onClose}
          style={{
            width: '100%',
            height: 46,
            fontFamily: 'Orbitron, sans-serif',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.15em',
            color: '#050810',
            background: 'linear-gradient(135deg, #00CFFF 0%, #0070DD 100%)',
            border: 'none',
            borderRadius: 12,
            cursor: 'pointer',
            textTransform: 'uppercase',
            boxShadow: '0 0 20px rgba(0,207,255,0.4), 0 4px 12px rgba(0,0,0,0.4)',
          }}
        >
          {t('close')}
        </button>
      </div>
    </div>
  );
}