import React, { useEffect, useState } from 'react';
import { Participant } from '../types';
import {
  X, Building, Globe, MapPin, Mail, Phone, ExternalLink,
  ShieldCheck, Link2, MessageCircle,
  Instagram, Linkedin, Facebook, Twitter,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getIdentityPlaceholder } from '../constants';
import { findCountry } from '../utils';

interface ProfileModalProps {
  participant: Participant | null;
  onClose: () => void;
  isAdmin?: boolean;
  onDelete?: (id: string) => Promise<void>;
  onEdit?: (id: string) => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({
  participant,
  onClose,
  isAdmin = false,
  onDelete,
  onEdit,
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (participant) {
      const timer = setTimeout(() => setIsOpen(true), 30);
      return () => clearTimeout(timer);
    } else {
      setIsOpen(false);
    }
  }, [participant]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (participant) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [participant, onClose]);

  if (!participant) return null;

  const countryInfo = findCountry(participant.country || '');
  const nationalityInfo = findCountry(participant.nationality || '');

  const handleDeleteClick = async () => {
    if (onDelete && window.confirm('Are you sure you want to delete this profile?')) {
      await onDelete(participant.id);
      onClose();
    }
  };

  /** Returns a Lucide icon component for a social platform name */
  const getPlatformIcon = (platform: string) => {
    const p = platform.toLowerCase();
    if (p.includes('instagram')) return <Instagram size={14} />;
    if (p.includes('linkedin')) return <Linkedin size={14} />;
    if (p.includes('facebook')) return <Facebook size={14} />;
    if (p.includes('twitter') || p.includes('x')) return <Twitter size={14} />;
    return <Link2 size={14} />;
  };

  const labelClass = 'text-[10px] font-avenir-bold text-[#1552ab]/50 dark:text-white/50 uppercase tracking-[2.5px] block mb-1';
  const contactRowClass =
    'flex items-center justify-between p-3.5 bg-black/3 dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/10 hover:border-[#1552ab]/20 dark:hover:border-white/20 transition-all text-xs font-avenir-medium group';

