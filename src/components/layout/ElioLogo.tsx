import elioSymbol from '@/assets/elio-symbol-blue.svg';
import elioHorizontal from '@/assets/elio-logo-horizontal-blue.svg';

interface ElioLogoProps {
  variant?: 'full' | 'symbol' | 'wordmark' | 'compact' | 'favicon';
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

  // Compact: symbole + wordmark serrés, optimisé mobile / header dense
  if (variant === 'compact') {
    return (
      <span className={`inline-flex items-center gap-1.5 ${className}`}>
        <img
          src={elioSymbol}
          alt="Élio"
          width={size}
          height={size * 1.08}
          style={{ flexShrink: 0 }}
        />
        <span
          className="font-bold leading-none"
          style={{
            fontSize: size * 0.62,
            letterSpacing: '-0.04em',
            background: 'linear-gradient(135deg, #1B3A5C 0%, #2A5580 60%, #C8943E 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          élio
        </span>
      </span>
    );
  }

  // Favicon: SVG inline ultra-lisible à très petite taille (16/32px)
  // Aplatissements: pas de dégradé fin, contraste max, glyphe épais
  if (variant === 'favicon') {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 64 64"
        width={size}
        height={size}
        className={className}
        aria-label="Élio"
      >
        <path
          d="M32 2C12 2 2 12 2 32s10 30 30 30 30-10 30-30S52 2 32 2Z"
          fill="#1B3A5C"
        />
        <circle cx="32.5" cy="13" r="3.4" fill="#C8943E" />
        <path
          d="M42 28c0-5.4-4.3-9.2-10-9.2-6.6 0-11.2 4.8-11.2 11.4 0 6.9 4.9 11.4 11.9 11.4 3.7 0 6.8-1.1 9.1-3l-2.8-3.9c-1.7 1.3-3.7 2-5.9 2-3.4 0-5.9-1.8-6.5-4.8H41.8c.1-.7.2-1.5.2-2.4Zm-15.4-2c.6-2.7 2.6-4.4 5.3-4.4 2.6 0 4.6 1.7 4.9 4.4H26.6Z"
          fill="#FAFAF7"
        />
      </svg>
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
