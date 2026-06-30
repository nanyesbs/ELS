import React, { useEffect, useState } from 'react';
import { Participant } from '../types';
import { X, Building, Globe, MapPin, Mail, Phone, ExternalLink, ShieldCheck, Sparkles, MessageCircle, Heart } from 'lucide-react';
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
  onEdit
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (participant) {
      // Small delay to trigger animation
      const timer = setTimeout(() => setIsOpen(true), 50);
      return () => clearTimeout(timer);
    } else {
      setIsOpen(false);
    }
  }, [participant]);

  if (!participant) return null;

  const countryInfo = findCountry(participant.country || '');

  const handleDeleteClick = async () => {
    if (onDelete && window.confirm('Are you sure you want to delete this profile?')) {
      await onDelete(participant.id);
      onClose();
    }
  };

  const getPlatformIcon = (platform: string) => {
    const p = platform.toLowerCase();
    if (p.includes('instagram')) return '📸';
    if (p.includes('linkedin')) return '💼';
    if (p.includes('facebook')) return '👥';
    if (p.includes('twitter') || p.includes('x')) return '🐦';
    return '🔗';
  };

  return (
    <div className={`fixed inset-0 z-[150] flex items-center justify-center p-4 md:p-6 transition-all duration-500 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md" 
        onClick={onClose} 
      />

      {/* Modal Container */}
      <div className={`relative z-10 w-full max-w-4xl bg-[#0a0a0a] dark:bg-white border border-white/10 dark:border-black/5 rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-2xl transition-transform duration-500 ${isOpen ? 'translate-y-0 scale-100' : 'translate-y-4 scale-95'}`}>
        
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 z-20 w-10 h-10 flex items-center justify-center bg-black/40 backdrop-blur-2xl rounded-full text-white/80 hover:text-[#1b52a9] hover:scale-110 hover:rotate-90 transition-all border border-white/10"
        >
          <X size={20} />
        </button>

        {/* Left Section: Photo and Basic Info */}
        <div className="w-full md:w-2/5 p-8 flex flex-col items-center bg-white/2 dark:bg-black/2 border-b md:border-b-0 md:border-r border-white/5 dark:border-black/5 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-[#1b52a9]/5 to-transparent pointer-events-none" />

          {/* Profile Picture */}
          <div className="relative mb-6 group z-10">
            <div className="w-32 h-32 rounded-3xl overflow-hidden border-2 border-[#1b52a9]/30 shadow-2xl relative">
              <img 
                src={participant.photo_url || getIdentityPlaceholder(participant.name || 'ELS')} 
                alt={participant.name} 
                className="w-full h-full object-cover" 
              />
            </div>
            {participant.status === 'completed' && (
              <div className="absolute -bottom-2 -right-2 px-3 py-1 bg-[#1b52a9] text-white text-[8px] font-avenir-bold uppercase rounded-full shadow-glow flex items-center gap-1 border border-[#1b52a9]/50">
                <ShieldCheck size={10} /> Active
              </div>
            )}
          </div>

          {/* Identity details */}
          <div className="text-center z-10 space-y-2">
            <h2 className="text-xl font-extrabold uppercase tracking-wide text-white dark:text-black leading-tight">
              {participant.name}
            </h2>
            <div className="inline-flex items-center gap-1 bg-[#1b52a9]/10 text-[#1b52a9] px-3 py-1 rounded-full text-[10px] font-avenir-bold uppercase tracking-wider">
              {participant.role}
            </div>
            <p className="text-xs text-white/50 dark:text-black/50 font-avenir-medium tracking-wide">
              {participant.organization}
            </p>
          </div>

          {/* Social media links */}
          {participant.social_media && participant.social_media.length > 0 && (
            <div className="mt-8 w-full border-t border-white/5 dark:border-black/5 pt-6 z-10">
              <h4 className="text-[10px] font-avenir-bold text-[#1b52a9] uppercase tracking-[4px] mb-4 text-center">Social Media</h4>
              <div className="flex flex-col gap-2">
                {participant.social_media.map((account, idx) => (
                  <a 
                    key={idx} 
                    href={account.handle.startsWith('http') ? account.handle : `https://${account.platform.toLowerCase() === 'instagram' ? 'instagram.com/' : ''}${account.handle.replace('@', '')}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 bg-white/5 dark:bg-black/5 rounded-xl border border-white/5 dark:border-black/5 hover:border-[#1b52a9]/30 transition-all text-xs font-avenir-medium group"
                  >
                    <span className="flex items-center gap-2">
                      <span>{getPlatformIcon(account.platform)}</span>
                      <span className="capitalize">{account.platform}</span>
                    </span>
                    <span className="text-white/40 dark:text-black/40 group-hover:text-[#1b52a9] transition-colors flex items-center gap-1">
                      {account.handle} <ExternalLink size={10} />
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Section: Detailed Profile */}
        <div className="flex-1 p-8 md:p-10 flex flex-col justify-between overflow-y-auto max-h-[70vh] md:max-h-none">
          <div className="space-y-8">
            
            {/* Short Bio */}
            {participant.short_bio && (
              <div className="relative pl-6">
                <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#1b52a9]" />
                <h4 className="text-[10px] font-avenir-bold text-[#1b52a9] uppercase tracking-[4px] mb-3">Short Bio</h4>
                <p className="text-sm md:text-base font-avenir-roman leading-relaxed text-white/80 dark:text-black/80">
                  {participant.short_bio}
                </p>
              </div>
            )}

            {/* Ministry Focus */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {participant.ministry && (
                <div className="space-y-1">
                  <span className="text-[8px] font-avenir-bold text-[#1b52a9] uppercase tracking-widest block">Ministry Focus</span>
                  <div className="text-sm font-avenir-medium text-white dark:text-black flex items-center gap-2">
                    <Building size={14} className="text-white/20 dark:text-black/20" />
                    {participant.ministry}
                  </div>
                </div>
              )}

              {participant.church && (
                <div className="space-y-1">
                  <span className="text-[8px] font-avenir-bold text-[#1b52a9] uppercase tracking-widest block">Church Affiliation</span>
                  <div className="text-sm font-avenir-medium text-white dark:text-black flex items-center gap-2">
                    <Globe size={14} className="text-white/20 dark:text-black/20" />
                    {participant.church}
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <span className="text-[8px] font-avenir-bold text-[#1b52a9] uppercase tracking-widest block">Residency Location</span>
                <div className="text-sm font-avenir-medium text-white dark:text-black flex items-center gap-2">
                  <MapPin size={14} className="text-white/20 dark:text-black/20" />
                  {participant.city ? `${participant.city}, ` : ''}{countryInfo.flag} {countryInfo.name}
                </div>
              </div>
            </div>

            {/* Interests & Languages */}
            <div className="space-y-6 pt-6 border-t border-white/5 dark:border-black/5">
              {participant.areas_of_interest && participant.areas_of_interest.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[8px] font-avenir-bold text-[#1b52a9] uppercase tracking-widest block">Areas of Interest</span>
                  <div className="flex flex-wrap gap-1.5">
                    {participant.areas_of_interest.map(interest => (
                      <span key={interest} className="px-3 py-1 bg-white/5 dark:bg-black/5 border border-white/10 dark:border-black/10 rounded-full text-[9px] font-avenir-bold uppercase text-white/70 dark:text-black/70">
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {participant.languages_spoken && participant.languages_spoken.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[8px] font-avenir-bold text-[#1b52a9] uppercase tracking-widest block">Languages Spoken</span>
                  <div className="flex flex-wrap gap-1.5">
                    {participant.languages_spoken.map(lang => (
                      <span key={lang} className="px-3 py-1 bg-[#1b52a9]/5 border border-[#1b52a9]/10 rounded-full text-[9px] font-avenir-bold uppercase text-[#1b52a9]">
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Private Contact Details (Only visible to Admins) */}
            {isAdmin && (
              <div className="p-6 bg-red-950/10 border border-red-500/20 rounded-2xl space-y-4">
                <span className="text-[8px] font-avenir-bold text-red-500 uppercase tracking-widest block flex items-center gap-1.5">
                  <ShieldCheck size={12} /> Confidential Contact Info (Admin Only)
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[8px] font-avenir-bold text-white/30 dark:text-black/30 uppercase tracking-widest block">Contact Email</span>
                    <a href={`mailto:${participant.email}`} className="text-xs font-avenir-medium text-white dark:text-black hover:text-[#1b52a9] flex items-center gap-1.5">
                      <Mail size={12} /> {participant.email || 'None'}
                    </a>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[8px] font-avenir-bold text-white/30 dark:text-black/30 uppercase tracking-widest block">Phone Number</span>
                    <a href={`tel:${participant.phone}`} className="text-xs font-avenir-medium text-white dark:text-black hover:text-[#1b52a9] flex items-center gap-1.5">
                      <Phone size={12} /> {participant.phone || 'None'}
                    </a>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Admin Edit/Delete footer panel */}
          {isAdmin && (onDelete || onEdit) && (
            <div className="mt-8 pt-6 border-t border-white/5 dark:border-black/5 flex justify-end gap-3">
              {onEdit && (
                <button
                  onClick={() => onEdit(participant.id)}
                  className="px-5 py-2.5 bg-white/5 border border-white/10 hover:border-[#1b52a9] hover:bg-[#1b52a9]/5 text-xs font-avenir-bold uppercase tracking-wider rounded-lg transition-all"
                >
                  Edit profile
                </button>
              )}
              {onDelete && (
                <button
                  onClick={handleDeleteClick}
                  className="px-5 py-2.5 bg-red-500/10 border border-red-500/20 hover:bg-red-500 text-red-500 hover:text-white text-xs font-avenir-bold uppercase tracking-wider rounded-lg transition-all"
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
