import React from 'react';

interface SkeletonCardProps {
  layout?: 'grid' | 'list';
}

const SkeletonCard: React.FC<SkeletonCardProps> = ({ layout = 'grid' }) => {
  if (layout === 'list') {
    return (
      <div className="relative bg-white/70 dark:bg-[#121829]/75 backdrop-blur-md border border-[#1552ab]/8 dark:border-white/10 p-4 sm:p-5 flex items-center gap-6 rounded-card overflow-hidden shadow-card">
        <div className="skeleton w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-2xl" />
        <div className="flex-1 min-w-0 space-y-2">
          <div className="skeleton h-4 w-2/5 rounded-full" />
          <div className="skeleton h-3 w-1/3 rounded-full" />
        </div>
        <div className="skeleton h-3 w-20 rounded-full hidden lg:block" />
        <div className="skeleton h-8 w-24 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="bg-white/70 dark:bg-[#121829]/75 backdrop-blur-md border border-[#1552ab]/8 dark:border-white/10 p-5 md:p-6 flex flex-col items-center text-center rounded-card overflow-hidden shadow-card">
      {/* Photo placeholder */}
      <div className="skeleton w-full aspect-[4/3] max-w-full rounded-lg mb-6" />

      {/* Name */}
      <div className="skeleton h-4 w-3/4 rounded-full mb-2" />
      {/* Role */}
      <div className="skeleton h-3 w-1/2 rounded-full mb-4" />
      {/* Country */}
      <div className="skeleton h-3 w-2/5 rounded-full mb-4" />
      {/* Org */}
      <div className="skeleton h-3 w-3/5 rounded-full mb-6" />
      {/* Button */}
      <div className="w-full pt-4 border-t border-[#1552ab]/10 dark:border-white/10">
        <div className="skeleton h-10 w-full rounded-lg" />
      </div>
    </div>
  );
};

export default SkeletonCard;
