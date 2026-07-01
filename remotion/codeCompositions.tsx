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
    <AbsoluteFill style={{ background: BG, fontFamily, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '44px 48px', textAlign: 'center' }}>
      {/* Byte animated */}
      <div style={{ transform: `scale(${breathe})`, marginBottom: 12 }}>
        <ByteMascot size={130} equipment={equipment} />
      </div>

      {/* Title */}
      <p style={{ fontSize: 28, color: '#999', margin: '0 0 12px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>
        {lang === 'sk' ? 'Doplň kód' : 'Fill in the code'}
      </p>

      {/* Prompt — big */}
      <h1 style={{ fontSize: 44, fontWeight: 800, color: '#fff', margin: '0 0 28px', lineHeight: 1.12, maxWidth: 920 }}>
        {prompt}
      </h1>

      {/* Code block with ? */}
      <div style={{ width: '100%', maxWidth: 900, borderRadius: 18, overflow: 'hidden', border: '1px solid #222', marginBottom: 28 }}>
        <div style={{ background: '#161616', padding: '10px 18px', display: 'flex', gap: 7 }}>
          <div style={{ width: 12, height: 12, borderRadius: 6, background: '#ff5f57' }} />
          <div style={{ width: 12, height: 12, borderRadius: 6, background: '#febc2e' }} />
          <div style={{ width: 12, height: 12, borderRadius: 6, background: '#28c840' }} />
        </div>
        <pre style={{ background: '#111', padding: '24px', fontSize: 30, color: '#e0e0e0', margin: 0, textAlign: 'left', lineHeight: 1.7, fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'pre-wrap' }}>
          {codeSnippet}
        </pre>
      </div>

      {/* Options label */}
      <p style={{ fontSize: 22, color: '#888', margin: '0 0 14px', fontWeight: 600 }}>
        {lang === 'sk' ? 'Vyber správnu odpoveď:' : 'Pick the correct answer:'}
      </p>

      {/* Options — horizontal row */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        {options.map((opt) => (
          <div key={opt} style={{
            padding: '16px 28px', borderRadius: 14,
            background: '#161616', border: '2px solid #2a2a2a',
            fontSize: 28, fontWeight: 600, color: '#ddd',
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            {opt}
          </div>
        ))}
      </div>

      {/* Swipe hint */}
      <div style={{ marginTop: 32, opacity: swipeOp, padding: '16px 44px', borderRadius: 50, background: '#161616', border: '2px solid #2a2a2a' }}>
        <p style={{ fontSize: 32, color: '#bbb', fontWeight: 600, margin: 0 }}>
          {lang === 'sk' ? 'Swipni doľava →' : 'Swipe left →'}
        </p>
      </div>

      {showHand && (
        <div style={{ position: 'absolute', bottom: 100, right: 180, transform: `translateX(${swipeHandX}px)`, opacity: swipeHandOp, fontSize: 48 }}>👆</div>
      )}

      <div style={{ position: 'absolute', bottom: 40 }}><CoduyLogo height={24} /></div>
    </AbsoluteFill>
  );
};

/* ========== SLIDE 2: Code Answer (VIDEO — celebrating) ========== */
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
    <AbsoluteFill style={{ background: BG, fontFamily, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '44px 48px', textAlign: 'center' }}>
      {/* Byte celebrating */}
      <div style={{ marginBottom: 12, position: 'relative' }}>
        <div style={{ transform: `rotate(${wiggle}deg) translateY(${bounce}px)` }}>
          <ByteMascot size={130} equipment={equipment} />
        </div>
        {/* Green confetti */}
        {[{ x: -35, y: -8 }, { x: 45, y: -3 }, { x: -25, y: 35 }, { x: 50, y: 30 }, { x: -45, y: 55 }, { x: 40, y: 50 }].map((p, i) => {
          const cy = interpolate((frame + i * 8) % (fps * 1.5), [0, fps * 1.5], [-15, 35]);
          const co = interpolate((frame + i * 8) % (fps * 1.5), [0, fps * 0.3, fps * 1, fps * 1.5], [0, 1, 0.7, 0]);
          return <div key={i} style={{ position: 'absolute', left: `calc(50% + ${p.x}px)`, top: `calc(50% + ${p.y}px)`, transform: `translateY(${cy}px)`, opacity: co, width: 8, height: 5, borderRadius: 2, background: ['#4ade80', '#22c55e', '#86efac', '#bbf7d0', '#fff', '#4ade80'][i] }} />;
        })}
        <div style={{ position: 'absolute', top: -8, left: -18, fontSize: 20, opacity: sparkle1, color: '#4ade80' }}>✦</div>
        <div style={{ position: 'absolute', top: 8, right: -18, fontSize: 16, opacity: sparkle2, color: '#22c55e' }}>✦</div>
      </div>

      {/* Title */}
      <p style={{ fontSize: 28, color: '#4ade80', margin: '0 0 12px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>
        {lang === 'sk' ? 'Správna odpoveď!' : 'Correct Answer!'}
      </p>

      {/* Prompt */}
      <h1 style={{ fontSize: 42, fontWeight: 800, color: '#fff', margin: '0 0 28px', lineHeight: 1.12, maxWidth: 920 }}>
        {prompt}
      </h1>

      {/* Code with correct answer */}
      <div style={{ width: '100%', maxWidth: 900, borderRadius: 18, overflow: 'hidden', border: '2px solid rgba(74,222,128,0.3)', marginBottom: 28 }}>
        <div style={{ background: '#161616', padding: '10px 18px', display: 'flex', gap: 7 }}>
          <div style={{ width: 12, height: 12, borderRadius: 6, background: '#ff5f57' }} />
          <div style={{ width: 12, height: 12, borderRadius: 6, background: '#febc2e' }} />
          <div style={{ width: 12, height: 12, borderRadius: 6, background: '#28c840' }} />
        </div>
        <pre style={{ background: '#111', padding: '24px', fontSize: 30, color: '#e0e0e0', margin: 0, textAlign: 'left', lineHeight: 1.7, fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'pre-wrap' }}>
          {codeAnswer}
        </pre>
      </div>

      {/* Options — correct highlighted */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        {options.map((opt) => (
          <div key={opt} style={{
            padding: '16px 28px', borderRadius: 14,
            background: opt === correct ? 'rgba(74,222,128,0.1)' : '#161616',
            border: `2px solid ${opt === correct ? '#4ade80' : '#1a1a1a'}`,
            fontSize: 28, fontWeight: opt === correct ? 700 : 500,
            color: opt === correct ? '#4ade80' : '#666',
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            {opt}
          </div>
        ))}
      </div>

      <div style={{ position: 'absolute', bottom: 40 }}><CoduyLogo height={24} /></div>
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
        <span style={{ fontSize: 26, color: '#4ade80', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>
          {lang === 'sk' ? 'Vysvetlenie' : 'Explanation'}
        </span>
      </div>

      <h2 style={{ fontSize: 48, fontWeight: 800, color: '#fff', margin: '0 0 20px', lineHeight: 1.1, maxWidth: 920 }}>
        {prompt}
      </h2>

      <div style={{
        padding: '14px 32px', borderRadius: 14, marginBottom: 28,
        background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.3)',
        fontFamily: "'JetBrains Mono', monospace", fontSize: 36, fontWeight: 700, color: '#4ade80',
      }}>
        {correct}
      </div>

      <p style={{ fontSize: 40, color: '#e0e0e0', lineHeight: 1.45, margin: 0, maxWidth: 900 }}>
        {explanation}
      </p>

      <div style={{ position: 'absolute', bottom: 44 }}><CoduyLogo height={22} /></div>
    </AbsoluteFill>
  );
};
