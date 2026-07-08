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

function wavePath(w: number, y: number, amplitude: number, frequency: number, phase: number): string {
  const pts: string[] = [];
  for (let x = 0; x <= w; x += 4) {
    const py = y + Math.sin((x / w) * Math.PI * frequency + phase) * amplitude;
    pts.push(`${x === 0 ? 'M' : 'L'} ${x} ${py}`);
  }
  return pts.join(' ');
}

const SEA_ITEMS = ['🐠', '🐟', '🐡', '🐚', '🦀', '🪸', '🐙', '🦑', '🐳', '🌊'];

export const ByteSurfAnimation: React.FC<{
  equipment?: Record<string, string>;
  durationInFrames: number;
  question?: string;
  audioUrl?: string;
  words?: ByteSurfWord[];
  questionerDuration?: number;
}> = ({ equipment = {}, question = '', audioUrl, words = [], questionerDuration = 0 }) => {
  const frame = useCurrentFrame();
  const { fps, height, width } = useVideoConfig();
  const time = frame / fps;
  const totalDuration = (words.length > 0 ? words[words.length - 1].end + 2 : 20);

  const byteSize = 220;

  // No shark
  const isSharkPhase = false;
  const sharkProgress = 0;

  // === BYTE POSITION ===
  const dodgeX = isSharkPhase ? 0 : Math.sin(time * 1.2) * 55 + Math.sin(time * 2.8) * 20;
  const byteX = width / 2 + dodgeX;
  const normalByteY = height * 0.48;

  // Jump off surfboard + swim away
  const jumpY = isSharkPhase ? interpolate(sharkProgress, [0, 0.2, 0.5, 1], [0, -80, 30, height * 0.6], { extrapolateRight: 'clamp' }) : 0;
  const swimX = isSharkPhase ? interpolate(sharkProgress, [0.3, 1], [0, width * 0.7], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' }) : 0;
  const byteY = normalByteY + jumpY;
  const tilt = isSharkPhase
    ? interpolate(sharkProgress, [0, 0.2, 0.5, 1], [0, -25, 15, 30], { extrapolateRight: 'clamp' })
    : Math.sin(time * 1.2) * -7;
  const breathe = 1 + Math.sin(time * Math.PI * 0.9) * 0.012;
  const legSwing = Math.sin(time * 3) * 8;
  const byteOpacity = isSharkPhase ? interpolate(sharkProgress, [0.7, 1], [1, 0], { extrapolateRight: 'clamp' }) : 1;

  // Swimming arms
  const armSwing = isSharkPhase && sharkProgress > 0.3 ? Math.sin(time * 12) * 25 : 0;

  // Questioner speaking?
  const isQuestionerSpeaking = questionerDuration > 0 && time > 1 && time < questionerDuration;

  // === SUBTITLE ===
  let subtitle = '';
  if (words.length > 0 && !isSharkPhase) {
    const GROUP = 7;
    const si = words.findIndex(w => time >= w.start && time < w.end);
    const idx = si >= 0 ? si : words.findIndex(w => time < w.start) - 1;
    if (idx >= 0) {
      const gs = Math.floor(idx / GROUP) * GROUP;
      const ge = Math.min(gs + GROUP, words.length);
      const gw = words.slice(gs, ge);
      if (time >= gw[0].start && time < gw[ge - gs - 1].end + 0.5) {
        subtitle = gw.map((w, gi) => (gs + gi === idx ? `<b>${w.word}</b>` : w.word)).join(' ');
      }
    }
  }

  const questionOp = interpolate(frame, [0, fps * 0.4, fps * 3, fps * 3.5], [0, 1, 1, 0], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ background: '#050a18', fontFamily, overflow: 'hidden' }}>
      {audioUrl && <Audio src={staticFile(audioUrl)} />}
      <Audio src={staticFile('sea.wav')} volume={0.08} loop />

      {/* Ocean gradient */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        background: 'radial-gradient(ellipse at 50% 15%, rgba(30, 64, 175, 0.2) 0%, transparent 55%)' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%',
        background: 'linear-gradient(180deg, transparent 0%, rgba(14, 47, 115, 0.15) 40%, rgba(30, 64, 175, 0.2) 100%)' }} />

      {/* Wavy waves */}
      <svg style={{ position: 'absolute', top: 0, left: 0 }} width={width} height={height}>
        {Array.from({ length: 15 }, (_, i) => {
          const speed = 1.5 + (i % 3) * 0.3;
          const rawY = ((time * speed * 70 + i * (height / 8)) % (height + 60)) - 30;
          const perspective = interpolate(rawY, [0, height], [0.15, 1.8], { extrapolateRight: 'clamp' });
          const amplitude = perspective * 15;
          const freq = 3 + (i % 2);
          const opacity = interpolate(rawY, [-20, height * 0.12, height * 0.85, height], [0, 0.3, 0.12, 0], { extrapolateRight: 'clamp' });
          const waveW = perspective * width * 0.85;
          const offsetX = (width - waveW) / 2;
          return <path key={`w-${i}`} d={wavePath(waveW, rawY, amplitude, freq, time * 2 + i * 0.7)}
            fill="none" stroke={`rgba(96, 165, 250, ${opacity})`} strokeWidth={1.5}
            transform={`translate(${offsetX}, 0)`} />;
        })}
      </svg>

      {/* Big wavy obstacles */}
      <svg style={{ position: 'absolute', top: 0, left: 0 }} width={width} height={height}>
        {Array.from({ length: 4 }, (_, i) => {
          const speed = 1.5 + (i % 2) * 0.5;
          const rawY = ((time * speed * 85 + i * 380) % (height + 300)) - 150;
          const perspective = interpolate(rawY, [0, height], [0.2, 2], { extrapolateRight: 'clamp' });
          const wSize = 120 * perspective;
          const ox = width * (0.15 + (i * 0.25) % 0.7);
          const opacity = interpolate(rawY, [-100, 50, height * 0.7, height], [0, 0.5, 0.3, 0], { extrapolateRight: 'clamp' });
          const amp = perspective * 18;
          return <path key={`bw-${i}`}
            d={wavePath(wSize, rawY, amp, 2, time * 3 + i * 1.5) + ` L ${wSize} ${rawY + amp * 2} L 0 ${rawY + amp * 2} Z`}
            fill={`rgba(59, 130, 246, ${opacity * 0.12})`} stroke={`rgba(96, 165, 250, ${opacity * 0.25})`} strokeWidth={1.5}
            transform={`translate(${ox - wSize / 2}, 0)`} />;
        })}
      </svg>

      {/* Sea items — fish, shells, etc. */}
      {Array.from({ length: 7 }, (_, i) => {
        const speed = 2.2 + (i % 3) * 0.5;
        const rawY = ((time * speed * 85 + i * 310 + 200) % (height + 200)) - 100;
        const scale = interpolate(rawY, [0, height], [0.3, 1.4], { extrapolateRight: 'clamp' });
        const sx = width * (0.12 + (i * 0.18) % 0.76);
        const opacity = interpolate(rawY, [-50, 80, height - 80, height], [0, 0.7, 0.4, 0], { extrapolateRight: 'clamp' });
        return <div key={`sea-${i}`} style={{ position: 'absolute', left: sx, top: rawY, fontSize: 18 * scale, opacity }}>{SEA_ITEMS[i % SEA_ITEMS.length]}</div>;
      })}

      {/* Spray */}
      {!isSharkPhase && Array.from({ length: 8 }, (_, i) => {
        const angle = (i / 8) * Math.PI * 0.6 + Math.PI * 0.7;
        const dist = (time * 60 + i * 8) % 35;
        return <div key={`sp-${i}`} style={{
          position: 'absolute', left: byteX + Math.cos(angle + time * 4) * dist,
          top: byteY + byteSize * 0.65 + Math.abs(Math.sin(angle)) * dist * 0.4,
          width: 2 + (i % 3), height: 2 + (i % 3), borderRadius: 10,
          background: `rgba(147, 197, 253, ${interpolate(dist, [0, 35], [0.5, 0], { extrapolateRight: 'clamp' })})`,
        }} />;
      })}

      {/* Surfboard — stays when Byte jumps off */}
      {!isSharkPhase && (
        <svg style={{ position: 'absolute', left: byteX - 65, top: byteY + byteSize * 0.5 }} width={130} height={50} viewBox="0 0 130 50">
          <defs><linearGradient id="sg" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#f59e0b" /><stop offset="100%" stopColor="#fb923c" /></linearGradient></defs>
          <ellipse cx="65" cy="20" rx="60" ry="16" fill="url(#sg)" transform={`rotate(${tilt * 0.3} 65 20)`} />
          <path d="M 65 34 L 60 44 L 70 44 Z" fill="#d97706" opacity="0.6" />
        </svg>
      )}
      {/* Abandoned surfboard floating */}
      {isSharkPhase && (
        <svg style={{ position: 'absolute', left: width / 2 - 65, top: normalByteY + byteSize * 0.5 + Math.sin(time * 2) * 10, opacity: interpolate(sharkProgress, [0.5, 1], [1, 0.3], { extrapolateRight: 'clamp' }) }} width={130} height={50} viewBox="0 0 130 50">
          <defs><linearGradient id="sg2" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#f59e0b" /><stop offset="100%" stopColor="#fb923c" /></linearGradient></defs>
          <ellipse cx="65" cy="20" rx="60" ry="16" fill="url(#sg2)" transform={`rotate(${Math.sin(time * 1.5) * 15} 65 20)`} />
        </svg>
      )}

      {/* Byte's legs — only when on surfboard */}
      {!isSharkPhase && (
        <svg style={{ position: 'absolute', left: byteX - 30, top: byteY + byteSize * 0.35, transform: `rotate(${tilt}deg)` }} width={60} height={80} viewBox="0 0 60 80">
          <line x1="18" y1="0" x2={14 + legSwing * 0.3} y2="50" stroke="#333" strokeWidth="6" strokeLinecap="round" />
          <circle cx={14 + legSwing * 0.3} cy="52" r="6" fill="#444" />
          <line x1="42" y1="0" x2={46 - legSwing * 0.3} y2="50" stroke="#333" strokeWidth="6" strokeLinecap="round" />
          <circle cx={46 - legSwing * 0.3} cy="52" r="6" fill="#444" />
        </svg>
      )}

      {/* Swimming arms — when Byte is swimming away */}
      {isSharkPhase && sharkProgress > 0.3 && (
        <svg style={{ position: 'absolute', left: byteX + swimX - 40, top: byteY - 20, opacity: byteOpacity }} width={80} height={40} viewBox="0 0 80 40">
          <line x1="10" y1="20" x2={10 + armSwing} y2={5} stroke="#333" strokeWidth="5" strokeLinecap="round" />
          <line x1="70" y1="20" x2={70 - armSwing} y2={5} stroke="#333" strokeWidth="5" strokeLinecap="round" />
        </svg>
      )}

      {/* Byte character */}
      <div style={{
        position: 'absolute',
        left: byteX - byteSize / 2 + swimX,
        top: byteY - byteSize * 0.35,
        transform: `rotate(${tilt}deg) scale(${breathe})`,
        transformOrigin: 'center bottom',
        opacity: isQuestionerSpeaking ? 0.3 : byteOpacity,
        transition: isQuestionerSpeaking ? 'opacity 0.5s' : 'none',
      }}>
        <ByteMascot size={byteSize} equipment={equipment} />
      </div>

      {/* === SHARK === */}
      {isSharkPhase && (
        <div style={{
          position: 'absolute',
          left: interpolate(sharkProgress, [0, 0.5, 1], [width + 50, width / 2 + 50, width / 2 - 30], { extrapolateRight: 'clamp' }),
          top: normalByteY - 20 + Math.sin(time * 3) * 15,
          fontSize: interpolate(sharkProgress, [0, 0.5, 1], [40, 70, 90], { extrapolateRight: 'clamp' }),
          transform: 'scaleX(-1)',
          opacity: interpolate(sharkProgress, [0, 0.15], [0, 1], { extrapolateRight: 'clamp' }),
        }}>
          🦈
        </div>
      )}

      {/* Questioner character */}
      {isQuestionerSpeaking && (
        <div style={{ position: 'absolute', left: '50%', top: height * 0.3, transform: 'translateX(-50%)', textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 8,
            background: 'rgba(5, 10, 24, 0.9)', borderRadius: 20, padding: '20px 30px',
            border: '1px solid rgba(96, 165, 250, 0.2)',
          }}>
            <div style={{ fontSize: 48 }}>🤔</div>
            <div style={{ fontSize: 36, fontWeight: 800, color: '#60a5fa' }}>?</div>
          </div>
        </div>
      )}

      {/* Subtitle — ALWAYS same style, above Byte */}
      {subtitle && (
        <div style={{
          position: 'absolute',
          top: isQuestionerSpeaking ? height * 0.62 : byteY - byteSize * 0.55,
          left: 0, right: 0, textAlign: 'center', padding: '0 40px',
        }}>
          <div style={{
            display: 'inline-block', fontSize: 22, fontWeight: 500, color: '#94a3b8',
            lineHeight: 1.5, background: 'rgba(5, 10, 24, 0.85)',
            borderRadius: 10, padding: '6px 18px', border: '1px solid rgba(96, 165, 250, 0.1)',
          }} dangerouslySetInnerHTML={{ __html: subtitle.replace(/<b>/g, '<b style="color:#fff;font-weight:700;">') }} />
        </div>
      )}

      {/* Question title — LOWER, two lines */}
      <div style={{
        position: 'absolute', top: height * 0.18, left: 0, right: 0,
        textAlign: 'center', opacity: questionOp, padding: '0 60px',
      }}>
        <div style={{ fontSize: 40, fontWeight: 800, color: '#fff', lineHeight: 1.2, letterSpacing: '-0.02em', maxWidth: 750, margin: '0 auto' }}>{question}</div>
      </div>

      {/* Logo */}
      <div style={{ position: 'absolute', bottom: 32, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
        <Img src={LOGO_SRC} style={{ height: 16, objectFit: 'contain' }} />
      </div>
    </AbsoluteFill>
  );
};
