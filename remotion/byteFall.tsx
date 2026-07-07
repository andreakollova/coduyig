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

  const byteSize = 500;
  const groundLineY = height * 0.75;
  const landY = groundLineY - byteSize;
  const startY = -byteSize - 100;

  // === TIMING ===
  const fallDuration = fps * 6; // 6 seconds of smooth falling
  const landed = frame >= fallDuration;

  // === SMOOTH FALL — ease-in cubic (slow start, smooth acceleration) ===
  const fallProgress = Math.min(frame / fallDuration, 1);
  const easedProgress = fallProgress * fallProgress * fallProgress; // cubic ease-in
  const currentY = landed ? landY : startY + (landY - startY) * easedProgress;

  // === GENTLE CONTINUOUS ROTATION — smooth, not jerky ===
  const rotationSpeed = interpolate(fallProgress, [0, 0.5, 1], [0.5, 1, 2], { extrapolateRight: 'clamp' });
  const rotation = landed ? 0 : frame * rotationSpeed * 3;

  // === WIND STREAKS — thin lines moving upward (feeling of speed) ===
  const windOpacity = interpolate(fallProgress, [0, 0.2, 0.8, 1], [0, 0.03, 0.12, 0.2], { extrapolateRight: 'clamp' });

  // === AFTER LANDING ===
  // Bounce
  const bounceTime = landed ? (frame - fallDuration) / fps : 0;
  const bounce = landed
    ? -140 * Math.exp(-bounceTime * 4) * Math.abs(Math.sin(bounceTime * Math.PI * 3))
    : 0;

  // Squash — only on first impact
  const impactTime = landed ? frame - fallDuration : -1;
  const squashX = impactTime >= 0 && impactTime < fps * 0.4
    ? interpolate(impactTime, [0, fps * 0.05, fps * 0.15, fps * 0.4], [1, 1.4, 0.9, 1], { extrapolateRight: 'clamp' })
    : 1;
  const squashY = impactTime >= 0 && impactTime < fps * 0.4
    ? interpolate(impactTime, [0, fps * 0.05, fps * 0.15, fps * 0.4], [1, 0.6, 1.1, 1], { extrapolateRight: 'clamp' })
    : 1;

  // Idle breathing after settling
  const settled = landed && bounceTime > 1.5;
  const breathe = settled
    ? 1 + Math.sin((frame - fallDuration - fps * 1.5) / fps * Math.PI * 0.6) * 0.02
    : 1;

  // Screen shake on first impact
  const shakeX = impactTime >= 0 && impactTime < fps * 0.3
    ? Math.sin(impactTime * 2.5) * interpolate(impactTime, [0, fps * 0.3], [10, 0], { extrapolateRight: 'clamp' })
    : 0;
  const shakeY = impactTime >= 0 && impactTime < fps * 0.3
    ? Math.cos(impactTime * 3) * interpolate(impactTime, [0, fps * 0.3], [8, 0], { extrapolateRight: 'clamp' })
    : 0;

  // Shadow
  const shadowScale = interpolate(easedProgress, [0, 1], [0.15, 1], { extrapolateRight: 'clamp' });
  const shadowOpacity = interpolate(easedProgress, [0, 1], [0.02, 0.12], { extrapolateRight: 'clamp' });

  // Ground line
  const groundOpacity = landed
    ? interpolate(impactTime, [0, fps * 0.1], [0, 0.4], { extrapolateRight: 'clamp' })
    : 0;

  // Impact dust cloud
  const showDust = landed && impactTime < fps * 1.0;
  const dustProgress = impactTime >= 0 ? impactTime / (fps * 0.8) : 0;

  // Impact particles
  const showParticles = landed && impactTime < fps * 0.6;
  const particleProgress = impactTime >= 0 ? impactTime / (fps * 0.5) : 0;

  const finalY = currentY + bounce;

  return (
    <AbsoluteFill style={{
      background: '#0A0A0A', fontFamily,
      transform: `translate(${shakeX}px, ${shakeY}px)`,
    }}>

      {/* Wind streaks */}
      {!landed && Array.from({ length: 20 }, (_, i) => {
        const x = ((i * 53 + 30) % (width - 60)) + 30;
        const speed = 8 + (i % 5) * 4;
        const streakY = ((frame * speed + i * 97) % (height + 300)) - 150;
        const streakH = interpolate(fallProgress, [0, 1], [20, 80 + (i % 3) * 40], { extrapolateRight: 'clamp' });
        return (
          <div key={`w-${i}`} style={{
            position: 'absolute', left: x, top: streakY,
            width: 1.5, height: streakH, borderRadius: 1,
            background: `rgba(255,255,255,${windOpacity * (0.5 + (i % 3) * 0.25)})`,
          }} />
        );
      })}

      {/* Shadow */}
      <div style={{
        position: 'absolute', top: groundLineY + 2, left: '50%',
        transform: `translateX(-50%) scaleX(${shadowScale}) scaleY(0.3)`,
        width: 300, height: 40, borderRadius: '50%',
        background: 'rgba(255,255,255,0.06)',
        opacity: shadowOpacity, filter: 'blur(15px)',
      }} />

      {/* Byte */}
      <div style={{
        position: 'absolute', top: finalY, left: '50%',
        transform: `translateX(-50%) rotate(${rotation}deg) scaleX(${squashX * breathe}) scaleY(${squashY * breathe})`,
        transformOrigin: 'center bottom',
      }}>
        <ByteMascot size={byteSize} equipment={equipment} />
      </div>

      {/* Ground line */}
      <div style={{
        position: 'absolute', top: groundLineY + 5, left: '50%',
        transform: 'translateX(-50%)',
        width: 500, height: 2,
        background: `rgba(255,255,255,${groundOpacity})`,
        borderRadius: 1,
      }} />

      {/* Dust cloud on impact */}
      {showDust && Array.from({ length: 6 }, (_, i) => {
        const side = i < 3 ? -1 : 1;
        const idx = i % 3;
        const spread = interpolate(dustProgress, [0, 1], [0, 60 + idx * 40], { extrapolateRight: 'clamp' });
        const dustOp = interpolate(dustProgress, [0, 0.1, 0.5, 1], [0, 0.15, 0.08, 0], { extrapolateRight: 'clamp' });
        const dustSize = interpolate(dustProgress, [0, 1], [10, 40 + idx * 15], { extrapolateRight: 'clamp' });
        const dustY = interpolate(dustProgress, [0, 1], [0, -20 - idx * 10], { extrapolateRight: 'clamp' });
        return (
          <div key={`d-${i}`} style={{
            position: 'absolute',
            top: groundLineY - dustSize / 2 + dustY,
            left: width / 2 + side * spread - dustSize / 2,
            width: dustSize, height: dustSize, borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)',
            opacity: dustOp, filter: 'blur(8px)',
          }} />
        );
      })}

      {/* Impact particles */}
      {showParticles && Array.from({ length: 16 }, (_, i) => {
        const angle = (i / 16) * Math.PI * 2;
        const dist = particleProgress * (80 + (i % 4) * 30);
        const x = Math.cos(angle) * dist;
        const py = Math.sin(angle) * dist * 0.25 - particleProgress * 40;
        const pOp = interpolate(particleProgress, [0, 0.15, 1], [0.9, 0.5, 0], { extrapolateRight: 'clamp' });
        const size = 3 + (i % 3) * 2;
        return (
          <div key={`p-${i}`} style={{
            position: 'absolute',
            top: groundLineY - 5 + py,
            left: width / 2 + x,
            width: size, height: size, borderRadius: size,
            background: i % 3 === 0 ? '#4ade80' : i % 3 === 1 ? '#fb923c' : '#fff',
            opacity: pOp * 0.6,
          }} />
        );
      })}

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
