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
        className={`text-4xl font-extrabold text-primary ${className}`}
        style={{ letterSpacing: '-0.3px' }}
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
