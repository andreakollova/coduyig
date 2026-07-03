import React from 'react';
import {
  AbsoluteFill, useCurrentFrame, interpolate, useVideoConfig,
  Audio, staticFile, Img, Sequence,
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
  start: number; // seconds
  end: number;
}

export interface ReelSection {
  label: string;       // "INTRODUCTION" | "LEARNING" | "KEY POINTS" | "WHY CARE?"
  words: WordTiming[]; // words spoken in this section
  code?: string;       // optional code snippet for this section
}

export interface ReelProps {
  sections: ReelSection[];
  audioUrl: string;       // public URL to voiceover MP3
  bgMusicUrl?: string;    // public URL to background music
  equipment: Record<string, string>;
  durationInFrames: number;
}

/* ========== KARAOKE CAPTIONS ========== */

const KaraokeCaptions: React.FC<{
  words: WordTiming[];
  globalStartFrame: number;
}> = ({ words, globalStartFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTime = (frame - globalStartFrame) / fps;

  // Find current word index
  let currentWordIdx = -1;
  for (let i = 0; i < words.length; i++) {
    if (currentTime >= words[i].start && currentTime < words[i].end + 0.15) {
      currentWordIdx = i;
    }
  }

  // Show 3-5 words at a time centered on current word
  const windowSize = 4;
  const windowStart = Math.max(0, currentWordIdx - Math.floor(windowSize / 2));
  const windowEnd = Math.min(words.length, windowStart + windowSize);
  const visibleWords = words.slice(windowStart, windowEnd);

  if (visibleWords.length === 0) return null;

  return (
    <div style={{
      position: 'absolute',
      bottom: 300, left: 60, right: 60,
      display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '6px 10px',
      fontFamily, fontWeight: 800, fontSize: 42, lineHeight: 1.3,
      textAlign: 'center',
    }}>
      {visibleWords.map((w, i) => {
        const globalIdx = windowStart + i;
        const isActive = globalIdx === currentWordIdx;
        const isPast = globalIdx < currentWordIdx;
        return (
          <span
            key={`${globalIdx}-${w.word}`}
            style={{
              color: isActive ? '#fff' : isPast ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.3)',
              transform: isActive ? 'scale(1.08)' : 'scale(1)',
              transition: 'all 0.1s',
              textShadow: isActive ? '0 0 20px rgba(255,255,255,0.3)' : 'none',
            }}
          >
            {w.word}
          </span>
        );
      })}
    </div>
  );
};

/* ========== CODE BLOCK ========== */

const CodeBlock: React.FC<{ code: string }> = ({ code }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fadeIn = interpolate(frame, [0, fps * 0.3], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <div style={{
      opacity: fadeIn,
      width: '100%', maxWidth: 920, borderRadius: 20,
      overflow: 'hidden', border: '1px solid #222',
      alignSelf: 'center',
    }}>
      <div style={{ background: '#161616', padding: '10px 18px', display: 'flex', gap: 7 }}>
        <div style={{ width: 10, height: 10, borderRadius: 5, background: '#ff5f57' }} />
        <div style={{ width: 10, height: 10, borderRadius: 5, background: '#febc2e' }} />
        <div style={{ width: 10, height: 10, borderRadius: 5, background: '#28c840' }} />
      </div>
      <pre style={{
        background: '#111', padding: '22px 24px', fontSize: 28,
        color: '#e0e0e0', margin: 0, textAlign: 'left', lineHeight: 1.7,
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        whiteSpace: 'pre-wrap',
      }}>
        {code}
      </pre>
    </div>
  );
};

/* ========== SECTION LABEL ========== */

const SectionLabel: React.FC<{ label: string }> = ({ label }) => {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: 'clamp' });
  const slideUp = interpolate(frame, [0, 8], [10, 0], { extrapolateRight: 'clamp' });

  return (
    <div style={{
      opacity: fadeIn, transform: `translateY(${slideUp}px)`,
      display: 'flex', alignItems: 'center', gap: 10,
      marginBottom: 16,
    }}>
      <div style={{ width: 10, height: 10, borderRadius: 5, background: '#4ade80' }} />
      <span style={{
        fontSize: 20, color: '#4ade80', fontWeight: 700,
        letterSpacing: '0.1em', textTransform: 'uppercase' as const,
      }}>
        {label}
      </span>
    </div>
  );
};

/* ========== MAIN REEL COMPOSITION ========== */

export const LessonReel: React.FC<ReelProps> = ({
  sections, audioUrl, bgMusicUrl, equipment, durationInFrames,
}) => {
  const { fps } = useVideoConfig();

  // Calculate frame ranges for each section based on word timings
  const sectionFrames = sections.map(sec => {
    if (sec.words.length === 0) return { start: 0, end: 0 };
    const startTime = sec.words[0].start;
    const endTime = sec.words[sec.words.length - 1].end;
    return {
      start: Math.floor(startTime * fps),
      end: Math.ceil((endTime + 0.5) * fps), // 0.5s padding after last word
    };
  });

  return (
    <AbsoluteFill style={{ background: BG, fontFamily }}>
      {/* Voiceover audio */}
      <Audio src={audioUrl} volume={1} />

      {/* Background music — from public/ folder or URL */}
      {bgMusicUrl && <Audio src={bgMusicUrl} volume={0.08} loop />}
      {!bgMusicUrl && (() => {
        try { return <Audio src={staticFile('bgmusic.mp3')} volume={0.08} loop />; }
        catch { return null; }
      })()}

      {/* Sections */}
      {sections.map((section, i) => {
        const sf = sectionFrames[i];
        if (sf.start >= sf.end) return null;
        const sectionDuration = sf.end - sf.start;

        return (
          <Sequence key={i} from={sf.start} durationInFrames={sectionDuration}>
            <AbsoluteFill style={{
              display: 'flex', flexDirection: 'column',
              padding: '80px 50px 400px',
              gap: 16,
            }}>
              {/* Section label */}
              <SectionLabel label={section.label} />

              {/* Byte — centered, animated */}
              <div style={{
                display: 'flex', justifyContent: 'center',
                marginTop: 8, marginBottom: 16,
              }}>
                <ByteMascot size={200} equipment={equipment} />
              </div>

              {/* Code block (if present) */}
              {section.code && <CodeBlock code={section.code} />}
            </AbsoluteFill>

            {/* Karaoke captions — always in lower third */}
            <KaraokeCaptions words={section.words} globalStartFrame={0} />
          </Sequence>
        );
      })}

      {/* Logo — always visible */}
      <div style={{
        position: 'absolute', bottom: 50,
        left: 0, right: 0,
        display: 'flex', justifyContent: 'center',
      }}>
        <CoduyLogo height={20} />
      </div>
    </AbsoluteFill>
  );
};
