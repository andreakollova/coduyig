import React from 'react';
import {
  AbsoluteFill, useCurrentFrame, interpolate, useVideoConfig,
  staticFile, Img,
} from 'remotion';
import { loadFont } from '@remotion/google-fonts/Inter';
import { ByteMascot } from './Byte';

const { fontFamily } = loadFont();
const LOGO_SRC = staticFile('logocoduy.png');

export const ByteFallAnimation: React.FC<{
  equipment?: Record<string, string>;
  durationInFrames: number;
  term?: string;
  termFull?: string;
  definition?: string;
  audioUrl?: string;
}> = ({
  equipment = {},
  term = 'SSH',
  termFull = 'Secure Shell',
  definition = 'Bezpečný komunikačný protokol na vzdialený prístup k serverom',
}) => {
  const frame = useCurrentFrame();
  const { fps, height, width } = useVideoConfig();

  const byteSize = 380;

  // === TIMING ===
  // Phase 1 (0-1.5s): Term appears big, Byte enters from top
  // Phase 2 (1.5-11s): Long smooth fall — Byte + term fall together through space
  // Phase 3 (11-12s): Impact on ground
  // Phase 4 (12-15s): Bounce, settle, definition reveals

  const enterEnd = fps * 1.5;
  const fallStart = enterEnd;
  const fallEnd = fps * 14;
  const impactFrame = fallEnd;
  const revealStart = fps * 15.5;

  const startY = -200;
  const floatY = height * 0.3;
  const groundY = height * 0.55;

  const landed = frame >= impactFrame;

  // === PHASE 1: Enter — Byte slides in from top, term fades in ===
  const enterProgress = interpolate(frame, [0, enterEnd], [0, 1], { extrapolateRight: 'clamp' });
  const enterEase = 1 - Math.pow(1 - enterProgress, 3); // ease-out cubic
  const enterY = startY + (floatY - startY) * enterEase;

  // Term scale pop
  const termScale = interpolate(frame, [fps * 0.3, fps * 1], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const termEase = termScale < 1 ? 1 - Math.pow(1 - termScale, 3) : 1;

  // === PHASE 2: Long fall — smooth, cinematic ===
  const fallProgress = frame >= fallStart && frame < fallEnd
    ? interpolate(frame, [fallStart, fallEnd], [0, 1], { extrapolateRight: 'clamp' })
    : frame >= fallEnd ? 1 : 0;

  // Smooth S-curve easing — slow start, smooth middle, accelerates at end
  const fallEase = fallProgress < 0.5
    ? 4 * fallProgress * fallProgress * fallProgress
    : 1 - Math.pow(-2 * fallProgress + 2, 3) / 2;

  const fallDistance = (groundY - floatY) * fallEase;

  // No full rotation — just wobble and tilt like tumbling/flailing

  // Wobble side to side — flying left and right
  const wobbleX = frame >= fallStart && frame < fallEnd
    ? Math.sin(frame / fps * Math.PI * 1.2) * interpolate(fallProgress, [0, 0.3, 0.7, 1], [40, 80, 100, 30], { extrapolateRight: 'clamp' })
    : 0;

  // Tilt — rocking back and forth, getting more intense
  const tilt = frame >= fallStart && frame < fallEnd
    ? Math.sin(frame / fps * Math.PI * 2) * interpolate(fallProgress, [0, 0.3, 0.7, 1], [8, 20, 30, 10], { extrapolateRight: 'clamp' })
    : 0;

  // Scale pulse — breathing/pulsing while falling
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

  // Breathing after settle
  const settleTime = impactTime >= 0 ? impactTime / fps : 0;
  const breathe = settleTime > 1.5 ? 1 + Math.sin((settleTime - 1.5) * Math.PI * 0.6) * 0.02 : 1;

  // Screen shake
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
    byteRot = 0; // no full rotation, just tilt
  } else {
    byteY = groundY + bounce;
    byteRot = 0;
  }

  // === STARS / SPACE PARTICLES — flowing upward during fall ===
  const showStars = frame >= fallStart && frame < impactFrame;
  const starSpeed = interpolate(fallProgress, [0, 1], [1, 8], { extrapolateRight: 'clamp' });

  // === TERM POSITION — follows Byte, then flies off on impact ===
  const termY = frame < impactFrame
    ? byteY - byteSize - 30
    : interpolate(impactTime, [0, fps * 0.3], [groundY - byteSize - 30, -300], { extrapolateRight: 'clamp' });

  const termOp = frame < fps * 0.3 ? 0
    : frame < impactFrame ? 1
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

  return (
    <AbsoluteFill style={{
      background: '#0A0A0A', fontFamily,
      transform: `translateY(${shake}px)`,
      overflow: 'hidden',
    }}>

      {/* Space stars flowing upward during fall */}
      {showStars && Array.from({ length: 30 }, (_, i) => {
        const sx = ((i * 37 + 50) % (width - 40)) + 20;
        const speed = (2 + (i % 5) * 1.5) * starSpeed;
        const sy = height - ((frame - fallStart) * speed + i * 67) % (height + 100);
        const sOp = interpolate(fallProgress, [0, 0.1, 0.8, 1], [0, 0.04, 0.1, 0.15], { extrapolateRight: 'clamp' });
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
          fontSize: 100, fontWeight: 900, color: '#fff',
          letterSpacing: '0.1em',
        }}>
          {term}
        </div>
        <div style={{
          fontSize: 22, fontWeight: 600, color: '#4ade80',
          letterSpacing: '0.08em', marginTop: 6,
          opacity: interpolate(frame, [fps * 0.8, fps * 1.5], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
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

      {/* Byte */}
      <div style={{
        position: 'absolute', top: byteY, left: '50%',
        transform: `translateX(-50%) translateX(${landed ? 0 : wobbleX}px) rotate(${byteRot + tilt}deg) scaleX(${squashX * breathe * scalePulse}) scaleY(${squashY * breathe * scalePulse})`,
        transformOrigin: 'center bottom',
      }}>
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

      {/* Definition — reveals above Byte after landing */}
      <div style={{
        position: 'absolute', top: 160 + defSlideUp, left: 0, right: 0,
        textAlign: 'center', opacity: defOp,
        padding: '0 60px',
      }}>
        <div style={{
          fontSize: 80, fontWeight: 900, color: '#fff',
          letterSpacing: '0.08em', marginBottom: 12,
        }}>
          {term}
        </div>
        <div style={{
          fontSize: 22, fontWeight: 600, color: '#4ade80',
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
