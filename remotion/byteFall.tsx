import React from 'react';
import {
  AbsoluteFill, useCurrentFrame, interpolate, useVideoConfig, spring,
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

  // === PHASE 1: Falling + spinning (0 - 2s) ===
  const fallDuration = fps * 2;
  const landFrame = fallDuration;

  // Y position: starts off screen top, falls to center-bottom
  const groundY = height * 0.55;
  const fallY = interpolate(
    frame,
    [0, landFrame],
    [-400, groundY],
    { extrapolateRight: 'clamp', easing: (t) => t * t } // gravity-like acceleration
  );

  // Rotation: spins while falling
  const fallRotation = interpolate(
    frame,
    [0, landFrame],
    [0, 720], // 2 full rotations
    { extrapolateRight: 'clamp' }
  );

  // === PHASE 2: Impact (2s - 2.5s) ===
  const impactBounce = frame > landFrame
    ? interpolate(
        frame - landFrame,
        [0, fps * 0.1, fps * 0.2, fps * 0.35, fps * 0.5],
        [0, -80, 0, -25, 0],
        { extrapolateRight: 'clamp' }
      )
    : 0;

  // Squash on impact
  const squashX = frame > landFrame
    ? interpolate(
        frame - landFrame,
        [0, fps * 0.05, fps * 0.15, fps * 0.3],
        [1, 1.3, 0.9, 1],
        { extrapolateRight: 'clamp' }
      )
    : 1;

  const squashY = frame > landFrame
    ? interpolate(
        frame - landFrame,
        [0, fps * 0.05, fps * 0.15, fps * 0.3],
        [1, 0.7, 1.1, 1],
        { extrapolateRight: 'clamp' }
      )
    : 1;

  // Stop rotation after landing
  const rotation = frame > landFrame ? 720 : fallRotation;

  // === PHASE 3: Idle breathing (after 2.5s) ===
  const idleStart = landFrame + fps * 0.5;
  const breathe = frame > idleStart
    ? interpolate(Math.sin((frame - idleStart) / fps * Math.PI * 0.6), [-1, 1], [0.97, 1.03])
    : 1;

  // === GROUND LINE — appears on impact ===
  const groundOpacity = frame > landFrame
    ? interpolate(frame - landFrame, [0, fps * 0.1], [0, 0.5], { extrapolateRight: 'clamp' })
    : 0;

  // === IMPACT PARTICLES ===
  const showParticles = frame > landFrame && frame < landFrame + fps * 0.8;

  // === SHADOW — grows as Byte falls ===
  const shadowScale = interpolate(frame, [0, landFrame], [0.2, 1], { extrapolateRight: 'clamp' });
  const shadowOpacity = interpolate(frame, [0, landFrame], [0.05, 0.15], { extrapolateRight: 'clamp' });

  const finalY = frame > landFrame ? groundY + impactBounce : fallY;

  return (
    <AbsoluteFill style={{ background: '#0A0A0A', fontFamily }}>
      {/* Shadow on ground */}
      <div style={{
        position: 'absolute',
        top: groundY + 180,
        left: '50%',
        transform: `translateX(-50%) scaleX(${shadowScale})`,
        width: 200, height: 20,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.08)',
        opacity: shadowOpacity,
        filter: 'blur(10px)',
      }} />

      {/* Byte */}
      <div style={{
        position: 'absolute',
        top: finalY,
        left: '50%',
        transform: `translateX(-50%) rotate(${rotation}deg) scaleX(${squashX * breathe}) scaleY(${squashY * breathe})`,
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
        background: `rgba(255,255,255,${groundOpacity})`,
        borderRadius: 1,
      }} />

      {/* Impact particles */}
      {showParticles && Array.from({ length: 12 }, (_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        const progress = (frame - landFrame) / (fps * 0.6);
        const dist = progress * (80 + Math.random() * 60);
        const x = Math.cos(angle) * dist;
        const y = Math.sin(angle) * dist * 0.4 - progress * 30;
        const opacity = interpolate(progress, [0, 0.3, 1], [1, 0.8, 0], { extrapolateRight: 'clamp' });
        const size = 4 + (i % 3) * 2;

        return (
          <div key={i} style={{
            position: 'absolute',
            top: groundY + 175 + y,
            left: width / 2 + x,
            width: size, height: size, borderRadius: size,
            background: i % 2 === 0 ? '#fff' : '#4ade80',
            opacity: opacity * 0.6,
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
