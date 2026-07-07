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

  const groundY = height * 0.58;

  // === Byte starts above screen and falls continuously ===
  // Total fall time: 4 seconds, starts from way above
  const fallEnd = fps * 4;
  const landed = frame >= fallEnd;

  // Fall: starts from above screen (-600), accelerates down to ground
  const fallY = frame < fallEnd
    ? interpolate(
        frame, [0, fallEnd], [-600, groundY],
        { extrapolateRight: 'clamp', easing: (t) => t * t } // gravity
      )
    : groundY;

  // 3D spin while falling — rotateY like a coin
  const rotY = frame < fallEnd
    ? (frame / fps) * 400 // fast spin
    : 0;

  // Slight tilt while falling
  const tilt = frame < fallEnd
    ? Math.sin(frame / fps * Math.PI * 2) * 8
    : 0;

  // === Bounce after landing ===
  const bounce = landed
    ? interpolate(
        frame - fallEnd,
        [0, fps * 0.12, fps * 0.3, fps * 0.5, fps * 0.7, fps * 0.85, fps * 1.0, fps * 1.3],
        [0, -150, 0, -60, 0, -20, 0, 0],
        { extrapolateRight: 'clamp' }
      )
    : 0;

  // Squash on impact
  const squashX = landed
    ? interpolate(
        frame - fallEnd,
        [0, fps * 0.06, fps * 0.18, fps * 0.3, fps * 0.45, fps * 0.6],
        [1, 1.5, 0.85, 1.2, 0.95, 1],
        { extrapolateRight: 'clamp' }
      )
    : 1;

  const squashY = landed
    ? interpolate(
        frame - fallEnd,
        [0, fps * 0.06, fps * 0.18, fps * 0.3, fps * 0.45, fps * 0.6],
        [1, 0.5, 1.15, 0.85, 1.05, 1],
        { extrapolateRight: 'clamp' }
      )
    : 1;

  // Idle breathing after bounce settles
  const idleStart = fallEnd + fps * 1.5;
  const breathe = frame > idleStart
    ? interpolate(Math.sin((frame - idleStart) / fps * Math.PI * 0.6), [-1, 1], [0.97, 1.03])
    : 1;

  const finalY = landed ? groundY + bounce : fallY;

  // === Shadow — grows as Byte approaches ground ===
  const shadowOpacity = frame < fallEnd
    ? interpolate(frame, [0, fallEnd], [0, 0.15], { extrapolateRight: 'clamp' })
    : 0.15;
  const shadowScale = frame < fallEnd
    ? interpolate(frame, [0, fallEnd], [0.1, 1], { extrapolateRight: 'clamp' })
    : 1;

  // === Ground line — appears on impact ===
  const groundOpacity = landed
    ? interpolate(frame - fallEnd, [0, fps * 0.08], [0, 0.5], { extrapolateRight: 'clamp' })
    : 0;

  // === Impact particles ===
  const showParticles = landed && frame < fallEnd + fps * 0.8;

  // === Screen shake on impact ===
  const shake = landed && frame < fallEnd + fps * 0.2
    ? interpolate(frame - fallEnd, [0, fps * 0.05, fps * 0.1, fps * 0.15, fps * 0.2], [0, -8, 6, -3, 0], { extrapolateRight: 'clamp' })
    : 0;

  return (
    <AbsoluteFill style={{ background: '#0A0A0A', fontFamily, transform: `translateY(${shake}px)` }}>

      {/* Shadow on ground */}
      <div style={{
        position: 'absolute',
        top: groundY + 230,
        left: '50%',
        transform: `translateX(-50%) scaleX(${shadowScale})`,
        width: 250, height: 20,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.08)',
        opacity: shadowOpacity,
        filter: 'blur(12px)',
      }} />

      {/* Byte */}
      <div style={{
        position: 'absolute',
        top: finalY,
        left: '50%',
        transform: `translateX(-50%) perspective(800px) rotateY(${rotY}deg) rotate(${tilt}deg) scaleX(${squashX * breathe}) scaleY(${squashY * breathe})`,
        transformOrigin: 'center bottom',
      }}>
        <ByteMascot size={550} equipment={equipment} />
      </div>

      {/* Ground line */}
      <div style={{
        position: 'absolute',
        top: groundY + 235,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 550, height: 3,
        background: `rgba(255,255,255,${groundOpacity})`,
        borderRadius: 2,
      }} />

      {/* Impact particles */}
      {showParticles && Array.from({ length: 18 }, (_, i) => {
        const angle = (i / 18) * Math.PI * 2;
        const progress = (frame - fallEnd) / (fps * 0.6);
        const dist = progress * (100 + (i % 4) * 35);
        const x = Math.cos(angle) * dist;
        const py = Math.sin(angle) * dist * 0.3 - progress * 50;
        const opacity = interpolate(progress, [0, 0.2, 1], [1, 0.6, 0], { extrapolateRight: 'clamp' });
        const size = 4 + (i % 4) * 2;

        return (
          <div key={i} style={{
            position: 'absolute',
            top: groundY + 220 + py,
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
