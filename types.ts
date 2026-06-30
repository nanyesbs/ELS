export interface Country {
  name: string;
  flag: string;
  code: string;
}

export interface SocialAccount {
  platform: string;
  handle: string;
}

export interface Participant {
  id: string;
  // Registration fields (set at sign-up)
  email: string;
  registered_name?: string;
  status: 'registered' | 'completed';
  profile_completed_at?: string;
  reminder_sent_count?: number;
  last_reminder_sent_at?: string;
  token_expires_at?: string;

  // Bio Fields (populated when status = 'completed')
  name?: string;
  country?: string;
  city?: string;
  organization?: string;
  church?: string;
  ministry?: string;
  role?: string;
  photo_url?: string;
  social_media?: SocialAccount[];
  areas_of_interest?: string[];
  languages_spoken?: string[];
  short_bio?: string;

  // Private fields (visible to admins or via secure token session only)
  phone?: string;

  created_at?: string;
  updated_at?: string;
}

export type LayoutMode = 'grid4' | 'grid2' | 'list';
