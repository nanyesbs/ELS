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

  // Bio Fields — Section 1: Personal Information
  name?: string;
  country?: string;           // Resident country
  state?: string;             // [NEW] Resident state
  city?: string;              // Resident city
  nationality?: string;       // [NEW] Nationality
  short_bio?: string;         // Bio / Background

  // Bio Fields — Section 2: Ministry Information
  organization?: string;      // Ministry / Church / Org / Business name
  role?: string;              // Legacy text role (kept for AdminConsole + ParticipantCard)
  role_tags?: string[];       // [NEW] Multi-select role tags
  org_description?: string;   // [NEW] Description of organization
  photo_url?: string;
  promotional_picture_url?: string; // [NEW] Company flyer / logo / promo

  // Bio Fields — Section 3: Public Contact Information
  public_phone?: string;      // [NEW] Public phone number
  public_email?: string;      // [NEW] Public contact email (separate from registration email)
  public_website?: string;    // [NEW] Website URL
  public_other?: string;      // [NEW] @handle / social link

  // Bio Fields — Section 4: Testimonies & Additional Information
  areas_of_interest?: string[];
  testimony?: string;              // [NEW] PRIVATE — admin only
  upcoming_kingdom_events?: string; // [NEW] PRIVATE — admin only
  dietary_restrictions?: string;   // [NEW] PRIVATE — admin only

  // Legacy fields — kept for backward compat, not shown in new form
  church?: string;
  ministry?: string;
  languages_spoken?: string[];
  social_media?: SocialAccount[];

  // Legacy private field (replaced by public_phone in new form)
  phone?: string;

  created_at?: string;
  updated_at?: string;

  // Privacy / Map
  hide_on_map?: boolean;       // Opt out of map + directory display

  // Computed at runtime (not stored in DB)
  distanceKm?: number;         // Distance in km from the viewer's location
}


export type LayoutMode = 'grid4' | 'grid2' | 'list';
