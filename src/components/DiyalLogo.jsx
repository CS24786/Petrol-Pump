import React from 'react';

export default function DiyalLogo({ size = 'default', light = false, showTagline = true, centered = false }) {
  const isLarge = size === 'large';
  const isSmall = size === 'small';

  const imgHeight = isLarge ? 'h-10 sm:h-11' : isSmall ? 'h-6 sm:h-7' : 'h-8 sm:h-9';
  const titleSize = isLarge ? 'text-2xl' : isSmall ? 'text-sm' : 'text-lg';
  const subSize = isLarge ? 'text-[11px]' : isSmall ? 'text-[9px]' : 'text-[10px]';

  return (
    <div className={`flex items-center gap-2.5 ${centered ? 'justify-center' : ''} select-none`}>
      {/* Official Diyal Logo matching Login screen */}
      <img
        src="./logo.png"
        alt="Diyal Logo"
        className={`${imgHeight} w-auto object-contain shrink-0 drop-shadow-sm`}
        onError={(e) => {
          e.target.src = './logo.jpg';
        }}
      />

      {/* Brand Text */}
      <div className="flex flex-col leading-none">
        <span className={`${titleSize} font-black tracking-wider ${light ? 'text-white' : 'text-[#0e2137]'}`}>
          DIYAL
        </span>
        {showTagline && (
          <span className={`${subSize} font-bold tracking-widest uppercase mt-0.5 text-[#c52227]`}>
            FILLING STATION
          </span>
        )}
      </div>
    </div>
  );
}
