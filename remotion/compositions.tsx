import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { loadFont } from '@remotion/google-fonts/Inter';
import { ByteMascot } from './Byte';

const { fontFamily } = loadFont();

const W = 1080;
const H = 1440;
const BG = '#0A0A0A';

/* ========== SLIDE 1: Video — Byte + Lesson Title ========== */
export const Slide1Video: React.FC<{
  title: string;
  moduleTitle: string;
  equipment: Record<string, string>;
}> = ({ title, moduleTitle, equipment }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Everything visible from frame 0 — only subtle scale animation (no fade-in)
  const breathe = interpolate(Math.sin(frame / fps * Math.PI * 0.5), [-1, 1], [0.97, 1.03]);
  const swipeOpacity = interpolate(frame, [0, fps * 2, fps * 2.5, fps * 3, fps * 3.5], [1, 1, 0.4, 1, 0.4], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ background: BG, fontFamily, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 60 }}>
      {/* Module badge — always visible */}
      <div style={{
        marginBottom: 50,
        padding: '14px 32px', borderRadius: 40,
        background: '#1a1a1a', border: '2px solid #333',
        fontSize: 18, color: '#aaa', fontWeight: 700,
        letterSpacing: '0.1em', textTransform: 'uppercase' as const,
      }}>
        {moduleTitle}
      </div>

      {/* Byte — BIG, gentle breathe animation */}
      <div style={{ transform: `scale(${breathe})` }}>
        <ByteMascot size={420} equipment={equipment} />
      </div>

      {/* Title — always visible */}
      <div style={{ marginTop: 60, textAlign: 'center', padding: '0 40px' }}>
        <h1 style={{
          fontSize: 64, fontWeight: 800, color: '#ffffff',
          lineHeight: 1.1, letterSpacing: '-0.03em', margin: 0,
        }}>
          {title}
        </h1>
      </div>

      {/* Swipe hint — blinks to draw attention */}
      <div style={{ marginTop: 30, opacity: swipeOpacity }}>
        <p style={{ fontSize: 24, color: '#888', fontWeight: 500 }}>Swipe to learn →</p>
      </div>

      {/* Coduy watermark */}
      <div style={{
        position: 'absolute', bottom: 50,
        fontSize: 18, color: '#444', fontWeight: 800, letterSpacing: '0.15em',
      }}>
        CODUY
      </div>
    </AbsoluteFill>
  );
};

