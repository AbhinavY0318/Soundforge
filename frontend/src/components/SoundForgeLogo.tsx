import React from 'react';

interface SoundForgeLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  animated?: boolean;
  className?: string;
}

export const SoundForgeLogo: React.FC<SoundForgeLogoProps> = ({
  size = 'md',
  showText = true,
  animated = false,
  className = '',
}) => {
  const sizeMap = {
    sm: { icon: 24, font: 'text-base', spacing: 'gap-2' },
    md: { icon: 32, font: 'text-xl', spacing: 'gap-2.5' },
    lg: { icon: 44, font: 'text-2xl', spacing: 'gap-3' },
    xl: { icon: 56, font: 'text-3xl', spacing: 'gap-3.5' },
  };

  const { icon, font, spacing } = sizeMap[size];

  return (
    <div className={`flex items-center ${spacing} select-none ${className}`}>
      {/* Geometric Sound Waveform Logo Symbol */}
      <div className="relative flex items-center justify-center">
        <svg
          width={icon}
          height={icon}
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="transition-transform duration-300 hover:scale-105"
        >
          <defs>
            <linearGradient id="sf-grad-1" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#22D3EE" />
              <stop offset="50%" stopColor="#818CF8" />
              <stop offset="100%" stopColor="#A78BFA" />
            </linearGradient>
            <linearGradient id="sf-grad-glow" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#A78BFA" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#22D3EE" stopOpacity="0.2" />
            </linearGradient>
            <filter id="sf-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background hexagonal rounded plate */}
          <rect
            x="2"
            y="2"
            width="36"
            height="36"
            rx="10"
            fill="#121622"
            stroke="url(#sf-grad-1)"
            strokeWidth="1.2"
            strokeOpacity="0.4"
          />

          {/* Sound Wave Equalizer Bars forming a geometric 'S' / Wave */}
          <path
            d="M8 20V20.5"
            stroke="url(#sf-grad-1)"
            strokeWidth="2.5"
            strokeLinecap="round"
            className={animated ? 'animate-equalize-slow origin-center' : ''}
          />
          <path
            d="M13 14V26"
            stroke="url(#sf-grad-1)"
            strokeWidth="2.5"
            strokeLinecap="round"
            className={animated ? 'animate-equalize-fast origin-center' : ''}
          />
          <path
            d="M18 9V31"
            stroke="url(#sf-grad-1)"
            strokeWidth="2.5"
            strokeLinecap="round"
            className={animated ? 'animate-equalize-mid origin-center' : ''}
          />
          <path
            d="M23 12V28"
            stroke="url(#sf-grad-1)"
            strokeWidth="2.5"
            strokeLinecap="round"
            className={animated ? 'animate-equalize-slow origin-center' : ''}
          />
          <path
            d="M28 16V24"
            stroke="url(#sf-grad-1)"
            strokeWidth="2.5"
            strokeLinecap="round"
            className={animated ? 'animate-equalize-fast origin-center' : ''}
          />
          <path
            d="M32 19V21"
            stroke="url(#sf-grad-1)"
            strokeWidth="2.5"
            strokeLinecap="round"
            className={animated ? 'animate-equalize-mid origin-center' : ''}
          />
        </svg>

        {/* Ambient subtle backglow */}
        <div
          className="absolute inset-0 -z-10 rounded-xl bg-accent-violet/20 blur-md pointer-events-none"
          style={{ width: icon, height: icon }}
        />
      </div>

      {/* Brand Wordmark */}
      {showText && (
        <div className="flex flex-col">
          <span className={`font-semibold tracking-tight text-white ${font}`}>
            Sound<span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-violet via-accent-indigo to-accent-cyan">Forge</span>
          </span>
        </div>
      )}
    </div>
  );
};
