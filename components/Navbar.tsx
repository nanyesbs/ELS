import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutGrid, Shield, Moon, Sun, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface NavbarProps {
  viewMode: 'directory' | 'admin';
  setViewMode: (mode: 'directory' | 'admin') => void;
  isAdminAuthorized: boolean;
  viewTab?: 'directory' | 'map';
  setViewTab?: (tab: 'directory' | 'map') => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
}

const Navbar: React.FC<NavbarProps> = ({
  viewMode,
  setViewMode,
  isAdminAuthorized,
  viewTab,
  setViewTab,
  darkMode,
  setDarkMode,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const navItemBase =
    'relative flex items-center gap-2 min-h-[44px] px-3 text-[10px] font-avenir-bold uppercase tracking-widest transition-all duration-200';
  const navItemActive =
    'text-[#1552ab] dark:text-white';
  const navItemInactive =
    'text-[#1552ab]/40 dark:text-white/40 hover:text-[#1552ab] dark:hover:text-white';

  const isDirectoryActive = viewTab ? viewTab === 'directory' : viewMode === 'directory';
  const isMapActive = viewTab === 'map';
  const isAdminActive = viewMode === 'admin';

  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] bg-white/70 dark:bg-[#0a0f1d]/75 backdrop-blur-xl border-b border-[#1552ab]/8 dark:border-white/10 shadow-sm transition-colors duration-300">
      <div className="px-4 md:px-8 max-w-[1400px] mx-auto flex items-center justify-between h-14">

        {/* Brand Logo Group */}
        <div
          onClick={() => navigate('/')}
          className="flex items-center gap-3 cursor-pointer py-2 group"
          role="link"
          tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && navigate('/')}
          aria-label="ELS Madrid 2026 — Home"
        >
          <img src="/logo-e21.png" alt="21 Europe" className="h-7 object-contain dark:invert transition-opacity group-hover:opacity-80" />
          <img src="/logo-esbs.png" alt="Europe Shall Be Saved" className="h-7 object-contain dark:invert transition-opacity group-hover:opacity-80" />
          <span className="text-[9px] md:text-[10px] font-avenir-bold text-[#1552ab] dark:text-[#f8fafc] uppercase tracking-[0.25em] md:tracking-[0.3em] hidden sm:block border-l border-[#1552ab]/20 dark:border-white/20 pl-3 group-hover:text-[#1552ab]/70 dark:group-hover:text-white/70 transition-colors">
            {t('nav.tagline', 'ELS | MADRID 2026')}
          </span>
        </div>

        {/* Navigation Items */}
        <div className="flex items-center gap-1">

          {/* Directory */}
          <button
            onClick={() => {
              if (setViewTab) {
                setViewTab('directory');
              } else {
                setViewMode('directory');
                navigate('/');
              }
            }}
            className={`${navItemBase} ${isDirectoryActive ? navItemActive : navItemInactive}`}
            aria-current={isDirectoryActive ? 'page' : undefined}
          >
            <LayoutGrid size={14} />
            <span>{t('nav.directory', 'Directory')}</span>
            {isDirectoryActive && (
              <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-[#1552ab] dark:bg-white rounded-full" />
            )}
          </button>

          {/* Map */}
          {setViewTab && (
            <button
              onClick={() => setViewTab('map')}
              className={`${navItemBase} ${isMapActive ? navItemActive : navItemInactive}`}
              aria-current={isMapActive ? 'page' : undefined}
            >
              <MapPin size={14} />
              <span>{t('nav.map', 'Map')}</span>
              {isMapActive && (
                <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-[#1552ab] dark:bg-white rounded-full" />
              )}
            </button>
          )}

          {/* Admin */}
          <button
            onClick={() => navigate('/admin')}
            className={`${navItemBase} ${isAdminActive ? navItemActive : navItemInactive}`}
            aria-current={isAdminActive ? 'page' : undefined}
          >
            <Shield size={14} />
            <span>{t('nav.admin', 'Admin')}</span>
            {isAdminAuthorized && (
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            )}
            {isAdminActive && (
              <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-[#1552ab] dark:bg-white rounded-full" />
            )}
          </button>

          {/* Divider */}
          <div className="w-px h-5 bg-[#1552ab]/10 dark:bg-white/10 mx-2 shrink-0" />

          {/* Theme Toggle — 44×44 touch target */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="w-11 h-11 flex items-center justify-center text-[#1552ab]/50 dark:text-white/50 hover:text-[#1552ab] dark:hover:text-white hover:bg-[#1552ab]/5 dark:hover:bg-white/5 rounded-full transition-all border border-[#1552ab]/10 dark:border-white/10 shrink-0"
            aria-label={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode
              ? <Sun size={15} strokeWidth={1.75} />
              : <Moon size={15} strokeWidth={1.75} />}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
