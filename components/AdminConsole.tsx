import React, { useState, useRef } from 'react';
import { Participant } from '../types';
import * as XLSX from 'xlsx';
import { api } from '../services/api';
import ProfileModal from './ProfileModal';
import {
  Search, FileSpreadsheet, Trash2, Send,
  Loader2, Mail, Phone, Filter
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

const AdminConsole: React.FC<AdminConsoleProps> = ({
  participants, onDelete, onUpdate
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'registered' | 'completed'>('ALL');
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);

  const filteredParticipants = React.useMemo(() => {
    return participants.filter(p => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch = !q ||
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
      'ID': p.id,
      'Status': p.status.toUpperCase(),
      'Registered Name': p.registered_name || '',
      'Registration Email': p.email,
      'Profile Name': p.name || '',
      'Phone': p.phone || '',
      'Country': p.country || '',
      'City': p.city || '',
      'Organization': p.organization || '',
      'Church': p.church || '',
      'Ministry': p.ministry || '',
      'Role': p.role || '',
      'Languages': p.languages_spoken?.join(', ') || '',
      'Interests': p.areas_of_interest?.join(', ') || '',
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
      const ok = await api.adminResendAccess(
        p.id,
        p.email,
        p.registered_name || p.name || 'ELS Participant'
      );
      alert(ok ? 'Access link sent.' : 'Failed to send. Check edge function config.');
    } finally {
      setResendingId(null);
    }
  };

  return (
    <div className="w-full space-y-8 animate-fade-in text-white dark:text-black">

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/5 dark:bg-black/5 p-6 rounded-2xl border border-white/10 dark:border-black/5">
          <span className="text-[10px] font-avenir-bold text-white/50 dark:text-black/50 uppercase tracking-[2px]">
            Total Registered
          </span>
          <span className="text-4xl font-extrabold mt-2 block text-[#1552ab]">
            {participants.length}
          </span>
        </div>
        <div className="bg-white/5 dark:bg-black/5 p-6 rounded-2xl border border-white/10 dark:border-black/5">
          <span className="text-[10px] font-avenir-bold text-white/50 dark:text-black/50 uppercase tracking-[2px]">
            Completed Bios
          </span>
          <span className="text-4xl font-extrabold mt-2 block text-green-500">
            {participants.filter(p => p.status === 'completed').length}
          </span>
        </div>
        <div className="bg-white/5 dark:bg-black/5 p-6 rounded-2xl border border-white/10 dark:border-black/5">
          <span className="text-[10px] font-avenir-bold text-white/50 dark:text-black/50 uppercase tracking-[2px]">
            Pending Bios
          </span>
          <span className="text-4xl font-extrabold mt-2 block text-yellow-500">
            {participants.filter(p => p.status === 'registered').length}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col xl:flex-row justify-between items-stretch xl:items-center gap-4 bg-white/5 dark:bg-black/5 p-4 rounded-2xl border border-white/10 dark:border-black/5">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 dark:text-black/40" />
          <input
            type="text"
            placeholder="Search by name, email, or organization..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-transparent border-none p-3 pl-12 text-sm font-avenir-medium text-white dark:text-black outline-none placeholder:text-white/20 dark:placeholder:text-black/20"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="bg-[#151515] dark:bg-[#f5f5f5] border border-white/10 dark:border-black/10 p-3.5 rounded-xl text-xs font-avenir-bold text-white dark:text-black outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="registered">Pending Bio</option>
            <option value="completed">Completed</option>
          </select>
          <button
            onClick={handleExport}
            className="px-5 py-3.5 bg-green-600 hover:bg-green-500 text-white rounded-xl text-[10px] font-avenir-bold uppercase tracking-widest transition-all flex items-center gap-2"
          >
            <FileSpreadsheet size={14} /> Export XLS
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/2 dark:bg-black/2 border border-white/10 dark:border-black/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 dark:border-black/5 text-[9px] font-avenir-bold uppercase tracking-[2px] text-white/50 dark:text-black/50 bg-white/5 dark:bg-black/5">
                <th className="p-4 pl-6">Participant</th>
                <th className="p-4">Bio Profile</th>
                <th className="p-4">Contact</th>
                <th className="p-4">Status</th>
                <th className="p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 dark:divide-black/5 text-xs">
              {filteredParticipants.map(p => (
                <tr key={p.id} className="hover:bg-white/5 dark:hover:bg-black/5 transition-all">

                  {/* Registrant identity */}
                  <td 
                    onClick={() => setSelectedParticipant(p)}
                    className="p-4 pl-6 space-y-1 cursor-pointer hover:text-[#1552ab] transition-colors"
                  >
                    <div className="font-avenir-bold text-white dark:text-black">
                      {p.registered_name || p.name || '—'}
                    </div>
                    <div className="text-[10px] text-white/40 dark:text-black/40">
                      {p.email}
                    </div>
                  </td>

                  {/* Bio details */}
                  <td 
                    onClick={() => setSelectedParticipant(p)}
                    className="p-4 space-y-1 cursor-pointer"
                  >
                    {p.status === 'completed' ? (
                      <>
                        <div className="font-avenir-bold text-[#1552ab]">{p.name}</div>
                        <div className="text-[10px] text-white/50 dark:text-black/50">
                          {p.role}{p.organization ? ` · ${p.organization}` : ''}
                        </div>
                      </>
                    ) : (
                      <span className="text-white/30 dark:text-black/30 italic text-[10px]">
                        No bio submitted yet
                      </span>
                    )}
                  </td>

                  {/* Contact */}
                  <td 
                    onClick={() => setSelectedParticipant(p)}
                    className="p-4 space-y-1 text-white/60 dark:text-black/60 cursor-pointer"
                  >
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
                  <td 
                    onClick={() => setSelectedParticipant(p)}
                    className="p-4 cursor-pointer"
                  >
                    {p.status === 'completed' ? (
                      <span className="px-2.5 py-1 bg-green-500/10 border border-green-500/20 text-green-500 rounded-full font-avenir-bold uppercase text-[9px] tracking-wider">
                        Completed
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 rounded-full font-avenir-bold uppercase text-[9px] tracking-wider">
                        Pending Bio
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="p-4 pr-6 text-right animate-none">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleResendAccess(p)}
                        disabled={resendingId === p.id}
                        title="Resend access link"
                        className="p-2 bg-white/5 hover:bg-[#1552ab]/10 border border-white/10 hover:border-[#1552ab] text-[#1552ab] rounded-lg transition-all disabled:opacity-40"
                      >
                        {resendingId === p.id
                          ? <Loader2 size={14} className="animate-spin" />
                          : <Send size={14} />}
                      </button>
                      <button
                        onClick={async () => {
                          if (window.confirm('Delete this registration permanently?')) {
                            await onDelete(p.id);
                          }
                        }}
                        title="Delete registration"
                        className="p-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg border border-red-500/20 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>

                </tr>
              ))}

              {filteredParticipants.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-white/30 dark:text-black/30 text-xs italic">
                    No participants match the current filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Render detailed profile modal if active */}
      {selectedParticipant && (
        <ProfileModal
          participant={selectedParticipant}
          onClose={() => setSelectedParticipant(null)}
          isAdmin={true}
          onDelete={async (id) => {
            await onDelete(id);
            setSelectedParticipant(null);
          }}
        />
      )}
    </div>
  );
};

export default AdminConsole;
