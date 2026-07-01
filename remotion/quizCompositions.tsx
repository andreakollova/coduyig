import React from 'react';
import { AbsoluteFill, staticFile, Img } from 'remotion';
import { loadFont } from '@remotion/google-fonts/Inter';
import { ByteMascot } from './Byte';

const { fontFamily } = loadFont();
const BG = '#0A0A0A';
const LOGO_SRC = staticFile('logocoduy.png');
const MOCKUP_SRC = staticFile('mockup.png');
const CoduyLogo: React.FC<{ height?: number }> = ({ height = 28 }) => (
  <Img src={LOGO_SRC} style={{ height, objectFit: 'contain' }} />
);

interface QuizSlideProps {
  question: string;
  options: { label: string; text: string; isCorrect: boolean }[];
  codeSnippet?: string;
  lang: string;
  showAnswer?: boolean;
  explanation?: string;
}

/* ========== SLIDE 1: Question (unanswered) ========== */
export const SlideQuestion: React.FC<QuizSlideProps> = ({ question, options, codeSnippet, lang }) => {
  return (
    <AbsoluteFill style={{ background: BG, fontFamily, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '56px 56px', textAlign: 'center' }}>
      {/* Byte */}
      <ByteMascot size={160} equipment={{}} />

      {/* Question */}
      <h2 style={{ fontSize: 48, fontWeight: 800, color: '#fff', margin: '28px 0', lineHeight: 1.12, maxWidth: 920 }}>
        {question}
      </h2>

      {/* Code snippet if present */}
      {codeSnippet && (
        <div style={{ width: '100%', maxWidth: 900, borderRadius: 20, overflow: 'hidden', border: '1px solid #222', marginBottom: 28 }}>
          <div style={{ background: '#161616', padding: '12px 20px', display: 'flex', gap: 8 }}>
            <div style={{ width: 14, height: 14, borderRadius: 7, background: '#ff5f57' }} />
            <div style={{ width: 14, height: 14, borderRadius: 7, background: '#febc2e' }} />
            <div style={{ width: 14, height: 14, borderRadius: 7, background: '#28c840' }} />
          </div>
          <pre style={{ background: '#111', padding: '24px', fontSize: 28, color: '#e0e0e0', margin: 0, textAlign: 'left', lineHeight: 1.6, fontFamily: "'JetBrains Mono', monospace" }}>
            {codeSnippet}
          </pre>
        </div>
      )}

      {/* Options — grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%', maxWidth: 900 }}>
        {options.map((opt) => (
          <div key={opt.label} style={{
            display: 'flex', alignItems: 'center', gap: 16,
            padding: '20px 28px', borderRadius: 16,
            background: '#161616', border: '2px solid #2a2a2a',
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: '#222', border: '2px solid #333',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, fontWeight: 700, color: '#aaa',
            }}>
              {opt.label}
            </div>
            <span style={{ fontSize: 28, color: '#ddd', fontWeight: 500, textAlign: 'left' }}>{opt.text}</span>
          </div>
        ))}
      </div>

      {/* Swipe hint */}
      <div style={{ marginTop: 32, padding: '16px 40px', borderRadius: 50, background: '#161616', border: '2px solid #2a2a2a' }}>
        <p style={{ fontSize: 26, color: '#bbb', fontWeight: 600, margin: 0 }}>
          {lang === 'sk' ? 'Vieš odpoveď? Swipni doľava →' : 'Know the answer? Swipe left →'}
        </p>
      </div>

      <div style={{ position: 'absolute', bottom: 44 }}><CoduyLogo height={24} /></div>
    </AbsoluteFill>
  );
};

