/**
 * FieldInfo — Info icon with tooltip explaining what a field means.
 * Usage: <FieldInfo text="Pre-money valuation is the company value before new investment." />
 */
import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface FieldInfoProps {
  text: string;
  /** Optional: 'top' | 'bottom' | 'left' | 'right'. Defaults to 'top'. */
  side?: 'top' | 'bottom' | 'left' | 'right';
  /** Optional: extra class names for the icon wrapper */
  className?: string;
}

export function FieldInfo({ text, side = 'top', className = '' }: FieldInfoProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={`inline-flex items-center justify-center cursor-help text-muted-foreground hover:text-foreground transition-colors ${className}`}
            tabIndex={0}
            aria-label="Field information"
          >
            <Info className="w-3.5 h-3.5" />
          </span>
        </TooltipTrigger>
        <TooltipContent
          side={side}
          className="max-w-[260px] text-xs leading-relaxed"
        >
          {text}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * LabelWithInfo — A label + info icon in one line.
 * Usage: <LabelWithInfo label="Pre-Money Valuation" info="Company value before new investment." />
 */
export function LabelWithInfo({
  label,
  info,
  required,
  side,
}: {
  label: string;
  info: string;
  required?: boolean;
  side?: 'top' | 'bottom' | 'left' | 'right';
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </span>
      <FieldInfo text={info} side={side} />
    </div>
  );
}
