import React from 'react';
import {
  AbsoluteFill, useCurrentFrame, interpolate, useVideoConfig,
  staticFile, Img, Audio,
} from 'remotion';
import { loadFont } from '@remotion/google-fonts/Inter';
import { ByteMascot } from './Byte';

const { fontFamily } = loadFont();
const LOGO_SRC = staticFile('logocoduy.png');

export interface ByteSurfWord { word: string; start: number; end: number; }

export const ByteSurfAnimation: React.FC<{
  equipment?: Record<string, string>;
  durationInFrames: number;
  question?: string;
  audioUrl?: string;
  words?: ByteSurfWord[];
}> = ({ equipment = {}, question = '', audioUrl, words = [] }) => {
  const frame = useCurrentFrame();
  const { fps, height, width } = useVideoConfig();
  const time = frame / fps;

  const byteSize = 220;
  const dodgeX = Math.sin(time * 1.2) * 50 + Math.sin(time * 2.8) * 25;
  const byteX = width / 2 + dodgeX;
  const byteY = height * 0.48;
  const tilt = Math.sin(time * 1.2) * -7;
  const breathe = 1 + Math.sin(time * Math.PI * 0.9) * 0.012;
  const legSwing = Math.sin(time * 3) * 8;

  // === OCEAN WAVES — blue, coming towards camera ===
  const waveRows = Array.from({ length: 20 }, (_, i) => {
    const speed = 2 + (i % 3) * 0.4;
    const rawY = ((time * speed * 80 + i * (height / 10)) % (height + 60)) - 30;
    const perspective = interpolate(rawY, [0, height], [0.15, 1.8], { extrapolateRight: 'clamp' });
    const waveWidth = perspective * width * 0.8;
    const waveAmplitude = perspective * 12;
    const opacity = interpolate(rawY, [-20, height * 0.15, height * 0.85, height], [0, 0.25, 0.15, 0], { extrapolateRight: 'clamp' });
    const xShift = Math.sin(rawY * 0.02 + time * 1.5) * waveAmplitude;
    return { y: rawY, width: waveWidth, opacity, xShift, i };
  });

  // === BIG WAVES — obstacles ===
  const bigWaves = Array.from({ length: 4 }, (_, i) => {
    const speed = 1.8 + (i % 2) * 0.6;
    const rawY = ((time * speed * 90 + i * 380) % (height + 300)) - 150;
    const perspective = interpolate(rawY, [0, height], [0.2, 2], { extrapolateRight: 'clamp' });
    const ox = width * (0.15 + (i * 0.25) % 0.7);
    const wSize = 70 * perspective;
    const opacity = interpolate(rawY, [-100, 50, height * 0.7, height], [0, 0.6, 0.4, 0], { extrapolateRight: 'clamp' });
    return { x: ox, y: rawY, size: wSize, opacity, i };
  });

  // === STARS ===
  const stars = Array.from({ length: 5 }, (_, i) => {
    const speed = 2.2 + (i % 3) * 0.5;
    const rawY = ((time * speed * 85 + i * 310 + 200) % (height + 200)) - 100;
    const perspective = interpolate(rawY, [0, height], [0.3, 1.4], { extrapolateRight: 'clamp' });
    const sx = width * (0.2 + (i * 0.2) % 0.6);
    const opacity = interpolate(rawY, [-50, 80, height - 80, height], [0, 0.9, 0.5, 0], { extrapolateRight: 'clamp' });
    return { x: sx, y: rawY, scale: perspective, opacity, i };
  });

  // === SPRAY ===
  const spray = Array.from({ length: 10 }, (_, i) => {
    const angle = (i / 10) * Math.PI * 0.6 + Math.PI * 0.7;
    const dist = (time * 60 + i * 8) % 35;
    return {
      x: byteX + Math.cos(angle + time * 4) * dist,
      y: byteY + byteSize * 0.65 + Math.abs(Math.sin(angle)) * dist * 0.4,
      opacity: interpolate(dist, [0, 35], [0.5, 0], { extrapolateRight: 'clamp' }),
      size: 2 + (i % 3),
    };
  });

  // === SUBTITLE — above Byte's head ===
  const currentTime = time;
  let subtitle = '';
  if (words.length > 0) {
    const GROUP = 7;
    const si = words.findIndex(w => currentTime >= w.start && currentTime < w.end);
    const idx = si >= 0 ? si : words.findIndex(w => currentTime < w.start) - 1;
    if (idx >= 0) {
      const gs = Math.floor(idx / GROUP) * GROUP;
      const ge = Math.min(gs + GROUP, words.length);
      const gw = words.slice(gs, ge);
      if (currentTime >= gw[0].start && currentTime < gw[ge - gs - 1].end + 0.5) {
        subtitle = gw.map((w, gi) => (gs + gi === idx ? `<b>${w.word}</b>` : w.word)).join(' ');
      }
    }
  }

  const questionOp = interpolate(frame, [0, fps * 0.4, fps * 2.5, fps * 3], [0, 1, 1, 0], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ background: '#050a18', fontFamily, overflow: 'hidden' }}>
      {audioUrl && <Audio src={staticFile(audioUrl)} />}

      {/* Ocean gradient */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        background: 'radial-gradient(ellipse at 50% 15%, rgba(30, 64, 175, 0.2) 0%, rgba(5, 10, 24, 0) 55%)',
      }} />
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%',
        background: 'linear-gradient(180deg, transparent 0%, rgba(14, 47, 115, 0.15) 40%, rgba(30, 64, 175, 0.2) 100%)',
      }} />

      {/* Wave rows — blue horizontal lines rushing towards camera */}
      {waveRows.map(({ y, width: w, opacity, xShift, i }) => (
        <div key={`wr-${i}`} style={{
          position: 'absolute', top: y, left: '50%',
          transform: `translateX(calc(-50% + ${xShift}px))`,
          width: w, height: 1.5,
          background: `rgba(96, 165, 250, ${opacity})`,
          borderRadius: 1,
        }} />
      ))}

      {/* Big waves — blue, coming at you */}
      {bigWaves.map(({ x, y, size, opacity, i }) => (
        <div key={`bw-${i}`} style={{
          position: 'absolute', left: x - size / 2, top: y - size * 0.3,
          width: size, height: size * 0.5,
          borderRadius: '50% 50% 35% 35%',
          background: `rgba(59, 130, 246, ${opacity * 0.2})`,
          border: `1.5px solid rgba(96, 165, 250, ${opacity * 0.3})`,
          boxShadow: `0 0 ${size * 0.3}px rgba(59, 130, 246, ${opacity * 0.1})`,
        }} />
      ))}

      {/* Stars */}
      {stars.map(({ x, y, scale, opacity, i }) => (
        <div key={`s-${i}`} style={{
          position: 'absolute', left: x, top: y,
          fontSize: 16 * scale, opacity,
          filter: `drop-shadow(0 0 4px rgba(250, 204, 21, ${opacity * 0.5}))`,
        }}>⭐</div>
      ))}

      {/* Spray particles */}
      {spray.map(({ x, y, opacity, size }, i) => (
        <div key={`sp-${i}`} style={{
          position: 'absolute', left: x, top: y,
          width: size, height: size, borderRadius: size,
          background: `rgba(147, 197, 253, ${opacity})`,
        }} />
      ))}

      {/* Surfboard — perspective towards camera */}
      <svg style={{ position: 'absolute', left: byteX - 65, top: byteY + byteSize * 0.5 }}
        width={130} height={50} viewBox="0 0 130 50">
        <defs>
          <linearGradient id="surfGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#fb923c" />
          </linearGradient>
        </defs>
        {/* Board shape — wider at front (bottom), narrower at back (top) */}
        <ellipse cx="65" cy="20" rx="60" ry="16" fill="url(#surfGrad)"
          transform={`rotate(${tilt * 0.3} 65 20)`} />
        {/* Fin */}
        <path d="M 65 34 L 60 44 L 70 44 Z" fill="#d97706" opacity="0.6"
          transform={`rotate(${tilt * 0.3} 65 20)`} />
      </svg>

      {/* Byte's LEGS on surfboard */}
      <svg style={{ position: 'absolute', left: byteX - 30, top: byteY + byteSize * 0.35, transform: `rotate(${tilt}deg)` }}
        width={60} height={80} viewBox="0 0 60 80">
        {/* Left leg */}
        <line x1="18" y1="0" x2={14 + legSwing * 0.3} y2="50" stroke="#333" strokeWidth="6" strokeLinecap="round" />
        <circle cx={14 + legSwing * 0.3} cy="52" r="6" fill="#444" /> {/* foot */}
        {/* Right leg */}
        <line x1="42" y1="0" x2={46 - legSwing * 0.3} y2="50" stroke="#333" strokeWidth="6" strokeLinecap="round" />
        <circle cx={46 - legSwing * 0.3} cy="52" r="6" fill="#444" /> {/* foot */}
      </svg>

      {/* Byte character */}
      <div style={{
        position: 'absolute',
        left: byteX - byteSize / 2,
        top: byteY - byteSize * 0.35,
        transform: `rotate(${tilt}deg) scale(${breathe})`,
        transformOrigin: 'center bottom',
      }}>
        <ByteMascot size={byteSize} equipment={equipment} />
      </div>

      {/* Subtitle — ABOVE Byte's head */}
      {subtitle && (
        <div style={{
          position: 'absolute',
          top: byteY - byteSize * 0.55,
          left: 0, right: 0,
          textAlign: 'center', padding: '0 40px',
        }}>
          <div
            style={{
              display: 'inline-block',
              fontSize: 22, fontWeight: 500, color: '#94a3b8',
              lineHeight: 1.5,
              background: 'rgba(5, 10, 24, 0.85)',
              borderRadius: 10, padding: '6px 18px',
              border: '1px solid rgba(96, 165, 250, 0.1)',
            }}
            dangerouslySetInnerHTML={{ __html: subtitle.replace(/<b>/g, '<b style="color:#fff;font-weight:700;">') }}
          />
        </div>
      )}

      {/* Question title */}
      <div style={{
        position: 'absolute', top: height * 0.05, left: 0, right: 0,
        textAlign: 'center', opacity: questionOp, padding: '0 50px',
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#60a5fa', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 10 }}>
          Behind the Scenes
        </div>
        <div style={{ fontSize: 36, fontWeight: 800, color: '#fff', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
          {question}
        </div>
      </div>

      {/* Logo */}
      <div style={{ position: 'absolute', bottom: 32, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
        <Img src={LOGO_SRC} style={{ height: 16, objectFit: 'contain' }} />
      </div>
    </AbsoluteFill>
  );
};
