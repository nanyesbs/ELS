import React, { useState } from 'react';
import { Participant } from '../types';
import * as XLSX from 'xlsx';
import { api } from '../services/api';
import ProfileModal from './ProfileModal';
import {
  Search, FileSpreadsheet, Trash2, Send,
  Loader2, Mail, Phone, Users, CheckCircle2, Clock,
} from 'lucide-react';

interface AdminConsoleProps {
  participants: Participant[];
  onUpdate: (id: string, p: Partial<Participant>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isAuthorized: boolean;
  onAuthorize: (v: boolean) => void;
  editingId: string | null;
  onSetEditingId: (id: string | null) => void;
  onAdd: (p: Omit<Participant, 'id'>) => Promise<void>;
}

type StatusFilter = 'ALL' | 'registered' | 'completed';

const AdminConsole: React.FC<AdminConsoleProps> = ({
  participants, onDelete,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);

  const filteredParticipants = React.useMemo(() => {
    return participants.filter(p => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (p.registered_name || '').toLowerCase().includes(q) ||
        (p.name || '').toLowerCase().includes(q) ||
        (p.email || '').toLowerCase().includes(q) ||
        (p.organization || '').toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [participants, searchTerm, statusFilter]);

  const handleExport = () => {
    const rows = participants.map(p => ({
      ID: p.id,
      Status: p.status.toUpperCase(),
      'Registered Name': p.registered_name || '',
      'Registration Email': p.email,
      'Profile Name': p.name || '',
      Phone: p.phone || '',
      Country: p.country || '',
      City: p.city || '',
      Organization: p.organization || '',
      Church: p.church || '',
      Ministry: p.ministry || '',
      Role: p.role || '',
      Languages: p.languages_spoken?.join(', ') || '',
      Interests: p.areas_of_interest?.join(', ') || '',
      'Short Bio': p.short_bio || '',
      'Registered At': p.created_at || '',
      'Completed At': p.profile_completed_at || '',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'ELS Participants');
    XLSX.writeFile(wb, `ELS_Participants_Madrid2026_${Date.now()}.xlsx`);
  };

  const handleResendAccess = async (p: Participant) => {
    if (!window.confirm(`Resend access link to ${p.email}?`)) return;
    setResendingId(p.id);
    try {
      const ok = await api.adminResendAccess(p.id, p.email, p.registered_name || p.name || 'ELS Participant');
      alert(ok ? 'Access link sent.' : 'Failed to send. Check edge function config.');
    } finally {
      setResendingId(null);
    }
  };

  const totalCount = participants.length;
  const completedCount = participants.filter(p => p.status === 'completed').length;
  const pendingCount = participants.filter(p => p.status === 'registered').length;

  const filterOptions: { id: StatusFilter; label: string }[] = [
    { id: 'ALL', label: 'All' },
    { id: 'completed', label: 'Completed' },
    { id: 'registered', label: 'Pending' },
  ];

  return (
    <div className="w-full space-y-6 animate-fade-in text-[#1552ab]">

      {/* ── Metrics ─────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total */}
        <div className="bg-white/75 dark:bg-[#121829]/75 backdrop-blur-md p-5 rounded-2xl border border-[#1552ab]/8 dark:border-white/10 flex items-center gap-4 shadow-card hover:shadow-card-hover transition-all">
          <div className="w-12 h-12 rounded-xl bg-[#1552ab]/10 dark:bg-white/10 flex items-center justify-center shrink-0">
            <Users size={20} className="text-[#1552ab] dark:text-white" />
          </div>
          <div>
            <p className="text-[10px] font-avenir-bold text-[#1552ab]/50 dark:text-white/50 uppercase tracking-[2px]">Total Registered</p>
            <p className="text-3xl font-extrabold text-[#1552ab] dark:text-white mt-0.5">{totalCount}</p>
          </div>
        </div>

        {/* Completed */}
        <div className="bg-white/75 dark:bg-[#121829]/75 backdrop-blur-md p-5 rounded-2xl border border-[#1552ab]/8 dark:border-white/10 flex items-center gap-4 shadow-card hover:shadow-card-hover transition-all">
          <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
            <CheckCircle2 size={20} className="text-green-500" />
          </div>
          <div>
            <p className="text-[10px] font-avenir-bold text-[#1552ab]/50 dark:text-white/50 uppercase tracking-[2px]">Completed Bios</p>
            <p className="text-3xl font-extrabold text-green-500 mt-0.5">{completedCount}</p>
          </div>
        </div>

        {/* Pending */}
        <div className="bg-white/75 dark:bg-[#121829]/75 backdrop-blur-md p-5 rounded-2xl border border-[#1552ab]/8 dark:border-white/10 flex items-center gap-4 shadow-card hover:shadow-card-hover transition-all">
          <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center shrink-0">
            <Clock size={20} className="text-yellow-500" />
          </div>
          <div>
            <p className="text-[10px] font-avenir-bold text-[#1552ab]/50 dark:text-white/50 uppercase tracking-[2px]">Pending Bios</p>
            <p className="text-3xl font-extrabold text-yellow-500 mt-0.5">{pendingCount}</p>
          </div>
        </div>
      </div>

      {/* ── Controls ────────────────────────────── */}
      <div className="flex flex-col xl:flex-row justify-between items-stretch xl:items-center gap-3 bg-white/60 dark:bg-white/5 backdrop-blur-md p-3 md:p-4 rounded-2xl border border-[#1552ab]/8 dark:border-white/10 shadow-card">

        {/* Search */}
        <div className="relative flex-1">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1552ab]/40 dark:text-white/40" />
          <input
            type="text"
            placeholder="Search by name, email or organisation…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-transparent border-none p-3 pl-11 text-sm font-avenir-medium text-[#1552ab] dark:text-white outline-none placeholder:text-[#1552ab]/40 dark:placeholder:text-white/40"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status pill filter — replaces native select */}
          <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-xl border border-black/10 dark:border-white/10">
            {filterOptions.map(opt => (
              <button
                key={opt.id}
                onClick={() => setStatusFilter(opt.id)}
                className={`px-3.5 py-2 rounded-lg text-[10px] font-avenir-bold uppercase tracking-[1.5px] transition-all min-h-[36px] ${
                  statusFilter === opt.id
                    ? 'bg-[#1552ab] dark:bg-white text-white dark:text-[#121829] shadow-sm'
                    : 'text-[#1552ab]/50 dark:text-white/50 hover:text-[#1552ab] dark:hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Export */}
          <button
            onClick={handleExport}
            className="px-4 py-2.5 min-h-[44px] bg-green-600 hover:bg-green-500 text-white rounded-xl text-[10px] font-avenir-bold uppercase tracking-widest transition-all flex items-center gap-2"
          >
            <FileSpreadsheet size={14} /> Export XLS
          </button>
        </div>
      </div>

      {/* ── Table ──────────────────────────────── */}
      <div className="bg-white/80 dark:bg-[#121829]/80 backdrop-blur-md border border-[#1552ab]/8 dark:border-white/10 rounded-2xl overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-black/8 dark:border-white/10 text-[9px] font-avenir-bold uppercase tracking-[2px] text-[#1552ab]/40 dark:text-white/40 bg-black/3 dark:bg-white/3">
                <th className="p-4 pl-6">Participant</th>
                <th className="p-4">Bio Profile</th>
                <th className="p-4">Contact</th>
                <th className="p-4">Status</th>
                <th className="p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/5 text-xs">
              {filteredParticipants.map(p => (
                <tr
                  key={p.id}
                  className="hover:bg-[#1552ab]/3 dark:hover:bg-white/3 transition-colors duration-150 group"
                >
                  {/* Registrant identity */}
                  <td
                    onClick={() => setSelectedParticipant(p)}
                    className="p-4 pl-6 space-y-0.5 cursor-pointer"
                  >
                    <div className="font-avenir-bold text-[#1552ab] dark:text-white group-hover:text-[#1552ab]/80 dark:group-hover:text-white/80 transition-colors">
                      {p.registered_name || p.name || '—'}
                    </div>
                    <div className="text-[10px] text-[#1552ab]/35 dark:text-white/35">{p.email}</div>
                  </td>

                  {/* Bio details */}
                  <td onClick={() => setSelectedParticipant(p)} className="p-4 space-y-0.5 cursor-pointer">
                    {p.status === 'completed' ? (
                      <>
                        <div className="font-avenir-bold text-[#1552ab] dark:text-white">{p.name}</div>
                        <div className="text-[10px] text-[#1552ab]/45 dark:text-white/45">
                          {p.role}{p.organization ? ` · ${p.organization}` : ''}
                        </div>
                      </>
                    ) : (
                      <span className="text-[#1552ab]/30 dark:text-white/30 italic text-[10px]">No bio yet</span>
                    )}
                  </td>

                  {/* Contact */}
                  <td onClick={() => setSelectedParticipant(p)} className="p-4 space-y-1 text-[#1552ab]/55 dark:text-white/55 cursor-pointer">
                    <div className="flex items-center gap-1.5">
                      <Mail size={10} /> {p.email}
                    </div>
                    {p.phone && (
                      <div className="flex items-center gap-1.5">
                        <Phone size={10} /> {p.phone}
                      </div>
                    )}
                  </td>

                  {/* Status badge */}
                  <td onClick={() => setSelectedParticipant(p)} className="p-4 cursor-pointer">
                    {p.status === 'completed' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 rounded-full font-avenir-bold uppercase text-[9px] tracking-wider">
                        <CheckCircle2 size={9} /> Completed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-400 rounded-full font-avenir-bold uppercase text-[9px] tracking-wider">
                        <Clock size={9} /> Pending
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="p-4 pr-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleResendAccess(p)}
                        disabled={resendingId === p.id}
                        title="Resend access link"
                        className="w-9 h-9 flex items-center justify-center bg-black/4 hover:bg-[#1552ab]/10 border border-black/10 hover:border-[#1552ab] text-[#1552ab] dark:text-white rounded-xl transition-all disabled:opacity-40"
                      >
                        {resendingId === p.id
                          ? <Loader2 size={13} className="animate-spin" />
                          : <Send size={13} />}
                      </button>
                      <button
                        onClick={async () => {
                          if (window.confirm('Delete this registration permanently?')) {
                            await onDelete(p.id);
                          }
                        }}
                        title="Delete registration"
                        className="w-9 h-9 flex items-center justify-center bg-red-500/8 hover:bg-red-500 text-red-500 hover:text-white rounded-xl border border-red-500/20 transition-all"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredParticipants.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-16 text-center text-[#1552ab]/30 dark:text-white/30 text-xs italic">
                    No participants match the current filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedParticipant && (
        <ProfileModal
          participant={selectedParticipant}
          onClose={() => setSelectedParticipant(null)}
          isAdmin
          onDelete={async id => {
            await onDelete(id);
            setSelectedParticipant(null);
          }}
        />
      )}
    </div>
  );
};

export default AdminConsole;
