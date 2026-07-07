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

  const centerY = height * 0.35;
  const groundY = height * 0.65;

  // === PHASE 1: Spinning in center (0 - 5s) ===
  const spinEnd = fps * 5;

  // Simple continuous 360° rotation
  const rotation = frame < spinEnd
    ? (frame / fps) * 360  // one full rotation per second
    : 0;

  // Gentle float
  const floatY = frame < spinEnd
    ? Math.sin(frame / fps * Math.PI) * 15
    : 0;

  // === PHASE 2: Fall down (5s - 6s) ===
  const fallStart = spinEnd;
  const fallEnd = spinEnd + fps * 1;

  const fallProgress = frame >= fallStart && frame < fallEnd
    ? interpolate(frame, [fallStart, fallEnd], [0, 1], { extrapolateRight: 'clamp' })
    : frame >= fallEnd ? 1 : 0;

  // Gravity acceleration
  const fallY = fallProgress * fallProgress * (groundY - centerY);

  // Last rotation while falling
  const fallRotation = frame >= fallStart && frame < fallEnd
    ? interpolate(frame, [fallStart, fallEnd], [0, 180], { extrapolateRight: 'clamp' })
    : 0;

  // === PHASE 3: Bounce (6s - 8s) ===
  const landed = frame >= fallEnd;

  const bounce = landed
    ? interpolate(
        frame - fallEnd,
        [0, fps * 0.12, fps * 0.3, fps * 0.5, fps * 0.7, fps * 0.85, fps * 1.0],
        [0, -100, 0, -35, 0, -10, 0],
        { extrapolateRight: 'clamp' }
      )
    : 0;

  const squashX = landed
    ? interpolate(
        frame - fallEnd,
        [0, fps * 0.06, fps * 0.2, fps * 0.35],
        [1, 1.35, 0.92, 1],
        { extrapolateRight: 'clamp' }
      )
    : 1;

  const squashY = landed
    ? interpolate(
        frame - fallEnd,
        [0, fps * 0.06, fps * 0.2, fps * 0.35],
        [1, 0.65, 1.08, 1],
        { extrapolateRight: 'clamp' }
      )
    : 1;

  // === Position ===
  let y: number;
  let rot: number;

  if (frame < spinEnd) {
    y = centerY + floatY;
    rot = rotation;
  } else if (frame < fallEnd) {
    y = centerY + fallY;
    rot = fallRotation;
  } else {
    y = groundY + bounce;
    rot = 0;
  }

  // === Idle breathing after bounce ===
  const idleStart = fallEnd + fps * 1.2;
  const breathe = frame > idleStart
    ? interpolate(Math.sin((frame - idleStart) / fps * Math.PI * 0.6), [-1, 1], [0.97, 1.03])
    : 1;

  // === Shadow ===
  const shadowOpacity = frame < spinEnd ? 0.04
    : landed ? 0.12
    : interpolate(fallProgress, [0, 1], [0.04, 0.12]);

  const shadowScale = frame < spinEnd ? 0.4
    : interpolate(fallProgress, [0, 1], [0.4, 1], { extrapolateRight: 'clamp' });

  // === Ground line ===
  const groundOpacity = landed
    ? interpolate(frame - fallEnd, [0, fps * 0.1], [0, 0.4], { extrapolateRight: 'clamp' })
    : 0;

  // === Impact particles ===
  const showParticles = landed && frame < fallEnd + fps * 0.7;

  return (
    <AbsoluteFill style={{ background: '#0A0A0A', fontFamily }}>

      {/* Shadow */}
      <div style={{
        position: 'absolute',
        top: groundY + 175,
        left: '50%',
        transform: `translateX(-50%) scaleX(${shadowScale})`,
        width: 180, height: 16,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.08)',
        opacity: shadowOpacity,
        filter: 'blur(10px)',
      }} />

      {/* Byte */}
      <div style={{
        position: 'absolute',
        top: y,
        left: '50%',
        transform: `translateX(-50%) rotate(${rot}deg) scaleX(${squashX * breathe}) scaleY(${squashY * breathe})`,
        transformOrigin: 'center bottom',
      }}>
        <ByteMascot size={350} equipment={equipment} />
      </div>

      {/* Ground line */}
      <div style={{
        position: 'absolute',
        top: groundY + 180,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 450, height: 2,
        background: `rgba(255,255,255,${groundOpacity})`,
        borderRadius: 1,
      }} />

      {/* Impact particles */}
      {showParticles && Array.from({ length: 14 }, (_, i) => {
        const angle = (i / 14) * Math.PI * 2;
        const progress = (frame - fallEnd) / (fps * 0.5);
        const dist = progress * (70 + (i % 3) * 30);
        const x = Math.cos(angle) * dist;
        const py = Math.sin(angle) * dist * 0.3 - progress * 30;
        const opacity = interpolate(progress, [0, 0.3, 1], [0.8, 0.5, 0], { extrapolateRight: 'clamp' });
        const size = 3 + (i % 3) * 2;

        return (
          <div key={i} style={{
            position: 'absolute',
            top: groundY + 170 + py,
            left: width / 2 + x,
            width: size, height: size, borderRadius: size,
            background: i % 3 === 0 ? '#4ade80' : i % 3 === 1 ? '#fb923c' : '#fff',
            opacity: opacity * 0.6,
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
