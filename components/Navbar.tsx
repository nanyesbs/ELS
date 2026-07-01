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
}

const Navbar: React.FC<NavbarProps> = ({
  viewMode,
  setViewMode,
  isAdminAuthorized,
  viewTab,
  setViewTab
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

 return (
  <nav className="fixed top-0 left-0 right-0 z-[100] bg-[#efefef]/95 backdrop-blur-xl border-b border-[#1552ab]/10">
    <div className="px-4 md:px-8 py-3 max-w-[1400px] mx-auto flex items-center justify-between">
      
      {/* Brand Logo Group */}
      <div className="flex items-center gap-3">
        <div 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 cursor-pointer py-1"
        >
          <img src="/logo-e21.png" alt="21 Europe" className="h-7 object-contain" />
          <img src="/logo-esbs.png" alt="Europe Shall Be Saved" className="h-7 object-contain" />
        </div>
        <span 
          onClick={() => navigate('/')}
          className="text-[9px] md:text-[10px] font-avenir-bold text-[#1552ab] uppercase tracking-[0.2em] md:tracking-[0.3em] cursor-pointer hidden sm:block border-l border-[#1552ab]/20 pl-3"
        >
          {t('nav.tagline', 'ELS | MADRID 2026')}
        </span>
      </div>

      {/* Navigation Items */}
      <div className="flex items-center gap-6">
        <button
          onClick={() => {
            if (setViewTab) {
              setViewTab('directory');
            } else {
              setViewMode('directory');
              navigate('/');
            }
          }}
          className={`text-[10px] font-avenir-bold uppercase flex items-center gap-2 transition-all ${
            (viewTab ? viewTab === 'directory' : viewMode === 'directory') 
              ? 'text-[#1552ab] border-b-2 border-[#1552ab] pb-1' 
              : 'text-[#1552ab]/50 hover:text-[#1552ab]'
          }`}
        >
          <LayoutGrid size={13} /> {t('nav.directory', 'Directory')}
        </button>

        {setViewTab && (
          <button
            onClick={() => setViewTab('map')}
            className={`text-[10px] font-avenir-bold uppercase flex items-center gap-2 transition-all ${
              viewTab === 'map'
                ? 'text-[#1552ab] border-b-2 border-[#1552ab] pb-1'
                : 'text-[#1552ab]/50 hover:text-[#1552ab]'
            }`}
          >
            <MapPin size={13} /> {t('nav.map', 'Map')}
          </button>
        )}

        <button
          onClick={() => navigate('/admin')}
          className={`text-[10px] font-avenir-bold uppercase flex items-center gap-2 transition-all ${
            viewMode === 'admin' 
              ? 'text-[#1552ab] border-b-2 border-[#1552ab] pb-1' 
              : 'text-[#1552ab]/50 hover:text-[#1552ab]'
          }`}
        >
          <Shield size={13} /> {t('nav.admin', 'Admin')}
          {isAdminAuthorized && <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />}
        </button>
      </div>
    </div>
  </nav>
 );
};

export default Navbar;
