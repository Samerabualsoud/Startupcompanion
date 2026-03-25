/**
 * Unified Polaris Logo Component
 * 
 * Renders the Polaris star logo in various contexts:
 * - header: Top navigation bar (compact)
 * - footer: Footer area (with text)
 * - sidebar: Sidebar navigation (icon only or with text)
 * - landing: Landing page hero (large)
 * - icon: Standalone icon
 */

import React from 'react';
import { Star } from 'lucide-react';

interface PolarisLogoProps {
  variant?: 'header' | 'footer' | 'sidebar' | 'landing' | 'icon';
  showText?: boolean;
  className?: string;
  onClick?: () => void;
}

export function PolarisLogo({
  variant = 'header',
  showText = true,
  className = '',
  onClick,
}: PolarisLogoProps) {
  const baseStyles = 'flex items-center gap-2 transition-all';

  // Size configurations for each variant
  const sizeConfig = {
    header: {
      iconSize: 'w-6 h-6',
      textSize: 'text-sm',
      containerClass: 'gap-2',
    },
    footer: {
      iconSize: 'w-5 h-5',
      textSize: 'text-base',
      containerClass: 'gap-2',
    },
    sidebar: {
      iconSize: 'w-7 h-7',
      textSize: 'text-sm',
      containerClass: 'gap-3',
    },
    landing: {
      iconSize: 'w-12 h-12',
      textSize: 'text-2xl',
      containerClass: 'gap-3',
    },
    icon: {
      iconSize: 'w-8 h-8',
      textSize: 'text-base',
      containerClass: 'gap-0',
    },
  };

  const config = sizeConfig[variant];

  // Color gradients for each variant
  const gradientId = `polaris-gradient-${variant}`;
  const gradientColors = {
    header: 'from-orange-500 to-indigo-600',
    footer: 'from-orange-500 to-indigo-600',
    sidebar: 'from-orange-500 to-indigo-600',
    landing: 'from-orange-500 to-indigo-600',
    icon: 'from-orange-500 to-indigo-600',
  };

  return (
    <div
      className={`${baseStyles} ${config.containerClass} ${className}`}
      onClick={onClick}
      style={onClick ? { cursor: 'pointer' } : {}}
    >
      {/* Star Icon with Gradient Background */}
      <div
        className={`${config.iconSize} rounded-lg flex items-center justify-center shrink-0 bg-gradient-to-br ${gradientColors[variant]}`}
      >
        <Star className="w-2/3 h-2/3 text-white fill-white" />
      </div>

      {/* Text Label (optional) */}
      {showText && variant !== 'icon' && (
        <div className="flex flex-col leading-tight">
          <span className={`font-extrabold text-foreground ${config.textSize}`}>
            Polaris
          </span>
          {variant === 'landing' && (
            <span className="text-xs text-muted-foreground font-medium">
              Arabia
            </span>
          )}
          {variant === 'footer' && (
            <span className="text-xs text-muted-foreground font-medium">
              Arabia
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Compact version for header/navigation
 */
export function PolarisLogoCompact({ onClick, className = '' }: { onClick?: () => void; className?: string }) {
  return (
    <PolarisLogo
      variant="header"
      showText={false}
      onClick={onClick}
      className={className}
    />
  );
}

/**
 * Full version with text for branding
 */
export function PolarisLogoBrand({ onClick, className = '' }: { onClick?: () => void; className?: string }) {
  return (
    <PolarisLogo
      variant="landing"
      showText={true}
      onClick={onClick}
      className={className}
    />
  );
}

/**
 * Footer version
 */
export function PolarisLogoFooter({ className = '' }: { className?: string }) {
  return (
    <PolarisLogo
      variant="footer"
      showText={true}
      className={className}
    />
  );
}

/**
 * Sidebar version
 */
export function PolarisLogoSidebar({ className = '' }: { className?: string }) {
  return (
    <PolarisLogo
      variant="sidebar"
      showText={true}
      className={className}
    />
  );
}

export default PolarisLogo;
