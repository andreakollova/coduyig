import React from 'react';
import { useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';

interface ByteProps {
  size?: number;
  equipment?: Record<string, string>;
}

export const ByteMascot: React.FC<ByteProps> = ({ size = 400, equipment = {} }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Float animation
  const floatY = interpolate(Math.sin(frame / fps * Math.PI * 0.7), [-1, 1], [-8, 8]);

  // Blink animation (every ~1.5s — frequent blinking)
  const blinkCycle = frame % Math.round(fps * 1.5);
  const blinkPhase = blinkCycle < 6 ? interpolate(blinkCycle, [0, 3, 6], [1, 0.05, 1]) : 1;

  const eyeRy = 9 * blinkPhase;

  // Hat rendering based on equipment
  const hatId = equipment?.hat;
  const isGolden = hatId?.includes('golden');
  const isFire = hatId?.includes('fire');
  const isIce = hatId?.includes('ice');
  const isVoid = hatId?.includes('void');
  const isGalaxy = hatId?.includes('galaxy');

  const hatStroke = isGolden ? '#f5a623' : isFire ? '#ff6030' : isIce ? '#80d0ff' : isVoid ? '#ff3366' : isGalaxy ? '#a855f7' : 'white';
  const hatFill = isGolden ? '#1a1200' : isFire ? '#1a0800' : isIce ? '#001020' : isVoid ? '#0a0010' : isGalaxy ? '#0a0020' : '#111';

  return (
    <div style={{ transform: `translateY(${floatY}px)`, display: 'flex', justifyContent: 'center' }}>
      <svg width={size} height={size} viewBox="0 0 120 130" fill="none">
        {/* Aura glow for epic+ */}
        {(isGolden || isFire || isVoid || isGalaxy) && (
          <ellipse cx="60" cy="75" rx="52" ry="48"
            fill="none" stroke={hatStroke} strokeWidth="1" opacity={0.2}
            style={{ filter: `blur(8px)` }} />
        )}

        {/* Antenna */}
        <circle cx="60" cy="14" r="5" fill="white" opacity={0.9}
          style={{ filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.5))' }} />
        <line x1="60" y1="20" x2="60" y2="32" stroke="#555" strokeWidth="2" strokeLinecap="round" />

        {/* Hat (crown for equipped) */}
        {hatId && (hatId.includes('crown') || hatId.includes('void') || hatId.includes('fire') || hatId.includes('ice') || hatId.includes('galaxy')) && (
          <g style={isGolden || isFire || isVoid || isGalaxy ? { filter: `drop-shadow(0 0 8px ${hatStroke}66)` } : {}}>
            <polygon points="34,50 42,34 50,44 60,28 70,44 78,34 86,50"
              fill={hatFill} stroke={hatStroke} strokeWidth="1.5" />
            <rect x="34" y="48" width="52" height="8" rx="2" fill={hatFill} stroke={hatStroke} strokeWidth="1" />
            {[42, 60, 78].map(x => <circle key={x} cx={x} cy="38" r="3" fill={hatStroke} opacity={0.8} />)}
          </g>
        )}
        {hatId && !hatId.includes('crown') && !hatId.includes('void') && !hatId.includes('fire') && !hatId.includes('ice') && !hatId.includes('galaxy') && (
          <g>
            <ellipse cx="60" cy="40" rx="30" ry="16" fill="#111" stroke="white" strokeWidth="1.5" />
            <rect x="30" y="50" width="60" height="7" rx="3.5" fill="#1a1a1a" stroke="white" strokeWidth="1" />
          </g>
        )}

        {/* Head */}
        <ellipse cx="60" cy="75" rx="40" ry="36" fill="#0d1b2a" stroke="white" strokeWidth="2" />

        {/* Glasses */}
        {equipment?.glasses && (
          <g stroke={equipment.glasses.includes('golden') ? '#f5a623' : equipment.glasses.includes('flame') ? '#ff6030' : equipment.glasses.includes('void') ? '#ff3366' : 'white'}
            strokeWidth="1.8" fill={equipment.glasses.includes('cool') || equipment.glasses.includes('aviator') ? '#111' : 'none'} opacity={0.9}
            style={equipment.glasses.includes('golden') || equipment.glasses.includes('flame') || equipment.glasses.includes('void') ? { filter: `drop-shadow(0 0 6px ${equipment.glasses.includes('golden') ? '#f5a62366' : equipment.glasses.includes('flame') ? '#ff603066' : '#ff336666'})` } : {}}>
            {equipment.glasses.includes('cool') || equipment.glasses.includes('aviator') || equipment.glasses.includes('flame') || equipment.glasses.includes('laser') ? (
              <>
                <rect x="29" y={63} width="28" height="14" rx="4" />
                <rect x="63" y={63} width="28" height="14" rx="4" />
                <line x1="57" y1={70} x2="63" y2={70} />
              </>
            ) : (
              <>
                <circle cx="43" cy={73} r="14" />
                <circle cx="77" cy={73} r="14" />
                <line x1="57" y1={73} x2="63" y2={73} />
              </>
            )}
          </g>
        )}

        {/* Eyes */}
        <ellipse cx="43" cy={73} rx={7} ry={eyeRy} fill="white"
          style={{ filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.6))' }} />
        <ellipse cx="77" cy={73} rx={7} ry={eyeRy} fill="white"
          style={{ filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.6))' }} />

        {/* Smile */}
        <path d="M 47 89 Q 60 99 73 89" stroke="rgba(255,255,255,0.5)" strokeWidth="2.5" strokeLinecap="round" fill="none" />

        {/* Accessory - bowtie */}
        {equipment?.accessory?.includes('bowtie') && (
          <g transform="translate(60, 110)" opacity={0.9}>
            <polygon points="-14,-6 0,0 14,-6 14,6 0,0 -14,6" fill="#111" stroke="white" strokeWidth="1.5" />
            <circle cx="0" cy="0" r="3" fill="white" />
          </g>
        )}
        {equipment?.accessory?.includes('fire-cape') && (
          <g style={{ filter: 'drop-shadow(0 0 8px rgba(255,80,20,0.5))' }}>
            <path d="M30,100 C30,100 35,120 60,125 C85,120 90,100 90,100 L85,115 C85,115 70,128 60,130 C50,128 35,115 35,115 Z"
              fill="#1a0800" stroke="#ff6030" strokeWidth="1.5" />
          </g>
        )}
        {equipment?.accessory?.includes('wings') && (
          <g style={{ filter: 'drop-shadow(0 0 10px rgba(245,158,11,0.5))' }}>
            <path d="M28,85 C20,80 10,90 15,100 C18,95 25,92 30,95 Z" fill="#1a1200" stroke="#f5a623" strokeWidth="1.5" />
            <path d="M92,85 C100,80 110,90 105,100 C102,95 95,92 90,95 Z" fill="#1a1200" stroke="#f5a623" strokeWidth="1.5" />
          </g>
        )}
        {equipment?.accessory?.includes('cosmic') && (
          <g style={{ filter: 'drop-shadow(0 0 12px rgba(168,85,247,0.5))' }}>
            <path d="M28,98 C28,98 35,122 60,128 C85,122 92,98 92,98 L88,118 C88,118 72,132 60,134 C48,132 32,118 32,118 Z"
              fill="#0a0020" stroke="#a855f7" strokeWidth="1.5" />
          </g>
        )}
      </svg>
    </div>
  );
};
