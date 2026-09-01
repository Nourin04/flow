import React from 'react';
import logoImg from '../assets/logo.png';

interface FlowLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  className?: string;
  variant?: 'dark' | 'light';
}

export const FlowIcon: React.FC<{ className?: string }> = ({ className = 'w-8 h-8' }) => (
  <img 
    src={logoImg} 
    alt="Flow Icon" 
    className={`object-contain ${className}`}
  />
);

export const FlowLogo: React.FC<FlowLogoProps> = ({
  size = 'md',
  showSubtitle = true,
  className = '',
  variant = 'dark'
}) => {
  const iconSize = size === 'sm' ? 'w-7 h-7' : size === 'lg' ? 'w-11 h-11' : 'w-9 h-9';
  const titleSize = size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-3xl' : 'text-2xl';
  const subtitleSize = size === 'sm' ? 'text-[9px]' : size === 'lg' ? 'text-xs' : 'text-[11px]';

  const textColor = variant === 'light' ? 'text-white' : 'text-[#0F172A]';
  const subColor = variant === 'light' ? 'text-slate-300' : 'text-slate-500';
  const dividerColor = variant === 'light' ? 'border-white/20' : 'border-slate-200';

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Uploaded Ribbon F Icon */}
      <FlowIcon className={`${iconSize} shrink-0`} />

      {/* Thin Vertical Line Divider */}
      <div className={`h-8 border-r ${dividerColor}`}></div>

      {/* Brand Text */}
      <div className="flex flex-col justify-center">
        <span className={`font-display font-extrabold tracking-tight leading-none ${titleSize} ${textColor}`}>
          Flow
        </span>
        {showSubtitle && (
          <span className={`font-medium mt-1 tracking-tight ${subtitleSize} ${subColor}`}>
            Your money, <span className="text-violet-600 font-bold">clearly.</span>
          </span>
        )}
      </div>
    </div>
  );
};
