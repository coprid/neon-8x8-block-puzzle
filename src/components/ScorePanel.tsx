import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../LanguageContext';

interface ScorePanelProps {
  score: number;
  best: number;
  muted: boolean;
  onToggleMute: () => void;
  onSettingsClick: () => void;
}

function ScoreBox({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  const [popping, setPopping] = useState(false);
  const prevRef = useRef(value);

  useEffect(() => {
    if (value !== prevRef.current) {
      prevRef.current = value;
      setPopping(true);
      const t = setTimeout(() => setPopping(false), 380);
      return () => clearTimeout(t);
    }
  }, [value]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: accent
          ? 'linear-gradient(145deg, rgba(28,22,5,0.94), rgba(8,12,30,0.94))'
          : 'linear-gradient(145deg, rgba(7,10,26,0.96), rgba(8,18,42,0.92))',
        border: `1px solid ${accent ? 'rgba(255,224,0,0.58)' : 'rgba(0,207,255,0.38)'}`,
        borderRadius: 14,
        padding: '6px 0',
        flex: 1,
        minWidth: 0,
        boxShadow: accent
          ? '0 0 0 1px rgba(255,224,0,0.16), 0 0 16px rgba(255,224,0,0.22), inset 0 0 14px rgba(255,224,0,0.06), inset 0 1px 0 rgba(255,255,255,0.06)'
          : '0 0 0 1px rgba(0,207,255,0.12), 0 0 14px rgba(0,207,255,0.18), inset 0 0 14px rgba(0,207,255,0.06), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
    >
      <span style={{
        fontFamily: 'Orbitron, sans-serif',
        fontSize: 8,
        fontWeight: 700,
        letterSpacing: '0.28em',
        color: accent ? '#8A6A00' : '#1E3460',
        textTransform: 'uppercase',
        marginBottom: 2,
      }}>
        {label}
      </span>
      <span
        className={popping ? 'score-pop' : ''}
        style={{
          fontFamily: 'Orbitron, sans-serif',
          fontSize: 18,
          fontWeight: 700,
          color: accent ? '#FFE000' : '#00CFFF',
          textShadow: accent
            ? '0 0 8px rgba(255,224,0,0.6)'
            : '0 0 8px rgba(0,207,255,0.6)',
          lineHeight: 1.2,
          display: 'block',
        }}
      >
        {value.toLocaleString()}
      </span>
    </div>
  );
}

function IconButton({
  onClick,
  disabled,
  children,
}: {
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      className="neon-btn"
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 52,
        height: 52,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: disabled
          ? 'rgba(20,30,70,0.5)'
          : 'linear-gradient(145deg, rgba(7,10,26,0.96), rgba(8,18,42,0.92))',
        border: `1px solid ${disabled ? 'rgba(30,46,90,0.75)' : 'rgba(0,207,255,0.38)'}`,
        borderRadius: 14,
        cursor: disabled ? 'not-allowed' : 'pointer',
        boxShadow: disabled
          ? '0 0 8px rgba(30,46,90,0.14)'
          : '0 0 0 1px rgba(0,207,255,0.12), 0 0 14px rgba(0,207,255,0.18), inset 0 0 14px rgba(0,207,255,0.06), inset 0 1px 0 rgba(255,255,255,0.05)',
        opacity: disabled ? 0.3 : 1,
        flexShrink: 0,
        padding: 0,
      }}
    >
      {children}
    </button>
  );
}

export default function ScorePanel({
  score,
  best,
  muted,
  onToggleMute,
  onSettingsClick,
}: ScorePanelProps) {
  const { t } = useLanguage();
  const isLeading = score > 0 && score >= best;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'stretch',
      justifyContent: 'space-between',
      width: '100%',
      gap: 12,
    }}>
      {/* Sound */}
      <IconButton onClick={onToggleMute}>
        {muted ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2A3860" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00CFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
          </svg>
        )}
      </IconButton>

      {/* Settings */}
      <IconButton onClick={onSettingsClick}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00CFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </IconButton>

      <ScoreBox label={t('score')} value={score} />
      <ScoreBox label={t('best')} value={best} accent={isLeading} />
    </div>
  );
}