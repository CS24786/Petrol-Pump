import React from 'react';

export default function DiyalLogo({ size = 'default', light = false, showTagline = true, centered = false }) {
  const isLarge = size === 'large';
  const isSmall = size === 'small';

  const iconContainerSize = isLarge ? 'w-11 h-11 rounded-xl p-1' : isSmall ? 'w-6 h-6 rounded-md p-0.5' : 'w-8 h-8 rounded-lg p-0.5';
  const titleSize = isLarge ? 'text-2xl' : isSmall ? 'text-sm' : 'text-lg';
  const subSize = isLarge ? 'text-[11px]' : isSmall ? 'text-[9px]' : 'text-[10px]';

  return (
    <div className={`flex items-center gap-2.5 ${centered ? 'justify-center' : ''}`}>
      {/* Official Diyal Logo from public/logo.jpg */}
      <div className={`${iconContainerSize} bg-white shadow-xs flex items-center justify-center shrink-0 border border-slate-200/80 overflow-hidden`}>
        <img
          src="/logo.jpg"
          alt="Diyal Logo"
          className="w-full h-full object-contain"
          onError={(e) => {
            e.target.src = '/logo.png';
          }}
        />
      </div>

      {/* Brand Text */}
      <div className="flex flex-col leading-none">
        <span className={`${titleSize} font-black tracking-wider ${light ? 'text-white' : 'text-[#102A45]'}`}>
          DIYAL
        </span>
        {showTagline && (
          <span className={`${subSize} font-bold tracking-widest uppercase mt-0.5 ${light ? 'text-red-400' : 'text-[#C32026]'}`}>
            Filling Station
          </span>
        )}
      </div>
    </div>
  );
}
