import elioSymbol from '@/assets/elio-symbol-blue.svg';
import elioHorizontal from '@/assets/elio-logo-horizontal-blue.svg';

interface ElioLogoProps {
  variant?: 'full' | 'symbol' | 'wordmark';
  className?: string;
  size?: number;
}

export const ElioLogo = ({ variant = 'full', className = '', size = 40 }: ElioLogoProps) => {
  if (variant === 'symbol') {
    return (
      <img
        src={elioSymbol}
        alt="Élio"
        width={size}
        height={size * 1.08}
        className={className}
      />
    );
  }

  if (variant === 'wordmark') {
    return (
      <span
        className={`font-bold ${className}`}
        style={{
          fontSize: size * 0.85,
          letterSpacing: '-0.04em',
          background: 'linear-gradient(135deg, #1B3A5C 0%, #2A5580 60%, #C8943E 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        élio
      </span>
    );
  }

  return (
    <img
      src={elioHorizontal}
      alt="Élio"
      className={className}
      style={{ height: `${size}px`, width: 'auto' }}
    />
  );
};
