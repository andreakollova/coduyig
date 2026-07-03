import React from 'react';
import {
  AbsoluteFill, useCurrentFrame, interpolate, useVideoConfig,
  Audio, staticFile, Img, Sequence, spring,
} from 'remotion';
import { loadFont } from '@remotion/google-fonts/Inter';
import { ByteMascot } from './Byte';

const { fontFamily } = loadFont();
const BG = '#0A0A0A';
const LOGO_SRC = staticFile('logocoduy.png');
const CoduyLogo: React.FC<{ height?: number }> = ({ height = 22 }) => (
  <Img src={LOGO_SRC} style={{ height, objectFit: 'contain' }} />
);

/* ========== TYPES ========== */

export interface WordTiming {
  word: string;
  start: number;
  end: number;
}

export interface ReelSection {
  label: string;
  words: WordTiming[];
  code?: string;
}

export interface ReelProps {
  sections: ReelSection[];
  audioUrl: string;
  bgMusicUrl?: string;
  equipment: Record<string, string>;
  durationInFrames: number;
}

/* ========== KARAOKE CAPTIONS ========== */

const KaraokeCaptions: React.FC<{ allWords: WordTiming[] }> = ({ allWords }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTime = frame / fps;

  let currentWordIdx = -1;
  for (let i = 0; i < allWords.length; i++) {
    if (currentTime >= allWords[i].start - 0.05 && currentTime < allWords[i].end + 0.1) {
      currentWordIdx = i;
    }
  }

  if (currentWordIdx < 0) return null;

  // Show 4-5 words centered on current
  const windowSize = 5;
  const windowStart = Math.max(0, currentWordIdx - Math.floor(windowSize / 2));
  const windowEnd = Math.min(allWords.length, windowStart + windowSize);
  const visibleWords = allWords.slice(windowStart, windowEnd);

  // Build caption text with spaces, highlight current word
  const parts: React.ReactNode[] = [];
  visibleWords.forEach((w, i) => {
    const globalIdx = windowStart + i;
    const isActive = globalIdx === currentWordIdx;
    const isPast = globalIdx < currentWordIdx;
    if (i > 0) parts.push(' ');
    parts.push(
      <span
        key={`${globalIdx}-${w.word}`}
        style={{
          color: isActive ? '#FFFFFF' : isPast ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.15)',
          transform: isActive ? 'scale(1.15)' : 'scale(1)',
          display: 'inline',
          textShadow: isActive
            ? '0 0 30px rgba(255,255,255,0.5), 0 0 60px rgba(74,222,128,0.2), 0 3px 10px rgba(0,0,0,0.9)'
            : '0 2px 6px rgba(0,0,0,0.6)',
        }}
      >
        {w.word}
      </span>
    );
  });

  return (
    <div style={{
      position: 'absolute',
      bottom: 260, left: 40, right: 40,
      fontFamily, fontWeight: 800, fontSize: 52, lineHeight: 1.4,
      textAlign: 'center',
    }}>
      {parts}
    </div>
  );
};

/* ========== CODE BLOCK ========== */

const CodeBlock: React.FC<{ code: string }> = ({ code }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fadeIn = interpolate(frame, [0, fps * 0.4], [0, 1], { extrapolateRight: 'clamp' });
  const slideUp = interpolate(frame, [0, fps * 0.4], [30, 0], { extrapolateRight: 'clamp' });

  return (
    <div style={{
      opacity: fadeIn,
      transform: `translateY(${slideUp}px)`,
      width: '100%', maxWidth: 940, borderRadius: 24,
      overflow: 'hidden', border: '1px solid #2a2a2a',
      alignSelf: 'center',
      boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
    }}>
      <div style={{ background: '#1a1a1a', padding: '12px 20px', display: 'flex', gap: 8 }}>
        <div style={{ width: 12, height: 12, borderRadius: 6, background: '#ff5f57' }} />
        <div style={{ width: 12, height: 12, borderRadius: 6, background: '#febc2e' }} />
        <div style={{ width: 12, height: 12, borderRadius: 6, background: '#28c840' }} />
      </div>
      <pre style={{
        background: '#111', padding: '24px 28px', fontSize: 30,
        color: '#e0e0e0', margin: 0, textAlign: 'left', lineHeight: 1.8,
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        whiteSpace: 'pre-wrap',
      }}>
        {code}
      </pre>
    </div>
  );
};

/* ========== SECTION LABEL with glow ========== */

