import React from 'react';
import {
  AbsoluteFill, useCurrentFrame, interpolate, useVideoConfig,
  staticFile, Img, Audio,
} from 'remotion';
import { loadFont } from '@remotion/google-fonts/Inter';
import { ByteMascot } from './Byte';

const { fontFamily } = loadFont();
const LOGO_SRC = staticFile('logocoduy.png');

export interface ByteFallWord {
  word: string;
  start: number;
  end: number;
}

const CHUTE_COLORS = ['#4ade80', '#60a5fa', '#f59e0b', '#a855f7', '#f472b6', '#34d399', '#fb923c', '#818cf8'];

export const ByteFallAnimation: React.FC<{
  equipment?: Record<string, string>;
  durationInFrames: number;
  term?: string;
  termFull?: string;
  definition?: string;
  audioUrl?: string;
  words?: ByteFallWord[];
  lang?: 'en' | 'sk';
  chuteColor?: string;
}> = ({
  equipment = {},
  term = 'SSH',
  termFull = 'Secure Shell',
  definition = 'Bezpečný komunikačný protokol na vzdialený prístup k serverom',
  audioUrl,
  words = [],
  lang = 'sk',
  chuteColor,
}) => {
  // Pick a stable color from the term so it's consistent across renders
  const parachuteColor = chuteColor || CHUTE_COLORS[term.split('').reduce((s, c) => s + c.charCodeAt(0), 0) % CHUTE_COLORS.length];
  const frame = useCurrentFrame();
  const { fps, height, width } = useVideoConfig();

  const byteSize = 380;

  // === TIMING ===
  const enterEnd = 1;
  const fallStart = 1;
  const fallEnd = fps * 11;
  const impactFrame = fallEnd;
  const revealStart = fps * 12;

  const startY = height * 0.35;
  const floatY = height * 0.35;
  const groundY = height * 0.55;

  const landed = frame >= impactFrame;

  // === PHASE 1: Enter ===
  const enterProgress = interpolate(frame, [0, enterEnd], [0, 1], { extrapolateRight: 'clamp' });
  const enterEase = 1 - Math.pow(1 - enterProgress, 3);
  const enterY = startY + (floatY - startY) * enterEase;

  // Term visible from first frame — no scale animation
  const termEase = 1;

  // === PHASE 2: Long fall ===
  const fallProgress = frame >= fallStart && frame < fallEnd
    ? interpolate(frame, [fallStart, fallEnd], [0, 1], { extrapolateRight: 'clamp' })
    : frame >= fallEnd ? 1 : 0;

  const fallEase = fallProgress < 0.5
    ? 4 * fallProgress * fallProgress * fallProgress
    : 1 - Math.pow(-2 * fallProgress + 2, 3) / 2;

  const fallDistance = (groundY - floatY) * fallEase;

  const wobbleX = frame >= fallStart && frame < fallEnd
    ? Math.sin(frame / fps * Math.PI * 1.2) * interpolate(fallProgress, [0, 0.3, 0.7, 1], [40, 80, 100, 30], { extrapolateRight: 'clamp' })
    : 0;

  const tilt = frame >= fallStart && frame < fallEnd
    ? Math.sin(frame / fps * Math.PI * 2) * interpolate(fallProgress, [0, 0.3, 0.7, 1], [8, 20, 30, 10], { extrapolateRight: 'clamp' })
    : 0;

  const scalePulse = frame >= fallStart && frame < fallEnd
    ? 1 + Math.sin(frame / fps * Math.PI * 3) * interpolate(fallProgress, [0, 0.5, 0.9], [0.02, 0.05, 0.02], { extrapolateRight: 'clamp' })
    : 1;

  // === PHASE 3: Impact ===
  const impactTime = landed ? frame - impactFrame : -1;

  const bounce = landed
    ? -100 * Math.exp(-((impactTime / fps) * 5)) * Math.abs(Math.sin((impactTime / fps) * Math.PI * 4))
    : 0;

  const squashX = impactTime >= 0 && impactTime < fps * 0.3
    ? interpolate(impactTime, [0, fps * 0.04, fps * 0.12, fps * 0.3], [1, 1.45, 0.88, 1], { extrapolateRight: 'clamp' })
    : 1;

  const squashY = impactTime >= 0 && impactTime < fps * 0.3
    ? interpolate(impactTime, [0, fps * 0.04, fps * 0.12, fps * 0.3], [1, 0.55, 1.12, 1], { extrapolateRight: 'clamp' })
    : 1;

  const settleTime = impactTime >= 0 ? impactTime / fps : 0;
  const breathe = settleTime > 1.5 ? 1 + Math.sin((settleTime - 1.5) * Math.PI * 0.6) * 0.02 : 1;

  const shake = impactTime >= 0 && impactTime < fps * 0.3
    ? Math.sin(impactTime * 2.5) * interpolate(impactTime, [0, fps * 0.3], [15, 0], { extrapolateRight: 'clamp' })
    : 0;

  // === FINAL BYTE POSITION ===
  let byteY: number;
  let byteRot: number;

  if (frame < fallStart) {
    byteY = enterY;
    byteRot = 0;
  } else if (frame < fallEnd) {
    byteY = floatY + fallDistance;
    byteRot = 0;
  } else {
    byteY = groundY + bounce;
    byteRot = 0;
  }

  // === STARS / SPACE PARTICLES ===
  const showStars = frame >= 2 && frame < impactFrame;
  const overallProgress = interpolate(frame, [0, impactFrame], [0, 1], { extrapolateRight: 'clamp' });
  const starSpeed = interpolate(overallProgress, [0, 0.05, 0.5, 1], [3, 5, 6, 10], { extrapolateRight: 'clamp' });

  // === TERM POSITION ===
  const termY = frame < impactFrame
    ? byteY - byteSize - 30
    : interpolate(impactTime, [0, fps * 0.3], [groundY - byteSize - 30, -300], { extrapolateRight: 'clamp' });

  // Term visible from frame 0 (no fade-in delay so first frame shows SSH)
  const termOp = frame < impactFrame ? 1
    : interpolate(impactTime, [0, fps * 0.2], [1, 0], { extrapolateRight: 'clamp' });

  // === DEFINITION — reveals after landing ===
  const defOp = frame >= revealStart
    ? interpolate(frame, [revealStart, revealStart + fps * 1], [0, 1], { extrapolateRight: 'clamp' })
    : 0;

  const defSlideUp = frame >= revealStart
    ? interpolate(frame, [revealStart, revealStart + fps * 1], [30, 0], { extrapolateRight: 'clamp' })
    : 30;

  // === SHADOW ===
  const shadowOp = frame < fallStart ? 0.03
    : landed ? 0.15
    : interpolate(fallProgress, [0, 1], [0.03, 0.15]);
  const shadowScale = frame < fallStart ? 0.3
    : interpolate(fallProgress, [0, 1], [0.3, 1], { extrapolateRight: 'clamp' });

  // === GROUND LINE ===
  const groundOp = landed
    ? interpolate(impactTime, [0, fps * 0.08], [0, 0.5], { extrapolateRight: 'clamp' })
    : 0;

  const groundLineTop = groundY + byteSize + 5;

  // === IMPACT PARTICLES ===
  const showParticles = landed && impactTime < fps * 0.7;
  const pProg = impactTime >= 0 ? Math.min(impactTime / (fps * 0.5), 1) : 0;

  // === VOICEOVER SUBTITLES ===
  const currentTime = frame / fps;
  // Find the current word being spoken
  const currentWordIdx = words.findIndex(w => currentTime >= w.start && currentTime < w.end);
  // Build subtitle: show a group of words around the current spoken word
  let subtitle = '';
  if (words.length > 0 && currentTime >= words[0].start) {
    const GROUP_SIZE = 6;
    // If between words or past last word, use the last spoken word
    let spokenIdx = currentWordIdx >= 0 ? currentWordIdx : -1;
    if (spokenIdx < 0) {
      // Find last word that already started
      for (let i = words.length - 1; i >= 0; i--) {
        if (currentTime >= words[i].start) { spokenIdx = i; break; }
      }
    }
    if (spokenIdx >= 0) {
      const groupStart = Math.floor(spokenIdx / GROUP_SIZE) * GROUP_SIZE;
      const groupEnd = Math.min(groupStart + GROUP_SIZE, words.length);
      const groupWords = words.slice(groupStart, groupEnd);
      const lastWord = groupWords[groupWords.length - 1];
      // Show group while speaking + 1.5s after last word ends
      if (currentTime >= groupWords[0].start && currentTime < lastWord.end + 1.5) {
        subtitle = groupWords.map((w, i) => {
          const absIdx = groupStart + i;
          const isActive = absIdx === spokenIdx;
          return isActive ? `<b>${w.word}</b>` : w.word;
        }).join(' ');
      }
    }
  }

  // Subtitle position: below Byte during fall, above definition after landing
  const subtitleTop = landed
    ? groundLineTop + 40
    : byteY + byteSize + 30;
  const subtitleOp = subtitle ? 1 : 0;

  return (
    <AbsoluteFill style={{
      background: '#0A0A0A', fontFamily,
      transform: `translateY(${shake}px)`,
      overflow: 'hidden',
    }}>

      {/* Audio */}
      {audioUrl && <Audio src={staticFile(audioUrl)} />}
      <Audio src={staticFile('wind.wav')} volume={interpolate(frame, [0, fallEnd - fps * 1, fallEnd], [0.35, 0.35, 0], { extrapolateRight: 'clamp' })} loop />

      {/* Space stars */}
      {showStars && Array.from({ length: 30 }, (_, i) => {
        const sx = ((i * 37 + 50) % (width - 40)) + 20;
        const speed = (2 + (i % 5) * 1.5) * starSpeed;
        const sy = height - (frame * speed + i * 67) % (height + 100);
        const sOp = interpolate(overallProgress, [0, 0.02, 0.3, 1], [0.06, 0.1, 0.12, 0.18], { extrapolateRight: 'clamp' });
        const sSize = 1.5 + (i % 3);
        return (
          <div key={`s-${i}`} style={{
            position: 'absolute', left: sx, top: sy,
            width: sSize, height: i % 4 === 0 ? sSize : sSize + starSpeed * 3,
            borderRadius: sSize,
            background: i % 5 === 0 ? '#4ade80' : i % 5 === 1 ? '#fb923c' : '#fff',
            opacity: sOp,
          }} />
        );
      })}

      {/* Term — follows Byte above */}
      <div style={{
        position: 'absolute', top: termY, left: 0, right: 0,
        textAlign: 'center', opacity: termOp,
        transform: `scale(${termEase})`,
      }}>
        <div style={{
          fontSize: 100, fontWeight: 700, color: '#fff',
          letterSpacing: '0.1em',
        }}>
          {term}
        </div>
        <div style={{
          fontSize: 22, fontWeight: 600, color: parachuteColor,
          letterSpacing: '0.08em', marginTop: 6,
          opacity: 1,
        }}>
          {termFull}
        </div>
      </div>

      {/* Shadow */}
      <div style={{
        position: 'absolute', top: groundLineTop, left: '50%',
        transform: `translateX(-50%) scaleX(${shadowScale}) scaleY(0.25)`,
        width: 250, height: 30, borderRadius: '50%',
        background: 'rgba(255,255,255,0.06)',
        opacity: shadowOp, filter: 'blur(12px)',
      }} />

      {/* Byte + Parachute */}
      <div style={{
        position: 'absolute', top: byteY, left: '50%',
        transform: `translateX(-50%) translateX(${landed ? 0 : wobbleX}px) rotate(${byteRot + tilt}deg) scaleX(${squashX * breathe * scalePulse}) scaleY(${squashY * breathe * scalePulse})`,
        transformOrigin: 'center bottom',
      }}>
        {/* Parachute */}
        {(() => {
          const chuteOpen = frame >= 0 && !landed;
          const chuteDetach = landed && impactTime < fps * 0.6;
          const chuteDetachY = chuteDetach ? -impactTime * 12 : 0;
          const chuteDetachOp = chuteDetach ? interpolate(impactTime, [0, fps * 0.4], [1, 0], { extrapolateRight: 'clamp' }) : 1;
          const chuteScale = 1;
          const chuteSwing = chuteOpen ? Math.sin(frame / fps * Math.PI * 1.5) * 8 : 0;

          if (!chuteOpen && !chuteDetach) return null;
          const cW = 280;
          const cH = 160;
          return (
            <div style={{
              position: 'absolute',
              top: -cH - 40 + chuteDetachY,
              left: '50%',
              transform: `translateX(-50%) rotate(${chuteSwing}deg) scale(${chuteScale})`,
              opacity: chuteDetachOp,
              transformOrigin: 'center bottom',
            }}>
              <svg width={cW} height={cH + 60} viewBox={`0 0 ${cW} ${cH + 60}`}>
                <ellipse cx={cW / 2} cy={cH * 0.45} rx={cW / 2 - 10} ry={cH * 0.45}
                  fill="none" stroke={parachuteColor} strokeWidth="3" opacity="0.7" />
                <ellipse cx={cW / 2} cy={cH * 0.45} rx={cW / 2 - 10} ry={cH * 0.45}
                  fill={parachuteColor} opacity="0.08" />
                {[0.25, 0.5, 0.75].map((t) => (
                  <line key={t} x1={cW * t} y1={5} x2={cW * t} y2={cH * 0.85}
                    stroke={parachuteColor} strokeWidth="1.5" opacity="0.3" />
                ))}
                <line x1={15} y1={cH * 0.8} x2={cW / 2 - 30} y2={cH + 55} stroke="#888" strokeWidth="1.5" />
                <line x1={cW - 15} y1={cH * 0.8} x2={cW / 2 + 30} y2={cH + 55} stroke="#888" strokeWidth="1.5" />
                <line x1={cW / 2} y1={cH * 0.85} x2={cW / 2} y2={cH + 55} stroke="#888" strokeWidth="1.5" />
              </svg>
            </div>
          );
        })()}
        <ByteMascot size={byteSize} equipment={equipment} />
      </div>

      {/* Ground line */}
      <div style={{
        position: 'absolute', top: groundLineTop, left: '50%',
        transform: 'translateX(-50%)',
        width: 500, height: 2,
        background: `rgba(255,255,255,${groundOp})`,
        borderRadius: 1,
      }} />

      {/* Impact particles */}
      {showParticles && Array.from({ length: 18 }, (_, i) => {
        const angle = (i / 18) * Math.PI * 2;
        const dist = pProg * (90 + (i % 4) * 25);
        const x = Math.cos(angle) * dist;
        const py = Math.sin(angle) * dist * 0.25 - pProg * 35;
        const pOp = interpolate(pProg, [0, 0.15, 1], [0.8, 0.4, 0], { extrapolateRight: 'clamp' });
        const size = 3 + (i % 3) * 2;
        return (
          <div key={`p-${i}`} style={{
            position: 'absolute',
            top: groundLineTop - 5 + py,
            left: width / 2 + x,
            width: size, height: size, borderRadius: size,
            background: i % 3 === 0 ? '#4ade80' : i % 3 === 1 ? '#fb923c' : '#fff',
            opacity: pOp * 0.6,
          }} />
        );
      })}

      {/* Voiceover subtitles */}
      {subtitle && (
        <div style={{
          position: 'absolute', top: subtitleTop, left: 0, right: 0,
          textAlign: 'center', opacity: subtitleOp,
          padding: '0 80px',
        }}>
          <div
            style={{
              display: 'inline-block',
              fontSize: 28, fontWeight: 500, color: '#aaa',
              lineHeight: 1.6,
              background: 'rgba(0,0,0,0.6)',
              borderRadius: 12,
              padding: '10px 24px',
            }}
            dangerouslySetInnerHTML={{ __html: subtitle.replace(/<b>/g, '<b style="color:#fff;font-weight:700;">') }}
          />
        </div>
      )}

      {/* Definition — reveals above Byte after landing */}
      <div style={{
        position: 'absolute', top: groundY - byteSize - 100 + defSlideUp, left: 0, right: 0,
        textAlign: 'center', opacity: defOp,
        padding: '0 60px',
      }}>
        <div style={{
          fontSize: 80, fontWeight: 700, color: '#fff',
          letterSpacing: '0.08em', marginBottom: 12,
        }}>
          {term}
        </div>
        <div style={{
          fontSize: 22, fontWeight: 600, color: parachuteColor,
          letterSpacing: '0.06em', marginBottom: 16,
        }}>
          {termFull}
        </div>
        <div style={{
          fontSize: 30, fontWeight: 500, color: '#ccc',
          lineHeight: 1.5, maxWidth: 700, margin: '0 auto',
        }}>
          {definition}
        </div>
      </div>

      {/* Caption hint */}
      {defOp > 0 && (
        <div style={{
          position: 'absolute', bottom: 110, left: 0, right: 0,
          textAlign: 'center',
          opacity: frame >= revealStart + fps * 2
            ? interpolate(frame, [revealStart + fps * 2, revealStart + fps * 3], [0, 1], { extrapolateRight: 'clamp' })
            : 0,
        }}>
          <div style={{
            fontSize: 18, fontWeight: 500, color: '#888',
            letterSpacing: '0.02em',
          }}>
            {lang === 'sk' ? 'kompletnejšie vysvetlenie tejto skratky nájdeš v popise' : 'check description for the full explanation'}
          </div>
        </div>
      )}

      {/* Logo */}
      <div style={{
        position: 'absolute', bottom: 60, left: 0, right: 0,
        display: 'flex', justifyContent: 'center',
      }}>
        <Img src={LOGO_SRC} style={{ height: 22, objectFit: 'contain' }} />
      </div>
    </AbsoluteFill>
  );
};
