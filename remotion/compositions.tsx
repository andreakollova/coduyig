import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, useVideoConfig } from 'remotion';
import { loadFont } from '@remotion/google-fonts/Inter';
import { ByteMascot } from './Byte';

const { fontFamily } = loadFont();

const BG = '#0A0A0A';

/* ========== SLIDE 1: Video — Byte + Lesson Title ========== */
export const Slide1Video: React.FC<{
  title: string;
  moduleTitle: string;
  equipment: Record<string, string>;
}> = ({ title, moduleTitle, equipment }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const breathe = interpolate(Math.sin(frame / fps * Math.PI * 0.5), [-1, 1], [0.97, 1.03]);
  const swipeOpacity = interpolate(frame, [0, fps * 2, fps * 2.5, fps * 3, fps * 3.5], [1, 1, 0.3, 1, 0.3], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ background: BG, fontFamily, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 50px' }}>
      {/* Module badge */}
      <div style={{
        marginBottom: 44,
        padding: '18px 40px', borderRadius: 50,
        background: '#1a1a1a', border: '2px solid #333',
        fontSize: 22, color: '#bbb', fontWeight: 700,
        letterSpacing: '0.1em', textTransform: 'uppercase' as const,
      }}>
        {moduleTitle}
      </div>

      {/* Byte */}
      <div style={{ transform: `scale(${breathe})` }}>
        <ByteMascot size={440} equipment={equipment} />
      </div>

      {/* Title */}
      <div style={{ marginTop: 52, textAlign: 'center', padding: '0 30px' }}>
        <h1 style={{
          fontSize: 72, fontWeight: 800, color: '#ffffff',
          lineHeight: 1.08, letterSpacing: '-0.03em', margin: 0,
        }}>
          {title}
        </h1>
      </div>

      {/* Swipe hint */}
      <div style={{
        marginTop: 36, opacity: swipeOpacity,
        padding: '16px 44px', borderRadius: 50,
        background: '#161616', border: '2px solid #2a2a2a',
      }}>
        <p style={{ fontSize: 28, color: '#aaa', fontWeight: 600, margin: 0 }}>Swipe to learn →</p>
      </div>

      {/* Coduy watermark */}
      <div style={{
        position: 'absolute', bottom: 48,
        fontSize: 22, color: '#555', fontWeight: 800, letterSpacing: '0.2em',
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
    <AbsoluteFill style={{ background: BG, fontFamily, display: 'flex', flexDirection: 'column', padding: '64px 56px' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 36 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 12, height: 12, borderRadius: 6, background: '#fff' }} />
          <span style={{ fontSize: 20, color: '#aaa', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>
            Learning
          </span>
        </div>
        <div style={{
          padding: '8px 20px', borderRadius: 24,
          background: '#1a1a1a', border: '1px solid #333',
          fontSize: 20, color: '#999', fontWeight: 700,
        }}>
          {slideNumber}/{totalSlides}
        </div>
      </div>

      {/* Byte mini */}
      <div style={{ marginBottom: 28 }}>
        <ByteMascot size={140} equipment={equipment} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20, overflow: 'hidden' }}>
        {paragraphs.slice(0, 7).map((para, i) => {
          const isHeading = para.length < 80 && !para.endsWith('.') && !para.startsWith('-') && !para.startsWith('•');
          if (isHeading) {
            return (
              <h2 key={i} style={{
                fontSize: 46, fontWeight: 800, color: '#ffffff',
                margin: 0, letterSpacing: '-0.02em', lineHeight: 1.12,
              }}>
                {para}
              </h2>
            );
          }
          return (
            <p key={i} style={{
              fontSize: 30, color: '#cccccc', lineHeight: 1.55, margin: 0,
            }}>
              {para}
            </p>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{
        borderTop: '1px solid #222', paddingTop: 24,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontSize: 20, color: '#555', fontWeight: 800, letterSpacing: '0.2em' }}>CODUY</span>
        <span style={{ fontSize: 20, color: '#555', fontWeight: 500 }}>coduy.app</span>
      </div>
    </AbsoluteFill>
  );
};

/* ========== SLIDE 5: Real World / Why Care ========== */
export const SlideRealWorld: React.FC<{
  content: string;
  equipment: Record<string, string>;
}> = ({ content, equipment }) => {
  const paragraphs = (content || '').split('\n').filter(l => l.trim()).slice(0, 8);

  return (
    <AbsoluteFill style={{ background: BG, fontFamily, display: 'flex', flexDirection: 'column', padding: '64px 56px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 32 }}>
        <div style={{ width: 12, height: 12, borderRadius: 6, background: '#f59e0b' }} />
        <span style={{
          fontSize: 20, color: '#f59e0b', fontWeight: 700,
          letterSpacing: '0.1em', textTransform: 'uppercase' as const,
        }}>
          Why should a programmer care?
        </span>
      </div>

      {/* Byte */}
      <div style={{ marginBottom: 28 }}>
        <ByteMascot size={140} equipment={equipment} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 18, overflow: 'hidden' }}>
        {paragraphs.slice(0, 6).map((para, i) => {
          const isHeading = para.length < 80 && !para.endsWith('.') && !para.startsWith('-');
          if (isHeading) {
            return <h3 key={i} style={{ fontSize: 42, fontWeight: 800, color: '#ffffff', margin: 0, lineHeight: 1.12 }}>{para}</h3>;
          }
          return <p key={i} style={{ fontSize: 28, color: '#cccccc', lineHeight: 1.55, margin: 0 }}>{para}</p>;
        })}
      </div>

      <div style={{
        borderTop: '1px solid #222', paddingTop: 24,
        display: 'flex', justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 20, color: '#555', fontWeight: 800, letterSpacing: '0.2em' }}>CODUY</span>
        <span style={{ fontSize: 20, color: '#555', fontWeight: 500 }}>coduy.app</span>
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
    <AbsoluteFill style={{ background: BG, fontFamily, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 50px' }}>
      {/* Byte */}
      <ByteMascot size={440} equipment={equipment} />

      <h1 style={{
        fontSize: 64, fontWeight: 800, color: '#ffffff',
        textAlign: 'center', marginTop: 52, lineHeight: 1.1,
        letterSpacing: '-0.02em',
      }}>
        {lang === 'sk' ? 'Nájdi v Coduy app' : 'Find it in Coduy app'}
      </h1>

      <p style={{ fontSize: 30, color: '#aaa', marginTop: 20, textAlign: 'center' }}>
        {lang === 'sk' ? 'Nauč sa programovať zadarmo' : 'Learn to code for free'}
      </p>

      {/* Save for later */}
      <div style={{
        marginTop: 44, display: 'flex', alignItems: 'center', gap: 16,
        padding: '22px 48px', borderRadius: 20,
        background: '#1a1a1a', border: '2px solid #333',
      }}>
        <span style={{ fontSize: 36 }}>🔖</span>
        <span style={{ fontSize: 28, color: '#ddd', fontWeight: 600 }}>
          {lang === 'sk' ? 'Ulož si na neskôr' : 'Save for later'}
        </span>
      </div>

      {/* CTA button */}
      <div style={{
        marginTop: 28, padding: '26px 96px', borderRadius: 24,
        background: '#ffffff', color: '#000000',
        fontSize: 32, fontWeight: 800,
      }}>
        coduy.app
      </div>

      <div style={{
        position: 'absolute', bottom: 48,
        fontSize: 22, color: '#666', fontWeight: 700,
      }}>
        @coduy
      </div>
    </AbsoluteFill>
  );
};
