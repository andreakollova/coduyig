import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, useVideoConfig, staticFile, Img } from 'remotion';
import { loadFont } from '@remotion/google-fonts/Inter';
import { ByteMascot } from './Byte';

const { fontFamily } = loadFont();

const BG = '#0A0A0A';
const LOGO_SRC = staticFile('logocoduy.png');
const MOCKUP_SRC = staticFile('mockup.png');

const CoduyLogo: React.FC<{ height?: number }> = ({ height = 28 }) => (
  <Img src={LOGO_SRC} style={{ height, objectFit: 'contain' }} />
);

/* ========== SLIDE 1: Video — Byte + Title ========== */
export const Slide1Video: React.FC<{
  title: string;
  moduleTitle: string;
  equipment: Record<string, string>;
  levelBadge?: string;
  lang?: string;
}> = ({ title, moduleTitle, equipment, levelBadge, lang = 'en' }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const breathe = interpolate(Math.sin(frame / fps * Math.PI * 0.5), [-1, 1], [0.97, 1.03]);
  const swipeOp = interpolate(frame, [0, fps * 2, fps * 2.5, fps * 3, fps * 3.5], [1, 1, 0.3, 1, 0.3], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ background: BG, fontFamily, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '50px 50px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 32 }}>
        <div style={{ padding: '12px 32px', borderRadius: 50, background: '#1a1a1a', border: '2px solid #333', fontSize: 18, color: '#ccc', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>
          {moduleTitle}
        </div>
        {levelBadge && (
          <div style={{ padding: '6px 20px', borderRadius: 30, background: '#111', border: '1px solid #2a2a2a', fontSize: 16, color: '#aaa', fontWeight: 600 }}>{levelBadge}</div>
        )}
      </div>
      <div style={{ transform: `scale(${breathe})` }}>
        <ByteMascot size={380} equipment={equipment} />
      </div>
      <h1 style={{ fontSize: 68, fontWeight: 800, color: '#fff', lineHeight: 1.08, letterSpacing: '-0.03em', margin: '40px 0 0', textAlign: 'center', padding: '0 20px' }}>
        {title}
      </h1>
      <div style={{ marginTop: 52, opacity: swipeOp, padding: '14px 40px', borderRadius: 50, background: '#161616', border: '2px solid #2a2a2a' }}>
        <p style={{ fontSize: 26, color: '#aaa', fontWeight: 600, margin: 0 }}>{lang === 'sk' ? 'Pokračuj potiahnutím →' : 'Swipe to learn →'}</p>
      </div>
      <div style={{ position: 'absolute', bottom: 44 }}><CoduyLogo height={32} /></div>
    </AbsoluteFill>
  );
};

/* ========== SLIDE 2: Introduction ========== */
export const SlideIntro: React.FC<{
  content: string;
  title: string;
  lang?: string;
}> = ({ content, title, lang = 'en' }) => {
  const lines = (content || '').split(/(?<=[.!?])\s+/).filter(l => l.trim()).slice(0, 9);

  return (
    <AbsoluteFill style={{ background: BG, fontFamily, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 56px', textAlign: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
        <div style={{ width: 10, height: 10, borderRadius: 5, background: '#fff' }} />
        <span style={{ fontSize: 18, color: '#bbb', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>
          {lang === 'sk' ? 'Úvod' : 'Introduction'}
        </span>
      </div>

      <h2 style={{ fontSize: 52, fontWeight: 800, color: '#fff', margin: '0 0 32px', letterSpacing: '-0.02em', lineHeight: 1.08 }}>
        {title}
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 900 }}>
        {lines.map((line, i) => (
          <p key={i} style={{ fontSize: 30, color: '#e0e0e0', lineHeight: 1.5, margin: 0 }}>
            {line}
          </p>
        ))}
      </div>

      <div style={{ position: 'absolute', bottom: 44, display: 'flex', alignItems: 'center', gap: 12 }}>
        <CoduyLogo height={20} />
      </div>
    </AbsoluteFill>
  );
};

/* ========== SLIDES 3-5: Learning Content (centered, big) ========== */
export const SlideLearn: React.FC<{
  content: string;
  slideNumber: number;
  totalSlides: number;
  lang?: string;
}> = ({ content, slideNumber, totalSlides, lang = 'en' }) => {
  const lines = (content || '').split('\n').filter(l => l.trim());
  const firstLine = lines[0] || '';
  const isHeading = firstLine.length < 40 && !firstLine.endsWith('.') && !/[=(){}\[\]<>]/.test(firstLine);
  const heading = isHeading ? firstLine : '';
  const bodyLines = isHeading ? lines.slice(1) : lines;

  return (
    <AbsoluteFill style={{ background: BG, fontFamily, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 56px', textAlign: 'center' }}>
      {/* Top bar */}
      <div style={{ position: 'absolute', top: 56, left: 56, right: 56, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 10, height: 10, borderRadius: 5, background: '#fff' }} />
          <span style={{ fontSize: 18, color: '#bbb', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>
            {lang === 'sk' ? 'Teória' : 'Learning'}
          </span>
        </div>
        <div style={{ padding: '6px 18px', borderRadius: 20, background: '#1a1a1a', border: '1px solid #333', fontSize: 18, color: '#aaa', fontWeight: 700 }}>
          {slideNumber}/{totalSlides}
        </div>
      </div>

      {/* Heading — same size as slide 1 title */}
      {heading && (
        <h2 style={{ fontSize: 60, fontWeight: 800, color: '#ffffff', margin: '0 0 28px', letterSpacing: '-0.02em', lineHeight: 1.08, maxWidth: 900 }}>
          {heading}
        </h2>
      )}

      {/* Body — big, centered */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 900 }}>
        {bodyLines.slice(0, 5).map((para, i) => (
          <p key={i} style={{ fontSize: 34, color: '#e0e0e0', lineHeight: 1.45, margin: 0 }}>
            {para}
          </p>
        ))}
      </div>

      <div style={{ position: 'absolute', bottom: 44, display: 'flex', alignItems: 'center', gap: 12 }}>
        <CoduyLogo height={20} />
      </div>
    </AbsoluteFill>
  );
};

/* ========== SLIDE 6: Fun Fact / Real Example ========== */
export const SlideFunFact: React.FC<{
  content: string;
  type: 'funfact' | 'example';
  lang?: string;
}> = ({ content, type, lang = 'en' }) => {
  const lines = (content || '').split(/(?<=[.!?])\s+/).filter(l => l.trim()).slice(0, 5);

  const label = type === 'funfact'
    ? (lang === 'sk' ? '🚀 Mini zaujímavosť' : '🚀 Fun Fact')
    : (lang === 'sk' ? '🌍 Reálny príklad' : '🌍 Real Example');

  return (
    <AbsoluteFill style={{ background: BG, fontFamily, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 56px', textAlign: 'center' }}>
      <div style={{
        padding: '14px 36px', borderRadius: 50,
        background: '#1a1a1a', border: '2px solid #333',
        fontSize: 24, color: '#fff', fontWeight: 700,
        marginBottom: 40,
      }}>
        {label}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 900 }}>
        {lines.map((line, i) => (
          <p key={i} style={{ fontSize: 34, color: '#e0e0e0', lineHeight: 1.5, margin: 0 }}>
            {line}
          </p>
        ))}
      </div>

      <div style={{ position: 'absolute', bottom: 44 }}><CoduyLogo height={20} /></div>
    </AbsoluteFill>
  );
};

/* ========== SLIDE 7: Why Programmer Cares (left-aligned + Byte) ========== */
export const SlideWhyCare: React.FC<{
  content: string;
  equipment: Record<string, string>;
  lang?: string;
}> = ({ content, equipment, lang = 'en' }) => {
  const lines = (content || '').split(/(?<=[.!?])\s+/).filter(l => l.trim()).slice(0, 6);

  return (
    <AbsoluteFill style={{ background: BG, fontFamily, display: 'flex', flexDirection: 'column', padding: '60px 56px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <div style={{ width: 10, height: 10, borderRadius: 5, background: '#f59e0b' }} />
        <span style={{ fontSize: 18, color: '#f59e0b', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>
          {lang === 'sk' ? 'Prečo na tom záleží?' : 'Why should a programmer care?'}
        </span>
      </div>

      {/* Content — left aligned */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 18 }}>
        {lines.map((line, i) => (
          <p key={i} style={{ fontSize: 32, color: '#e0e0e0', lineHeight: 1.5, margin: 0 }}>
            {line}
          </p>
        ))}
      </div>

      {/* Byte — bottom right */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
        <ByteMascot size={160} equipment={equipment} />
      </div>

      <div style={{ position: 'absolute', bottom: 44, left: 56 }}><CoduyLogo height={20} /></div>
    </AbsoluteFill>
  );
};

/* ========== SLIDE 8: CTA ========== */
export const SlideCTA: React.FC<{
  lang: 'en' | 'sk';
  equipment: Record<string, string>;
}> = ({ lang }) => {
  return (
    <AbsoluteFill style={{ background: BG, fontFamily, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '36px 50px 40px' }}>
      <CoduyLogo height={32} />
      <div style={{ marginTop: 12 }}>
        <Img src={MOCKUP_SRC} style={{ height: 560, objectFit: 'contain' }} />
      </div>
      <h1 style={{ fontSize: 48, fontWeight: 800, color: '#fff', textAlign: 'center', marginTop: 12, lineHeight: 1.1, letterSpacing: '-0.02em' }}>
        {lang === 'sk' ? 'Celá lekcia na Coduy' : 'Full lesson on Coduy'}
      </h1>
      <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
        <div style={{ padding: '12px 24px', borderRadius: 12, background: '#fff', color: '#000', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#000"><path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 21.99 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.1 21.99C7.79 22.03 6.8 20.68 5.96 19.47C4.25 16.97 2.94 12.45 4.7 9.39C5.57 7.87 7.13 6.91 8.82 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z"/></svg>
          App Store
        </div>
        <div style={{ padding: '12px 24px', borderRadius: 12, background: '#fff', color: '#000', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="16" height="18" viewBox="0 0 24 24" fill="#000"><path d="M3 20.5V3.5C3 2.91 3.34 2.39 3.84 2.15L13.69 12L3.84 21.85C3.34 21.6 3 21.09 3 20.5ZM16.81 15.12L6.05 21.34L14.54 12.85L16.81 15.12ZM20.16 10.81C20.5 11.08 20.75 11.5 20.75 12C20.75 12.5 20.53 12.9 20.18 13.18L17.89 14.5L15.39 12L17.89 9.5L20.16 10.81ZM6.05 2.66L16.81 8.88L14.54 11.15L6.05 2.66Z"/></svg>
          Google Play
        </div>
      </div>
      <div style={{ width: '70%', height: 1, background: '#222', marginTop: 18 }} />
      <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 18, padding: '26px 60px', borderRadius: 22, background: '#1a1a1a', border: '2px solid #333' }}>
        <svg width="34" height="38" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>
        <span style={{ fontSize: 32, color: '#fff', fontWeight: 700 }}>{lang === 'sk' ? 'Ulož si na neskôr' : 'Save for later'}</span>
      </div>
    </AbsoluteFill>
  );
};
