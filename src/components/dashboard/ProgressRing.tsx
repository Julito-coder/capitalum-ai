interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  status?: 'success' | 'warning' | 'critical';
}

export const ProgressRing = ({ 
  progress, 
  size = 120, 
  strokeWidth = 8,
  status = 'success'
}: ProgressRingProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  const colors = {
    success: 'stroke-success',
    warning: 'stroke-warning',
    critical: 'stroke-destructive'
  };

  const bgColors = {
    success: 'stroke-success/20',
    warning: 'stroke-warning/20',
    critical: 'stroke-destructive/20'
  };

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className={bgColors[status]}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className={`${colors[status]} transition-all duration-700 ease-out`}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offset
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold">{Math.round(progress)}%</span>
        <span className="text-xs text-muted-foreground">du seuil</span>
      </div>
    </div>
  );
};
