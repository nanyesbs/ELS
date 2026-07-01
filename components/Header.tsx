
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="w-full bg-[#efefef] py-12 md:py-20 px-6">
      <div className="max-w-5xl mx-auto flex flex-col items-center justify-center">

        {/* Centered content block (Title + Logos side-by-side on desktop) */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10">
          
          {/* Big title - left-aligned relative to itself */}
          <div className="text-left">
            <h1
              className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-[#1552ab] leading-[1.0] tracking-tight"
            >
              European<br />
              Leaders Summit
            </h1>
          </div>

          {/* Logos beside the title */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <img
              src="/logo-e21.png"
              alt="21 Europe"
              className="h-16 md:h-20 object-contain"
            />
            <img
              src="/logo-esbs.png"
              alt="Europe Shall Be Saved"
              className="h-16 md:h-20 object-contain"
            />
          </div>
        </div>

        {/* Date - centered */}
        <p className="mt-6 text-xs md:text-sm font-semibold tracking-[0.35em] uppercase text-[#1552ab]/70 text-center">
          10 - 12 November 2026
        </p>

        {/* Location badge - centered */}
        <div className="mt-4 flex justify-center">
          <span className="inline-block border border-[#1552ab] rounded-full px-6 py-1.5 text-[10px] md:text-xs font-bold tracking-[0.3em] uppercase text-[#1552ab] bg-white/20">
            Madrid, Spain
          </span>
        </div>

      </div>
    </header>
  );
};

export default Header;

