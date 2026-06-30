import React, { useState, useEffect, createContext, useContext } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useParams,
} from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { useTranslation } from 'react-i18next';
import {
  Loader2, Search, RefreshCcw, LayoutGrid, Columns,
  Square, Filter, X, Shield, LogOut, ArrowRight,
  CheckCircle2, Mail, Edit3, Eye, EyeOff,
} from 'lucide-react';

import Navbar from './components/Navbar';
import Header from './components/Header';
import ParticipantCard from './components/ParticipantCard';
import ProfileModal from './components/ProfileModal';
import AdminConsole from './components/AdminConsole';
import RegistrationForm from './components/RegistrationForm';
import { Participant, LayoutMode } from './types';
import { api } from './services/api';
import { supabase } from './services/supabase';

// ─────────────────────────────────────────────
//  SESSION CONTEXT
//  Holds the raw token + participant record.
//  Token stored in sessionStorage (clears on tab close).
//  On reload, the token is read from sessionStorage and re-validated
//  server-side against the DB — client state is never trusted alone.
// ─────────────────────────────────────────────
interface SessionContextType {
  token: string | null;
  participant: Participant | null;
  setSession: (token: string, participant: Participant) => void;
  clearSession: () => void;
  refreshParticipant: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType>({
  token: null,
  participant: null,
  setSession: () => {},
  clearSession: () => {},
  refreshParticipant: async () => {},
});

const useSession = () => useContext(SessionContext);
const SESSION_KEY = 'els_session_token';

// ─────────────────────────────────────────────
//  ROUTE LIST (final, simplified)
//  /              → Landing page (public)
//  /sign-up       → Native registration form (public, rate-limited)
//  /:token        → Participant view — token validated server-side on every load.
//                   Shows directory + "Edit my Bio" if valid.
//                   Shows error state if invalid/expired.
//  /admin/login   → Supabase Auth email+password (admin only)
//  /admin         → Admin console (admin session required)
//  *              → Redirect to /
// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
//  SCREEN A: Landing Page (/)
// ─────────────────────────────────────────────
const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <nav className="w-full px-6 md:px-12 py-6 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#1b52a9]/20 border border-[#1b52a9]/30 flex items-center justify-center text-[#1b52a9] text-xs font-bold">E</div>
          <span className="text-xs font-avenir-bold uppercase tracking-[3px] text-white/60">ELS Madrid 2026</span>
        </div>
        <button
          onClick={() => navigate('/admin/login')}
          className="text-[10px] font-avenir-bold uppercase tracking-widest text-white/30 hover:text-white/60 transition-colors flex items-center gap-1.5"
        >
          <Shield size={12} /> Admin
        </button>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#1b52a9]/10 border border-[#1b52a9]/20 rounded-full mb-10">
          <span className="w-1.5 h-1.5 rounded-full bg-[#1b52a9] animate-pulse" />
          <span className="text-[10px] font-avenir-bold uppercase tracking-[3px] text-[#1b52a9]">
            10–12 November 2026 · Madrid, Spain
          </span>
        </div>

        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold uppercase tracking-tight text-white max-w-4xl leading-none mb-6">
          Europe Shall<br />Be Saved
        </h1>

        <p className="text-base md:text-lg text-white/50 max-w-xl leading-relaxed mb-12">
          The ELS Retreat participant directory — connect with leaders, ministers,
          and change-makers gathering in Madrid this November.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <button
            onClick={() => navigate('/sign-up')}
            className="flex items-center gap-3 px-8 py-5 bg-[#1b52a9] hover:bg-[#1b52a9]/90 text-white rounded-2xl font-avenir-bold uppercase text-xs tracking-[3px] transition-all hover:scale-105 active:scale-95 shadow-lg"
          >
            Join the Directory <ArrowRight size={16} />
          </button>
          <p className="text-[10px] text-white/30 font-avenir-medium uppercase tracking-wider">
            Already registered?{' '}
            <span className="text-white/50">Check your email for your personal link.</span>
          </p>
        </div>
      </main>

