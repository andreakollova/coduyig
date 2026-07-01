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

interface QuizOption { label: string; text: string; isCorrect: boolean; }

/* ========== SLIDE 1: Question (VIDEO — animated Byte + swipe blink) ========== */
export const SlideQuestion: React.FC<{
  question: string;
  options: QuizOption[];
  codeSnippet?: string | null;
  lang: string;
}> = ({ question, options = [], codeSnippet, lang }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const breathe = interpolate(Math.sin(frame / fps * Math.PI * 0.5), [-1, 1], [0.97, 1.03]);
  const swipeOp = interpolate(frame, [0, fps * 2, fps * 2.5, fps * 3, fps * 3.5], [1, 1, 0.3, 1, 0.3], { extrapolateRight: 'clamp' });

  // Swipe hand animation
  const swipeHandX = interpolate(frame % (fps * 2), [0, fps * 0.5, fps * 1, fps * 1.5, fps * 2], [60, 0, -60, -60, 60], { extrapolateRight: 'clamp' });
  const swipeHandOp = interpolate(frame % (fps * 2), [0, fps * 0.3, fps * 1, fps * 1.3, fps * 2], [0, 0.6, 0.6, 0, 0], { extrapolateRight: 'clamp' });
  const showHand = frame > fps * 2.5;

  return (
    <AbsoluteFill style={{ background: BG, fontFamily, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '44px 48px', textAlign: 'center' }}>
      {/* Byte animated */}
      <div style={{ transform: `scale(${breathe})`, marginBottom: 12 }}>
        <ByteMascot size={140} equipment={{}} />
      </div>

      {/* Title — smaller, not bold */}
      <p style={{ fontSize: 28, color: '#999', margin: '0 0 12px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>
        {lang === 'sk' ? 'Vieš správnu odpoveď?' : 'Do you know the answer?'}
      </p>

      {/* Question — big heading */}
      <h1 style={{ fontSize: 52, fontWeight: 800, color: '#fff', margin: '0 0 40px', lineHeight: 1.12, letterSpacing: '-0.02em', maxWidth: 920 }}>
        {question}
      </h1>

      {/* Code snippet */}
      {codeSnippet && codeSnippet.trim() && (
        <div style={{ width: '100%', maxWidth: 900, borderRadius: 18, overflow: 'hidden', border: '1px solid #222', marginBottom: 28 }}>
          <div style={{ background: '#161616', padding: '10px 18px', display: 'flex', gap: 7 }}>
            <div style={{ width: 12, height: 12, borderRadius: 6, background: '#ff5f57' }} />
            <div style={{ width: 12, height: 12, borderRadius: 6, background: '#febc2e' }} />
            <div style={{ width: 12, height: 12, borderRadius: 6, background: '#28c840' }} />
          </div>
          <pre style={{ background: '#111', padding: '20px', fontSize: 28, color: '#e0e0e0', margin: 0, textAlign: 'left', lineHeight: 1.6, fontFamily: "'JetBrains Mono', monospace" }}>
            {codeSnippet}
          </pre>
        </div>
      )}

      {/* Options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 900 }}>
        {(options || []).map((opt) => (
          <div key={opt.label} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
            padding: '18px 28px', borderRadius: 16,
            background: '#161616', border: '2px solid #2a2a2a',
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, flexShrink: 0,
              background: '#222', border: '2px solid #333',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, fontWeight: 700, color: '#aaa',
            }}>
              {opt.label}
            </div>
            <span style={{ fontSize: 32, color: '#ddd', fontWeight: 500 }}>{opt.text}</span>
          </div>
        ))}
      </div>

      {/* Swipe hint — animated blink */}
      <div style={{ marginTop: 36, opacity: swipeOp, padding: '18px 48px', borderRadius: 50, background: '#161616', border: '2px solid #2a2a2a', position: 'relative' }}>
        <p style={{ fontSize: 34, color: '#bbb', fontWeight: 600, margin: 0 }}>
          {lang === 'sk' ? 'Swipni doľava →' : 'Swipe left →'}
        </p>
      </div>

      {/* Swipe hand */}
      {showHand && (
        <div style={{ position: 'absolute', bottom: 100, right: 180, transform: `translateX(${swipeHandX}px)`, opacity: swipeHandOp, fontSize: 48 }}>
          👆
        </div>
      )}

      <div style={{ position: 'absolute', bottom: 40 }}><CoduyLogo height={24} /></div>
    </AbsoluteFill>
  );
};

/* ========== SLIDE 2: Answer (VIDEO — celebrating Byte) ========== */
export const SlideAnswer: React.FC<{
  question: string;
  options: QuizOption[];
  codeSnippet?: string | null;
  lang: string;
}> = ({ question, options = [], codeSnippet, lang }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Celebrating animation — wiggle + bounce
  const wiggle = interpolate(Math.sin(frame / fps * Math.PI * 4), [-1, 1], [-3, 3]);
  const bounce = interpolate(Math.sin(frame / fps * Math.PI * 2), [-1, 1], [0, -10]);

  // Sparkle opacity
  const sparkle1 = interpolate(Math.sin(frame / fps * Math.PI * 3), [-1, 1], [0.2, 1]);
  const sparkle2 = interpolate(Math.sin(frame / fps * Math.PI * 3 + 2), [-1, 1], [0.2, 1]);

  return (
    <AbsoluteFill style={{ background: BG, fontFamily, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '44px 48px', textAlign: 'center' }}>
      {/* Byte — celebrating! */}
      <div style={{ marginBottom: 12, transform: `rotate(${wiggle}deg) translateY(${bounce}px)`, position: 'relative' }}>
        <ByteMascot size={140} equipment={{}} />
        {/* Sparkles around Byte */}
        <div style={{ position: 'absolute', top: -5, left: -15, fontSize: 20, opacity: sparkle1 }}>✦</div>
        <div style={{ position: 'absolute', top: 10, right: -15, fontSize: 16, opacity: sparkle2 }}>✦</div>
        <div style={{ position: 'absolute', bottom: 20, left: -10, fontSize: 14, opacity: sparkle1 * 0.8 }}>✦</div>
      </div>

      {/* Title — smaller, green, not bold */}
      <p style={{ fontSize: 28, color: '#4ade80', margin: '0 0 12px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>
        {lang === 'sk' ? 'Správna odpoveď!' : 'Correct Answer!'}
      </p>

      {/* Question — big heading */}
      <h1 style={{ fontSize: 52, fontWeight: 800, color: '#fff', margin: '0 0 40px', lineHeight: 1.12, letterSpacing: '-0.02em', maxWidth: 920 }}>
        {question}
      </h1>

      {/* Code snippet */}
      {codeSnippet && codeSnippet.trim() && (
        <div style={{ width: '100%', maxWidth: 900, borderRadius: 18, overflow: 'hidden', border: '1px solid #222', marginBottom: 28 }}>
          <div style={{ background: '#161616', padding: '10px 18px', display: 'flex', gap: 7 }}>
            <div style={{ width: 12, height: 12, borderRadius: 6, background: '#ff5f57' }} />
            <div style={{ width: 12, height: 12, borderRadius: 6, background: '#febc2e' }} />
            <div style={{ width: 12, height: 12, borderRadius: 6, background: '#28c840' }} />
          </div>
          <pre style={{ background: '#111', padding: '20px', fontSize: 28, color: '#e0e0e0', margin: 0, textAlign: 'left', lineHeight: 1.6, fontFamily: "'JetBrains Mono', monospace" }}>
            {codeSnippet}
          </pre>
        </div>
      )}

      {/* Options — correct highlighted */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 900 }}>
        {(options || []).map((opt) => (
          <div key={opt.label} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
            padding: '18px 28px', borderRadius: 16,
            background: opt.isCorrect ? 'rgba(74,222,128,0.1)' : '#161616',
            border: `2px solid ${opt.isCorrect ? '#4ade80' : '#1a1a1a'}`,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, flexShrink: 0,
              background: opt.isCorrect ? '#4ade80' : '#222',
              border: `2px solid ${opt.isCorrect ? '#4ade80' : '#333'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, fontWeight: 700, color: opt.isCorrect ? '#052e16' : '#666',
            }}>
              {opt.isCorrect ? '✓' : opt.label}
            </div>
            <span style={{ fontSize: 32, color: opt.isCorrect ? '#4ade80' : '#666', fontWeight: opt.isCorrect ? 700 : 500 }}>
              {opt.text}
            </span>
          </div>
        ))}
      </div>

      <div style={{ position: 'absolute', bottom: 40 }}><CoduyLogo height={24} /></div>
    </AbsoluteFill>
  );
};

/* ========== SLIDE 3: Explanation ========== */
export const SlideExplanation: React.FC<{
  question: string;
  explanation?: string;
  lang: string;
}> = ({ question, explanation, lang }) => {
  return (
    <AbsoluteFill style={{ background: BG, fontFamily, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 52px', textAlign: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 36 }}>
        <div style={{ width: 12, height: 12, borderRadius: 6, background: '#4ade80' }} />
        <span style={{ fontSize: 26, color: '#4ade80', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>
          {lang === 'sk' ? 'Vysvetlenie' : 'Explanation'}
        </span>
      </div>

      <h2 style={{ fontSize: 48, fontWeight: 800, color: '#fff', margin: '0 0 36px', lineHeight: 1.1, maxWidth: 920 }}>
        {question}
      </h2>

      <p style={{ fontSize: 42, color: '#e0e0e0', lineHeight: 1.45, margin: 0, maxWidth: 900 }}>
        {explanation}
      </p>

      <div style={{ position: 'absolute', bottom: 44 }}><CoduyLogo height={22} /></div>
    </AbsoluteFill>
  );
};
