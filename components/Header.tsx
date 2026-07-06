import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="relative w-full bg-[#efefef] dark:bg-[#0a0f1d] pt-28 pb-14 md:pt-36 md:pb-20 px-6 overflow-hidden transition-colors duration-500">

      {/* Subtle radial gradient decoration */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 50% -10%, rgba(21,82,171,0.08) 0%, transparent 70%)',
        }}
      />

      {/* Decorative circle — top-right */}
      <div
        className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full border border-[#1552ab]/8 dark:border-white/5"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -top-12 -right-12 w-48 h-48 rounded-full border border-[#1552ab]/5 dark:border-white/3"
        aria-hidden="true"
      />

      {/* Decorative circle — bottom-left */}
      <div
        className="pointer-events-none absolute -bottom-16 -left-16 w-56 h-56 rounded-full border border-[#1552ab]/6 dark:border-white/4"
        aria-hidden="true"
      />

      <div className="relative max-w-5xl mx-auto animate-fade-in">

        {/* Event label — top */}
        <p className="text-[9px] sm:text-[10px] font-avenir-bold uppercase tracking-[0.35em] text-[#1552ab]/50 dark:text-white/40 text-center mb-6 transition-colors duration-500">
          10 – 12 November 2026
        </p>

        {/* Main layout: Title + Logos */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12">

          {/* Headline */}
          <div className="text-center md:text-left">
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-[#1552ab] dark:text-white leading-[1.0] tracking-tight transition-colors duration-500">
              European<br />
              Leaders<br className="hidden xs:block" /> Summit
            </h1>
          </div>

          {/* Vertical divider — desktop only */}
          <div className="hidden md:block w-px h-24 bg-gradient-to-b from-transparent via-[#1552ab]/20 dark:via-white/20 to-transparent shrink-0" />

          {/* Logos */}
          <div className="flex items-center gap-5 shrink-0">
            <img
              src="/logo-e21.png"
              alt="21 Europe"
              className="h-16 md:h-20 object-contain dark:invert transition-all"
            />
            <img
              src="/logo-esbs.png"
              alt="Europe Shall Be Saved"
              className="h-16 md:h-20 object-contain dark:invert transition-all"
            />
          </div>
        </div>

        {/* Location badge — bottom */}
        <div className="mt-8 flex justify-center">
          <span className="inline-flex items-center gap-2 border border-[#1552ab]/15 dark:border-white/25 rounded-full px-6 py-2 text-[10px] md:text-xs font-avenir-bold tracking-[0.3em] uppercase text-[#1552ab] dark:text-white bg-white/60 dark:bg-white/10 backdrop-blur-md shadow-sm transition-all">
            Madrid, Spain
          </span>
        </div>
      </div>
    </header>
  );
};

export default Header;
