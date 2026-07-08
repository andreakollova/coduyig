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
  question = 'What happens when you type google.com?',
  audioUrl,
  words = [],
}) => {
  const frame = useCurrentFrame();
  const { fps, height, width } = useVideoConfig();
  const time = frame / fps;

  const byteSize = 260;

  // === WAVE GENERATION ===
  const waveY = (x: number, t: number, amplitude: number, freq: number) =>
    Math.sin(x * freq + t * 2) * amplitude;

  // Byte position — surfing on wave
  const byteX = width * 0.5;
  const baseY = height * 0.55;
  const surfWave = waveY(byteX / width, time, 25, 4);
  const byteY = baseY + surfWave;
  const tilt = Math.sin(time * 2.5) * 6;

  // Breathing
  const breathe = 1 + Math.sin(time * Math.PI * 0.8) * 0.02;

  // === STARS / COLLECTIBLES ===
  const stars = Array.from({ length: 8 }, (_, i) => {
    const sx = ((i * 137 + 80) % (width - 60)) + 30;
    const sy = height * 0.2 + (i * 97) % (height * 0.4);
    const collected = time > (i * 1.8 + 2);
    const pulse = Math.sin(time * 3 + i) * 0.15 + 1;
    return { x: sx, y: sy, collected, pulse, i };
  });

  // === SUBTITLE from word timings ===
  const currentTime = time;
  let subtitle = '';
  if (words.length > 0) {
    const GROUP_SIZE = 8;
    const spokenIdx = words.findIndex(w => currentTime >= w.start && currentTime < w.end);
    const idx = spokenIdx >= 0 ? spokenIdx : words.findIndex(w => currentTime < w.start) - 1;
    if (idx >= 0) {
      const groupStart = Math.floor(idx / GROUP_SIZE) * GROUP_SIZE;
      const groupEnd = Math.min(groupStart + GROUP_SIZE, words.length);
      const groupWords = words.slice(groupStart, groupEnd);
      if (currentTime >= groupWords[0].start && currentTime < groupWords[groupEnd - groupStart - 1].end + 0.5) {
        subtitle = groupWords.map((w, i) => {
          const absIdx = groupStart + i;
          const isActive = absIdx === idx;
          return isActive ? `<b>${w.word}</b>` : w.word;
        }).join(' ');
      }
    }
  }

  // === QUESTION TITLE ===
  const questionOp = interpolate(frame, [0, fps * 0.5, fps * 2, fps * 2.5], [0, 1, 1, 0], { extrapolateRight: 'clamp' });
  const questionScale = interpolate(frame, [0, fps * 0.3], [0.8, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ background: '#0A0A0A', fontFamily, overflow: 'hidden' }}>

      {/* Audio */}
      {audioUrl && <Audio src={staticFile(audioUrl)} />}

      {/* Ocean gradient background */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%',
        background: 'linear-gradient(180deg, transparent 0%, rgba(6, 95, 70, 0.15) 50%, rgba(6, 95, 70, 0.25) 100%)',
      }} />

      {/* Waves — multiple layers */}
      {[0, 1, 2].map(layer => {
        const amp = 20 + layer * 10;
        const freq = 3 + layer * 0.5;
        const speed = 1.5 + layer * 0.3;
        const opacity = 0.08 - layer * 0.02;
        const yOffset = height * 0.6 + layer * 40;

        return (
          <svg key={layer} style={{ position: 'absolute', top: 0, left: 0 }} width={width} height={height}>
            <path
              d={`M 0 ${yOffset} ` +
                Array.from({ length: 50 }, (_, i) => {
                  const x = (i / 49) * width;
                  const y = yOffset + waveY(x / width, time * speed, amp, freq);
                  return `L ${x} ${y}`;
                }).join(' ') +
                ` L ${width} ${height} L 0 ${height} Z`}
              fill={`rgba(74, 222, 128, ${opacity})`}
            />
          </svg>
        );
      })}

      {/* Stars / collectibles */}
      {stars.map(({ x, y, collected, pulse, i }) => (
        <div key={i} style={{
          position: 'absolute', left: x - 12, top: y - 12,
          fontSize: 20, transform: `scale(${collected ? 0 : pulse})`,
          opacity: collected ? 0 : 0.7,
          transition: 'transform 0.3s, opacity 0.3s',
        }}>
          ⭐
        </div>
      ))}

      {/* Big waves / obstacles */}
      {[0, 1, 2].map(i => {
        const waveX = ((time * 80 + i * 400) % (width + 200)) - 100;
        const waveHeight = 60 + (i % 2) * 30;
        return (
          <div key={`wave-${i}`} style={{
            position: 'absolute',
            left: waveX,
            top: height * 0.52 - waveHeight / 2 + Math.sin(time * 1.5 + i * 2) * 15,
            width: waveHeight * 1.5,
            height: waveHeight,
            borderRadius: '50% 50% 0 0',
            background: `rgba(74, 222, 128, ${0.06 + (i % 2) * 0.03})`,
            border: '1px solid rgba(74, 222, 128, 0.08)',
          }} />
        );
      })}

      {/* Question title — appears at start */}
      <div style={{
        position: 'absolute', top: height * 0.08, left: 0, right: 0,
        textAlign: 'center', opacity: questionOp,
        transform: `scale(${questionScale})`,
        padding: '0 60px',
      }}>
        <div style={{
          fontSize: 11, fontWeight: 700, color: '#4ade80',
          letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 14,
        }}>
          Behind the Scenes
        </div>
        <div style={{
          fontSize: 42, fontWeight: 800, color: '#fff',
          lineHeight: 1.15, letterSpacing: '-0.02em',
        }}>
          {question}
        </div>
      </div>

      {/* Surfboard */}
      <div style={{
        position: 'absolute',
        left: byteX - 80,
        top: byteY + byteSize - 30,
        width: 160,
        height: 16,
        borderRadius: '50%',
        background: 'linear-gradient(90deg, #f59e0b, #fb923c)',
        transform: `rotate(${tilt * 0.5}deg)`,
        boxShadow: '0 4px 20px rgba(251, 146, 60, 0.3)',
      }} />

      {/* Byte character */}
      <div style={{
        position: 'absolute',
        left: byteX - byteSize / 2,
        top: byteY - byteSize * 0.3,
        transform: `rotate(${tilt}deg) scale(${breathe})`,
        transformOrigin: 'center bottom',
      }}>
        <ByteMascot size={byteSize} equipment={equipment} />
      </div>

      {/* Subtitle */}
      {subtitle && (
        <div style={{
          position: 'absolute', bottom: 120, left: 0, right: 0,
          textAlign: 'center', padding: '0 60px',
        }}>
          <div
            style={{
              display: 'inline-block',
              fontSize: 26, fontWeight: 500, color: '#aaa',
              lineHeight: 1.6,
              background: 'rgba(0,0,0,0.7)',
              borderRadius: 12,
              padding: '10px 24px',
            }}
            dangerouslySetInnerHTML={{ __html: subtitle.replace(/<b>/g, '<b style="color:#fff;font-weight:700;">') }}
          />
        </div>
      )}

      {/* Logo */}
      <div style={{
        position: 'absolute', bottom: 40, left: 0, right: 0,
        display: 'flex', justifyContent: 'center',
      }}>
        <Img src={LOGO_SRC} style={{ height: 20, objectFit: 'contain' }} />
      </div>
    </AbsoluteFill>
  );
};
