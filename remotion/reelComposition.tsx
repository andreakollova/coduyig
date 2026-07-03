import React from 'react';
import {
  AbsoluteFill, useCurrentFrame, interpolate, useVideoConfig,
  Audio, staticFile, Img, spring, Sequence,
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
  lessonTitle?: string;
  lessonNumber?: number;
}

/* ========== CODE BLOCK — always visible at top ========== */

const CodeBlock: React.FC<{ code: string }> = ({ code }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fadeIn = interpolate(frame, [0, fps * 0.5], [0, 1], { extrapolateRight: 'clamp' });
  const slideDown = interpolate(frame, [0, fps * 0.5], [-40, 0], { extrapolateRight: 'clamp' });

  return (
    <div style={{
      opacity: fadeIn,
      transform: `translateY(${slideDown}px)`,
      width: '100%', borderRadius: 24,
      overflow: 'hidden', border: '1px solid #2a2a2a',
      boxShadow: '0 8px 40px rgba(0,0,0,0.7), 0 0 60px rgba(74,222,128,0.05)',
    }}>
      <div style={{ background: '#1a1a1a', padding: '12px 20px', display: 'flex', gap: 8, alignItems: 'center' }}>
        <div style={{ width: 12, height: 12, borderRadius: 6, background: '#ff5f57' }} />
        <div style={{ width: 12, height: 12, borderRadius: 6, background: '#febc2e' }} />
        <div style={{ width: 12, height: 12, borderRadius: 6, background: '#28c840' }} />
        <span style={{ marginLeft: 12, fontSize: 14, color: '#555', fontWeight: 600 }}>main.py</span>
      </div>
      <pre style={{
        background: '#111', padding: '26px 28px', fontSize: 32,
        color: '#e0e0e0', margin: 0, textAlign: 'left', lineHeight: 1.8,
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        whiteSpace: 'pre-wrap',
      }}>
        {code}
      </pre>
    </div>
  );
};

/* ========== SECTION LABEL — subtle top indicator ========== */

const SectionLabel: React.FC<{ label: string }> = ({ label }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fadeIn = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: 'clamp' });
  const glow = interpolate(Math.sin(frame / fps * Math.PI * 2), [-1, 1], [0.6, 1]);

  return (
    <div style={{
      opacity: fadeIn,
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
    }}>
      <div style={{
        width: 10, height: 10, borderRadius: 5, background: '#4ade80',
        boxShadow: `0 0 ${8 * glow}px rgba(74,222,128,0.5)`,
      }} />
      <span style={{
        fontSize: 20, color: '#4ade80', fontWeight: 700,
        letterSpacing: '0.12em', textTransform: 'uppercase' as const,
        opacity: glow,
      }}>
        {label}
      </span>
    </div>
  );
};

/* ========== KARAOKE CAPTIONS — middle of screen ========== */

const KaraokeCaptions: React.FC<{ allWords: WordTiming[]; offsetFrames?: number }> = ({ allWords, offsetFrames = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTime = (frame - offsetFrames) / fps;

  let currentWordIdx = -1;
  for (let i = 0; i < allWords.length; i++) {
    if (currentTime >= allWords[i].start - 0.05 && currentTime < allWords[i].end + 0.1) {
      currentWordIdx = i;
    }
  }

  if (currentWordIdx < 0) return null;

  const windowSize = 5;
  const windowStart = Math.max(0, currentWordIdx - Math.floor(windowSize / 2));
  const windowEnd = Math.min(allWords.length, windowStart + windowSize);
  const visibleWords = allWords.slice(windowStart, windowEnd);

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
          color: isActive ? '#FFFFFF' : isPast ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.15)',
          transform: isActive ? 'scale(1.12)' : 'scale(1)',
          display: 'inline',
          textShadow: isActive
            ? '0 0 24px rgba(255,255,255,0.5), 0 0 50px rgba(74,222,128,0.15), 0 3px 8px rgba(0,0,0,0.9)'
            : '0 2px 4px rgba(0,0,0,0.5)',
        }}
      >
        {w.word}
      </span>
    );
  });

  return (
    <div style={{
      position: 'absolute',
      bottom: 280, left: 80, right: 80,
      maxWidth: 700, margin: '0 auto',
      fontFamily, fontWeight: 800, fontSize: 44, lineHeight: 1.5,
      textAlign: 'center',
    }}>
      {parts}
    </div>
  );
};

