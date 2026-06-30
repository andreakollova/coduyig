import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Sequence } from 'remotion';
import { ByteMascot } from './Byte';

// Shared constants
const W = 1087;
const H = 1447;
const BG = '#0A0A0A';
const FONT = "-apple-system, 'SF Pro Display', system-ui, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', monospace";

/* ========== SLIDE 1: Video — Byte + Lesson Title ========== */
export const Slide1Video: React.FC<{
  title: string;
  moduleTitle: string;
  equipment: Record<string, string>;
}> = ({ title, moduleTitle, equipment }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({ frame: frame - 20, fps, config: { damping: 14 } });
  const subtitleSpring = spring({ frame: frame - 35, fps, config: { damping: 14 } });
  const badgeSpring = spring({ frame: frame - 10, fps, config: { damping: 12 } });

  return (
    <AbsoluteFill style={{ background: BG, fontFamily: FONT, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 80 }}>
      {/* Module badge */}
      <div style={{ transform: `scale(${badgeSpring})`, marginBottom: 40, padding: '10px 24px', borderRadius: 30, background: '#161616', border: '1px solid #2a2a2a', fontSize: 14, color: '#888', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>
        {moduleTitle}
      </div>

      {/* Byte */}
      <ByteMascot size={320} equipment={equipment} />

      {/* Title */}
      <div style={{ marginTop: 48, textAlign: 'center', transform: `translateY(${(1 - titleSpring) * 30}px)`, opacity: titleSpring }}>
        <h1 style={{ fontSize: 52, fontWeight: 800, color: '#fff', lineHeight: 1.15, letterSpacing: '-0.03em', margin: 0, maxWidth: 800 }}>
          {title}
        </h1>
      </div>

      {/* Subtitle */}
      <div style={{ marginTop: 20, transform: `translateY(${(1 - subtitleSpring) * 20}px)`, opacity: subtitleSpring }}>
        <p style={{ fontSize: 20, color: '#888', fontWeight: 500 }}>Swipe to learn →</p>
      </div>

      {/* Coduy watermark */}
      <div style={{ position: 'absolute', bottom: 50, fontSize: 16, color: '#333', fontWeight: 700, letterSpacing: '0.1em' }}>
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
  // Split content into paragraphs
  const paragraphs = content.split('\n').filter(l => l.trim());

  return (
    <AbsoluteFill style={{ background: BG, fontFamily: FONT, display: 'flex', flexDirection: 'column', padding: '80px 72px' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 48 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 8, height: 8, borderRadius: 4, background: '#fff' }} />
          <span style={{ fontSize: 14, color: '#888', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>
            Learning
          </span>
        </div>
        <span style={{ fontSize: 14, color: '#444', fontWeight: 600 }}>{slideNumber}/{totalSlides}</span>
      </div>

      {/* Byte mini */}
      <div style={{ marginBottom: 36 }}>
        <ByteMascot size={100} equipment={equipment} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
        {paragraphs.map((para, i) => {
          const isHeading = para.length < 60 && !para.endsWith('.') && !para.startsWith('-');
          if (isHeading) {
            return (
              <h2 key={i} style={{ fontSize: 36, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                {para}
              </h2>
            );
          }
          return (
            <p key={i} style={{ fontSize: 22, color: '#b0b0b0', lineHeight: 1.7, margin: 0 }}>
              {para}
            </p>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid #1a1a1a', paddingTop: 20, display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 14, color: '#333', fontWeight: 700, letterSpacing: '0.1em' }}>CODUY</span>
        <span style={{ fontSize: 14, color: '#333' }}>coduy.app</span>
      </div>
    </AbsoluteFill>
  );
};

/* ========== SLIDE 5: Real World / Why Care ========== */
export const SlideRealWorld: React.FC<{
  content: string;
  equipment: Record<string, string>;
}> = ({ content, equipment }) => {
  const paragraphs = content.split('\n').filter(l => l.trim()).slice(0, 12);

  return (
    <AbsoluteFill style={{ background: BG, fontFamily: FONT, display: 'flex', flexDirection: 'column', padding: '80px 72px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40 }}>
        <div style={{ width: 8, height: 8, borderRadius: 4, background: '#f59e0b' }} />
        <span style={{ fontSize: 14, color: '#f59e0b', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>
          Why should you care?
        </span>
      </div>

      {/* Byte */}
      <div style={{ marginBottom: 36 }}>
        <ByteMascot size={100} equipment={equipment} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {paragraphs.map((para, i) => {
          const isHeading = para.length < 60 && !para.endsWith('.') && !para.startsWith('-');
          if (isHeading) {
            return <h3 key={i} style={{ fontSize: 30, fontWeight: 700, color: '#fff', margin: 0, lineHeight: 1.2 }}>{para}</h3>;
          }
          return <p key={i} style={{ fontSize: 20, color: '#999', lineHeight: 1.7, margin: 0 }}>{para}</p>;
        })}
      </div>

      <div style={{ borderTop: '1px solid #1a1a1a', paddingTop: 20, display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 14, color: '#333', fontWeight: 700, letterSpacing: '0.1em' }}>CODUY</span>
        <span style={{ fontSize: 14, color: '#333' }}>coduy.app</span>
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
    <AbsoluteFill style={{ background: BG, fontFamily: FONT, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 80 }}>
      {/* Byte big */}
      <ByteMascot size={360} equipment={equipment} />

      <h1 style={{ fontSize: 48, fontWeight: 800, color: '#fff', textAlign: 'center', marginTop: 48, lineHeight: 1.2, letterSpacing: '-0.02em' }}>
        {lang === 'sk' ? 'Stiahni si Coduy' : 'Download Coduy'}
      </h1>

      <p style={{ fontSize: 22, color: '#888', marginTop: 16, textAlign: 'center', lineHeight: 1.6 }}>
        {lang === 'sk' ? 'Nauč sa programovať zadarmo' : 'Learn to code for free'}
      </p>

      {/* Save for later */}
      <div style={{ marginTop: 40, display: 'flex', alignItems: 'center', gap: 12, padding: '16px 32px', borderRadius: 14, background: '#161616', border: '1px solid #2a2a2a' }}>
        <span style={{ fontSize: 24 }}>🔖</span>
        <span style={{ fontSize: 18, color: '#aaa', fontWeight: 500 }}>
          {lang === 'sk' ? 'Ulož si na neskôr' : 'Save for later'}
        </span>
      </div>

      {/* CTA button */}
      <div style={{
        marginTop: 28, padding: '22px 64px', borderRadius: 16,
        background: '#fff', color: '#000',
        fontSize: 22, fontWeight: 700,
      }}>
        {lang === 'sk' ? 'Nájdi v Coduy app' : 'Find it in Coduy app'}
      </div>

      <div style={{ position: 'absolute', bottom: 50, fontSize: 14, color: '#444', fontWeight: 600 }}>
        @coduy
      </div>
    </AbsoluteFill>
  );
};
