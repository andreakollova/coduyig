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
}> = ({ equipment = {} }) => {
  const frame = useCurrentFrame();
  const { fps, height, width } = useVideoConfig();

  const byteSize = 550;
  const groundLineY = height * 0.78;
  const groundY = groundLineY - byteSize; // top position when Byte's feet touch ground

  // === FALL: 7 seconds, starts from above screen ===
  const fallEnd = fps * 7;
  const landed = frame >= fallEnd;

  // Fall position — slow start, accelerates (gravity)
  const fallY = frame < fallEnd
    ? interpolate(frame, [0, fallEnd], [-700, groundY], {
        extrapolateRight: 'clamp',
        easing: (t) => t * t,
      })
    : groundY;

  // Rotation while falling — spinning like a wheel
  const spinRotation = frame < fallEnd
    ? (frame / fps) * 300
    : 0;

  // === WIND LINES — streaking past as Byte falls ===
  const windLines = frame < fallEnd ? Array.from({ length: 12 }, (_, i) => {
    const speed = 3 + (i % 4) * 2;
    const x = 100 + (i * 80) % (width - 200);
    const lineY = ((frame * speed + i * 200) % (height + 200)) - 100;
    const opacity = interpolate(frame, [0, fps * 2, fallEnd - fps], [0, 0.15, 0.3], { extrapolateRight: 'clamp' });
    const lineHeight = 40 + (i % 3) * 30;
    return (
      <div key={`wind-${i}`} style={{
        position: 'absolute', left: x, top: lineY,
        width: 2, height: lineHeight, borderRadius: 1,
        background: '#fff', opacity,
      }} />
    );
  }) : null;

  // === BYTE REACTIONS during fall ===
  // Phase 1 (0-2s): calm, just spinning
  // Phase 2 (2-4s): starts wobbling — getting nervous
  // Phase 3 (4-7s): wobbles more, looking down

  const wobble = frame < fps * 2 ? 0
    : frame < fps * 4 ? Math.sin(frame / fps * Math.PI * 3) * 5
    : frame < fallEnd ? Math.sin(frame / fps * Math.PI * 6) * 12
    : 0;

  // Scale pulse — gets bigger as approaching ground (dramatic effect)
  const dramaPulse = frame < fallEnd
    ? interpolate(frame, [fps * 5, fallEnd], [1, 1.08], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    : 1;

  // === SPEED PARTICLES — small dots flying upward as Byte falls ===
  const showSpeedDots = frame > fps * 2 && frame < fallEnd;
  const speedDots = showSpeedDots ? Array.from({ length: 8 }, (_, i) => {
    const dotX = width / 2 + (Math.sin(frame * 0.3 + i * 2) * 200);
    const dotSpeed = 5 + (i % 3) * 3;
    const dotY = ((frame * dotSpeed + i * 250) % (height + 100)) - 50;
    const dotOp = interpolate(frame, [fps * 2, fps * 4], [0.05, 0.15], { extrapolateRight: 'clamp' });
    const dotSize = 3 + (i % 3);
    return (
      <div key={`dot-${i}`} style={{
        position: 'absolute', left: dotX, top: dotY,
        width: dotSize, height: dotSize, borderRadius: dotSize,
        background: i % 2 === 0 ? '#4ade80' : '#fb923c',
        opacity: dotOp,
      }} />
    );
  }) : null;

  // === BOUNCE after landing ===
  const bounce = landed
    ? interpolate(
        frame - fallEnd,
        [0, fps * 0.12, fps * 0.3, fps * 0.5, fps * 0.7, fps * 0.85, fps * 1.0, fps * 1.3],
        [0, -160, 0, -60, 0, -20, 0, 0],
        { extrapolateRight: 'clamp' }
      )
    : 0;

  const squashX = landed
    ? interpolate(
        frame - fallEnd,
        [0, fps * 0.06, fps * 0.18, fps * 0.3, fps * 0.5, fps * 0.65],
        [1, 1.5, 0.85, 1.2, 0.95, 1],
        { extrapolateRight: 'clamp' }
      )
    : 1;

  const squashY = landed
    ? interpolate(
        frame - fallEnd,
        [0, fps * 0.06, fps * 0.18, fps * 0.3, fps * 0.5, fps * 0.65],
        [1, 0.5, 1.15, 0.85, 1.05, 1],
        { extrapolateRight: 'clamp' }
      )
    : 1;

  // Idle breathing
  const idleStart = fallEnd + fps * 1.5;
  const breathe = frame > idleStart
    ? interpolate(Math.sin((frame - idleStart) / fps * Math.PI * 0.6), [-1, 1], [0.97, 1.03])
    : 1;

  const finalY = landed ? groundY + bounce : fallY;

  // === Shadow ===
  const shadowOpacity = frame < fallEnd
    ? interpolate(frame, [0, fallEnd], [0, 0.15], { extrapolateRight: 'clamp' })
    : 0.15;
  const shadowScale = frame < fallEnd
    ? interpolate(frame, [0, fallEnd], [0.1, 1], { extrapolateRight: 'clamp' })
    : 1;

  // === Ground line ===
  const groundOpacity = landed
    ? interpolate(frame - fallEnd, [0, fps * 0.08], [0, 0.5], { extrapolateRight: 'clamp' })
    : 0;

  // === Impact particles ===
  const showParticles = landed && frame < fallEnd + fps * 0.8;

  // === Screen shake ===
  const shake = landed && frame < fallEnd + fps * 0.25
    ? interpolate(frame - fallEnd, [0, fps * 0.05, fps * 0.1, fps * 0.15, fps * 0.2, fps * 0.25],
        [0, -12, 8, -5, 3, 0], { extrapolateRight: 'clamp' })
    : 0;

  return (
    <AbsoluteFill style={{ background: '#0A0A0A', fontFamily, transform: `translateY(${shake}px)` }}>

      {/* Wind lines */}
      {windLines}

      {/* Speed dots */}
      {speedDots}

      {/* Shadow on ground */}
      <div style={{
        position: 'absolute', top: groundLineY,
        left: '50%', transform: `translateX(-50%) scaleX(${shadowScale})`,
        width: 250, height: 20, borderRadius: '50%',
        background: 'rgba(255,255,255,0.08)',
        opacity: shadowOpacity, filter: 'blur(12px)',
      }} />

      {/* Byte */}
      <div style={{
        position: 'absolute', top: finalY, left: '50%',
        transform: `translateX(-50%) rotate(${landed ? 0 : spinRotation + wobble}deg) scaleX(${squashX * breathe * dramaPulse}) scaleY(${squashY * breathe * dramaPulse})`,
        transformOrigin: 'center bottom',
      }}>
        <ByteMascot size={byteSize} equipment={equipment} />
      </div>

      {/* Ground line */}
      <div style={{
        position: 'absolute', top: groundLineY + 5, left: '50%',
        transform: 'translateX(-50%)',
        width: 550, height: 3,
        background: `rgba(255,255,255,${groundOpacity})`,
        borderRadius: 2,
      }} />

      {/* Impact particles */}
      {showParticles && Array.from({ length: 20 }, (_, i) => {
        const angle = (i / 20) * Math.PI * 2;
        const progress = (frame - fallEnd) / (fps * 0.6);
        const dist = progress * (120 + (i % 4) * 40);
        const x = Math.cos(angle) * dist;
        const py = Math.sin(angle) * dist * 0.3 - progress * 60;
        const opacity = interpolate(progress, [0, 0.2, 1], [1, 0.6, 0], { extrapolateRight: 'clamp' });
        const size = 4 + (i % 4) * 3;

        return (
          <div key={`p-${i}`} style={{
            position: 'absolute',
            top: groundLineY - 10 + py,
            left: width / 2 + x,
            width: size, height: size, borderRadius: size,
            background: i % 3 === 0 ? '#4ade80' : i % 3 === 1 ? '#fb923c' : '#fff',
            opacity: opacity * 0.7,
          }} />
        );
      })}

      {/* Logo */}
      <div style={{
        position: 'absolute', bottom: 60,
        left: 0, right: 0,
        display: 'flex', justifyContent: 'center',
      }}>
        <Img src={LOGO_SRC} style={{ height: 22, objectFit: 'contain' }} />
      </div>
    </AbsoluteFill>
  );
};
