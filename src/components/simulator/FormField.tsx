import { ReactNode } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { FieldTooltip, FieldTooltipData } from './FieldTooltip';
import { cn } from '@/lib/utils';

interface FormFieldProps {
  label: string;
  tooltip?: FieldTooltipData;
  children?: ReactNode;
  className?: string;
  description?: string;
  error?: string;
  required?: boolean;
}

export const FormField = ({ 
  label, 
  tooltip, 
  children, 
  className,
  description,
  error,
  required 
}: FormFieldProps) => {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center gap-1.5">
        <Label className={cn(error && "text-destructive")}>
          {label}
          {required && <span className="text-destructive ml-0.5">*</span>}
        </Label>
        {tooltip && <FieldTooltip data={tooltip} />}
      </div>
      {children}
      {description && !error && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
};

// Numeric input with formatting
interface NumericInputProps {
  value: number;
  onChange: (value: number) => void;
  suffix?: string;
  prefix?: string;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const NumericInput = ({
  value,
  onChange,
  suffix,
  prefix,
  min,
  max,
  step = 1,
  placeholder,
  disabled,
  className
}: NumericInputProps) => {
  return (
    <div className="relative">
      {prefix && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
          {prefix}
        </span>
      )}
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          prefix && "pl-8",
          suffix && "pr-10",
          className
        )}
      />
      {suffix && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
          {suffix}
        </span>
      )}
    </div>
  );
};

// Switch with label inline
interface SwitchFieldProps {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  tooltip?: FieldTooltipData;
  description?: string;
}

import { Switch } from '@/components/ui/switch';

export const SwitchField = ({
  label,
  checked,
  onCheckedChange,
  tooltip,
  description
}: SwitchFieldProps) => {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
      <div className="flex items-center gap-2">
        <Label className="cursor-pointer">{label}</Label>
        {tooltip && <FieldTooltip data={tooltip} />}
        {description && (
          <span className="text-xs text-muted-foreground">({description})</span>
        )}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
};

// Percentage/Amount toggle input
interface PercentOrAmountInputProps {
  mode: 'percentage' | 'amount';
  onModeChange: (mode: 'percentage' | 'amount') => void;
  value: number;
  onChange: (value: number) => void;
  baseAmount?: number; // For calculating between modes
  label: string;
  tooltip?: FieldTooltipData;
}

export const PercentOrAmountInput = ({
  mode,
  onModeChange,
  value,
  onChange,
  baseAmount,
  label,
  tooltip
}: PercentOrAmountInputProps) => {
  const toggleMode = () => {
    const newMode = mode === 'percentage' ? 'amount' : 'percentage';
    if (baseAmount) {
      if (newMode === 'amount') {
        onChange(Math.round(baseAmount * (value / 100)));
      } else {
        onChange(baseAmount > 0 ? Math.round((value / baseAmount) * 100 * 100) / 100 : 0);
      }
    }
    onModeChange(newMode);
  };

  return (
    <FormField label={label} tooltip={tooltip}>
      <div className="flex gap-2">
        <Input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          step={mode === 'percentage' ? 0.1 : 100}
          className="flex-1"
        />
        <button
          type="button"
          onClick={toggleMode}
          className="px-3 py-2 text-sm font-medium rounded-md border bg-muted hover:bg-muted/80 transition-colors min-w-[50px]"
        >
          {mode === 'percentage' ? '%' : '€'}
        </button>
      </div>
    </FormField>
  );
};