/* ========== SLIDE 2: Answer revealed ========== */
export const SlideAnswer: React.FC<QuizSlideProps> = ({ question, options, codeSnippet, lang }) => {
  return (
    <AbsoluteFill style={{ background: BG, fontFamily, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '56px 56px', textAlign: 'center' }}>
      {/* Byte celebrating */}
      <ByteMascot size={160} equipment={{}} />

      {/* Question */}
      <h2 style={{ fontSize: 44, fontWeight: 800, color: '#fff', margin: '24px 0', lineHeight: 1.12, maxWidth: 920 }}>
        {question}
      </h2>

      {/* Code snippet */}
      {codeSnippet && (
        <div style={{ width: '100%', maxWidth: 900, borderRadius: 20, overflow: 'hidden', border: '1px solid #222', marginBottom: 24 }}>
          <div style={{ background: '#161616', padding: '12px 20px', display: 'flex', gap: 8 }}>
            <div style={{ width: 14, height: 14, borderRadius: 7, background: '#ff5f57' }} />
            <div style={{ width: 14, height: 14, borderRadius: 7, background: '#febc2e' }} />
            <div style={{ width: 14, height: 14, borderRadius: 7, background: '#28c840' }} />
          </div>
          <pre style={{ background: '#111', padding: '24px', fontSize: 28, color: '#e0e0e0', margin: 0, textAlign: 'left', lineHeight: 1.6, fontFamily: "'JetBrains Mono', monospace" }}>
            {codeSnippet}
          </pre>
        </div>
      )}

      {/* Options — correct highlighted */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%', maxWidth: 900 }}>
        {options.map((opt) => (
          <div key={opt.label} style={{
            display: 'flex', alignItems: 'center', gap: 16,
            padding: '20px 28px', borderRadius: 16,
            background: opt.isCorrect ? 'rgba(74,222,128,0.1)' : '#161616',
            border: `2px solid ${opt.isCorrect ? '#4ade80' : '#2a2a2a'}`,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: opt.isCorrect ? '#4ade80' : '#222',
              border: `2px solid ${opt.isCorrect ? '#4ade80' : '#333'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, fontWeight: 700, color: opt.isCorrect ? '#052e16' : '#aaa',
            }}>
              {opt.isCorrect ? '✓' : opt.label}
            </div>
            <span style={{ fontSize: 28, color: opt.isCorrect ? '#4ade80' : '#888', fontWeight: opt.isCorrect ? 700 : 500, textAlign: 'left' }}>
              {opt.text}
            </span>
          </div>
        ))}
      </div>

      {/* Correct banner */}
      <div style={{
        marginTop: 28, padding: '18px 48px', borderRadius: 16,
        background: 'rgba(74,222,128,0.1)', border: '2px solid rgba(74,222,128,0.4)',
      }}>
        <span style={{ fontSize: 32, fontWeight: 700, color: '#4ade80' }}>
          {lang === 'sk' ? '✓ Správne!' : '✓ Correct!'}
        </span>
      </div>

      <div style={{ position: 'absolute', bottom: 44 }}><CoduyLogo height={24} /></div>
    </AbsoluteFill>
  );
};

/* ========== SLIDE 3: Explanation ========== */
export const SlideExplanation: React.FC<QuizSlideProps> = ({ question, explanation, lang }) => {
  return (
    <AbsoluteFill style={{ background: BG, fontFamily, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 56px', textAlign: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 36 }}>
        <div style={{ width: 12, height: 12, borderRadius: 6, background: '#4ade80' }} />
        <span style={{ fontSize: 22, color: '#4ade80', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>
          {lang === 'sk' ? 'Vysvetlenie' : 'Explanation'}
        </span>
      </div>

      <h2 style={{ fontSize: 44, fontWeight: 800, color: '#fff', margin: '0 0 32px', lineHeight: 1.12, maxWidth: 920 }}>
        {question}
      </h2>

      <div style={{ maxWidth: 920 }}>
        <p style={{ fontSize: 38, color: '#e0e0e0', lineHeight: 1.5, margin: 0 }}>
          {explanation}
        </p>
      </div>

      <div style={{ marginTop: 40 }}>
        <ByteMascot size={180} equipment={{}} />
      </div>

      <div style={{ position: 'absolute', bottom: 44 }}><CoduyLogo height={20} /></div>
    </AbsoluteFill>
  );
};
