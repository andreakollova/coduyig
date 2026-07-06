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

  const groundY = height * 0.62;
  const centerY = height * 0.38;

  // === PHASE 1: Spinning in center (0 - 8s) ===
  const spinEnd = fps * 8;
  const isSpinning = frame < spinEnd;

  // Rotation — continuous spinning, speeds up towards the end
  const spinSpeed = interpolate(frame, [0, spinEnd], [1, 4], { extrapolateRight: 'clamp' });
  const spinRotation = frame < spinEnd
    ? frame * spinSpeed * 4
    : 0;

  // Floating up and down while spinning
  const floatY = isSpinning
    ? Math.sin(frame / fps * Math.PI * 0.8) * 30
    : 0;

  // Subtle scale pulse while spinning
  const pulse = isSpinning
    ? interpolate(Math.sin(frame / fps * Math.PI * 1.5), [-1, 1], [0.92, 1.08])
    : 1;

  // Wobble — gets more intense near the end of spinning
  const wobbleIntensity = interpolate(frame, [0, spinEnd * 0.5, spinEnd], [5, 10, 25], { extrapolateRight: 'clamp' });
  const wobble = isSpinning
    ? Math.sin(frame / fps * Math.PI * 3) * wobbleIntensity
    : 0;

  // === PHASE 2: Fall to ground (8s - 9s) ===
  const fallStart = spinEnd;
  const fallEnd = spinEnd + fps * 1;
  const isFalling = frame >= fallStart && frame < fallEnd;

  const fallProgress = isFalling
    ? interpolate(frame, [fallStart, fallEnd], [0, 1], { extrapolateRight: 'clamp' })
    : frame >= fallEnd ? 1 : 0;

  // Gravity curve — accelerates
  const fallCurve = fallProgress * fallProgress;
  const fallY = fallCurve * (groundY - centerY);

  // Still rotating while falling but slowing
  const fallRotation = isFalling
    ? interpolate(frame, [fallStart, fallEnd], [0, 360], { extrapolateRight: 'clamp' })
    : 0;

  // === PHASE 3: Impact + bounce (9s - 10.5s) ===
  const impactFrame = fallEnd;
  const hasLanded = frame >= impactFrame;

  const bounce = hasLanded
    ? interpolate(
        frame - impactFrame,
        [0, fps * 0.15, fps * 0.35, fps * 0.55, fps * 0.75, fps * 1.0, fps * 1.2, fps * 1.5],
        [0, -120, 0, -50, 0, -15, 0, 0],
        { extrapolateRight: 'clamp' }
      )
    : 0;

  // Squash on each impact
  const squashX = hasLanded
    ? interpolate(
        frame - impactFrame,
        [0, fps * 0.05, fps * 0.15, fps * 0.25, fps * 0.35, fps * 0.45, fps * 0.55, fps * 0.7],
        [1, 1.4, 0.9, 1.2, 0.95, 1.1, 0.98, 1],
        { extrapolateRight: 'clamp' }
      )
    : 1;

  const squashY = hasLanded
    ? interpolate(
        frame - impactFrame,
        [0, fps * 0.05, fps * 0.15, fps * 0.25, fps * 0.35, fps * 0.45, fps * 0.55, fps * 0.7],
        [1, 0.6, 1.1, 0.8, 1.05, 0.9, 1.02, 1],
        { extrapolateRight: 'clamp' }
      )
    : 1;

  // === PHASE 4: Idle (after bounce) ===
  const idleStart = impactFrame + fps * 1.5;
  const breathe = frame > idleStart
    ? interpolate(Math.sin((frame - idleStart) / fps * Math.PI * 0.6), [-1, 1], [0.97, 1.03])
    : 1;

  // === FINAL POSITION ===
  let finalY: number;
  let finalRotation: number;

  if (isSpinning) {
    finalY = centerY + floatY;
    finalRotation = spinRotation + wobble;
  } else if (isFalling) {
    finalY = centerY + fallY;
    finalRotation = fallRotation;
  } else {
    finalY = groundY + bounce;
    finalRotation = 0;
  }

  // === SHADOW ===
  const shadowOpacity = isSpinning
    ? interpolate(Math.sin(frame / fps * Math.PI * 0.8), [-1, 1], [0.03, 0.06])
    : hasLanded
      ? interpolate(frame - impactFrame, [0, fps * 0.3], [0.08, 0.12], { extrapolateRight: 'clamp' })
      : interpolate(fallProgress, [0, 1], [0.04, 0.1]);

  const shadowScale = isSpinning ? 0.5 : interpolate(fallProgress, [0, 1], [0.5, 1], { extrapolateRight: 'clamp' });

  // === SPEED LINES while spinning ===
  const showSpeedLines = isSpinning && frame > fps * 2;
  const speedLineOpacity = showSpeedLines
    ? interpolate(frame, [fps * 2, spinEnd], [0.05, 0.2], { extrapolateRight: 'clamp' })
    : 0;

  // === IMPACT PARTICLES ===
  const showParticles = hasLanded && frame < impactFrame + fps * 0.8;

  // === GROUND LINE ===
  const groundLineOpacity = hasLanded
    ? interpolate(frame - impactFrame, [0, fps * 0.1], [0, 0.5], { extrapolateRight: 'clamp' })
    : 0;

  return (
    <AbsoluteFill style={{ background: '#0A0A0A', fontFamily }}>

      {/* Speed lines / motion blur while spinning */}
      {showSpeedLines && Array.from({ length: 8 }, (_, i) => {
        const angle = (frame * 3 + i * 45) * Math.PI / 180;
        const dist = 180 + Math.sin(frame / fps * 2 + i) * 30;
        const x = width / 2 + Math.cos(angle) * dist;
        const y = centerY + 80 + Math.sin(angle) * dist * 0.4;
        return (
          <div key={i} style={{
            position: 'absolute', left: x, top: y,
            width: 30, height: 2, borderRadius: 1,
            background: '#fff',
            opacity: speedLineOpacity,
            transform: `rotate(${angle * 180 / Math.PI + 90}deg)`,
          }} />
        );
      })}

      {/* Shadow on ground */}
      <div style={{
        position: 'absolute',
        top: groundY + 190,
        left: '50%',
        transform: `translateX(-50%) scaleX(${shadowScale})`,
        width: 200, height: 20,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.1)',
        opacity: shadowOpacity,
        filter: 'blur(12px)',
      }} />

      {/* Byte */}
      <div style={{
        position: 'absolute',
        top: finalY,
        left: '50%',
        transform: `translateX(-50%) rotate(${finalRotation}deg) scaleX(${squashX * (isSpinning ? pulse : breathe)}) scaleY(${squashY * (isSpinning ? pulse : breathe)})`,
        transformOrigin: 'center bottom',
      }}>
        <ByteMascot size={350} equipment={equipment} />
      </div>

      {/* Ground line */}
      <div style={{
        position: 'absolute',
        top: groundY + 190,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 500, height: 2,
        background: `rgba(255,255,255,${groundLineOpacity})`,
        borderRadius: 1,
      }} />

      {/* Impact particles */}
      {showParticles && Array.from({ length: 16 }, (_, i) => {
        const angle = (i / 16) * Math.PI * 2;
        const progress = (frame - impactFrame) / (fps * 0.6);
        const dist = progress * (100 + (i % 4) * 30);
        const x = Math.cos(angle) * dist;
        const y = Math.sin(angle) * dist * 0.3 - progress * 40;
        const opacity = interpolate(progress, [0, 0.3, 1], [1, 0.7, 0], { extrapolateRight: 'clamp' });
        const size = 3 + (i % 4) * 2;

        return (
          <div key={i} style={{
            position: 'absolute',
            top: groundY + 180 + y,
            left: width / 2 + x,
            width: size, height: size, borderRadius: size,
            background: i % 3 === 0 ? '#4ade80' : i % 3 === 1 ? '#fb923c' : '#fff',
            opacity: opacity * 0.7,
          }} />
        );
      })}

      {/* Coduy logo */}
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
