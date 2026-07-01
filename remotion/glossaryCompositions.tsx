import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, useVideoConfig, staticFile, Img } from 'remotion';
import { loadFont } from '@remotion/google-fonts/Inter';
import { ByteMascot } from './Byte';

const { fontFamily } = loadFont();
const BG = '#0A0A0A';
const LOGO_SRC = staticFile('logocoduy.png');
const CoduyLogo: React.FC<{ height?: number }> = ({ height = 28 }) => (
  <Img src={LOGO_SRC} style={{ height, objectFit: 'contain' }} />
);

const categoryLabel: Record<string, { en: string; sk: string }> = {
  skratka: { en: 'ABBREVIATION', sk: 'SKRATKA' },
  koncept: { en: 'CONCEPT', sk: 'KONCEPT' },
  nastroj: { en: 'TOOL', sk: 'NÁSTROJ' },
};

/** Animated antenna decoration — just the tip, floating and glowing */
const AntennaDecor: React.FC<{ antenna: string; frame: number; fps: number }> = ({ antenna, frame, fps }) => {
  const float = interpolate(Math.sin(frame / fps * Math.PI * 0.6), [-1, 1], [-6, 6]);
  const pulse = interpolate(Math.sin(frame / fps * Math.PI * 1.2), [-1, 1], [0.85, 1.15]);
  const glow = interpolate(Math.sin(frame / fps * Math.PI * 0.8), [-1, 1], [0.4, 0.9]);

  const colors: Record<string, string> = {
    'ant-heart': '#ff6b8a', 'ant-star': '#fff', 'ant-lightning': '#ffd700',
    'ant-diamond': '#80d0ff', 'ant-flame-orb': '#ff6030',
    'ant-frost-crystal': '#80d0ff', 'ant-golden-star': '#f5a623',
  };
  const color = colors[antenna] || '#fff';

  return (
    <div style={{ transform: `translateY(${float}px) scale(${pulse})`, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width={60} height={70} viewBox="0 0 60 70">
        {/* Stem */}
        <line x1="30" y1="35" x2="30" y2="60" stroke="#555" strokeWidth="3" strokeLinecap="round" />
        {/* Tip glow */}
        <circle cx="30" cy="28" r="18" fill={color} opacity={glow * 0.15} style={{ filter: 'blur(8px)' }} />
        {/* Tip */}
        {antenna.includes('heart') && (
          <path d="M30,20 C30,20 23,14 23,19 C23,23 27,25 30,30 C33,25 37,23 37,19 C37,14 30,20 30,20 Z" fill={color} />
        )}
        {antenna.includes('star') && (
          <polygon points="30,12 32.5,22 42,22 34,28 37,38 30,32 23,38 26,28 18,22 27.5,22" fill={color} />
        )}
        {antenna.includes('lightning') && (
          <polygon points="33,10 25,25 31,25 27,40 36,22 30,22" fill={color} />
        )}
        {antenna.includes('diamond') && (
          <polygon points="30,12 38,24 30,36 22,24" fill={color} />
        )}
        {antenna.includes('flame') && (
          <circle cx="30" cy="24" r="12" fill={color} opacity={0.9} />
        )}
        {antenna.includes('frost') && (
          <polygon points="30,12 35,20 42,22 35,24 30,32 25,24 18,22 25,20" fill={color} />
        )}
        {antenna.includes('golden') && (
          <polygon points="30,10 33,20 43,21 35,27 38,37 30,31 22,37 25,27 17,21 27,20" fill={color} />
        )}
      </svg>
    </div>
  );
};

/* ========== SLIDE 1: Term + Definition + Code (VIDEO) ========== */
export const SlideGlossaryTerm: React.FC<{
  term: string;
  short: string;
  category: string;
  explanation: string;
  example: string;
  antenna: string;
  lang: string;
}> = ({ term, short, category, explanation, example, antenna, lang }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cat = categoryLabel[category] || { en: 'TERM', sk: 'POJEM' };

  return (
    <AbsoluteFill style={{ background: BG, fontFamily, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '52px 52px', textAlign: 'center' }}>
      {/* Antenna decoration */}
      <AntennaDecor antenna={antenna} frame={frame} fps={fps} />

      {/* Category badge */}
      <div style={{ padding: '10px 28px', borderRadius: 30, background: '#1a1a1a', border: '1px solid #333', fontSize: 20, color: '#999', fontWeight: 700, letterSpacing: '0.12em', marginTop: 8, marginBottom: 20 }}>
        {lang === 'sk' ? cat.sk : cat.en}
      </div>

      {/* Term — huge */}
      <h1 style={{ fontSize: 96, fontWeight: 800, color: '#fff', margin: '0 0 8px', letterSpacing: '-0.03em', lineHeight: 1 }}>
        {term}
      </h1>

      {/* Full name */}
      <p style={{ fontSize: 30, color: '#999', fontWeight: 500, margin: '0 0 28px', fontStyle: 'italic' }}>
        {short}
      </p>

      {/* Definition */}
      <p style={{ fontSize: 34, color: '#e0e0e0', lineHeight: 1.45, margin: '0 0 28px', maxWidth: 920 }}>
        {explanation}
      </p>

      {/* Code example */}
      {example && (
        <div style={{ width: '100%', maxWidth: 900, borderRadius: 18, overflow: 'hidden', border: '1px solid #222' }}>
          <div style={{ background: '#161616', padding: '10px 18px', display: 'flex', gap: 7 }}>
            <div style={{ width: 12, height: 12, borderRadius: 6, background: '#ff5f57' }} />
            <div style={{ width: 12, height: 12, borderRadius: 6, background: '#febc2e' }} />
            <div style={{ width: 12, height: 12, borderRadius: 6, background: '#28c840' }} />
          </div>
          <pre style={{ background: '#111', padding: '20px 24px', fontSize: 26, color: '#ccc', margin: 0, lineHeight: 1.6, fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'pre-wrap', textAlign: 'left' }}>
            {example}
          </pre>
        </div>
      )}

      <div style={{ position: 'absolute', bottom: 44 }}><CoduyLogo height={22} /></div>
    </AbsoluteFill>
  );
};

/* ========== SLIDE 2: Explained Simply ========== */
export const SlideGlossarySimple: React.FC<{
  term: string;
  simpleExplanation: string;
  lang: string;
  equipment?: Record<string, string>;
}> = ({ term, simpleExplanation, lang, equipment = {} }) => {
  return (
    <AbsoluteFill style={{ background: BG, fontFamily, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 52px', textAlign: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
        <div style={{ width: 12, height: 12, borderRadius: 6, background: '#4ade80' }} />
        <span style={{ fontSize: 24, color: '#4ade80', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>
          {lang === 'sk' ? 'Vysvetlené ľudskou rečou' : 'Explained Simply'}
        </span>
      </div>

      <h2 style={{ fontSize: 80, fontWeight: 800, color: '#fff', margin: '0 0 40px', letterSpacing: '-0.03em', lineHeight: 1.06 }}>
        {term}
      </h2>

      <p style={{ fontSize: 40, color: '#e0e0e0', lineHeight: 1.5, margin: '0 0 36px', maxWidth: 900 }}>
        {simpleExplanation}
      </p>

      <ByteMascot size={180} equipment={equipment} />

      <div style={{ position: 'absolute', bottom: 44 }}><CoduyLogo height={22} /></div>
    </AbsoluteFill>
  );
};
