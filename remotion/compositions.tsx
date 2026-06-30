import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, useVideoConfig, staticFile, Img } from 'remotion';
import { loadFont } from '@remotion/google-fonts/Inter';
import { ByteMascot } from './Byte';

const { fontFamily } = loadFont();

const BG = '#0A0A0A';
const LOGO_SRC = staticFile('logocoduy.png');

const CoduyLogo: React.FC<{ height?: number; opacity?: number }> = ({ height = 28, opacity = 0.5 }) => (
  <Img src={LOGO_SRC} style={{ height, opacity, objectFit: 'contain' }} />
);

/* ========== SLIDE 1: Video — Byte + Lesson Title ========== */
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
  const swipeOpacity = interpolate(frame, [0, fps * 2, fps * 2.5, fps * 3, fps * 3.5], [1, 1, 0.3, 1, 0.3], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ background: BG, fontFamily, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 50px' }}>
      {/* Module + level badge */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginBottom: 40 }}>
        <div style={{
          padding: '14px 36px', borderRadius: 50,
          background: '#1a1a1a', border: '2px solid #333',
          fontSize: 20, color: '#bbb', fontWeight: 700,
          letterSpacing: '0.1em', textTransform: 'uppercase' as const,
        }}>
          {moduleTitle}
        </div>
        {levelBadge && (
          <div style={{
            padding: '8px 24px', borderRadius: 30,
            background: '#111', border: '1px solid #2a2a2a',
            fontSize: 18, color: '#999', fontWeight: 600,
          }}>
            {levelBadge}
          </div>
        )}
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
        <p style={{ fontSize: 28, color: '#aaa', fontWeight: 600, margin: 0 }}>{lang === 'sk' ? 'Pokračuj potiahnutím →' : 'Swipe to learn →'}</p>
      </div>

      {/* Coduy logo */}
      <div style={{ position: 'absolute', bottom: 48 }}>
        <CoduyLogo height={36} opacity={1} />
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
  lang?: string;
}> = ({ content, slideNumber, totalSlides, equipment, lang = 'en' }) => {
  // Content format: first line may be heading (from pickLesson), rest is body
  const lines = (content || '').split('\n').filter(l => l.trim());
  const firstLine = lines[0] || '';
  const isFirstHeading = firstLine.length < 55 && !firstLine.endsWith('.') && !firstLine.endsWith(';')
    && !/[=(){}\[\]<>]/.test(firstLine) && !firstLine.startsWith('-');
  const heading = isFirstHeading ? firstLine : '';
  const bodyLines = isFirstHeading ? lines.slice(1) : lines;

  return (
    <AbsoluteFill style={{ background: BG, fontFamily, display: 'flex', flexDirection: 'column', padding: '64px 56px' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 12, height: 12, borderRadius: 6, background: '#fff' }} />
          <span style={{ fontSize: 20, color: '#aaa', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>
            {lang === 'sk' ? 'Teória' : 'Learning'}
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


      {/* Heading — big, bold, white */}
      {heading && (
        <h2 style={{
          fontSize: 44, fontWeight: 800, color: '#ffffff',
          margin: '0 0 20px 0', letterSpacing: '-0.02em', lineHeight: 1.1,
        }}>
          {heading}
        </h2>
      )}

      {/* Body text — readable, lighter */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14, overflow: 'hidden' }}>
        {bodyLines.slice(0, 8).map((para, i) => (
          <p key={i} style={{
            fontSize: 28, color: '#cccccc', lineHeight: 1.5, margin: 0,
          }}>
            {para}
          </p>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        borderTop: '1px solid #222', paddingTop: 24,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <CoduyLogo height={22} opacity={1} />
        <span style={{ fontSize: 16, color: '#555', fontWeight: 600 }}>{lang === 'sk' ? '@coduy.sk' : '@coduyapp'}</span>
      </div>
    </AbsoluteFill>
  );
};

/* ========== SLIDE 5: Real World / Why Care ========== */
export const SlideRealWorld: React.FC<{
  content: string;
  equipment: Record<string, string>;
  lang?: string;
}> = ({ content, equipment, lang = 'en' }) => {
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
          {lang === 'sk' ? 'Prečo na tom záleží pri programovaní?' : 'Why should a programmer care?'}
        </span>
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
        <CoduyLogo height={22} opacity={1} />
        <span style={{ fontSize: 16, color: '#555', fontWeight: 600 }}>{lang === 'sk' ? '@coduy.sk' : '@coduyapp'}</span>
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
      <ByteMascot size={400} equipment={equipment} />

      <h1 style={{
        fontSize: 58, fontWeight: 800, color: '#ffffff',
        textAlign: 'center', marginTop: 44, lineHeight: 1.1,
        letterSpacing: '-0.02em',
      }}>
        {lang === 'sk' ? 'Nájdi v Coduy app' : 'Find it in Coduy app'}
      </h1>

      <p style={{ fontSize: 28, color: '#aaa', marginTop: 16, textAlign: 'center' }}>
        {lang === 'sk' ? 'Nauč sa programovať zadarmo' : 'Learn to code for free'}
      </p>

      {/* Save for later — IG bookmark icon */}
      <div style={{
        marginTop: 36, display: 'flex', alignItems: 'center', gap: 16,
        padding: '20px 44px', borderRadius: 18,
        background: '#1a1a1a', border: '2px solid #333',
      }}>
        {/* IG bookmark icon (SVG) */}
        <svg width="28" height="32" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
        <span style={{ fontSize: 26, color: '#ddd', fontWeight: 600 }}>
          {lang === 'sk' ? 'Ulož si na neskôr' : 'Save for later'}
        </span>
      </div>

      {/* Download badges */}
      <div style={{
        marginTop: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
      }}>
        <div style={{ display: 'flex', gap: 16 }}>
          {/* App Store badge */}
          <div style={{
            padding: '14px 28px', borderRadius: 14,
            background: '#ffffff', color: '#000000',
            fontSize: 18, fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#000000">
              <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 21.99 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.1 21.99C7.79 22.03 6.8 20.68 5.96 19.47C4.25 16.97 2.94 12.45 4.7 9.39C5.57 7.87 7.13 6.91 8.82 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z"/>
            </svg>
            App Store
          </div>
          {/* Google Play badge */}
          <div style={{
            padding: '14px 28px', borderRadius: 14,
            background: '#ffffff', color: '#000000',
            fontSize: 18, fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <svg width="20" height="22" viewBox="0 0 24 24" fill="#000000">
              <path d="M3 20.5V3.5C3 2.91 3.34 2.39 3.84 2.15L13.69 12L3.84 21.85C3.34 21.6 3 21.09 3 20.5ZM16.81 15.12L6.05 21.34L14.54 12.85L16.81 15.12ZM20.16 10.81C20.5 11.08 20.75 11.5 20.75 12C20.75 12.5 20.53 12.9 20.18 13.18L17.89 14.5L15.39 12L17.89 9.5L20.16 10.81ZM6.05 2.66L16.81 8.88L14.54 11.15L6.05 2.66Z"/>
            </svg>
            Google Play
          </div>
        </div>
      </div>

      {/* Handle */}
      <div style={{ position: 'absolute', bottom: 48, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <CoduyLogo height={32} opacity={1} />
        <span style={{ fontSize: 20, color: '#666', fontWeight: 600 }}>
          {lang === 'sk' ? '@coduy.sk' : '@coduyapp'}
        </span>
      </div>
    </AbsoluteFill>
  );
};
