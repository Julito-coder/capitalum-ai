interface ElioLogoProps {
  variant?: 'full' | 'symbol' | 'wordmark';
  className?: string;
  size?: number;
}

export const ElioLogo = ({ variant = 'full', className = '', size = 40 }: ElioLogoProps) => {
  const Symbol = ({ s = size }: { s?: number }) => (
    <svg width={s} height={s} viewBox="-40 -40 80 88" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M 0,-36 C 20,-36 36,-20 36,0 C 36,16 26,30 14,34 L 22,44 C 16,40 8,36 0,36 C -20,36 -36,20 -36,0 C -36,-20 -20,-36 0,-36 Z"
        fill="hsl(210 53% 23%)"
      />
      <circle cx="10" cy="-8" r="6" fill="hsl(37 55% 51%)" />
      <path
        d="M -12,8 Q 0,18 12,8"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        opacity="0.6"
      />
    </svg>
  );

  if (variant === 'symbol') {
    return <Symbol />;
  }

  if (variant === 'wordmark') {
    return (
      <span
        className={`text-4xl font-extrabold text-primary ${className}`}
        style={{ letterSpacing: '-0.3px' }}
      >
        élio
      </span>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Symbol />
      <span
        className="text-2xl font-extrabold text-primary"
        style={{ letterSpacing: '-0.3px' }}
      >
        élio
      </span>
    </div>
  );
};