  return (
    <div
      className={`fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      role="dialog"
      aria-modal="true"
      aria-label={`Profile of ${participant.name}`}
    >
      {/* Backdrop — proper scrim strength */}
      <div
        className="absolute inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div
        className={`relative z-10 w-full max-w-4xl bg-white/90 dark:bg-[#121829]/95 backdrop-blur-xl border border-[#1552ab]/10 dark:border-white/10 rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-modal transition-all duration-300 max-h-[95svh] sm:max-h-[88vh] ${isOpen ? 'translate-y-0 scale-100' : 'translate-y-6 scale-[0.98]'}`}
      >

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-10 h-10 flex items-center justify-center bg-black/5 dark:bg-white/10 hover:bg-[#1552ab] dark:hover:bg-white text-[#1552ab] dark:text-white hover:text-white dark:hover:text-[#121829] hover:scale-110 hover:rotate-90 transition-all duration-200 border border-[#1552ab]/8 dark:border-white/15 rounded-full"
          aria-label="Close profile"
        >
          <X size={18} strokeWidth={2} />
        </button>

        {/* ── Left panel: Photo + Identity + Contact ─────── */}
        <div className="w-full md:w-2/5 p-7 md:p-8 flex flex-col items-center bg-gradient-to-b from-[#1552ab]/4 dark:from-white/3 to-transparent border-b md:border-b-0 md:border-r border-[#1552ab]/10 dark:border-white/10 relative overflow-y-auto">

          {/* Profile Picture */}
          <div className="relative mb-5">
            <div className="w-28 h-28 md:w-32 md:h-32 rounded-2xl overflow-hidden border-2 border-[#1552ab]/20 dark:border-white/20 shadow-xl relative">
              <img
                src={participant.photo_url || getIdentityPlaceholder(participant.name || 'ELS')}
                alt={participant.name || ''}
                className="w-full h-full object-cover"
                loading="eager"
              />
            </div>
            {participant.status === 'completed' && (
              <div className="absolute -bottom-2 -right-2 px-2.5 py-1 bg-[#1552ab] dark:bg-white text-white dark:text-[#121829] text-[8px] font-avenir-bold uppercase rounded-full shadow-md flex items-center gap-1">
                <ShieldCheck size={9} /> Active
              </div>
            )}
          </div>

          {/* Identity */}
          <div className="text-center space-y-2 mb-6">
            <h2 className="text-xl md:text-2xl font-extrabold uppercase tracking-wide text-[#1552ab] dark:text-white leading-tight">
              {participant.name}
            </h2>
            {participant.role && (
              <div className="inline-flex items-center gap-1.5 bg-[#1552ab]/8 dark:bg-white/10 text-[#1552ab] dark:text-white px-3 py-1 rounded-full text-[10px] font-avenir-bold uppercase tracking-wider">
                {participant.role}
              </div>
            )}
            {/* role_tags pills */}
            {participant.role_tags && participant.role_tags.length > 0 && (
              <div className="flex flex-wrap justify-center gap-1 mt-1">
                {participant.role_tags.map(tag => (
                  <span key={tag} className="px-2 py-0.5 bg-[#1552ab]/5 dark:bg-white/5 border border-[#1552ab]/15 dark:border-white/15 rounded-full text-[9px] font-avenir-bold uppercase text-[#1552ab]/70 dark:text-white/70">
                    {tag}
                  </span>
                ))}
              </div>
            )}
            {participant.organization && (
              <p className="text-xs text-[#1552ab]/50 dark:text-white/50 font-avenir-medium tracking-wide">
                {participant.organization}
              </p>
            )}
          </div>

          {/* Connection / Contact */}
          {(participant.public_email || participant.public_phone || participant.public_website || participant.public_other || (participant.social_media && participant.social_media.length > 0)) && (
            <div className="w-full border-t border-black/8 dark:border-white/10 pt-5 space-y-2">
              <h4 className={labelClass + ' text-center'}>Connection</h4>

              {participant.public_email && (
                <a href={`mailto:${participant.public_email}`} className={contactRowClass}>
                  <span className="flex items-center gap-2 text-[#1552ab] dark:text-white">
                    <Mail size={14} className="text-[#1552ab]/40 dark:text-white/40" />
                    <span>Email</span>
                  </span>
                  <span className="text-[#1552ab]/60 dark:text-white/60 group-hover:text-[#1552ab] dark:group-hover:text-white transition-colors flex items-center gap-1 truncate max-w-[150px]">
                    {participant.public_email} <ExternalLink size={9} />
                  </span>
                </a>
              )}

              {participant.public_phone && (
                <a
                  href={`https://wa.me/${participant.public_phone.replace(/\D/g, '')}`}
                  target="_blank" rel="noopener noreferrer"
                  className={contactRowClass}
                >
                  <span className="flex items-center gap-2 text-[#1552ab] dark:text-white">
                    <Phone size={14} className="text-[#1552ab]/40 dark:text-white/40" />
                    <span>WhatsApp</span>
                  </span>
                  <span className="text-[#1552ab]/60 dark:text-white/60 group-hover:text-[#1552ab] dark:group-hover:text-white transition-colors flex items-center gap-1">
                    {participant.public_phone} <ExternalLink size={9} />
                  </span>
                </a>
              )}

              {participant.public_website && (
                <a
                  href={participant.public_website.startsWith('http') ? participant.public_website : `https://${participant.public_website}`}
                  target="_blank" rel="noopener noreferrer"
                  className={contactRowClass}
                >
                  <span className="flex items-center gap-2 text-[#1552ab] dark:text-white">
                    <Globe size={14} className="text-[#1552ab]/40 dark:text-white/40" />
                    <span>Website</span>
                  </span>
                  <span className="text-[#1552ab]/60 dark:text-white/60 group-hover:text-[#1552ab] dark:group-hover:text-white transition-colors flex items-center gap-1 truncate max-w-[150px]">
                    {participant.public_website.replace(/https?:\/\/(www\.)?/, '')} <ExternalLink size={9} />
                  </span>
                </a>
              )}

              {participant.public_other && (
                <div className={contactRowClass.replace('hover:border-[#1552ab]/30 dark:hover:border-white/30', '')}>
                  <span className="flex items-center gap-2 text-[#1552ab] dark:text-white">
                    <MessageCircle size={14} className="text-[#1552ab]/40 dark:text-white/40" />
                    <span>Handle</span>
                  </span>
                  <span className="text-[#1552ab]/65 dark:text-white/65 truncate max-w-[150px]">
                    {participant.public_other}
                  </span>
                </div>
              )}

              {/* Legacy social media — now with Lucide icons */}
              {participant.social_media?.map((account, idx) => (
                <a
                  key={`social-${idx}`}
                  href={account.handle.startsWith('http') ? account.handle : `https://${account.platform.toLowerCase() === 'instagram' ? 'instagram.com/' : ''}${account.handle.replace('@', '')}`}
                  target="_blank" rel="noopener noreferrer"
                  className={contactRowClass}
                >
                  <span className="flex items-center gap-2 text-[#1552ab] dark:text-white">
                    <span className="text-[#1552ab]/40 dark:text-white/40">{getPlatformIcon(account.platform)}</span>
                    <span className="capitalize">{account.platform}</span>
                  </span>
                  <span className="text-[#1552ab]/60 dark:text-white/60 group-hover:text-[#1552ab] dark:group-hover:text-white transition-colors flex items-center gap-1">
                    {account.handle} <ExternalLink size={9} />
                  </span>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* ── Right panel: Bio + Details ──────────────────── */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          <div className="p-7 md:p-10 space-y-7 flex-1">

            {/* Bio */}
            {participant.short_bio && (
              <div className="relative pl-5">
                <div className="absolute left-0 top-0 bottom-0 w-[2px] rounded-full bg-gradient-to-b from-[#1552ab] to-[#1552ab]/20 dark:from-white/60 dark:to-transparent" />
                <span className={labelClass}>Bio / Background</span>
                <p className="text-sm md:text-[15px] font-avenir-roman leading-relaxed text-[#1552ab]/80 dark:text-white/80">
                  {participant.short_bio}
                </p>
              </div>
            )}

            {/* Details grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {participant.ministry && (
                <div className="space-y-1">
                  <span className={labelClass}>Ministry Focus</span>
                  <div className="flex items-center gap-2 text-sm font-avenir-medium text-[#1552ab] dark:text-white">
                    <Building size={13} className="text-[#1552ab]/25 dark:text-white/25 shrink-0" />
                    {participant.ministry}
                  </div>
                </div>
              )}
              {participant.church && (
                <div className="space-y-1">
                  <span className={labelClass}>Church Affiliation</span>
                  <div className="flex items-center gap-2 text-sm font-avenir-medium text-[#1552ab] dark:text-white">
                    <Globe size={13} className="text-[#1552ab]/25 dark:text-white/25 shrink-0" />
                    {participant.church}
                  </div>
                </div>
              )}
              <div className="space-y-1">
                <span className={labelClass}>Resident Country</span>
                <div className="flex items-center gap-2 text-sm font-avenir-medium text-[#1552ab] dark:text-white">
                  <MapPin size={13} className="text-[#1552ab]/25 dark:text-white/25 shrink-0" />
                  {[participant.city, participant.state, countryInfo.name].filter(Boolean).join(', ')} {countryInfo.flag}
                </div>
              </div>
              {participant.nationality && (
                <div className="space-y-1">
                  <span className={labelClass}>Nationality</span>
                  <div className="flex items-center gap-2 text-sm font-avenir-medium text-[#1552ab] dark:text-white">
                    <span className="text-base leading-none">{nationalityInfo.flag}</span>
                    {nationalityInfo.name}
                  </div>
                </div>
              )}
            </div>

            {/* Org description */}
            {participant.org_description && (
              <div className="pt-5 border-t border-black/5 dark:border-white/10">
                <span className={labelClass}>About the Organisation</span>
                <p className="text-xs font-avenir-roman text-[#1552ab]/70 dark:text-white/70 leading-relaxed">
                  {participant.org_description}
                </p>
              </div>
            )}

            {/* Promo / Flyer */}
            {participant.promotional_picture_url && (
              <div className="pt-5 border-t border-black/5 dark:border-white/10 space-y-3">
                <span className={labelClass}>Company Flyer / Promo</span>
                <div className="w-full max-w-lg rounded-2xl overflow-hidden border border-[#1552ab]/12 dark:border-white/10 bg-black/5 dark:bg-white/5 shadow-md">
                  <img
                    src={participant.promotional_picture_url}
                    alt="Company Flyer/Logo/Promo"
                    className="w-full h-auto object-contain max-h-[280px]"
                    loading="lazy"
                  />
                </div>
              </div>
            )}

            {/* Interests + Languages */}
            {((participant.areas_of_interest && participant.areas_of_interest.length > 0) ||
              (participant.languages_spoken && participant.languages_spoken.length > 0)) && (
              <div className="pt-5 border-t border-black/5 dark:border-white/10 space-y-5">
                {participant.areas_of_interest && participant.areas_of_interest.length > 0 && (
                  <div className="space-y-2">
                    <span className={labelClass}>Areas of Interest</span>
                    <div className="flex flex-wrap gap-1.5">
                      {participant.areas_of_interest.map(interest => (
                        <span key={interest} className="px-3 py-1 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-full text-[10px] font-avenir-bold uppercase text-[#1552ab]/70 dark:text-white/70">
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {participant.languages_spoken && participant.languages_spoken.length > 0 && (
                  <div className="space-y-2">
                    <span className={labelClass}>Languages Spoken</span>
                    <div className="flex flex-wrap gap-1.5">
                      {participant.languages_spoken.map(lang => (
                        <span key={lang} className="px-3 py-1 bg-[#1552ab]/8 dark:bg-white/5 border border-[#1552ab]/15 dark:border-white/10 rounded-full text-[10px] font-avenir-bold uppercase text-[#1552ab] dark:text-white">
                          {lang}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Admin — Confidential */}
            {isAdmin && (
              <div className="p-5 bg-red-950/8 border border-red-500/20 rounded-2xl space-y-4">
                <span className="text-[10px] font-avenir-bold text-red-500 uppercase tracking-widest flex items-center gap-1.5">
                  <ShieldCheck size={12} /> Confidential — Admin Only
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-avenir-bold text-[#1552ab]/30 dark:text-white/30 uppercase tracking-widest block">Contact Email</span>
                    <a href={`mailto:${participant.email}`} className="text-xs font-avenir-medium text-[#1552ab] dark:text-white hover:underline flex items-center gap-1.5">
                      <Mail size={11} /> {participant.email || 'None'}
                    </a>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-avenir-bold text-[#1552ab]/30 dark:text-white/30 uppercase tracking-widest block">Phone Number</span>
                    <a href={`tel:${participant.phone}`} className="text-xs font-avenir-medium text-[#1552ab] dark:text-white hover:underline flex items-center gap-1.5">
                      <Phone size={11} /> {participant.phone || 'None'}
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Admin footer actions */}
          {isAdmin && (onDelete || onEdit) && (
            <div className="px-7 md:px-10 py-5 border-t border-black/8 dark:border-white/10 flex justify-end gap-3 bg-black/2 dark:bg-white/2 shrink-0">
              {onEdit && (
                <button
                  onClick={() => onEdit(participant.id)}
                  className="px-5 py-2.5 min-h-[44px] bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 hover:border-[#1552ab] dark:hover:border-white hover:bg-[#1552ab]/5 text-xs font-avenir-bold uppercase tracking-wider rounded-xl transition-all"
                >
                  Edit profile
                </button>
              )}
              {onDelete && (
                <button
                  onClick={handleDeleteClick}
                  className="px-5 py-2.5 min-h-[44px] bg-red-500/8 border border-red-500/20 hover:bg-red-500 text-red-500 hover:text-white text-xs font-avenir-bold uppercase tracking-wider rounded-xl transition-all"
                >
                  Delete Profile
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
