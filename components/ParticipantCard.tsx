import React, { useState, useEffect } from 'react';
import { Participant } from '../types';
import { Building, ChevronRight, User, Mail, Phone, Globe } from 'lucide-react';
import { getIdentityPlaceholder, HIGH_QUALITY_PLACEHOLDER } from '../constants';
import { findCountry } from '../utils';

interface ParticipantCardProps {
 participant: Participant;
 onClick: () => void;
 layout?: 'grid' | 'list';
}

const ParticipantCard: React.FC<ParticipantCardProps> = ({ participant, onClick, layout = 'grid' }) => {
 const [imgSrc, setImgSrc] = useState<string>(participant.photo_url || getIdentityPlaceholder(participant.name || 'ELS'));
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

  if (layout === 'list') {
    return (
      <div
        onClick={onClick}
        className="group relative bg-white border border-[#1552ab]/10 hover:border-[#1552ab]/30 transition-all duration-500 cursor-pointer overflow-hidden p-4 sm:p-5 flex items-center gap-6 rounded-card shadow-card hover:shadow-xl hover:-translate-y-1"
      >
        <div className="relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-2xl overflow-hidden border border-[#1552ab]/10 group-hover:border-[#1552ab]/30 transition-all duration-700 bg-[#efefef] shadow-inner">
          <img
            src={imgSrc}
            alt={participant.name}
            onError={handleImageError}
            className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-110 ease-out"
          />
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-t from-[#1552ab]/10 via-transparent to-transparent transition-opacity duration-700 pointer-events-none" />
        </div>

        <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-avenir-bold text-[#1552ab] mb-1 uppercase tracking-wider group-hover:text-[#1552ab] transition-colors line-clamp-1">
              {participant.name}
            </h3>
            <p className="text-[10px] sm:text-xs font-avenir-medium text-[#1552ab] uppercase tracking-[2px] opacity-90 group-hover:opacity-100 transition-opacity truncate">
              {participant.role}
            </p>
          </div>

          <div className="flex items-center gap-4 sm:gap-8">
            <div className="hidden lg:flex items-center gap-2 text-xs text-[#1552ab]/60 font-avenir-roman">
              <Building size={12} className="text-[#1552ab]/60 shrink-0" />
              <span className="truncate max-w-[150px]">{participant.organization}</span>
            </div>

            {/* Quick Connection Links */}
            {(participant.public_email || participant.public_phone || participant.public_website) && (
              <div className="hidden sm:flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                {participant.public_email && (
                  <a 
                    href={`mailto:${participant.public_email}`}
                    title="Send Email"
                    className="p-1.5 text-[#1552ab]/60 hover:text-[#1552ab] hover:bg-[#1552ab]/10 rounded-full transition-all border border-[#1552ab]/10"
                  >
                    <Mail size={12} />
                  </a>
                )}
                {participant.public_phone && (
                  <a 
                    href={`https://wa.me/${participant.public_phone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="WhatsApp Chat"
                    className="p-1.5 text-[#1552ab]/60 hover:text-[#1552ab] hover:bg-[#1552ab]/10 rounded-full transition-all border border-[#1552ab]/10"
                  >
                    <Phone size={12} />
                  </a>
                )}
                {participant.public_website && (
                  <a 
                    href={participant.public_website.startsWith('http') ? participant.public_website : `https://${participant.public_website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Visit Website"
                    className="p-1.5 text-[#1552ab]/60 hover:text-[#1552ab] hover:bg-[#1552ab]/10 rounded-full transition-all border border-[#1552ab]/10"
                  >
                    <Globe size={12} />
                  </a>
                )}
              </div>
            )}

            <div className="flex items-center gap-3">
              <div className="flex gap-1.5 items-center bg-[#efefef] p-1.5 px-3 rounded-full border border-[#1552ab]/10">
                <span className="text-lg leading-none" title="Residency">{countryInfo.flag}</span>
                <span className="text-[10px] font-avenir-bold text-[#1552ab]/75">
                  {[participant.city, participant.state, countryInfo.name].filter(Boolean).join(', ')}
                </span>
              </div>
              <ChevronRight size={16} className="text-[#1552ab]/40 group-hover:text-[#1552ab] group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className="group relative bg-white border border-[#1552ab]/10 hover:border-[#1552ab]/30 transition-all duration-700 cursor-pointer overflow-hidden p-5 md:p-6 flex flex-col items-center text-center rounded-card shadow-card hover:shadow-2xl hover:-translate-y-2"
    >
      {/* Profile Picture */}
      <div className="relative mb-6 w-full aspect-square max-w-[180px]">
        <div className="w-full h-full rounded-card overflow-hidden border border-[#1552ab]/15 group-hover:border-[#1552ab]/30 transition-all duration-700 bg-[#efefef] relative shadow-inner">
          <img
            src={imgSrc}
            alt={participant.name}
            onError={handleImageError}
            className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-110 ease-out"
          />

          {/* Inner Glow Overlay */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-t from-[#1552ab]/10 via-transparent to-transparent transition-opacity duration-700 pointer-events-none" />

          {/* Flag Overlay */}
          <div className="absolute bottom-0 right-0 p-1.5 flex gap-1 bg-[#efefef]/90 backdrop-blur-md border-t border-l border-[#1552ab]/10 rounded-tl-card shadow-2xl z-10">
            <span className="text-lg leading-none" title={countryInfo.name}>{countryInfo.flag}</span>
          </div>
        </div>
      </div>

      <div className="w-full flex flex-col items-center">
        {/* Full Name */}
        <h3 className="text-sm md:text-base font-avenir-bold text-[#1552ab] mb-1.5 uppercase tracking-wider group-hover:text-[#1552ab] transition-colors duration-500 line-clamp-1">
          {participant.name}
        </h3>

        {/* Role */}
        <p className="text-[10px] md:text-xs font-avenir-medium text-[#1552ab] mb-3 uppercase tracking-[3px] opacity-90 group-hover:opacity-100 transition-opacity">
          {participant.role}
        </p>

        {/* Country & City Info */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="text-xl leading-none" title={countryInfo.name}>{countryInfo.flag}</span>
          <span className="text-[10px] font-avenir-bold text-[#1552ab]/60 uppercase tracking-wider">
            {[participant.city, participant.state, countryInfo.name].filter(Boolean).join(', ')}
          </span>
        </div>

        {/* Organization */}
        <div className="flex items-center justify-center gap-2 text-xs md:text-sm text-[#1552ab]/60 font-avenir-roman mb-4 min-h-[1.5rem] w-full px-2">
          <Building size={12} className="text-[#1552ab]/60 shrink-0" />
          <span className="truncate line-clamp-1 max-w-[90%]">{participant.organization}</span>
        </div>

        {/* Quick Connection Links */}
        {(participant.public_email || participant.public_phone || participant.public_website) && (
          <div className="flex items-center justify-center gap-3 mb-4" onClick={(e) => e.stopPropagation()}>
            {participant.public_email && (
              <a 
                href={`mailto:${participant.public_email}`}
                title="Send Email"
                className="p-2 text-[#1552ab]/60 hover:text-[#1552ab] hover:bg-[#1552ab]/10 rounded-full transition-all border border-[#1552ab]/10"
              >
                <Mail size={12} />
              </a>
            )}
            {participant.public_phone && (
              <a 
                href={`https://wa.me/${participant.public_phone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                title="WhatsApp Chat"
                className="p-2 text-[#1552ab]/60 hover:text-[#1552ab] hover:bg-[#1552ab]/10 rounded-full transition-all border border-[#1552ab]/10"
              >
                <Phone size={12} />
              </a>
            )}
            {participant.public_website && (
              <a 
                href={participant.public_website.startsWith('http') ? participant.public_website : `https://${participant.public_website}`}
                target="_blank"
                rel="noopener noreferrer"
                title="Visit Website"
                className="p-2 text-[#1552ab]/60 hover:text-[#1552ab] hover:bg-[#1552ab]/10 rounded-full transition-all border border-[#1552ab]/10"
              >
                <Globe size={12} />
              </a>
            )}
          </div>
        )}

        {/* View Profile Button */}
        <div className="w-full pt-6 border-t border-[#1552ab]/10 flex flex-col items-center">
          <button className="flex items-center gap-2 px-6 py-3.5 min-h-[44px] bg-[#1552ab]/10 group-hover:bg-[#1552ab] text-[#1552ab] group-hover:text-white rounded-button text-[10px] md:text-xs font-avenir-bold hover:scale-105 active:scale-95 uppercase transition-all tracking-[3px]">
            View Profile
            <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>

  );
};

export default ParticipantCard;
