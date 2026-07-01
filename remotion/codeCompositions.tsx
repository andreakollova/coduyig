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

/** Render code with ? replaced by a highlighted blank box */
const CodeWithBlank: React.FC<{ code: string; fontSize: number }> = ({ code, fontSize }) => {
  const parts = code.split('  ?  ');
  if (parts.length < 2) {
    return <span>{code}</span>;
  }
  return (
    <span>
      {parts[0]}
      <span style={{
        display: 'inline-block',
        padding: '4px 20px', margin: '0 6px',
        background: 'rgba(74,158,255,0.15)',
        border: '2px dashed #4a9eff',
        borderRadius: 10,
        color: '#4a9eff',
        fontWeight: 700,
        fontSize: fontSize * 0.9,
      }}>?</span>
      {parts.slice(1).join('  ?  ')}
    </span>
  );
};

/* ========== SLIDE 1: Code Question (VIDEO) ========== */
export const SlideCodeQuestion: React.FC<{
  prompt: string;
  codeSnippet: string;
  options: string[];
  equipment: Record<string, string>;
  lang: string;
}> = ({ prompt, codeSnippet, options = [], equipment = {}, lang }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const breathe = interpolate(Math.sin(frame / fps * Math.PI * 0.5), [-1, 1], [0.97, 1.03]);
  const swipeOp = interpolate(frame, [0, fps * 2, fps * 2.5, fps * 3, fps * 3.5], [1, 1, 0.3, 1, 0.3], { extrapolateRight: 'clamp' });
  const swipeHandX = interpolate(frame % (fps * 2), [0, fps * 0.5, fps * 1, fps * 1.5, fps * 2], [60, 0, -60, -60, 60], { extrapolateRight: 'clamp' });
  const swipeHandOp = interpolate(frame % (fps * 2), [0, fps * 0.3, fps * 1, fps * 1.3, fps * 2], [0, 0.6, 0.6, 0, 0], { extrapolateRight: 'clamp' });
  const showHand = frame > fps * 2.5;

  return (
    <AbsoluteFill style={{ background: BG, fontFamily, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 48px', textAlign: 'center' }}>
      {/* Byte */}
      <div style={{ transform: `scale(${breathe})`, marginBottom: 12 }}>
        <ByteMascot size={120} equipment={equipment} />
      </div>

      {/* Label */}
      <p style={{ fontSize: 26, color: '#999', margin: '0 0 8px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>
        {lang === 'sk' ? 'Doplňovačka' : 'Fill in the code'}
      </p>

      {/* Prompt — big */}
      <h1 style={{ fontSize: 48, fontWeight: 800, color: '#fff', margin: '0 0 32px', lineHeight: 1.12, maxWidth: 920 }}>
        {lang === 'sk' ? prompt.replace('Doplň chýbajúce kľúčové slová:', 'Doplň chýbajúci kód:').replace('Doplň kód tak,', 'Doplň chýbajúci kód tak,').replace('Doplň kód aby', 'Doplň chýbajúci kód aby').replace('Doplň správne', 'Doplň chýbajúci').replace('Doplň operátor', 'Doplň chýbajúci operátor').replace('Doplň union type', 'Doplň chýbajúci union type') : prompt}
      </h1>

      {/* Code block with highlighted ? blank */}
      <div style={{ width: '100%', maxWidth: 900, borderRadius: 20, overflow: 'hidden', border: '1px solid #222', marginBottom: 32 }}>
        <div style={{ background: '#161616', padding: '10px 18px', display: 'flex', gap: 7 }}>
          <div style={{ width: 12, height: 12, borderRadius: 6, background: '#ff5f57' }} />
          <div style={{ width: 12, height: 12, borderRadius: 6, background: '#febc2e' }} />
          <div style={{ width: 12, height: 12, borderRadius: 6, background: '#28c840' }} />
        </div>
        <pre style={{ background: '#111', padding: '28px', fontSize: 34, color: '#e0e0e0', margin: 0, textAlign: 'left', lineHeight: 1.7, fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'pre-wrap' }}>
          <CodeWithBlank code={codeSnippet} fontSize={34} />
        </pre>
      </div>

      {/* Options label */}
      <p style={{ fontSize: 24, color: '#999', margin: '0 0 16px', fontWeight: 600 }}>
        {lang === 'sk' ? 'Vyber správnu odpoveď:' : 'Pick the correct answer:'}
      </p>

      {/* Options row */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
        {options.map((opt) => (
          <div key={opt} style={{
            padding: '18px 32px', borderRadius: 16,
            background: '#161616', border: '2px solid #2a2a2a',
            fontSize: 32, fontWeight: 600, color: '#ddd',
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            {opt}
          </div>
        ))}
      </div>

      {/* Swipe hint — with spacing */}
      <div style={{ marginTop: 40, opacity: swipeOp, padding: '18px 48px', borderRadius: 50, background: '#161616', border: '2px solid #2a2a2a' }}>
        <p style={{ fontSize: 34, color: '#bbb', fontWeight: 600, margin: 0 }}>
          {lang === 'sk' ? 'Swipni doľava →' : 'Swipe left →'}
        </p>
      </div>

      {showHand && (
        <div style={{ position: 'absolute', bottom: 90, right: 180, transform: `translateX(${swipeHandX}px)`, opacity: swipeHandOp, fontSize: 48 }}>👆</div>
      )}

      <div style={{ position: 'absolute', bottom: 36 }}><CoduyLogo height={24} /></div>
    </AbsoluteFill>
  );
};

/* ========== SLIDE 2: Code Answer (VIDEO) ========== */
export const SlideCodeAnswer: React.FC<{
  prompt: string;
  codeAnswer: string;
  correct: string;
  options: string[];
  equipment: Record<string, string>;
  lang: string;
}> = ({ prompt, codeAnswer, correct, options = [], equipment = {}, lang }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const wiggle = interpolate(Math.sin(frame / fps * Math.PI * 4), [-1, 1], [-3, 3]);
  const bounce = interpolate(Math.sin(frame / fps * Math.PI * 2), [-1, 1], [0, -10]);
  const sparkle1 = interpolate(Math.sin(frame / fps * Math.PI * 3), [-1, 1], [0.2, 1]);
  const sparkle2 = interpolate(Math.sin(frame / fps * Math.PI * 3 + 2), [-1, 1], [0.2, 1]);

  return (
    <AbsoluteFill style={{ background: BG, fontFamily, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 48px', textAlign: 'center' }}>
      {/* Byte celebrating */}
      <div style={{ marginBottom: 12, position: 'relative' }}>
        <div style={{ transform: `rotate(${wiggle}deg) translateY(${bounce}px)` }}>
          <ByteMascot size={120} equipment={equipment} />
        </div>
        {[{ x: -35, y: -8 }, { x: 45, y: -3 }, { x: -25, y: 35 }, { x: 50, y: 30 }, { x: -45, y: 55 }, { x: 40, y: 50 }].map((p, i) => {
          const cy = interpolate((frame + i * 8) % (fps * 1.5), [0, fps * 1.5], [-15, 35]);
          const co = interpolate((frame + i * 8) % (fps * 1.5), [0, fps * 0.3, fps * 1, fps * 1.5], [0, 1, 0.7, 0]);
          return <div key={i} style={{ position: 'absolute', left: `calc(50% + ${p.x}px)`, top: `calc(50% + ${p.y}px)`, transform: `translateY(${cy}px)`, opacity: co, width: 8, height: 5, borderRadius: 2, background: ['#4ade80', '#22c55e', '#86efac', '#bbf7d0', '#fff', '#4ade80'][i] }} />;
        })}
        <div style={{ position: 'absolute', top: -8, left: -18, fontSize: 20, opacity: sparkle1, color: '#4ade80' }}>✦</div>
        <div style={{ position: 'absolute', top: 8, right: -18, fontSize: 16, opacity: sparkle2, color: '#22c55e' }}>✦</div>
      </div>

      {/* Label */}
      <p style={{ fontSize: 26, color: '#4ade80', margin: '0 0 8px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>
        {lang === 'sk' ? 'Správna odpoveď!' : 'Correct Answer!'}
      </p>

      {/* Prompt */}
      <h1 style={{ fontSize: 46, fontWeight: 800, color: '#fff', margin: '0 0 28px', lineHeight: 1.12, maxWidth: 920 }}>
        {lang === 'sk' ? 'Doplň chýbajúci kód:' : prompt}
      </h1>

      {/* Code with correct answer — green border */}
      <div style={{ width: '100%', maxWidth: 900, borderRadius: 20, overflow: 'hidden', border: '2px solid rgba(74,222,128,0.4)', marginBottom: 28 }}>
        <div style={{ background: '#161616', padding: '10px 18px', display: 'flex', gap: 7 }}>
          <div style={{ width: 12, height: 12, borderRadius: 6, background: '#ff5f57' }} />
          <div style={{ width: 12, height: 12, borderRadius: 6, background: '#febc2e' }} />
          <div style={{ width: 12, height: 12, borderRadius: 6, background: '#28c840' }} />
        </div>
        <pre style={{ background: '#111', padding: '28px', fontSize: 34, color: '#e0e0e0', margin: 0, textAlign: 'left', lineHeight: 1.7, fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'pre-wrap' }}>
          {codeAnswer}
        </pre>
      </div>

      {/* Options — correct highlighted */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
        {options.map((opt) => (
          <div key={opt} style={{
            padding: '18px 32px', borderRadius: 16,
            background: opt === correct ? 'rgba(74,222,128,0.1)' : '#161616',
            border: `2px solid ${opt === correct ? '#4ade80' : '#1a1a1a'}`,
            fontSize: 32, fontWeight: opt === correct ? 700 : 500,
            color: opt === correct ? '#4ade80' : '#666',
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            {opt}
          </div>
        ))}
      </div>

      <div style={{ position: 'absolute', bottom: 36 }}><CoduyLogo height={24} /></div>
    </AbsoluteFill>
  );
};

/* ========== SLIDE 3: Explanation ========== */
export const SlideCodeExplanation: React.FC<{
  prompt: string;
  correct: string;
  explanation: string;
  lang: string;
}> = ({ prompt, correct, explanation, lang }) => {
  return (
    <AbsoluteFill style={{ background: BG, fontFamily, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 52px', textAlign: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
        <div style={{ width: 12, height: 12, borderRadius: 6, background: '#4ade80' }} />
        <span style={{ fontSize: 28, color: '#4ade80', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>
          {lang === 'sk' ? 'Vysvetlenie' : 'Explanation'}
        </span>
      </div>

      <h2 style={{ fontSize: 50, fontWeight: 800, color: '#fff', margin: '0 0 24px', lineHeight: 1.1, maxWidth: 920 }}>
        {prompt}
      </h2>

      <div style={{
        padding: '16px 36px', borderRadius: 16, marginBottom: 32,
        background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.3)',
        fontFamily: "'JetBrains Mono', monospace", fontSize: 40, fontWeight: 700, color: '#4ade80',
      }}>
        {correct}
      </div>

      <p style={{ fontSize: 42, color: '#e0e0e0', lineHeight: 1.45, margin: 0, maxWidth: 900 }}>
        {explanation}
      </p>

      <div style={{ position: 'absolute', bottom: 44 }}><CoduyLogo height={22} /></div>
    </AbsoluteFill>
  );
};