/* ========== ANIMATED BYTE — bottom, pointing up ========== */

const PointingByte: React.FC<{ equipment: Record<string, string> }> = ({ equipment }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entry from bottom
  const entryY = interpolate(frame, [0, fps * 0.6], [80, 0], { extrapolateRight: 'clamp' });
  const entryOp = interpolate(frame, [0, fps * 0.3], [0, 1], { extrapolateRight: 'clamp' });

  // Subtle pointing motion — rocking left-right
  const rock = interpolate(Math.sin(frame / fps * Math.PI * 1.2), [-1, 1], [-4, 4]);

  // Bounce on section changes (every ~3s)
  const bouncePhase = (frame % (fps * 3)) / fps;
  const bounce = bouncePhase < 0.3
    ? interpolate(bouncePhase, [0, 0.15, 0.3], [0, -12, 0])
    : 0;

  return (
    <div style={{
      opacity: entryOp,
      transform: `translateY(${entryY + bounce}px) rotate(${rock}deg)`,
      display: 'flex', justifyContent: 'center',
    }}>
      <ByteMascot size={280} equipment={equipment} />
    </div>
  );
};

/* ========== CURRENT SECTION TRACKER ========== */

const CurrentSectionLabel: React.FC<{
  sections: ReelSection[];
  offsetFrames?: number;
}> = ({ sections, offsetFrames = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTime = (frame - offsetFrames) / fps;

  // Find which section we're in
  let currentLabel = '';
  for (const sec of sections) {
    if (sec.words.length === 0) continue;
    const start = sec.words[0].start;
    const end = sec.words[sec.words.length - 1].end;
    if (currentTime >= start - 0.1 && currentTime <= end + 0.3) {
      currentLabel = sec.label;
    }
  }

  if (!currentLabel) return null;

  return <SectionLabel label={currentLabel} />;
};

/* ========== MAIN REEL COMPOSITION ========== */

export const LessonReel: React.FC<ReelProps> = ({
  sections, audioUrl, bgMusicUrl, equipment, durationInFrames, lessonTitle, lessonNumber,
}) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();

  const allWords: WordTiming[] = sections.flatMap(sec => sec.words);
  const codeSnippet = sections.find(s => s.code)?.code;

  // Title card: first 2 seconds (60 frames)
  const TITLE_DURATION = fps * 2;
  // CTA card: last 3 seconds
  const ctaStart = allWords.length > 0
    ? Math.ceil(allWords[allWords.length - 1].end * fps) + fps * 0.5
    : durationInFrames - fps * 3;

  const showTitle = frame < TITLE_DURATION;
  const showCTA = frame >= ctaStart;
  const showMain = !showTitle && !showCTA;

  // Title card animations
  const titleOp = interpolate(frame, [0, 10, TITLE_DURATION - 10, TITLE_DURATION], [0, 1, 1, 0], { extrapolateRight: 'clamp' });
  const titleScale = interpolate(frame, [0, 15], [0.9, 1], { extrapolateRight: 'clamp' });

  // CTA animations
  const ctaOp = interpolate(frame, [ctaStart, ctaStart + 15], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ background: BG, fontFamily }}>
      {/* Audio — starts after title card */}
      <Sequence from={TITLE_DURATION}>
        <Audio src={audioUrl} volume={1} />
      </Sequence>
      {bgMusicUrl && <Audio src={bgMusicUrl} volume={0.08} loop />}
      {!bgMusicUrl && (() => {
        try { return <Audio src={staticFile('bgmusic.mp3')} volume={0.08} loop />; }
        catch { return null; }
      })()}

      <BackgroundParticles />

      {/* ===== TITLE CARD ===== */}
      {showTitle && (
        <AbsoluteFill style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: 60, gap: 24,
          opacity: titleOp, transform: `scale(${titleScale})`,
        }}>
          <ByteMascot size={250} equipment={equipment} />
          <div style={{
            padding: '12px 28px', borderRadius: 30,
            background: '#161616', border: '1px solid #2a2a2a',
            fontSize: 22, color: '#4ade80', fontWeight: 700,
            letterSpacing: '0.1em', textTransform: 'uppercase' as const,
          }}>
            Lesson {lessonNumber || ''}
          </div>
          <h1 style={{
            fontSize: 56, fontWeight: 800, color: '#fff',
            textAlign: 'center', lineHeight: 1.15, margin: 0,
            maxWidth: 800,
          }}>
            {lessonTitle || ''}
          </h1>
          <CoduyLogo height={26} />
        </AbsoluteFill>
      )}

      {/* ===== MAIN CONTENT ===== */}
      {showMain && (
        <>
          {/* Section label — top */}
          <div style={{ position: 'absolute', top: 70, left: 0, right: 0 }}>
            <CurrentSectionLabel sections={sections} offsetFrames={TITLE_DURATION} />
          </div>

          {/* Byte — upper area */}
          <div style={{
            position: 'absolute', top: 120, left: 0, right: 0,
            display: 'flex', justifyContent: 'center',
          }}>
            <PointingByte equipment={equipment} />
          </div>

          {/* Code — below Byte */}
          {codeSnippet && (
            <div style={{ position: 'absolute', top: 440, left: 40, right: 40 }}>
              <CodeBlock code={codeSnippet} />
            </div>
          )}

          {/* Karaoke captions — lower area */}
          <KaraokeCaptions allWords={allWords} offsetFrames={TITLE_DURATION} />
        </>
      )}

      {/* ===== CTA SCREEN ===== */}
      {showCTA && (
        <AbsoluteFill style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: 60, gap: 32, opacity: ctaOp,
        }}>
          <ByteMascot size={220} equipment={equipment} />
          <h2 style={{
            fontSize: 42, fontWeight: 800, color: '#fff',
            textAlign: 'center', lineHeight: 1.3, margin: 0,
            maxWidth: 750,
          }}>
            Full lesson available on
          </h2>
          <div style={{ marginTop: 8 }}>
            <CoduyLogo height={48} />
          </div>
          <p style={{
            fontSize: 24, color: '#888', fontWeight: 600,
            textAlign: 'center', margin: 0,
          }}>
            Free on App Store & Google Play
          </p>
        </AbsoluteFill>
      )}

      {/* Logo — always at bottom (except during title/CTA which have their own) */}
      {showMain && (
        <div style={{
          position: 'absolute', bottom: 50,
          left: 0, right: 0,
          display: 'flex', justifyContent: 'center',
        }}>
          <CoduyLogo height={20} />
        </div>
      )}
    </AbsoluteFill>
  );
};

/* ========== BACKGROUND PARTICLES ========== */

const BackgroundParticles: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <>
      {Array.from({ length: 10 }, (_, i) => {
        const x = 80 + (i * 110) % 920;
        const baseY = 150 + (i * 200) % 1600;
        const speed = 0.2 + (i % 4) * 0.15;
        const size = 2 + (i % 3) * 2;
        const y = baseY + Math.sin((frame / fps * speed) + i * 1.5) * 25;
        const opacity = interpolate(Math.sin((frame / fps * 0.4) + i), [-1, 1], [0.02, 0.06]);

        return (
          <div key={i} style={{
            position: 'absolute', left: x, top: y,
            width: size, height: size, borderRadius: size / 2,
            background: i % 2 === 0 ? '#4ade80' : '#60a5fa', opacity,
          }} />
        );
      })}
    </>
  );
};