const SectionLabel: React.FC<{ label: string }> = ({ label }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fadeIn = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: 'clamp' });
  const slideDown = interpolate(frame, [0, 10], [-15, 0], { extrapolateRight: 'clamp' });
  const glow = interpolate(Math.sin(frame / fps * Math.PI * 2), [-1, 1], [0.6, 1]);

  return (
    <div style={{
      opacity: fadeIn, transform: `translateY(${slideDown}px)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
    }}>
      <div style={{
        width: 12, height: 12, borderRadius: 6, background: '#4ade80',
        boxShadow: `0 0 ${10 * glow}px rgba(74,222,128,0.6)`,
      }} />
      <span style={{
        fontSize: 24, color: '#4ade80', fontWeight: 700,
        letterSpacing: '0.12em', textTransform: 'uppercase' as const,
        opacity: glow,
      }}>
        {label}
      </span>
    </div>
  );
};

/* ========== ANIMATED BYTE ========== */

const AnimatedByte: React.FC<{ equipment: Record<string, string> }> = ({ equipment }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entry bounce
  const scale = spring({ frame, fps, config: { damping: 12, stiffness: 120 } });
  // Subtle breathing
  const breathe = interpolate(Math.sin(frame / fps * Math.PI * 0.6), [-1, 1], [0.96, 1.04]);

  return (
    <div style={{
      display: 'flex', justifyContent: 'center',
      transform: `scale(${scale * breathe})`,
    }}>
      <ByteMascot size={300} equipment={equipment} />
    </div>
  );
};

/* ========== MAIN REEL COMPOSITION ========== */

export const LessonReel: React.FC<ReelProps> = ({
  sections, audioUrl, bgMusicUrl, equipment,
}) => {
  const { fps } = useVideoConfig();

  const allWords: WordTiming[] = sections.flatMap(sec => sec.words);

  const sectionFrames = sections.map(sec => {
    if (sec.words.length === 0) return { start: 0, end: 0 };
    const startTime = sec.words[0].start;
    const endTime = sec.words[sec.words.length - 1].end;
    return {
      start: Math.floor(startTime * fps),
      end: Math.ceil((endTime + 0.5) * fps),
    };
  });

  return (
    <AbsoluteFill style={{ background: BG, fontFamily }}>
      {/* Voiceover */}
      <Audio src={audioUrl} volume={1} />

      {/* Background music */}
      {bgMusicUrl && <Audio src={bgMusicUrl} volume={0.08} loop />}
      {!bgMusicUrl && (() => {
        try { return <Audio src={staticFile('bgmusic.mp3')} volume={0.08} loop />; }
        catch { return null; }
      })()}

      {/* Subtle animated background particles */}
      <BackgroundParticles />

      {/* Section visuals */}
      {sections.map((section, i) => {
        const sf = sectionFrames[i];
        if (sf.start >= sf.end) return null;
        const sectionDuration = sf.end - sf.start;

        return (
          <Sequence key={i} from={sf.start} durationInFrames={sectionDuration}>
            <AbsoluteFill style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: '100px 50px 380px',
              gap: 20,
            }}>
              {/* Section label — top */}
              <SectionLabel label={section.label} />

              {/* Byte — large, centered, animated */}
              <div style={{ marginTop: 16, marginBottom: 20 }}>
                <AnimatedByte equipment={equipment} />
              </div>

              {/* Code block — below Byte */}
              {section.code && (
                <div style={{ width: '100%', paddingLeft: 20, paddingRight: 20 }}>
                  <CodeBlock code={section.code} />
                </div>
              )}
            </AbsoluteFill>
          </Sequence>
        );
      })}

      {/* Karaoke captions — absolute positioning, always synced */}
      <KaraokeCaptions allWords={allWords} />

      {/* Logo */}
      <div style={{
        position: 'absolute', bottom: 60,
        left: 0, right: 0,
        display: 'flex', justifyContent: 'center',
      }}>
        <CoduyLogo height={22} />
      </div>
    </AbsoluteFill>
  );
};

/* ========== BACKGROUND PARTICLES ========== */

const BackgroundParticles: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 8 subtle floating particles
  const particles = Array.from({ length: 8 }, (_, i) => {
    const x = 100 + (i * 130) % 880;
    const baseY = 200 + (i * 250) % 1500;
    const speed = 0.3 + (i % 3) * 0.2;
    const size = 3 + (i % 3) * 2;
    const y = baseY + Math.sin((frame / fps * speed) + i) * 30;
    const opacity = interpolate(Math.sin((frame / fps * 0.5) + i * 1.2), [-1, 1], [0.03, 0.08]);

    return (
      <div key={i} style={{
        position: 'absolute', left: x, top: y,
        width: size, height: size, borderRadius: size / 2,
        background: '#4ade80', opacity,
      }} />
    );
  });

  return <>{particles}</>;
};
