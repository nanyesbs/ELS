import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutGrid, Shield, Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface NavbarProps {
    viewMode: 'directory' | 'admin';
    setViewMode: (mode: 'directory' | 'admin') => void;
    darkMode: boolean;
    setDarkMode: (dark: boolean) => void;
    isAdminAuthorized: boolean;
}

const Navbar: React.FC<NavbarProps> = ({
    viewMode,
    setViewMode,
    darkMode,
    setDarkMode,
    isAdminAuthorized
}) => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    return (
        <nav className="fixed top-0 left-0 right-0 z-[100] bg-black/90 dark:bg-white/90 backdrop-blur-xl border-b border-white/10 dark:border-black/5">
            <div className="px-4 md:px-8 py-3 md:py-4 max-w-[1400px] mx-auto flex items-center justify-between">
                
                {/* Brand Logo Slot */}
                <div className="flex items-center gap-3">
                    <div 
                        onClick={() => navigate('/')}
                        className="h-10 px-4 border border-dashed border-white/20 dark:border-black/20 rounded flex items-center justify-center text-[10px] uppercase tracking-widest text-white/40 dark:text-black/40 cursor-pointer hover:border-[#1b52a9] transition-colors"
                    >
                        [ Logo Slot ]
                    </div>
                    <span 
                        onClick={() => navigate('/')}
                        className="text-[9px] md:text-[10px] font-avenir-bold text-white dark:text-black uppercase tracking-[0.2em] md:tracking-[0.3em] cursor-pointer hidden sm:block"
                    >
                        {t('nav.tagline', 'ELS MADRID 2026')}
                    </span>
                </div>

                {/* Navigation Items */}
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => navigate('/')}
                        className={`text-[10px] font-avenir-bold uppercase flex items-center gap-2 transition-all ${
                            viewMode === 'directory' 
                                ? 'text-[#1b52a9]' 
                                : 'text-white/40 dark:text-black/40 hover:text-white dark:hover:text-black'
                        }`}
                    >
                        <LayoutGrid size={14} /> {t('nav.directory', 'Directory')}
                    </button>

                    <button
                        onClick={() => navigate('/admin')}
                        className={`text-[10px] font-avenir-bold uppercase flex items-center gap-2 transition-all ${
                            viewMode === 'admin' 
                                ? 'text-[#1b52a9]' 
                                : 'text-white/40 dark:text-black/40 hover:text-white dark:hover:text-black'
                        }`}
                    >
                        <Shield size={14} /> {t('nav.admin', 'Admin')}
                        {isAdminAuthorized && <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />}
                    </button>

                    <div className="w-[1px] h-4 bg-white/10 dark:bg-black/10 mx-2" />
                    
                    <button 
                        onClick={() => setDarkMode(!darkMode)} 
                        className="text-[#1b52a9] hover:scale-110 active:scale-95 transition-all"
                    >
                        {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
