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
  speaker: 'student' | 'teacher';
}

export interface ReelLineData {
  speaker: 'student' | 'teacher';
  audioUrl: string;
  words: WordTiming[];
  startTime: number; // absolute start in seconds
  duration: number;
  code?: string;
}

export interface ReelProps {
  lines: ReelLineData[];
  bgMusicUrl?: string;
  equipmentStudent: Record<string, string>;
  equipmentTeacher: Record<string, string>;
  durationInFrames: number;
  lessonTitle?: string;
  lessonNumber?: number;
}

/* ========== CODE BLOCK — top of screen ========== */

const CodeBlock: React.FC<{ code: string }> = ({ code }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fadeIn = interpolate(frame, [0, fps * 0.5], [0, 1], { extrapolateRight: 'clamp' });
  const slideDown = interpolate(frame, [0, fps * 0.5], [-30, 0], { extrapolateRight: 'clamp' });

  return (
    <div style={{
      opacity: fadeIn, transform: `translateY(${slideDown}px)`,
      width: '100%', borderRadius: 24, overflow: 'hidden',
      border: '1px solid #2a2a2a',
      boxShadow: '0 8px 40px rgba(0,0,0,0.7)',
    }}>
      <div style={{ background: '#1a1a1a', padding: '10px 18px', display: 'flex', gap: 8 }}>
        <div style={{ width: 11, height: 11, borderRadius: 6, background: '#ff5f57' }} />
        <div style={{ width: 11, height: 11, borderRadius: 6, background: '#febc2e' }} />
        <div style={{ width: 11, height: 11, borderRadius: 6, background: '#28c840' }} />
        <span style={{ marginLeft: 10, fontSize: 13, color: '#555', fontWeight: 600 }}>main.py</span>
      </div>
      <pre style={{
        background: '#111', padding: '20px 24px', fontSize: 28,
        color: '#e0e0e0', margin: 0, textAlign: 'left', lineHeight: 1.7,
        fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'pre-wrap',
      }}>
        {code.replace(/\\n/g, '\n')}
      </pre>
    </div>
  );
};

/* ========== CONVERSATION CAPTIONS ========== */