/* ========== SLIDE 2-4: Learning Content ========== */
export const SlideLearn: React.FC<{
  content: string;
  slideNumber: number;
  totalSlides: number;
  equipment: Record<string, string>;
}> = ({ content, slideNumber, totalSlides, equipment }) => {
  const paragraphs = (content || '').split('\n').filter(l => l.trim());

  return (
    <AbsoluteFill style={{ background: BG, fontFamily, display: 'flex', flexDirection: 'column', padding: '70px 60px' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 10, height: 10, borderRadius: 5, background: '#fff' }} />
          <span style={{ fontSize: 16, color: '#999', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>
            Learning
          </span>
        </div>
        <div style={{
          padding: '6px 16px', borderRadius: 20,
          background: '#1a1a1a', border: '1px solid #333',
          fontSize: 16, color: '#888', fontWeight: 700,
        }}>
          {slideNumber}/{totalSlides}
        </div>
      </div>

      {/* Byte mini — left aligned */}
      <div style={{ marginBottom: 30 }}>
        <ByteMascot size={120} equipment={equipment} />
      </div>

      {/* Content — big readable text */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 18, overflow: 'hidden' }}>
        {paragraphs.slice(0, 8).map((para, i) => {
          const isHeading = para.length < 80 && !para.endsWith('.') && !para.startsWith('-') && !para.startsWith('•');
          if (isHeading) {
            return (
              <h2 key={i} style={{
                fontSize: 40, fontWeight: 800, color: '#ffffff',
                margin: 0, letterSpacing: '-0.02em', lineHeight: 1.15,
              }}>
                {para}
              </h2>
            );
          }
          return (
            <p key={i} style={{
              fontSize: 26, color: '#cccccc', lineHeight: 1.6, margin: 0,
            }}>
              {para.length > 200 ? para.slice(0, 200) + '…' : para}
            </p>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{
        borderTop: '1px solid #222', paddingTop: 24,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontSize: 16, color: '#444', fontWeight: 800, letterSpacing: '0.15em' }}>CODUY</span>
        <span style={{ fontSize: 16, color: '#444', fontWeight: 500 }}>coduy.app</span>
      </div>
    </AbsoluteFill>
  );
};

/* ========== SLIDE 5: Real World / Why Care ========== */
export const SlideRealWorld: React.FC<{
  content: string;
  equipment: Record<string, string>;
}> = ({ content, equipment }) => {
  const paragraphs = (content || '').split('\n').filter(l => l.trim()).slice(0, 10);

  return (
    <AbsoluteFill style={{ background: BG, fontFamily, display: 'flex', flexDirection: 'column', padding: '70px 60px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 36 }}>
        <div style={{ width: 10, height: 10, borderRadius: 5, background: '#f59e0b' }} />
        <span style={{
          fontSize: 16, color: '#f59e0b', fontWeight: 700,
          letterSpacing: '0.1em', textTransform: 'uppercase' as const,
        }}>
          Why should you care?
        </span>
      </div>

      {/* Byte */}
      <div style={{ marginBottom: 30 }}>
        <ByteMascot size={120} equipment={equipment} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, overflow: 'hidden' }}>
        {paragraphs.slice(0, 7).map((para, i) => {
          const isHeading = para.length < 80 && !para.endsWith('.') && !para.startsWith('-');
          if (isHeading) {
            return <h3 key={i} style={{ fontSize: 36, fontWeight: 800, color: '#ffffff', margin: 0, lineHeight: 1.15 }}>{para}</h3>;
          }
          return <p key={i} style={{ fontSize: 24, color: '#bbbbbb', lineHeight: 1.6, margin: 0 }}>
            {para.length > 220 ? para.slice(0, 220) + '…' : para}
          </p>;
        })}
      </div>

      <div style={{
        borderTop: '1px solid #222', paddingTop: 24,
        display: 'flex', justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 16, color: '#444', fontWeight: 800, letterSpacing: '0.15em' }}>CODUY</span>
        <span style={{ fontSize: 16, color: '#444', fontWeight: 500 }}>coduy.app</span>
      </div>
    </AbsoluteFill>
  );
};

/* ========== SLIDE 6: CTA ========== */
export const SlideCTA: React.FC<{
  lang: 'en' | 'sk';
  equipment: Record<string, string>;
}> = ({ lang, equipment }) => {
  return (
    <AbsoluteFill style={{ background: BG, fontFamily, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 60 }}>
      {/* Byte — big */}
      <ByteMascot size={420} equipment={equipment} />

      <h1 style={{
        fontSize: 56, fontWeight: 800, color: '#ffffff',
        textAlign: 'center', marginTop: 56, lineHeight: 1.15,
        letterSpacing: '-0.02em',
      }}>
        {lang === 'sk' ? 'Nájdi v Coduy app' : 'Find it in Coduy app'}
      </h1>

      <p style={{ fontSize: 26, color: '#999', marginTop: 20, textAlign: 'center' }}>
        {lang === 'sk' ? 'Nauč sa programovať zadarmo' : 'Learn to code for free'}
      </p>

      {/* Save for later */}
      <div style={{
        marginTop: 48, display: 'flex', alignItems: 'center', gap: 14,
        padding: '18px 40px', borderRadius: 16,
        background: '#1a1a1a', border: '2px solid #333',
      }}>
        <span style={{ fontSize: 28 }}>🔖</span>
        <span style={{ fontSize: 22, color: '#ccc', fontWeight: 600 }}>
          {lang === 'sk' ? 'Ulož si na neskôr' : 'Save for later'}
        </span>
      </div>

      {/* CTA button */}
      <div style={{
        marginTop: 28, padding: '24px 80px', borderRadius: 20,
        background: '#ffffff', color: '#000000',
        fontSize: 26, fontWeight: 800,
      }}>
        coduy.app
      </div>

      <div style={{
        position: 'absolute', bottom: 50,
        fontSize: 18, color: '#555', fontWeight: 600,
      }}>
        @coduy
      </div>
    </AbsoluteFill>
  );
};
