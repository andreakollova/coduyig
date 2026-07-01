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

/* ========== SLIDE 1: Question ========== */
export const SlideQuestion: React.FC<{
  question: string;
  options: QuizOption[];
  codeSnippet?: string | null;
  lang: string;
}> = ({ question, options = [], codeSnippet, lang }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const breathe = interpolate(Math.sin(frame / fps * Math.PI * 0.5), [-1, 1], [0.97, 1.03]);

  return (
    <AbsoluteFill style={{ background: BG, fontFamily, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 48px', textAlign: 'center' }}>
      {/* Byte ABOVE title, animated */}
      <div style={{ transform: `scale(${breathe})`, marginBottom: 16 }}>
        <ByteMascot size={140} equipment={{}} />
      </div>

      {/* Title */}
      <h1 style={{ fontSize: 68, fontWeight: 800, color: '#fff', margin: '0 0 20px', lineHeight: 1.06, letterSpacing: '-0.03em' }}>
        {lang === 'sk' ? 'Vieš správnu odpoveď?' : 'Do you know the answer?'}
      </h1>

      {/* Question */}
      <p style={{ fontSize: 40, color: '#e0e0e0', margin: '0 0 20px', lineHeight: 1.35, maxWidth: 920 }}>
        {question}
      </p>

      {/* Code snippet */}
      {codeSnippet && codeSnippet.trim() && (
        <div style={{ width: '100%', maxWidth: 900, borderRadius: 18, overflow: 'hidden', border: '1px solid #222', marginBottom: 20 }}>
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

      {/* Options — centered */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 900 }}>
        {(options || []).map((opt) => (
          <div key={opt.label} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
            padding: '18px 28px', borderRadius: 16,
            background: '#161616', border: '2px solid #2a2a2a',
          }}>
            <div style={{
              width: 42, height: 42, borderRadius: 12, flexShrink: 0,
              background: '#222', border: '2px solid #333',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, fontWeight: 700, color: "#aaa",
            }}>
              {opt.label}
            </div>
            <span style={{ fontSize: 32, color: "#ddd", fontWeight: 500 }}>{opt.text}</span>
          </div>
        ))}
      </div>

      {/* Swipe hint */}
      <div style={{ marginTop: 24, padding: '16px 40px', borderRadius: 50, background: '#161616', border: '2px solid #2a2a2a' }}>
        <p style={{ fontSize: 30, color: '#bbb', fontWeight: 600, margin: 0 }}>
          {lang === 'sk' ? 'Swipni doľava →' : 'Swipe left →'}
        </p>
      </div>

      <div style={{ position: 'absolute', bottom: 40 }}><CoduyLogo height={24} /></div>
    </AbsoluteFill>
  );
};

/* ========== SLIDE 2: Answer ========== */
export const SlideAnswer: React.FC<{
  question: string;
  options: QuizOption[];
  codeSnippet?: string | null;
  lang: string;
}> = ({ question, options = [], codeSnippet, lang }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const breathe = interpolate(Math.sin(frame / fps * Math.PI * 0.5), [-1, 1], [0.97, 1.03]);

  return (
    <AbsoluteFill style={{ background: BG, fontFamily, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 48px', textAlign: 'center' }}>
      {/* Byte ABOVE title, animated */}
      <div style={{ transform: `scale(${breathe})`, marginBottom: 16 }}>
        <ByteMascot size={140} equipment={{}} />
      </div>

      {/* Title — green */}
      <h1 style={{ fontSize: 68, fontWeight: 800, color: '#4ade80', margin: '0 0 20px', lineHeight: 1.06, letterSpacing: '-0.03em' }}>
        {lang === 'sk' ? 'Správna odpoveď!' : 'Correct Answer!'}
      </h1>

      {/* Question */}
      <p style={{ fontSize: 38, color: '#ccc', margin: '0 0 20px', lineHeight: 1.35, maxWidth: 920 }}>
        {question}
      </p>

      {/* Code snippet */}
      {codeSnippet && codeSnippet.trim() && (
        <div style={{ width: '100%', maxWidth: 900, borderRadius: 18, overflow: 'hidden', border: '1px solid #222', marginBottom: 20 }}>
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

      {/* Options — correct highlighted, centered */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 900 }}>
        {(options || []).map((opt) => (
          <div key={opt.label} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
            padding: '18px 28px', borderRadius: 16,
            background: opt.isCorrect ? 'rgba(74,222,128,0.1)' : '#161616',
            border: `2px solid ${opt.isCorrect ? '#4ade80' : '#1a1a1a'}`,
          }}>
            <div style={{
              width: 42, height: 42, borderRadius: 12, flexShrink: 0,
              background: opt.isCorrect ? '#4ade80' : '#222',
              border: `2px solid ${opt.isCorrect ? '#4ade80' : '#333'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, fontWeight: 700, color: opt.isCorrect ? '#052e16' : '#666',
            }}>
              {opt.isCorrect ? '✓' : opt.label}
            </div>
            <span style={{ fontSize: 30, color: opt.isCorrect ? '#4ade80' : '#666', fontWeight: opt.isCorrect ? 700 : 500 }}>
              {opt.text}
            </span>
          </div>
        ))}
      </div>

      <div style={{ position: 'absolute', bottom: 40 }}><CoduyLogo height={24} /></div>
    </AbsoluteFill>
  );
};

/* ========== SLIDE 3: Explanation (no Byte) ========== */
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
