import React from 'react';
import {
  AbsoluteFill, useCurrentFrame, interpolate, useVideoConfig,
  staticFile, Img, Audio,
} from 'remotion';
import { loadFont } from '@remotion/google-fonts/Inter';
import { ByteMascot } from './Byte';

const { fontFamily } = loadFont();
const LOGO_SRC = staticFile('logocoduy.png');

export interface ByteSurfWord {
  word: string;
  start: number;
  end: number;
}

export const ByteSurfAnimation: React.FC<{
  equipment?: Record<string, string>;
  durationInFrames: number;
  question?: string;
  audioUrl?: string;
  words?: ByteSurfWord[];
}> = ({
  equipment = {},
  question = '',
  audioUrl,
  words = [],
}) => {
  const frame = useCurrentFrame();
  const { fps, height, width } = useVideoConfig();
  const time = frame / fps;

  const byteSize = 240;

  // === BYTE POSITION — sways left/right like dodging ===
  const dodgeX = Math.sin(time * 1.3) * 60 + Math.sin(time * 2.7) * 30;
  const byteX = width / 2 + dodgeX;
  const byteY = height * 0.52;
  const tilt = Math.sin(time * 1.3) * -8; // tilts opposite to movement
  const breathe = 1 + Math.sin(time * Math.PI * 0.9) * 0.015;

  // === PERSPECTIVE ROAD LINES — racing towards camera ===
  const roadLines = Array.from({ length: 12 }, (_, i) => {
    const speed = 3 + (i % 3) * 0.5;
    const rawY = ((time * speed * 120 + i * (height / 6)) % (height + 100)) - 50;
    const scale = interpolate(rawY, [0, height], [0.1, 1.5], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
    const opacity = interpolate(rawY, [0, height * 0.3, height * 0.8, height], [0, 0.08, 0.06, 0], { extrapolateRight: 'clamp' });
    const lineWidth = scale * 300;
    return { y: rawY, scale, opacity, lineWidth, i };
  });

  // === OBSTACLES — waves coming from top ===
  const obstacles = Array.from({ length: 5 }, (_, i) => {
    const speed = 2.5 + (i % 2) * 0.8;
    const rawY = ((time * speed * 100 + i * 350) % (height + 200)) - 100;
    const ox = width * (0.2 + (i * 0.17) % 0.6);
    const scale = interpolate(rawY, [0, height], [0.3, 1.8], { extrapolateRight: 'clamp' });
    const opacity = interpolate(rawY, [-50, 100, height - 100, height], [0, 0.5, 0.3, 0], { extrapolateRight: 'clamp' });
    const size = 50 * scale;
    return { x: ox, y: rawY, size, opacity, i };
  });

  // === STARS — collectible items racing towards camera ===
  const stars = Array.from({ length: 6 }, (_, i) => {
    const speed = 2 + (i % 3) * 0.6;
    const rawY = ((time * speed * 90 + i * 280 + 150) % (height + 200)) - 100;
    const sx = width * (0.15 + (i * 0.23) % 0.7);
    const scale = interpolate(rawY, [0, height], [0.3, 1.5], { extrapolateRight: 'clamp' });
    const opacity = interpolate(rawY, [-50, 100, height - 100, height], [0, 0.8, 0.6, 0], { extrapolateRight: 'clamp' });
    return { x: sx, y: rawY, scale, opacity, i };
  });

  // === PARTICLE SPRAY from surfboard ===
  const sprayParticles = Array.from({ length: 8 }, (_, i) => {
    const angle = (i / 8) * Math.PI + Math.PI;
    const dist = (time * 80 + i * 10) % 40;
    const px = byteX + Math.cos(angle + time * 3) * dist;
    const py = byteY + byteSize * 0.4 + Math.sin(angle) * dist * 0.3 + 10;
    const op = interpolate(dist, [0, 40], [0.4, 0], { extrapolateRight: 'clamp' });
    return { x: px, y: py, opacity: op, size: 2 + (i % 3), i };
  });

  // === SUBTITLE ===
  const currentTime = time;
  let subtitle = '';
  if (words.length > 0) {
    const GROUP_SIZE = 7;
    const spokenIdx = words.findIndex(w => currentTime >= w.start && currentTime < w.end);
    const idx = spokenIdx >= 0 ? spokenIdx : words.findIndex(w => currentTime < w.start) - 1;
    if (idx >= 0) {
      const groupStart = Math.floor(idx / GROUP_SIZE) * GROUP_SIZE;
      const groupEnd = Math.min(groupStart + GROUP_SIZE, words.length);
      const groupWords = words.slice(groupStart, groupEnd);
      if (currentTime >= groupWords[0].start && currentTime < groupWords[groupEnd - groupStart - 1].end + 0.5) {
        subtitle = groupWords.map((w, gi) => {
          const absIdx = groupStart + gi;
          return absIdx === idx ? `<b>${w.word}</b>` : w.word;
        }).join(' ');
      }
    }
  }

  // === QUESTION TITLE ===
  const questionOp = interpolate(frame, [0, fps * 0.4, fps * 2.5, fps * 3], [0, 1, 1, 0], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ background: '#0A0A0A', fontFamily, overflow: 'hidden' }}>

      {/* Audio */}
      {audioUrl && <Audio src={staticFile(audioUrl)} />}

      {/* Perspective gradient — water rushing towards camera */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        background: 'radial-gradient(ellipse at 50% 20%, rgba(6, 95, 70, 0.12) 0%, transparent 60%)',
      }} />

      {/* Road/water perspective lines */}
      {roadLines.map(({ y, opacity, lineWidth, i }) => (
        <div key={`road-${i}`} style={{
          position: 'absolute', top: y, left: '50%',
          transform: 'translateX(-50%)',
          width: lineWidth, height: 1,
          background: `rgba(74, 222, 128, ${opacity})`,
          borderRadius: 1,
        }} />
      ))}

      {/* Obstacles — waves coming at camera */}
      {obstacles.map(({ x, y, size, opacity, i }) => (
        <div key={`obs-${i}`} style={{
          position: 'absolute', left: x - size / 2, top: y - size / 2,
          width: size, height: size * 0.6,
          borderRadius: '50% 50% 40% 40%',
          background: `rgba(74, 222, 128, ${opacity * 0.15})`,
          border: `1px solid rgba(74, 222, 128, ${opacity * 0.2})`,
        }} />
      ))}

      {/* Stars racing towards camera */}
      {stars.map(({ x, y, scale, opacity, i }) => (
        <div key={`star-${i}`} style={{
          position: 'absolute', left: x - 10 * scale, top: y - 10 * scale,
          fontSize: 18 * scale, opacity,
        }}>
          ⭐
        </div>
      ))}

      {/* Spray particles behind surfboard */}
      {sprayParticles.map(({ x, y, opacity, size, i }) => (
        <div key={`spray-${i}`} style={{
          position: 'absolute', left: x, top: y,
          width: size, height: size, borderRadius: size,
          background: `rgba(255, 255, 255, ${opacity})`,
        }} />
      ))}

      {/* Surfboard — under Byte */}
      <div style={{
        position: 'absolute',
        left: byteX - 70,
        top: byteY + byteSize * 0.55,
        width: 140, height: 20,
        borderRadius: '50%',
        background: 'linear-gradient(90deg, #f59e0b, #fb923c)',
        transform: `rotate(${tilt * 0.3}deg)`,
        boxShadow: '0 6px 25px rgba(251, 146, 60, 0.35)',
      }} />

      {/* Byte — facing towards camera */}
      <div style={{
        position: 'absolute',
        left: byteX - byteSize / 2,
        top: byteY - byteSize * 0.4,
        transform: `rotate(${tilt}deg) scale(${breathe})`,
        transformOrigin: 'center bottom',
      }}>
        <ByteMascot size={byteSize} equipment={equipment} />
      </div>

      {/* Question title — big at start */}
      <div style={{
        position: 'absolute', top: height * 0.06, left: 0, right: 0,
        textAlign: 'center', opacity: questionOp,
        padding: '0 50px',
      }}>
        <div style={{
          fontSize: 10, fontWeight: 700, color: '#4ade80',
          letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 12,
        }}>
          Behind the Scenes
        </div>
        <div style={{
          fontSize: 38, fontWeight: 800, color: '#fff',
          lineHeight: 1.15, letterSpacing: '-0.02em',
        }}>
          {question}
        </div>
      </div>

      {/* Subtitle */}
      {subtitle && (
        <div style={{
          position: 'absolute', bottom: 100, left: 0, right: 0,
          textAlign: 'center', padding: '0 50px',
        }}>
          <div
            style={{
              display: 'inline-block',
              fontSize: 24, fontWeight: 500, color: '#999',
              lineHeight: 1.6,
              background: 'rgba(0,0,0,0.75)',
              borderRadius: 12, padding: '8px 20px',
            }}
            dangerouslySetInnerHTML={{ __html: subtitle.replace(/<b>/g, '<b style="color:#fff;font-weight:700;">') }}
          />
        </div>
      )}

      {/* Logo */}
      <div style={{
        position: 'absolute', bottom: 36, left: 0, right: 0,
        display: 'flex', justifyContent: 'center',
      }}>
        <Img src={LOGO_SRC} style={{ height: 18, objectFit: 'contain' }} />
      </div>
    </AbsoluteFill>
  );
};