      <footer className="border-t border-white/5 py-8 text-center">
        <p className="text-[10px] text-white/20 font-avenir-medium uppercase tracking-widest">
          Empowered21 + Europe Shall Be Saved · Global Church
        </p>
      </footer>
    </div>
  );
};

// ─────────────────────────────────────────────
//  SCREEN B: Sign-Up (/sign-up)
// ─────────────────────────────────────────────
const SignUpPage: React.FC = () => {
  const navigate = useNavigate();
  const { setSession } = useSession();

  const handleSignupComplete = async (token?: string) => {
    if (token) {
      const p = await api.getParticipantByToken(token);
      if (p) {
        setSession(token, p);
        navigate(`/${token}`);
      } else {
        navigate('/');
      }
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-black dark:bg-white text-white dark:text-black py-20 md:py-32 px-4 animate-fade-in">
      <div className="max-w-3xl mx-auto mb-8">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-[10px] font-avenir-bold uppercase tracking-widest text-white/40 dark:text-black/40 hover:text-[#1b52a9] transition-colors"
        >
          ← Back
        </button>
      </div>
      <RegistrationForm
        mode="signup"
        onComplete={handleSignupComplete}
      />
    </div>
  );
};

// ─────────────────────────────────────────────
//  SCREEN C: Token View (/:token)
//  The token IS the route. Validated server-side on every load.
//  Never trusts sessionStorage alone — always re-validates against DB.
// ─────────────────────────────────────────────
const TokenPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { setSession } = useSession();
  const { t } = useTranslation();

  const [loadStatus, setLoadStatus] = useState<'loading' | 'valid' | 'invalid'>('loading');
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);

  // Public directory state
  const [publicList, setPublicList] = useState<Omit<Participant, 'email' | 'phone'>[]>([]);
  const [dirLoading, setDirLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<Participant | null>(null);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>(
    () => (localStorage.getItem('els_layout') as LayoutMode) || 'grid4'
  );
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('els_theme') === 'dark');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterCountry, setFilterCountry] = useState('ALL');
  const [filterRole, setFilterRole] = useState('ALL');

  // ── Server-side token validation ──────────────────────────────
  // Every load hits the DB. No client state is trusted.
  useEffect(() => {
    if (!token) { setLoadStatus('invalid'); return; }

    const validate = async () => {
      const p = await api.getParticipantByToken(token);
      if (!p) {
        setLoadStatus('invalid');
        return;
      }
      setParticipant(p);
      setSession(token, p);
      setLoadStatus('valid');
      loadDirectory();
    };

    validate();
  }, [token]);

  useEffect(() => { localStorage.setItem('els_layout', layoutMode); }, [layoutMode]);
  useEffect(() => {
    if (darkMode) { document.documentElement.classList.add('dark'); localStorage.setItem('els_theme', 'dark'); }
    else { document.documentElement.classList.remove('dark'); localStorage.setItem('els_theme', 'light'); }
  }, [darkMode]);

  const loadDirectory = async () => {
    setDirLoading(true);
    const data = await api.getPublicParticipants();
    setPublicList(data);
    setDirLoading(false);
  };

  const handleBioSaved = async () => {
    // Re-validate token to get updated participant data
    if (!token) return;
    const updated = await api.getParticipantByToken(token);
    if (updated) {
      setParticipant(updated);
      setSession(token, updated);
    }
    setShowEditForm(false);
    loadDirectory();
  };

  const countriesList = React.useMemo(() => {
    const s = new Set<string>();
    publicList.forEach(p => p.country && s.add(p.country));
    return Array.from(s).sort();
  }, [publicList]);

  const rolesList = React.useMemo(() => {
    const s = new Set<string>();
    publicList.forEach(p => p.role && s.add(p.role));
    return Array.from(s).sort();
  }, [publicList]);

  const filtered = React.useMemo(() => {
    return publicList.filter(p => {
      const q = searchQuery.toLowerCase().trim();
      const matchQ = !q ||
        (p.name || '').toLowerCase().includes(q) ||
        (p.organization || '').toLowerCase().includes(q) ||
        (p.role || '').toLowerCase().includes(q);
      return matchQ &&
        (filterCountry === 'ALL' || p.country === filterCountry) &&
        (filterRole === 'ALL' || p.role === filterRole);
    });
  }, [publicList, searchQuery, filterCountry, filterRole]);

  // ── Invalid token state ───────────────────────────────────────
  if (loadStatus === 'invalid') {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6 text-center text-white">
        <div className="w-16 h-16 bg-red-950/20 border border-red-500/30 rounded-full flex items-center justify-center mb-6">
          <X size={28} className="text-red-500" />
        </div>
        <h2 className="text-2xl font-bold uppercase tracking-tight mb-3">
          Access Link Not Found
        </h2>
        <p className="text-white/50 text-sm max-w-sm mb-2 leading-relaxed">
          This link is invalid or has been revoked.
          If you registered, check your email for your original access link.
        </p>
        <p className="text-white/30 text-xs max-w-xs mb-8 leading-relaxed">
          Need a new link? Re-register with your email address — if you're already in the system, a fresh link will be sent.
        </p>
        <button
          onClick={() => navigate('/sign-up')}
          className="px-6 py-3 bg-[#1b52a9] hover:bg-[#1b52a9]/90 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
        >
          Register / Get a New Link
        </button>
      </div>
    );
  }

  // ── Loading state ─────────────────────────────────────────────
  if (loadStatus === 'loading') {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white gap-4">
        <Loader2 size={36} className="animate-spin text-[#1b52a9]" />
        <p className="text-[10px] uppercase tracking-widest text-white/40">Verifying access...</p>
      </div>
    );
  }

  // ── Bio form view (first-time completion or edit) ─────────────
  if (showEditForm && participant) {
    return (
      <div className="min-h-screen bg-black dark:bg-white text-white dark:text-black py-20 md:py-32 px-4">
        <div className="max-w-3xl mx-auto mb-8">
          <button
            onClick={() => setShowEditForm(false)}
            className="flex items-center gap-2 text-[10px] font-avenir-bold uppercase tracking-widest text-white/40 dark:text-black/40 hover:text-[#1b52a9] transition-colors"
          >
            ← Back to Directory
          </button>
        </div>
        <RegistrationForm
          mode={participant.status === 'completed' ? 'edit' : 'create'}
          token={token!}
          initialData={participant}
          onComplete={handleBioSaved}
        />
      </div>
    );
  }

  // ── Main directory view ───────────────────────────────────────
  const hasActiveFilters = filterCountry !== 'ALL' || filterRole !== 'ALL';

  return (
    <div className="min-h-screen bg-black dark:bg-white text-white dark:text-black transition-colors duration-500">
      <Navbar
        viewMode="directory"
        setViewMode={() => {}}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        isAdminAuthorized={false}
        onEditBio={() => setShowEditForm(true)}
        onSignOut={() => navigate('/')}
      />

      <Header darkMode={darkMode} />

      {/* "Edit my Bio" floating button — visible only when token is valid */}
      <div className="fixed bottom-8 right-6 z-50">
        <button
          onClick={() => setShowEditForm(true)}
          className="flex items-center gap-2 px-5 py-3.5 bg-[#1b52a9] hover:bg-[#1b52a9]/90 text-white rounded-2xl font-avenir-bold uppercase text-[10px] tracking-[2px] shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95"
        >
          <Edit3 size={14} />
          {participant?.status === 'completed' ? 'Edit my Bio' : 'Complete my Bio'}
        </button>
      </div>

      <main className="max-w-[1400px] mx-auto px-4 md:px-8 py-20 md:py-32">
        {/* Controls */}
        <div className="flex flex-col xl:flex-row justify-between items-stretch xl:items-center gap-4 bg-white/5 dark:bg-black/5 p-3 md:p-4 rounded-3xl border border-white/10 dark:border-black/5 backdrop-blur-md mb-10">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1b52a9]" />
            <input
              type="text"
              placeholder={t('app.search', 'Search participants...')}
              className="w-full bg-transparent border-none p-3 md:p-4 pl-12 text-sm font-avenir-medium text-white dark:text-black outline-none placeholder:text-white/20 dark:placeholder:text-black/20"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-end gap-2 h-full px-2">
            <button onClick={loadDirectory} className="p-3 text-[#1b52a9]/60 hover:text-[#1b52a9] hover:bg-white/5 rounded-xl transition-all">
              <RefreshCcw size={18} />
            </button>
            <div className="w-px h-8 bg-white/10 dark:bg-black/10 mx-1 hidden sm:block" />
            <div className="hidden sm:flex gap-1">
              {(['list', 'grid2', 'grid4'] as LayoutMode[]).map(mode => (
                <button key={mode} onClick={() => setLayoutMode(mode)}
                  className={`p-3 rounded-xl transition-all ${layoutMode === mode ? 'bg-[#1b52a9] text-white' : 'text-[#1b52a9] hover:bg-white/5'}`}>
                  {mode === 'list' ? <Square size={20} /> : mode === 'grid2' ? <Columns size={20} /> : <LayoutGrid size={20} />}
                </button>
              ))}
            </div>
            <div className="w-px h-8 bg-white/10 dark:bg-black/10 mx-1" />
            <button onClick={() => setIsFilterOpen(true)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl font-avenir-bold text-[10px] uppercase tracking-[2px] transition-all ${hasActiveFilters ? 'bg-[#1b52a9] text-white' : 'bg-white/5 text-[#1b52a9] border border-[#1b52a9]/20'}`}>
              <Filter size={14} />
              <span className="hidden xs:inline">Filters</span>
              {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-white animate-pulse" />}
            </button>
          </div>
        </div>

        {/* Directory grid */}
        {dirLoading ? (
          <div className="flex flex-col items-center justify-center py-40">
            <Loader2 className="animate-spin text-[#1b52a9] mb-4" size={32} />
            <p className="text-[10px] text-[#1b52a9] uppercase font-avenir-medium tracking-widest">Loading profiles...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-40 border border-dashed border-white/10 rounded-3xl">
            <p className="text-sm text-white/40 font-avenir-medium uppercase tracking-wider">No profiles match your search.</p>
          </div>
        ) : (
          <div className={`grid gap-4 md:gap-8 ${
            layoutMode === 'grid4' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
            : layoutMode === 'grid2' ? 'grid-cols-1 sm:grid-cols-2'
            : 'grid-cols-1'}`}>
            {filtered.map(p => (
              <ParticipantCard
                key={p.id}
                participant={p as Participant}
                onClick={() => setSelectedProfile(p as Participant)}
                layout={layoutMode === 'list' ? 'list' : 'grid'}
                isOwnProfile={participant?.id === p.id}
              />
            ))}
          </div>
        )}
      </main>

      <footer className="mt-40 border-t border-white/5 py-24 bg-black dark:bg-white text-center">
        <div className="max-w-[1400px] mx-auto px-8 space-y-8">
          <p className="font-didot italic text-3xl text-white/30 dark:text-black/20 max-w-3xl mx-auto leading-relaxed">
            {t('footer.vision')}
          </p>
          <div className="text-[10px] font-avenir-bold text-[#1b52a9] uppercase tracking-[4px]">
            {t('footer.tagline')}
          </div>
        </div>
      </footer>

      {/* Profile modal */}
      {selectedProfile && (
        <ProfileModal
          participant={selectedProfile}
          onClose={() => setSelectedProfile(null)}
          isAdmin={false}
        />
      )}

      {/* Filter drawer */}
      <div className={`fixed inset-0 z-[200] transition-all duration-500 ${isFilterOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsFilterOpen(false)} />
        <div className={`absolute right-0 top-0 h-full w-full max-w-sm bg-[#0a0a0a] dark:bg-white shadow-2xl border-l border-white/10 flex flex-col transition-transform duration-500 ${isFilterOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="p-8 border-b border-white/10 flex justify-between items-center bg-white/5">
            <h3 className="text-xs font-avenir-bold text-[#1b52a9] uppercase tracking-[4px]">Filters</h3>
            <button onClick={() => setIsFilterOpen(false)} className="p-2 text-white/40 hover:text-[#1b52a9]"><X size={24} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-8 space-y-10">
            {[['Country', filterCountry, setFilterCountry, countriesList], ['Role', filterRole, setFilterRole, rolesList]].map(
              ([label, value, setter, list]) => (
                <div key={label as string} className="space-y-4">
                  <span className="text-[9px] font-avenir-bold text-[#1b52a9] uppercase tracking-[2px] block">{label as string}</span>
                  <select value={value as string} onChange={e => (setter as any)(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-xs font-avenir-medium text-white outline-none focus:border-[#1b52a9]">
                    <option value="ALL">All</option>
                    {(list as string[]).map(c => <option key={c} value={c} className="bg-[#0a0a0a]">{c}</option>)}
                  </select>
                </div>
              )
            )}
          </div>
          <div className="p-8 border-t border-white/10 space-y-4">
            <button onClick={() => { setFilterCountry('ALL'); setFilterRole('ALL'); setSearchQuery(''); }}
              className="w-full py-4 text-[10px] font-avenir-bold text-white/40 hover:text-[#1b52a9] uppercase tracking-[3px] transition-colors">
              Clear Filters
            </button>
            <button onClick={() => setIsFilterOpen(false)}
              className="w-full py-5 bg-[#1b52a9] text-white font-avenir-bold uppercase text-[10px] tracking-[4px] rounded-2xl active:scale-95 transition-all">
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
//  SCREEN D: Admin Login (/admin/login)
// ─────────────────────────────────────────────
const AdminLoginPage: React.FC<{ onAuth: () => void }> = ({ onAuth }) => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Map username → real email for Supabase Auth
      const adminMap: Record<string, string> = {
        'admin123': 'esbsinterview@gmail.com',
      };
      const internalEmail = adminMap[username.trim().toLowerCase()] || `${username.trim().toLowerCase()}@els-admin.internal`;
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: internalEmail,
        password,
      });
      if (authError) throw new Error('Invalid username or password.');

      const { data: adminUser, error: dbError } = await supabase
        .from('admin_users').select('*').eq('id', data.user.id).single();

      if (dbError || !adminUser) {
        await supabase.auth.signOut();
        throw new Error('Access denied — not registered as an administrator.');
      }

      onAuth();
      navigate('/admin');
    } catch (err: any) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-[2rem] p-8 md:p-12 shadow-2xl backdrop-blur-2xl">
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-[#1b52a9]/20 border border-[#1b52a9]/40 rounded-full flex items-center justify-center mb-6">
            <Shield size={28} className="text-[#1b52a9]" />
          </div>
          <h1 className="text-xl font-avenir-bold text-center tracking-tight text-white uppercase">Admin Console</h1>
          <p className="text-[10px] tracking-[0.2em] font-avenir-medium uppercase text-white/40 mt-2">ELS Madrid 2026</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[9px] font-avenir-bold uppercase tracking-[2px] text-white/50 pl-1 block">Username</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} required
              className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-sm text-white outline-none focus:border-[#1b52a9] transition-all"
              placeholder="admin123"
              autoComplete="username" />
          </div>
          <div className="space-y-2">
            <label className="text-[9px] font-avenir-bold uppercase tracking-[2px] text-white/50 pl-1 block">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full bg-white/5 border border-white/10 p-4 pr-12 rounded-xl text-sm text-white outline-none focus:border-[#1b52a9] transition-all"
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          {error && <p className="text-[10px] font-avenir-bold text-red-500 text-center uppercase tracking-wider">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full py-5 bg-[#1b52a9] hover:bg-[#1b52a9]/90 text-white rounded-xl font-avenir-bold uppercase text-[10px] tracking-[4px] active:scale-95 transition-all flex items-center justify-center gap-2">
            {loading ? <><Loader2 size={14} className="animate-spin" /> Authorizing...</> : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
//  SCREEN E: Admin Dashboard (/admin)
// ─────────────────────────────────────────────
const AdminDashboard: React.FC<{ isAdmin: boolean; onLogout: () => void }> = ({ isAdmin, onLogout }) => {
  const navigate = useNavigate();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) { navigate('/admin/login'); return; }
    loadData();
  }, [isAdmin]);

  const loadData = async () => {
    setLoading(true);
    try { const d = await api.adminGetParticipants(); setParticipants(d); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-black text-white py-20 px-4">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex justify-between items-center mb-10 pb-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Shield size={24} className="text-[#1b52a9]" />
            <h1 className="text-xl font-avenir-bold uppercase tracking-widest">ELS Administration</h1>
          </div>
          <button onClick={async () => { await supabase.auth.signOut(); onLogout(); navigate('/admin/login'); }}
            className="flex items-center gap-2 px-4 py-2 border border-red-500/20 text-red-500/80 hover:text-red-500 hover:bg-red-500/5 text-xs font-bold uppercase rounded-lg transition-all">
            <LogOut size={14} /> Log out
          </button>
        </div>
        {loading ? (
          <div className="flex flex-col items-center py-40">
            <Loader2 className="animate-spin text-[#1b52a9] mb-4" size={32} />
            <p className="text-xs text-white/40 uppercase tracking-wider">Loading data...</p>
          </div>
        ) : (
          <AdminConsole
            participants={participants}
            onAdd={async () => loadData()}
            onUpdate={async (id, u) => { await api.adminUpdateParticipant(id, u); loadData(); }}
            onDelete={async (id) => { await api.adminDeleteParticipant(id); loadData(); }}
            isAuthorized={true}
            onAuthorize={() => {}}
            editingId={null}
            onSetEditingId={() => {}}
          />
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
//  ROOT APP — SessionContext + Router
// ─────────────────────────────────────────────
const App: React.FC = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  const [sessionToken, setSessionToken] = useState<string | null>(
    () => sessionStorage.getItem(SESSION_KEY)
  );
  const [sessionParticipant, setSessionParticipant] = useState<Participant | null>(null);

  // Restore session on mount — re-validate token against DB
  useEffect(() => {
    const restore = async () => {
      const stored = sessionStorage.getItem(SESSION_KEY);
      if (stored) {
        const p = await api.getParticipantByToken(stored);
        if (p) {
          setSessionToken(stored);
          setSessionParticipant(p);
        } else {
          sessionStorage.removeItem(SESSION_KEY);
        }
      }
    };
    restore();
  }, []);

  // Check admin Supabase Auth session
  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: adminUser } = await supabase
          .from('admin_users').select('id').eq('id', session.user.id).single();
        if (adminUser) setIsAdmin(true);
      }
      setCheckingAdmin(false);
    };
    check();
  }, []);

  const setSession = (token: string, participant: Participant) => {
    sessionStorage.setItem(SESSION_KEY, token);
    setSessionToken(token);
    setSessionParticipant(participant);
  };

  const clearSession = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setSessionToken(null);
    setSessionParticipant(null);
  };

  const refreshParticipant = async () => {
    if (!sessionToken) return;
    const p = await api.getParticipantByToken(sessionToken);
    if (p) setSessionParticipant(p);
  };

  if (checkingAdmin) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <Loader2 className="animate-spin text-[#1b52a9]" size={32} />
      </div>
    );
  }

  return (
    <SessionContext.Provider value={{
      token: sessionToken,
      participant: sessionParticipant,
      setSession,
      clearSession,
      refreshParticipant,
    }}>
      <Router>
        <Routes>
          {/* Public landing */}
          <Route path="/" element={<LandingPage />} />

          {/* Native sign-up */}
          <Route path="/sign-up" element={<SignUpPage />} />

          {/* Admin — MUST be defined before /:token to avoid conflict */}
          <Route path="/admin/login" element={<AdminLoginPage onAuth={() => setIsAdmin(true)} />} />
          <Route path="/admin" element={<AdminDashboard isAdmin={isAdmin} onLogout={() => setIsAdmin(false)} />} />

          {/* /:token — participant's permanent access point.
              Validated server-side on every load. No client state trusted alone.
              Must be last — catches any single path segment not matched above. */}
          <Route path="/:token" element={<TokenPage />} />

          {/* Catch-all → landing */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Analytics />
      </Router>
    </SessionContext.Provider>
  );
};

export default App;
