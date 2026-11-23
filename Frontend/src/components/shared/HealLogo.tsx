import React from 'react';

interface HealLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'light' | 'dark'; // light text for dark backgrounds, dark text for light backgrounds
  showSubtitle?: boolean;
}

export default function HealLogo({
  className = '',
  size = 'md',
  variant = 'light',
  showSubtitle = true,
}: HealLogoProps) {
  const dimensions = {
    sm: { iconW: 22, iconH: 28, titleSize: 'text-base', subSize: 'text-[7.5px]' },
    md: { iconW: 28, iconH: 36, titleSize: 'text-xl', subSize: 'text-[9px]' },
    lg: { iconW: 38, iconH: 48, titleSize: 'text-3xl', subSize: 'text-[11px]' },
    xl: { iconW: 52, iconH: 66, titleSize: 'text-5xl', subSize: 'text-[13px]' },
  }[size];

  const textColor = variant === 'light' ? 'text-white' : 'text-[#1E1B18]';
  const subColor = variant === 'light' ? 'text-[#D8C7B8]' : 'text-[#8E6D53]';
  const emblemColor = '#965F36';
  const cutoutBg = variant === 'light' ? '#1E1916' : '#FFFFFF';

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Authentic HEAL Emblem */}
      <svg
        width={dimensions.iconW}
        height={dimensions.iconH}
        viewBox="0 0 34 42"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        {/* Left vertical pill */}
        <rect x="2" y="3" width="7" height="36" rx="3.5" fill={emblemColor} />
        {/* Right vertical pill */}
        <rect x="25" y="3" width="7" height="36" rx="3.5" fill={emblemColor} />
        {/* Center top pill */}
        <path
          d="M13.5 6.5C13.5 4.567 15.067 3 17 3C18.933 3 20.5 4.567 20.5 6.5V16C20.5 17 19 18 17 18C15 18 13.5 17 13.5 16V6.5Z"
          fill={emblemColor}
        />
        {/* Center bottom pill */}
        <path
          d="M13.5 26C13.5 25 15 24 17 24C19 24 20.5 25 20.5 26V35.5C20.5 37.433 18.933 39 17 39C15.067 39 13.5 37.433 13.5 35.5V26Z"
          fill={emblemColor}
        />
        {/* Horizontal cross connection */}
        <rect x="9" y="16.5" width="16" height="9" rx="2" fill={emblemColor} />
        {/* Negative space oval */}
        <ellipse cx="17" cy="21" rx="3.5" ry="3" fill={cutoutBg} />
      </svg>

      {/* Brand Wordmark */}
      <div className="flex flex-col leading-none">
        <span
          className={`font-brand-serif font-bold tracking-tight ${dimensions.titleSize} ${textColor}`}
          style={{ letterSpacing: '0.04em' }}
        >
          HEAL
        </span>
        {showSubtitle && (
          <span
            className={`font-brand-sans font-semibold uppercase tracking-[0.24em] ${dimensions.subSize} ${subColor} mt-1`}
          >
            Aesthetic Clinic
          </span>
        )}
      </div>
    </div>
  );
}
