import React, { useState, useEffect } from 'react';
import { Participant } from '../types';
import { Building, ChevronRight, Mail, Phone, Globe, Star } from 'lucide-react';
import { getIdentityPlaceholder, HIGH_QUALITY_PLACEHOLDER } from '../constants';
import { findCountry } from '../utils';

interface ParticipantCardProps {
  participant: Participant;
  onClick: () => void;
  layout?: 'grid' | 'list';
  isOwnProfile?: boolean;
  cardIndex?: number;
}

const ParticipantCard: React.FC<ParticipantCardProps> = ({
  participant,
  onClick,
  layout = 'grid',
  isOwnProfile = false,
  cardIndex = 0,
}) => {
  const [imgSrc, setImgSrc] = useState<string>(
    participant.photo_url || getIdentityPlaceholder(participant.name || 'ELS')
  );
  const [fallbackStage, setFallbackStage] = useState<number>(participant.photo_url ? 0 : 1);

  useEffect(() => {
    setImgSrc(participant.photo_url || getIdentityPlaceholder(participant.name || 'ELS'));
    setFallbackStage(participant.photo_url ? 0 : 1);
  }, [participant.photo_url, participant.name]);

  const handleImageError = () => {
    if (fallbackStage === 0) {
      setImgSrc(getIdentityPlaceholder(participant.name || 'ELS'));
      setFallbackStage(1);
    } else if (fallbackStage === 1) {
      setImgSrc(HIGH_QUALITY_PLACEHOLDER);
      setFallbackStage(2);
    }
  };

  const countryInfo = findCountry(participant.country || '');

  /* ── List layout ─────────────────────────────────────────── */
  if (layout === 'list') {
    return (
      <div
        onClick={onClick}
        className="card-stagger group relative bg-white/75 dark:bg-[#121829]/75 backdrop-blur-md border border-[#1552ab]/8 dark:border-white/10 hover:border-[#1552ab]/20 dark:hover:border-white/20 transition-all duration-300 cursor-pointer overflow-hidden p-4 sm:p-5 flex items-center gap-5 rounded-card shadow-card hover:shadow-card-hover hover:-translate-y-0.5"
        style={{ '--card-index': Math.min(cardIndex, 20) } as React.CSSProperties}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && onClick()}
        aria-label={`View profile of ${participant.name || participant.registered_name}`}
      >
        {/* Thumbnail */}
        <div className="relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-xl overflow-hidden border border-[#1552ab]/10 dark:border-white/10 group-hover:border-[#1552ab]/30 dark:group-hover:border-white/30 transition-all duration-300 bg-[#efefef] dark:bg-[#0a0f1d]">
          <img
            src={imgSrc}
            alt={participant.name || ''}
            onError={handleImageError}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            loading="lazy"
          />
          {isOwnProfile && (
            <div className="absolute top-1 left-1 w-5 h-5 bg-[#1552ab] dark:bg-white rounded-full flex items-center justify-center shadow-md" title="Your profile">
              <Star size={9} className="text-white dark:text-[#1552ab]" fill="currentColor" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-avenir-bold text-[#1552ab] dark:text-white mb-0.5 uppercase tracking-wider line-clamp-1 transition-colors">
              {participant.name}
            </h3>
            <p className="text-[10px] sm:text-xs font-avenir-medium text-[#1552ab]/60 dark:text-white/60 uppercase tracking-[2px] truncate">
              {participant.role}
            </p>
          </div>

          <div className="flex items-center gap-4 sm:gap-6">
            <div className="hidden lg:flex items-center gap-1.5 text-xs text-[#1552ab]/50 dark:text-white/50 font-avenir-roman">
              <Building size={11} className="shrink-0" />
              <span className="truncate max-w-[150px]">{participant.organization}</span>
            </div>

            {/* Quick contact links — stop propagation */}
            {(participant.public_email || participant.public_phone || participant.public_website) && (
              <div className="hidden sm:flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                {participant.public_email && (
                  <a href={`mailto:${participant.public_email}`} title="Send Email"
                    className="w-9 h-9 flex items-center justify-center text-[#1552ab]/50 dark:text-white/50 hover:text-[#1552ab] dark:hover:text-white hover:bg-[#1552ab]/8 dark:hover:bg-white/10 rounded-full transition-all border border-[#1552ab]/10 dark:border-white/10">
                    <Mail size={14} />
                  </a>
                )}
                {participant.public_phone && (
                  <a href={`https://wa.me/${participant.public_phone.replace(/\D/g, '')}`}
                    target="_blank" rel="noopener noreferrer" title="WhatsApp"
                    className="w-9 h-9 flex items-center justify-center text-[#1552ab]/50 dark:text-white/50 hover:text-[#1552ab] dark:hover:text-white hover:bg-[#1552ab]/8 dark:hover:bg-white/10 rounded-full transition-all border border-[#1552ab]/10 dark:border-white/10">
                    <Phone size={14} />
                  </a>
                )}
                {participant.public_website && (
                  <a href={participant.public_website.startsWith('http') ? participant.public_website : `https://${participant.public_website}`}
                    target="_blank" rel="noopener noreferrer" title="Website"
                    className="w-9 h-9 flex items-center justify-center text-[#1552ab]/50 dark:text-white/50 hover:text-[#1552ab] dark:hover:text-white hover:bg-[#1552ab]/8 dark:hover:bg-white/10 rounded-full transition-all border border-[#1552ab]/10 dark:border-white/10">
                    <Globe size={14} />
                  </a>
                )}
              </div>
            )}

            <div className="flex items-center gap-2">
              <div className="flex gap-1.5 items-center bg-[#efefef]/60 dark:bg-white/5 px-2.5 py-1.5 rounded-full border border-[#1552ab]/8 dark:border-white/10">
                <span className="text-base leading-none" title="Residency">{countryInfo.flag}</span>
                <span className="text-[10px] font-avenir-bold text-[#1552ab]/65 dark:text-white/65 hidden sm:block">
                  {[participant.city, countryInfo.name].filter(Boolean).join(', ')}
                </span>
              </div>
              <ChevronRight size={15} className="text-[#1552ab]/30 dark:text-white/30 group-hover:text-[#1552ab] dark:group-hover:text-white group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Grid layout ─────────────────────────────────────────── */
  return (
    <div
      onClick={onClick}
      className="card-stagger group relative bg-white/75 dark:bg-[#121829]/75 backdrop-blur-md border border-[#1552ab]/8 dark:border-white/10 hover:border-[#1552ab]/20 dark:hover:border-white/20 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col rounded-card shadow-card hover:shadow-card-hover hover:-translate-y-1"
      style={{ '--card-index': Math.min(cardIndex, 20) } as React.CSSProperties}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick()}
      aria-label={`View profile of ${participant.name || participant.registered_name}`}
    >
      {/* Profile photo — wider aspect ratio for impact */}
      <div className="relative w-full aspect-[4/3] overflow-hidden bg-[#efefef] dark:bg-[#0a0f1d]">
        <img
          src={imgSrc}
          alt={participant.name || ''}
          onError={handleImageError}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
        />

        {/* Subtle gradient overlay at bottom for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        {/* "You" badge */}
        {isOwnProfile && (
          <div className="absolute top-3 left-3 flex items-center gap-1 bg-[#1552ab] text-white text-[9px] font-avenir-bold uppercase tracking-[1.5px] px-2.5 py-1 rounded-full shadow-md">
            <Star size={9} fill="currentColor" />
            You
          </div>
        )}

        {/* Flag overlay */}
        <div className="absolute bottom-0 right-0 p-2 flex gap-1 bg-white/90 dark:bg-[#121829]/90 backdrop-blur-md border-t border-l border-[#1552ab]/10 dark:border-white/10 rounded-tl-xl">
          <span className="text-base leading-none" title={countryInfo.name}>{countryInfo.flag}</span>
        </div>
      </div>

      {/* Card body */}
      <div className="flex flex-col items-center text-center p-5 flex-1">
        {/* Name */}
        <h3 className="text-sm md:text-base font-avenir-bold text-[#1552ab] dark:text-white mb-1 uppercase tracking-wider line-clamp-1 w-full transition-colors duration-300">
          {participant.name}
        </h3>

        {/* Role */}
        <p className="text-[10px] md:text-xs font-avenir-medium text-[#1552ab]/60 dark:text-white/60 uppercase tracking-[2.5px] mb-3 line-clamp-1">
          {participant.role}
        </p>

        {/* Organization */}
        {participant.organization && (
          <div className="flex items-center justify-center gap-1.5 text-xs text-[#1552ab]/50 dark:text-white/50 font-avenir-roman mb-3 w-full px-2">
            <Building size={11} className="shrink-0" />
            <span className="truncate">{participant.organization}</span>
          </div>
        )}

        {/* Location pill */}
        <div className="inline-flex items-center gap-1.5 bg-[#efefef]/60 dark:bg-white/5 px-3 py-1.5 rounded-full border border-[#1552ab]/8 dark:border-white/10 mb-4">
          <span className="text-sm leading-none">{countryInfo.flag}</span>
          <span className="text-[10px] font-avenir-bold text-[#1552ab]/60 dark:text-white/60 uppercase tracking-wider">
            {[participant.city, countryInfo.name].filter(Boolean).join(', ')}
          </span>
        </div>

        {/* Quick contact links */}
        {(participant.public_email || participant.public_phone || participant.public_website) && (
          <div className="flex items-center justify-center gap-2 mb-4" onClick={e => e.stopPropagation()}>
            {participant.public_email && (
              <a href={`mailto:${participant.public_email}`} title="Send Email"
                className="w-9 h-9 flex items-center justify-center text-[#1552ab]/50 dark:text-white/50 hover:text-[#1552ab] dark:hover:text-white hover:bg-[#1552ab]/8 dark:hover:bg-white/10 rounded-full transition-all border border-[#1552ab]/10 dark:border-white/10">
                <Mail size={14} />
              </a>
            )}
            {participant.public_phone && (
              <a href={`https://wa.me/${participant.public_phone.replace(/\D/g, '')}`}
                target="_blank" rel="noopener noreferrer" title="WhatsApp"
                className="w-9 h-9 flex items-center justify-center text-[#1552ab]/50 dark:text-white/50 hover:text-[#1552ab] dark:hover:text-white hover:bg-[#1552ab]/8 dark:hover:bg-white/10 rounded-full transition-all border border-[#1552ab]/10 dark:border-white/10">
                <Phone size={14} />
              </a>
            )}
            {participant.public_website && (
              <a href={participant.public_website.startsWith('http') ? participant.public_website : `https://${participant.public_website}`}
                target="_blank" rel="noopener noreferrer" title="Website"
                className="w-9 h-9 flex items-center justify-center text-[#1552ab]/50 dark:text-white/50 hover:text-[#1552ab] dark:hover:text-white hover:bg-[#1552ab]/8 dark:hover:bg-white/10 rounded-full transition-all border border-[#1552ab]/10 dark:border-white/10">
                <Globe size={14} />
              </a>
            )}
          </div>
        )}

        {/* "View Profile" — only visible on group hover */}
        <div className="mt-auto w-full pt-4 border-t border-[#1552ab]/8 dark:border-white/8">
          <div className="flex items-center justify-center gap-1.5 px-5 py-3 min-h-[44px] bg-[#1552ab]/0 group-hover:bg-[#1552ab] text-[#1552ab]/50 group-hover:text-white dark:text-white/40 dark:group-hover:text-white rounded-xl text-[10px] md:text-xs font-avenir-bold uppercase tracking-[2.5px] transition-all duration-300">
            View Profile
            <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform duration-200" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParticipantCard;