const ConversationCaptions: React.FC<{
  allWords: WordTiming[];
  titleCardFrames: number;
}> = ({ allWords, titleCardFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTime = (frame - titleCardFrames) / fps;

  let currentWordIdx = -1;
  for (let i = 0; i < allWords.length; i++) {
    if (currentTime >= allWords[i].start - 0.05 && currentTime < allWords[i].end + 0.12) {
      currentWordIdx = i;
    }
  }

  if (currentWordIdx < 0) return null;

  // Current speaker determines color
  const currentSpeaker = allWords[currentWordIdx]?.speaker || 'teacher';
  const activeColor = currentSpeaker === 'student' ? '#FFFFFF' : '#fb923c'; // white vs orange

  // Window of words (same speaker chunk)
  const windowSize = 6;
  const windowStart = Math.max(0, currentWordIdx - 2);
  const windowEnd = Math.min(allWords.length, windowStart + windowSize);
  const visibleWords = allWords.slice(windowStart, windowEnd);

  const parts: React.ReactNode[] = [];
  visibleWords.forEach((w, i) => {
    const globalIdx = windowStart + i;
    const isActive = globalIdx === currentWordIdx;
    const isPast = globalIdx < currentWordIdx;
    const wordColor = w.speaker === 'student' ? '#FFFFFF' : '#fb923c';
    const dimColor = w.speaker === 'student' ? 'rgba(255,255,255,0.25)' : 'rgba(251,146,60,0.25)';

    if (i > 0) parts.push(' ');
    parts.push(
      <span key={`${globalIdx}-${w.word}`} style={{
        color: isActive ? wordColor : isPast ? dimColor : dimColor,
        transform: isActive ? 'scale(1.1)' : 'scale(1)',
        display: 'inline',
        textShadow: isActive
          ? `0 0 20px ${w.speaker === 'student' ? 'rgba(255,255,255,0.4)' : 'rgba(251,146,60,0.4)'}, 0 2px 8px rgba(0,0,0,0.8)`
          : '0 2px 4px rgba(0,0,0,0.5)',
      }}>
        {w.word}
      </span>
    );
  });

  return (
    <div style={{
      position: 'absolute',
      bottom: 580, left: 50, right: 50,
      maxWidth: 700, margin: '0 auto',
      fontFamily, fontWeight: 800, fontSize: 44, lineHeight: 1.4,
      textAlign: 'center',
    }}>
      {parts}
    </div>
  );
};

/**
 * Inline captions — shows the FULL current speaker's sentence.
 * Words highlight one by one but the text doesn't move/shift.
 */
const ConversationCaptionsInline: React.FC<{
  allWords: WordTiming[];
  titleCardFrames: number;
}> = ({ allWords, titleCardFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTime = (frame - titleCardFrames) / fps;

  // Find current word
  let currentWordIdx = -1;
  for (let i = 0; i < allWords.length; i++) {
    if (currentTime >= allWords[i].start - 0.05 && currentTime < allWords[i].end + 0.12) {
      currentWordIdx = i;
    }
  }

  if (currentWordIdx < 0) return null;

  // Find the current "chunk" — all consecutive words from the same speaker
  const currentSpeaker = allWords[currentWordIdx].speaker;
  let chunkStart = currentWordIdx;
  let chunkEnd = currentWordIdx;

  // Go backwards to find start of this speaker's chunk
  while (chunkStart > 0 && allWords[chunkStart - 1].speaker === currentSpeaker) {
    // Also check for time gaps — if gap > 1s it's a new sentence
    if (allWords[chunkStart].start - allWords[chunkStart - 1].end > 1.0) break;
    chunkStart--;
  }
  // Go forwards to find end
  while (chunkEnd < allWords.length - 1 && allWords[chunkEnd + 1].speaker === currentSpeaker) {
    if (allWords[chunkEnd + 1].start - allWords[chunkEnd].end > 1.0) break;
    chunkEnd++;
  }

  const chunkWords = allWords.slice(chunkStart, chunkEnd + 1);

  // Render ALL words in the chunk, highlight current one
  // Use a single string approach with word wrapping
  return (
    <span style={{ wordSpacing: '8px' }}>
      {chunkWords.map((w, i) => {
        const globalIdx = chunkStart + i;
        const isActive = globalIdx === currentWordIdx;
        const isPast = globalIdx < currentWordIdx;
        const activeColor = w.speaker === 'student' ? '#FFFFFF' : '#fb923c';
        const pastColor = w.speaker === 'student' ? 'rgba(255,255,255,0.55)' : 'rgba(251,146,60,0.55)';
        const futureColor = w.speaker === 'student' ? 'rgba(255,255,255,0.3)' : 'rgba(251,146,60,0.3)';

        return (
          <React.Fragment key={`${globalIdx}-${w.word}`}>
            {i > 0 && <span>{' '}</span>}
            <span style={{
              color: isActive ? activeColor : isPast ? pastColor : futureColor,
              fontWeight: isActive ? 900 : 800,
              textShadow: isActive
                ? `0 0 16px ${w.speaker === 'student' ? 'rgba(255,255,255,0.35)' : 'rgba(251,146,60,0.35)'}`
                : 'none',
            }}>
              {w.word}
            </span>
          </React.Fragment>
        );
      })}
    </span>
  );
};

/* ========== TWO BYTES — bottom, side by side ========== */

const TwoBytes: React.FC<{
  equipmentStudent: Record<string, string>;
  equipmentTeacher: Record<string, string>;
  activeSpeaker: 'student' | 'teacher' | null;
}> = ({ equipmentStudent, equipmentTeacher, activeSpeaker }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Talking animation — active speaker bounces
  const bounce = interpolate(Math.sin(frame / fps * Math.PI * 4), [-1, 1], [-4, 4]);
  const idleBob = interpolate(Math.sin(frame / fps * Math.PI * 0.6), [-1, 1], [-3, 3]);

  // Student leans slightly right (toward teacher), teacher leans slightly left
  const studentLean = interpolate(Math.sin(frame / fps * Math.PI * 0.8), [-1, 1], [-2, 2]);
  const teacherLean = interpolate(Math.sin(frame / fps * Math.PI * 0.8 + 1), [-1, 1], [-2, 2]);

  return (
    <div style={{
      display: 'flex', justifyContent: 'center', alignItems: 'flex-end',
      gap: 20, paddingBottom: 10,
    }}>
      {/* Student — left, white outline glow when speaking */}
      <div style={{
        transform: `translateY(${activeSpeaker === 'student' ? bounce : idleBob}px) rotate(${studentLean}deg)`,
        filter: activeSpeaker === 'student' ? 'drop-shadow(0 0 12px rgba(255,255,255,0.3))' : 'none',
        opacity: activeSpeaker === 'teacher' ? 0.6 : 1,
      }}>
        <ByteMascot size={240} equipment={equipmentStudent} />
      </div>

      {/* Teacher — right, orange outline glow when speaking */}
      <div style={{
        transform: `translateY(${activeSpeaker === 'teacher' ? bounce : idleBob}px) rotate(${teacherLean}deg)`,
        filter: activeSpeaker === 'teacher' ? 'drop-shadow(0 0 12px rgba(251,146,60,0.3))' : 'none',
        opacity: activeSpeaker === 'student' ? 0.6 : 1,
      }}>
        <ByteMascot size={240} equipment={equipmentTeacher} />
      </div>
    </div>
  );
};

/* ========== ACTIVE SPEAKER TRACKER ========== */

function useActiveSpeaker(allWords: WordTiming[], titleCardFrames: number): 'student' | 'teacher' | null {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = (frame - titleCardFrames) / fps;

  for (let i = allWords.length - 1; i >= 0; i--) {
    if (t >= allWords[i].start - 0.1 && t <= allWords[i].end + 0.3) {
      return allWords[i].speaker;
    }
  }
  return null;
}

/* ========== MAIN COMPOSITION ========== */

export const LessonReel: React.FC<ReelProps> = ({
  lines, bgMusicUrl, equipmentStudent, equipmentTeacher,
  durationInFrames, lessonTitle, lessonNumber,
}) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();

  const allWords: WordTiming[] = lines.flatMap(l => l.words);
  const codeSnippet = lines.find(l => l.code)?.code;

  const TITLE_FRAMES = fps * 2;

  // CTA starts after last word + 0.5s
  const lastWordEnd = allWords.length > 0 ? allWords[allWords.length - 1].end : 0;
  const ctaStartFrame = TITLE_FRAMES + Math.ceil(lastWordEnd * fps) + Math.ceil(fps * 0.8);

  const showTitle = frame < TITLE_FRAMES;
  const showCTA = frame >= ctaStartFrame;
  const showMain = !showTitle && !showCTA;

  const activeSpeaker = useActiveSpeaker(allWords, TITLE_FRAMES);

  // No fade-in on title — frame 0 must show content for IG preview
  // Only fade OUT at the end of title card
  const titleOp = interpolate(frame, [TITLE_FRAMES - 8, TITLE_FRAMES], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // CTA — no fade in either
  const ctaOp = 1;

  return (
    <AbsoluteFill style={{ background: BG, fontFamily }}>
      {/* BG music */}
      {bgMusicUrl && <Audio src={bgMusicUrl} volume={0.06} loop />}
      {!bgMusicUrl && (() => {
        try { return <Audio src={staticFile('bgmusic.mp3')} volume={0.06} loop />; }
        catch { return null; }
      })()}

      {/* Audio lines — each plays at its offset */}
      {lines.map((line, i) => {
        const startFrame = TITLE_FRAMES + Math.round(line.startTime * fps);
        return (
          <Sequence key={i} from={startFrame} durationInFrames={Math.ceil(line.duration * fps) + 10}>
            <Audio src={line.audioUrl} volume={1} />
          </Sequence>
        );
      })}

      <BackgroundParticles />

      {/* ===== TITLE CARD ===== */}
      {showTitle && (
        <AbsoluteFill style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: 60, gap: 24,
        }}>
          <div style={{
            padding: '10px 24px', borderRadius: 30,
            background: '#161616', border: '1px solid #2a2a2a',
            fontSize: 20, color: '#4ade80', fontWeight: 700,
            letterSpacing: '0.1em', textTransform: 'uppercase' as const,
          }}>
            Lesson {lessonNumber || ''}
          </div>
          <h1 style={{
            fontSize: 62, fontWeight: 800, color: '#fff',
            textAlign: 'center', lineHeight: 1.12, margin: 0, maxWidth: 850,
          }}>
            {lessonTitle || ''}
          </h1>
          <div style={{ position: 'relative', marginTop: 80 }}>
            {/* Speech bubble from student (left) — "Bet." */}
            <div style={{
              position: 'absolute', top: -44, left: 10,
              padding: '8px 18px', borderRadius: 16,
              background: '#222', border: '1px solid #333',
              fontSize: 16, color: '#fff', fontWeight: 600,
              whiteSpace: 'nowrap',
            }}>
              Bet.
              <div style={{
                position: 'absolute', bottom: -6, left: 30,
                width: 12, height: 12, background: '#222',
                border: '1px solid #333', borderTop: 'none', borderLeft: 'none',
                transform: 'rotate(45deg)',
              }} />
            </div>
            {/* Speech bubble from teacher (right) — "Got a minute?" */}
            <div style={{
              position: 'absolute', top: -44, right: 10,
              padding: '8px 18px', borderRadius: 16,
              background: '#222', border: '1px solid #444',
              fontSize: 16, color: '#fb923c', fontWeight: 600,
              whiteSpace: 'nowrap',
            }}>
              Got a minute?
              <div style={{
                position: 'absolute', bottom: -6, right: 30,
                width: 12, height: 12, background: '#222',
                border: '1px solid #444', borderTop: 'none', borderLeft: 'none',
                transform: 'rotate(45deg)',
              }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16 }}>
              <ByteMascot size={160} equipment={equipmentStudent} />
              <ByteMascot size={160} equipment={equipmentTeacher} />
            </div>
            {/* Ground line */}
            <div style={{
              width: 420, height: 2, background: 'rgba(255,255,255,0.08)',
              borderRadius: 1, marginTop: 4, alignSelf: 'center',
            }} />
          </div>
        </AbsoluteFill>
      )}

      {/* ===== MAIN CONTENT — fixed positions ===== */}
      {showMain && (
        <>
          {/* LESSON TITLE — fixed top */}
          {lessonTitle && (
            <div style={{
              position: 'absolute', top: 60, left: 0, right: 0,
              fontSize: 22, fontWeight: 700, color: '#888',
              letterSpacing: '0.06em', textTransform: 'uppercase' as const,
              textAlign: 'center',
            }}>
              {lessonTitle}
            </div>
          )}

          {/* CODE — fixed position below title */}
          {codeSnippet && (
            <div style={{
              position: 'absolute', top: 110, left: 60, right: 60,
            }}>
              <CodeBlock code={codeSnippet} />
            </div>
          )}

          {/* CAPTIONS — fixed middle area */}
          <div style={{
            position: 'absolute', top: 520, left: 50, right: 50,
            bottom: 560,
            maxWidth: 700, margin: '0 auto',
            fontFamily, fontWeight: 800, fontSize: 44, lineHeight: 1.4,
            textAlign: 'center',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ConversationCaptionsInline allWords={allWords} titleCardFrames={TITLE_FRAMES} />
          </div>

          {/* TWO BYTES — fixed bottom */}
          <div style={{ position: 'absolute', bottom: 180, left: 0, right: 0 }}>
            <TwoBytes
              equipmentStudent={equipmentStudent}
              equipmentTeacher={equipmentTeacher}
              activeSpeaker={activeSpeaker}
            />
          </div>

          {/* Speaker labels — fixed under Bytes */}
          <div style={{
            position: 'absolute', bottom: 145, left: 0, right: 0,
            display: 'flex', justifyContent: 'center', gap: 160,
          }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: activeSpeaker === 'student' ? '#fff' : '#555', letterSpacing: '0.08em' }}>STUDENT</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: activeSpeaker === 'teacher' ? '#fb923c' : '#555', letterSpacing: '0.08em' }}>TEACHER</span>
          </div>
        </>
      )}

      {/* ===== CTA ===== */}
      {showCTA && (
        <AbsoluteFill style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: 60, gap: 32, opacity: ctaOp,
        }}>
          <div style={{ display: 'flex', gap: 16 }}>
            <ByteMascot size={150} equipment={equipmentStudent} />
            <ByteMascot size={150} equipment={equipmentTeacher} />
          </div>
          <h2 style={{ fontSize: 38, fontWeight: 800, color: '#fff', textAlign: 'center', lineHeight: 1.3, margin: 0 }}>
            Full lesson available on
          </h2>
          <CoduyLogo height={70} />
          <div style={{ display: 'flex', gap: 20, marginTop: 8 }}>
            {/* App Store badge */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '14px 24px', borderRadius: 14,
              background: '#fff', color: '#000',
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="black">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              <div>
                <div style={{ fontSize: 11, fontWeight: 500, lineHeight: 1 }}>Download on the</div>
                <div style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.2 }}>App Store</div>
              </div>
            </div>
            {/* Google Play badge */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '14px 24px', borderRadius: 14,
              background: '#fff', color: '#000',
            }}>
              <svg width="24" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M3 20.5V3.5C3 2.91 3.34 2.39 3.84 2.15L13.69 12L3.84 21.85C3.34 21.61 3 21.09 3 20.5Z" fill="#4285F4"/>
                <path d="M16.81 15.12L6.05 21.34L13.69 12L16.81 15.12Z" fill="#34A853"/>
                <path d="M20.16 10.81C20.5 11.08 20.75 11.5 20.75 12C20.75 12.5 20.53 12.9 20.18 13.18L17.89 14.5L14.5 12L17.89 9.5L20.16 10.81Z" fill="#FBBC04"/>
                <path d="M6.05 2.66L16.81 8.88L13.69 12L6.05 2.66Z" fill="#EA4335"/>
              </svg>
              <div>
                <div style={{ fontSize: 11, fontWeight: 500, lineHeight: 1 }}>GET IT ON</div>
                <div style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.2 }}>Google Play</div>
              </div>
            </div>
          </div>
        </AbsoluteFill>
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
      {Array.from({ length: 8 }, (_, i) => {
        const x = 80 + (i * 130) % 920;
        const baseY = 200 + (i * 230) % 1500;
        const y = baseY + Math.sin((frame / fps * (0.2 + i * 0.1)) + i) * 20;
        const op = interpolate(Math.sin((frame / fps * 0.4) + i), [-1, 1], [0.02, 0.05]);
        const size = 3 + (i % 3);
        return <div key={i} style={{ position: 'absolute', left: x, top: y, width: size, height: size, borderRadius: size, background: i % 2 === 0 ? '#4ade80' : '#fb923c', opacity: op }} />;
      })}
    </>
  );
};
