import React from 'react';
import { AbsoluteFill, staticFile, Img } from 'remotion';
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
  symbol: { en: 'SYMBOL', sk: 'SYMBOL' },
};

/* ========== SLIDE 1: Term + Definition + Code ========== */
export const SlideGlossaryTerm: React.FC<{
  term: string;
  short: string;
  category: string;
  explanation: string;
  example: string;
  antenna: string;
  lang: string;
}> = ({ term, short, category, explanation, example, antenna, lang }) => {
  const cat = categoryLabel[category] || { en: 'TERM', sk: 'POJEM' };

  return (
    <AbsoluteFill style={{ background: BG, fontFamily, display: 'flex', flexDirection: 'column', padding: '56px 56px' }}>
      {/* Category badge + Byte with antenna */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div style={{ padding: '10px 24px', borderRadius: 30, background: '#1a1a1a', border: '1px solid #333', fontSize: 18, color: '#999', fontWeight: 700, letterSpacing: '0.12em' }}>
          {lang === 'sk' ? cat.sk : cat.en}
        </div>
        <ByteMascot size={120} equipment={{ antenna }} />
      </div>

      {/* Term — huge */}
      <h1 style={{ fontSize: 88, fontWeight: 800, color: '#fff', margin: '0 0 8px', letterSpacing: '-0.03em', lineHeight: 1 }}>
        {term}
      </h1>

      {/* Full name */}
      <p style={{ fontSize: 28, color: '#888', fontWeight: 500, margin: '0 0 32px', fontStyle: 'italic' }}>
        {short}
      </p>

      {/* Definition */}
      <p style={{ fontSize: 34, color: '#e0e0e0', lineHeight: 1.5, margin: '0 0 32px', maxWidth: 920 }}>
        {explanation}
      </p>

      {/* Code example */}
      {example && (
        <div style={{ width: '100%', borderRadius: 16, overflow: 'hidden', border: '1px solid #222' }}>
          <div style={{ background: '#161616', padding: '10px 18px', display: 'flex', gap: 7 }}>
            <div style={{ width: 12, height: 12, borderRadius: 6, background: '#ff5f57' }} />
            <div style={{ width: 12, height: 12, borderRadius: 6, background: '#febc2e' }} />
            <div style={{ width: 12, height: 12, borderRadius: 6, background: '#28c840' }} />
          </div>
          <pre style={{ background: '#111', padding: '20px 24px', fontSize: 24, color: '#ccc', margin: 0, lineHeight: 1.6, fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'pre-wrap' }}>
            {example}
          </pre>
        </div>
      )}

      <div style={{ position: 'absolute', bottom: 44, left: 56 }}><CoduyLogo height={22} /></div>
    </AbsoluteFill>
  );
};

/* ========== SLIDE 2: Explained Simply ========== */
export const SlideGlossarySimple: React.FC<{
  term: string;
  simpleExplanation: string;
  lang: string;
}> = ({ term, simpleExplanation, lang }) => {
  return (
    <AbsoluteFill style={{ background: BG, fontFamily, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 56px', textAlign: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 36 }}>
        <div style={{ width: 12, height: 12, borderRadius: 6, background: '#4ade80' }} />
        <span style={{ fontSize: 22, color: '#4ade80', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>
          {lang === 'sk' ? 'Vysvetlené ľudskou rečou' : 'Explained Simply'}
        </span>
      </div>

      <h2 style={{ fontSize: 72, fontWeight: 800, color: '#fff', margin: '0 0 36px', letterSpacing: '-0.03em', lineHeight: 1.06 }}>
        {term}
      </h2>

      <p style={{ fontSize: 40, color: '#e0e0e0', lineHeight: 1.5, margin: 0, maxWidth: 900 }}>
        {simpleExplanation}
      </p>

      <div style={{ marginTop: 44 }}>
        <ByteMascot size={200} equipment={{}} />
      </div>

      <div style={{ position: 'absolute', bottom: 44 }}><CoduyLogo height={20} /></div>
    </AbsoluteFill>
  );
};
