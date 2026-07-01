
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="w-full bg-[#efefef] py-10 md:py-14 px-6 md:px-16">
      <div className="max-w-5xl mx-auto flex flex-col items-center md:items-start">

        {/* Title row: text + logos */}
        <div className="flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-10">
          {/* Big title */}
          <h1
            className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-[#1552ab] leading-[1.0] text-center md:text-left"
            style={{ letterSpacing: '-0.02em' }}
          >
            European<br />
            Leaders Summit
          </h1>

          {/* Logos stacked beside title */}
          <div className="flex items-center gap-4 pb-1 flex-shrink-0">
            <img
              src="/logo-e21.png"
              alt="21 Europe"
              className="h-14 md:h-16 object-contain"
            />
            <img
              src="/logo-esbs.png"
              alt="Europe Shall Be Saved"
              className="h-14 md:h-16 object-contain"
            />
          </div>
        </div>

        {/* Date */}
        <p className="mt-4 text-xs md:text-sm font-semibold tracking-[0.35em] uppercase text-[#1552ab]/70 text-center md:text-left">
          10 – 12 November 2026
        </p>

        {/* Location badge */}
        <div className="mt-3">
          <span className="inline-block border border-[#1552ab] rounded-full px-5 py-1.5 text-[10px] md:text-xs font-bold tracking-[0.3em] uppercase text-[#1552ab]">
            Madrid, Spain
          </span>
        </div>

      </div>
    </header>
  );
};

export default Header;
