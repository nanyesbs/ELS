
import React from 'react';
import { useTranslation } from 'react-i18next';

interface HeaderProps {
 darkMode?: boolean;
}

const Header: React.FC<HeaderProps> = ({ darkMode }) => {
 const { t } = useTranslation();

 return (
 <header className="relative w-full h-[35vh] md:h-[40vh] flex flex-col items-center justify-center overflow-hidden bg-[#efefef] pt-10 md:pt-0">
 {/* Background Image with Overlay */}
 <div
 className="absolute inset-0 z-0 opacity-20"
 style={{
 backgroundImage: 'url("/header-bg.png")',
 backgroundSize: 'cover',
 backgroundPosition: 'center',
 }}
 />
 <div className="absolute inset-0 z-10 bg-gradient-to-b from-transparent via-[#efefef]/80 to-[#efefef]" />

 {/* SVG Logo (Top Right Slot) */}
 <div className="absolute top-8 right-8 z-20 hidden lg:block">
 <div className="flex items-center gap-3 bg-[#efefef]/60 backdrop-blur-sm p-2.5 rounded-2xl border border-[#1552ab]/10">
   <img src="/logo-e21.png" alt="21 Europe" className="h-7 object-contain" />
   <img src="/logo-esbs.png" alt="Europe Shall Be Saved" className="h-7 object-contain" />
 </div>
 </div>

 {/* Hero Content */}
 <div className="relative z-20 text-center px-4 max-w-4xl flex flex-col items-center">
 <span className="text-[9px] md:text-xs tracking-[0.4em] md:tracking-[0.5em] font-light text-[#1552ab]/80 uppercase mb-3 md:mb-4 animate-fade-in">
 {t('header.tagline', 'EMPOWERED21 + EUROPE SHALL BE SAVED')}
 </span>

 <h1 className="text-2xl sm:text-3xl md:text-6xl font-extrabold text-[#1552ab] uppercase leading-tight mb-4 md:mb-6">
 {t('header.title1', 'ELS RETREAT')} <br />
 <span className="tracking-tighter">{t('header.title2', 'MADRID 2026')}</span>
 </h1>

 <div className="w-16 md:w-24 h-[1px] md:h-[2px] bg-[var(--brand-heaven-gold)] mb-3" />

 <p className="text-[10px] md:text-lg font-normal text-white/90 text-[#1552ab]/90 tracking-[0.2em] md:tracking-widest uppercase">
 10.11.26 – 12.11.26 | Madrid, Spain
 </p>
 </div>
 </header>
 );
};

export default Header;
