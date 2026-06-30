
import React from 'react';
import { useTranslation } from 'react-i18next';

interface HeaderProps {
  darkMode?: boolean;
}

const Header: React.FC<HeaderProps> = ({ darkMode }) => {
  const { t } = useTranslation();

  return (
    <header className="relative w-full h-[35vh] md:h-[40vh] flex flex-col items-center justify-center overflow-hidden bg-black dark:bg-white transition-colors duration-500 pt-10 md:pt-0">
      {/* Background Image with Overlay */}
      <div
        className="absolute inset-0 z-0 opacity-70"
        style={{
          backgroundImage: 'url("/header-bg.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div className={`absolute inset-0 z-10 bg-gradient-to-b from-transparent ${darkMode ? 'via-white/70 to-white' : 'via-black/70 to-black'}`} />

      {/* Brand Logos (Top Right Slot) */}
      <div className="absolute top-8 right-8 z-20 hidden lg:flex items-center gap-3 bg-white/5 dark:bg-black/5 p-3 rounded-2xl backdrop-blur-md border border-white/10 dark:border-black/5">
        <img src="/logo-e21.png" alt="E21 Logo" className="h-7 w-auto object-contain" />
        <img src="/logo-esbs.png" alt="ESBS Logo" className="h-7 w-auto object-contain" />
      </div>

      {/* Hero Content */}
      <div className="relative z-20 text-center px-4 max-w-4xl flex flex-col items-center">
        <span className="text-[9px] md:text-xs tracking-[0.4em] md:tracking-[0.5em] font-light text-white/80 dark:text-black/80 uppercase mb-3 md:mb-4 animate-fade-in">
          {t('header.tagline', 'EMPOWERED21 + EUROPE SHALL BE SAVED')}
        </span>

        <h1 className="text-2xl sm:text-3xl md:text-6xl font-extrabold text-white dark:text-black uppercase leading-tight mb-4 md:mb-6">
          {t('header.title1', 'ELS RETREAT')} <br />
          <span className="tracking-tighter">{t('header.title2', 'MADRID 2026')}</span>
        </h1>

        <div className="w-16 md:w-24 h-[1px] md:h-[2px] bg-[var(--brand-heaven-gold)] mb-3" />

        <p className="text-[10px] md:text-lg font-normal text-white/90 dark:text-black/90 tracking-[0.2em] md:tracking-widest uppercase">
          10.11.26 – 12.11.26 | Madrid, Spain
        </p>
      </div>
    </header>
  );
};

export default Header;
