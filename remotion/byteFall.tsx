import React from 'react';
import {
  AbsoluteFill, useCurrentFrame, interpolate, useVideoConfig,
  staticFile, Img, Audio, Sequence,
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
}> = ({ equipment = {}, term = 'SSH', termFull = 'Secure Shell', definition = 'Bezpečný komunikačný protokol na vzdialený prístup' }) => {
  const frame = useCurrentFrame();
  const { fps, height, width } = useVideoConfig();

  const byteSize = 400;
  const centerX = width / 2;

  // === SCENE: Byte floats in center, term appears, then Byte drops ===

  // PHASE 1 (0-2s): Byte appears, floats gently
  // PHASE 2 (2-4s): Term + full name appears with typing effect
  // PHASE 3 (4-6s): Definition appears below
  // PHASE 4 (6-7.5s): Everything starts shaking, Byte looks worried
  // PHASE 5 (7.5-8.5s): Byte drops, everything falls
  // PHASE 6 (8.5-10s): Bounce, settle, Coduy logo

  const phase1End = fps * 2;
  const phase2End = fps * 4;
  const phase3End = fps * 6;
  const phase4End = fps * 7.5;
  const phase5End = fps * 8.5;

  // === BYTE POSITION ===
  const byteRestY = height * 0.25;
  const groundY = height * 0.65;

  // Gentle float in phases 1-4
  const floatY = frame < phase4End
    ? Math.sin(frame / fps * Math.PI * 0.5) * 12
    : 0;

  // Shake in phase 4
  const isShaking = frame >= phase3End && frame < phase4End;
  const shakeX = isShaking ? Math.sin(frame * 1.5) * interpolate(frame, [phase3End, phase4End], [2, 15], { extrapolateRight: 'clamp' }) : 0;
  const shakeY = isShaking ? Math.cos(frame * 2) * interpolate(frame, [phase3End, phase4End], [1, 8], { extrapolateRight: 'clamp' }) : 0;

  // Fall in phase 5
  const isFalling = frame >= phase4End && frame < phase5End;
  const fallProgress = isFalling ? interpolate(frame, [phase4End, phase5End], [0, 1], { extrapolateRight: 'clamp' }) : frame >= phase5End ? 1 : 0;
  const fallEased = fallProgress * fallProgress;
  const fallY = fallEased * (groundY - byteRestY);

  // Rotation during fall
  const fallRotation = isFalling ? fallProgress * 360 : 0;

  // Bounce after landing
  const hasLanded = frame >= phase5End;
  const bounceTime = hasLanded ? (frame - phase5End) / fps : 0;
  const bounce = hasLanded
    ? -120 * Math.exp(-bounceTime * 5) * Math.abs(Math.sin(bounceTime * Math.PI * 3.5))
    : 0;

  // Squash
  const impactT = hasLanded ? frame - phase5End : -1;
  const squashX = impactT >= 0 && impactT < fps * 0.35
    ? interpolate(impactT, [0, fps * 0.04, fps * 0.12, fps * 0.35], [1, 1.4, 0.88, 1], { extrapolateRight: 'clamp' })
    : 1;
  const squashY = impactT >= 0 && impactT < fps * 0.35
    ? interpolate(impactT, [0, fps * 0.04, fps * 0.12, fps * 0.35], [1, 0.55, 1.12, 1], { extrapolateRight: 'clamp' })
    : 1;

  // Breathing after settle
  const settled = hasLanded && bounceTime > 1.2;
  const breathe = settled ? 1 + Math.sin((bounceTime - 1.2) * Math.PI * 0.6) * 0.02 : 1;

  let byteY: number;
  if (frame < phase4End) {
    byteY = byteRestY + floatY;
  } else if (isFalling) {
    byteY = byteRestY + fallY;
  } else {
    byteY = groundY + bounce;
  }

  // === TERM TEXT ===
  // Typing effect for term
  const termChars = frame >= phase1End
    ? Math.min(term.length, Math.floor((frame - phase1End) / 3))
    : 0;
  const termVisible = term.slice(0, termChars);

  // Full name fade in
  const fullNameOp = frame >= phase1End + term.length * 3
    ? interpolate(frame, [phase1End + term.length * 3, phase1End + term.length * 3 + fps * 0.5], [0, 1], { extrapolateRight: 'clamp' })
    : 0;

  // Definition fade in
  const defOp = frame >= phase2End
    ? interpolate(frame, [phase2End, phase2End + fps * 0.8], [0, 1], { extrapolateRight: 'clamp' })
    : 0;

  // Text falls with Byte in phase 5
  const textFallY = isFalling || hasLanded
    ? interpolate(frame, [phase4End, phase4End + fps * 0.3], [0, height + 200], { extrapolateRight: 'clamp' })
    : 0;

  // Text shake
  const textShakeX = isShaking ? Math.sin(frame * 1.8) * interpolate(frame, [phase3End, phase4End], [1, 10], { extrapolateRight: 'clamp' }) : 0;

  // === SCREEN SHAKE on impact ===
  const screenShake = impactT >= 0 && impactT < fps * 0.25
    ? Math.sin(impactT * 3) * interpolate(impactT, [0, fps * 0.25], [12, 0], { extrapolateRight: 'clamp' })
    : 0;

  // === GROUND ===
  const groundOp = hasLanded ? interpolate(impactT, [0, fps * 0.1], [0, 0.4], { extrapolateRight: 'clamp' }) : 0;

  // === IMPACT PARTICLES ===
  const showParticles = hasLanded && impactT < fps * 0.7;
  const pProgress = impactT >= 0 ? impactT / (fps * 0.5) : 0;

  // === SHADOW ===
  const shadowOp = frame < phase4End ? 0.05
    : hasLanded ? 0.12
    : interpolate(fallProgress, [0, 1], [0.05, 0.12]);
  const shadowScale = frame < phase4End ? 0.6 : interpolate(fallProgress, [0, 1], [0.6, 1], { extrapolateRight: 'clamp' });

  // === BYTE ENTRY ===
  const byteEntryScale = interpolate(frame, [0, fps * 0.5], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{
      background: '#0A0A0A', fontFamily,
      transform: `translateY(${screenShake}px)`,
    }}>

      {/* Background music */}
      {(() => { try { return <Audio src={staticFile('bgmusic.mp3')} volume={0.04} loop />; } catch { return null; } })()}

      {/* Term text — floats above Byte */}
      {termChars > 0 && (
        <div style={{
          position: 'absolute',
          top: byteRestY - 100 + textFallY,
          left: 0, right: 0,
          textAlign: 'center',
          transform: `translateX(${textShakeX}px)`,
        }}>
          {/* Big term */}
          <div style={{
            fontSize: 90, fontWeight: 900, color: '#fff',
            letterSpacing: '0.08em',
            textShadow: '0 0 40px rgba(74,222,128,0.2)',
          }}>
            {termVisible}
            {termChars < term.length && <span style={{ opacity: frame % 10 < 5 ? 1 : 0 }}>|</span>}
          </div>

          {/* Full name */}
          <div style={{
            fontSize: 24, fontWeight: 600, color: '#4ade80',
            opacity: fullNameOp, marginTop: 8,
            letterSpacing: '0.06em',
          }}>
            {termFull}
          </div>

          {/* Definition */}
          <div style={{
            fontSize: 28, fontWeight: 500, color: '#aaa',
            opacity: defOp, marginTop: 20,
            maxWidth: 700, margin: '20px auto 0',
            lineHeight: 1.4,
          }}>
            {definition}
          </div>
        </div>
      )}

      {/* Shadow */}
      <div style={{
        position: 'absolute', top: groundY + byteSize + 5, left: '50%',
        transform: `translateX(-50%) scaleX(${shadowScale}) scaleY(0.25)`,
        width: 250, height: 30, borderRadius: '50%',
        background: 'rgba(255,255,255,0.06)',
        opacity: shadowOp, filter: 'blur(12px)',
      }} />

      {/* Byte */}
      <div style={{
        position: 'absolute', top: byteY, left: '50%',
        transform: `translateX(${shakeX}px) translateX(-50%) rotate(${fallRotation}deg) scaleX(${squashX * breathe}) scaleY(${squashY * breathe})`,
        transformOrigin: 'center bottom',
        scale: `${byteEntryScale}`,
      }}>
        <ByteMascot size={byteSize} equipment={equipment} />
      </div>

      {/* Ground line */}
      <div style={{
        position: 'absolute', top: groundY + byteSize + 5, left: '50%',
        transform: 'translateX(-50%)',
        width: 500, height: 2,
        background: `rgba(255,255,255,${groundOp})`,
        borderRadius: 1,
      }} />

      {/* Impact particles */}
      {showParticles && Array.from({ length: 16 }, (_, i) => {
        const angle = (i / 16) * Math.PI * 2;
        const dist = pProgress * (90 + (i % 4) * 25);
        const x = Math.cos(angle) * dist;
        const py = Math.sin(angle) * dist * 0.25 - pProgress * 35;
        const pOp = interpolate(pProgress, [0, 0.15, 1], [0.8, 0.4, 0], { extrapolateRight: 'clamp' });
        const size = 3 + (i % 3) * 2;
        return (
          <div key={`p-${i}`} style={{
            position: 'absolute',
            top: groundY + byteSize + py,
            left: width / 2 + x,
            width: size, height: size, borderRadius: size,
            background: i % 3 === 0 ? '#4ade80' : i % 3 === 1 ? '#fb923c' : '#fff',
            opacity: pOp * 0.6,
          }} />
        );
      })}

      {/* Logo — always visible */}
      <div style={{
        position: 'absolute', bottom: 60, left: 0, right: 0,
        display: 'flex', justifyContent: 'center',
      }}>
        <Img src={LOGO_SRC} style={{ height: 22, objectFit: 'contain' }} />
      </div>
    </AbsoluteFill>
  );
};
