
import { Country } from './types';

export const ADMIN_PASSWORD = 'RGR@ESBSJesus!';
export const BRAND_GOLD = '#1b52a9'; // ELS Primary Blue
export const BRAND_GOLD_LIGHT = '#1b52a9'; // ELS Blue Light
export const BRAND_GOLD_DARK = '#0f387a';
export const BRAND_BLACK = '#050505';


export const SUMMIT_START = '2026-07-03';
export const SUMMIT_END = '2026-07-31';

export const HIGH_QUALITY_PLACEHOLDER = "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=1000&auto=format&fit=crop";

export const getIdentityPlaceholder = (name: string): string => {
  try {
    const initials = name
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'LS';

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${BRAND_GOLD};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${BRAND_GOLD_DARK};stop-opacity:1" />
          </linearGradient>
          <radialGradient id="innerGlow" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
            <stop offset="0%" style="stop-color:${BRAND_GOLD};stop-opacity:0.15" />
            <stop offset="100%" style="stop-color:black;stop-opacity:0" />
          </radialGradient>
        </defs>
        <rect width="100" height="100" fill="#0A0A0A"/>
        <circle cx="50" cy="50" r="48" fill="url(#innerGlow)"/>
        <circle cx="50" cy="50" r="42" fill="none" stroke="url(#goldGradient)" stroke-width="0.5" opacity="0.3" />
        <circle cx="50" cy="50" r="38" fill="none" stroke="url(#goldGradient)" stroke-width="1.5" />
        <text 
          x="50%" 
          y="50%" 
          fill="url(#goldGradient)" 
          font-family="'Bodoni Moda', serif" 
          font-weight="400" 
          font-size="32" 
          text-anchor="middle" 
          dominant-baseline="central" 
          style="letter-spacing: 0px; text-transform: uppercase; font-style: italic;"
        >
          ${initials}
        </text>
      </svg>
    `.trim();

    const base64 = btoa(unescape(encodeURIComponent(svg)));
    return `data:image/svg+xml;base64,${base64}`;
  } catch (error) {
    return HIGH_QUALITY_PLACEHOLDER;
  }
};

export const COUNTRY_LIST: Country[] = [
  { name: 'Afghanistan', code: 'AF', flag: '🇦🇫' },
  { name: 'Albania', code: 'AL', flag: '🇦🇱' },
  { name: 'Algeria', code: 'DZ', flag: '🇩🇿' },
  { name: 'Andorra', code: 'AD', flag: '🇦🇩' },
  { name: 'Angola', code: 'AO', flag: '🇦🇴' },
  { name: 'Antigua and Barbuda', code: 'AG', flag: '🇦🇬' },
  { name: 'Argentina', code: 'AR', flag: '🇦🇷' },
  { name: 'Armenia', code: 'AM', flag: '🇦🇲' },
  { name: 'Australia', code: 'AU', flag: '🇦🇺' },
  { name: 'Austria', code: 'AT', flag: '🇦🇹' },
  { name: 'Azerbaijan', code: 'AZ', flag: '🇦🇿' },
  { name: 'Bahamas', code: 'BS', flag: '🇧🇸' },
  { name: 'Bahrain', code: 'BH', flag: '🇧🇭' },
  { name: 'Bangladesh', code: 'BD', flag: '🇧🇩' },
  { name: 'Barbados', code: 'BB', flag: '🇧🇧' },
  { name: 'Belarus', code: 'BY', flag: '🇧🇾' },
  { name: 'Belgium', code: 'BE', flag: '🇧🇪' },
  { name: 'Belize', code: 'BZ', flag: '🇧🇿' },
  { name: 'Benin', code: 'BJ', flag: '🇧🇯' },
  { name: 'Bhutan', code: 'BT', flag: '🇧🇹' },
  { name: 'Bolivia', code: 'BO', flag: '🇧🇴' },
  { name: 'Bosnia and Herzegovina', code: 'BA', flag: '🇧🇦' },
  { name: 'Botswana', code: 'BW', flag: '🇧🇼' },
  { name: 'Brazil', code: 'BR', flag: '🇧🇷' },
  { name: 'Brunei', code: 'BN', flag: '🇧🇳' },
  { name: 'Bulgaria', code: 'BG', flag: '🇧🇬' },
  { name: 'Burkina Faso', code: 'BF', flag: '🇧🇫' },
  { name: 'Burundi', code: 'BI', flag: '🇧🇮' },
  { name: 'Cabo Verde', code: 'CV', flag: '🇨🇻' },
  { name: 'Cambodia', code: 'KH', flag: '🇰🇭' },
  { name: 'Cameroon', code: 'CM', flag: '🇨🇲' },
  { name: 'Canada', code: 'CA', flag: '🇨🇦' },
  { name: 'Central African Republic', code: 'CF', flag: '🇨🇫' },
  { name: 'Chad', code: 'TD', flag: '🇹🇩' },
  { name: 'Chile', code: 'CL', flag: '🇨🇱' },
  { name: 'China', code: 'CN', flag: '🇨🇳' },
  { name: 'Colombia', code: 'CO', flag: '🇨🇴' },
  { name: 'Comoros', code: 'KM', flag: '🇰🇲' },
  { name: 'Congo', code: 'CG', flag: '🇨🇬' },
  { name: 'Costa Rica', code: 'CR', flag: '🇨🇷' },
  { name: 'Croatia', code: 'HR', flag: '🇭🇷' },
  { name: 'Cuba', code: 'CU', flag: '🇨🇺' },
  { name: 'Cyprus', code: 'CY', flag: '🇨🇾' },
  { name: 'Czech Republic', code: 'CZ', flag: '🇨🇿' },
  { name: 'Denmark', code: 'DK', flag: '🇩🇰' },
  { name: 'Djibouti', code: 'DJ', flag: '🇩🇯' },
  { name: 'Dominica', code: 'DM', flag: '🇩🇲' },
  { name: 'Dominican Republic', code: 'DO', flag: '🇩🇴' },
  { name: 'Ecuador', code: 'EC', flag: '🇪🇨' },
  { name: 'Egypt', code: 'EG', flag: '🇪🇬' },
  { name: 'El Salvador', code: 'SV', flag: '🇸🇻' },
  { name: 'Equatorial Guinea', code: 'GQ', flag: '🇬🇶' },
  { name: 'Eritrea', code: 'ER', flag: '🇪🇷' },
  { name: 'Estonia', code: 'EE', flag: '🇪🇪' },
  { name: 'Eswatini', code: 'SZ', flag: '🇸🇿' },
  { name: 'Ethiopia', code: 'ET', flag: '🇪🇹' },
  { name: 'Fiji', code: 'FJ', flag: '🇫🇯' },
  { name: 'Finland', code: 'FI', flag: '🇫🇮' },
  { name: 'France', code: 'FR', flag: '🇫🇷' },
  { name: 'Gabon', code: 'GA', flag: '🇬🇦' },
  { name: 'Gambia', code: 'GM', flag: '🇬🇲' },
  { name: 'Georgia', code: 'GE', flag: '🇬🇪' },
  { name: 'Germany', code: 'DE', flag: '🇩🇪' },
  { name: 'Ghana', code: 'GH', flag: '🇬🇭' },
  { name: 'Greece', code: 'GR', flag: '🇬🇷' },
  { name: 'Grenada', code: 'GD', flag: '🇬🇩' },
  { name: 'Guatemala', code: 'GT', flag: '🇬🇹' },
  { name: 'Guinea', code: 'GN', flag: '🇬🇳' },
  { name: 'Guinea-Bissau', code: 'GW', flag: '🇬🇼' },
  { name: 'Guyana', code: 'GY', flag: '🇬🇾' },
  { name: 'Haiti', code: 'HT', flag: '🇭🇹' },
  { name: 'Honduras', code: 'HN', flag: '🇭🇳' },
  { name: 'Hungary', code: 'HU', flag: '🇭🇺' },
  { name: 'Iceland', code: 'IS', flag: '🇮🇸' },
  { name: 'India', code: 'IN', flag: '🇮🇳' },
  { name: 'Indonesia', code: 'ID', flag: '🇮🇩' },
  { name: 'Iran', code: 'IR', flag: '🇮🇷' },
  { name: 'Iraq', code: 'IQ', flag: '🇮🇶' },
  { name: 'Ireland', code: 'IE', flag: '🇮🇪' },
  { name: 'Israel', code: 'IL', flag: '🇮🇱' },
  { name: 'Italy', code: 'IT', flag: '🇮🇹' },
  { name: 'Jamaica', code: 'JM', flag: '🇯🇲' },
  { name: 'Japan', code: 'JP', flag: '🇯🇵' },
  { name: 'Jordan', code: 'JO', flag: '🇯🇴' },
  { name: 'Kazakhstan', code: 'KZ', flag: '🇰🇿' },
  { name: 'Kenya', code: 'KE', flag: '🇰🇪' },
  { name: 'Kiribati', code: 'KI', flag: '🇰🇮' },
  { name: 'Korea (North)', code: 'KP', flag: '🇰🇵' },
  { name: 'Korea (South)', code: 'KR', flag: '🇰🇷' },
  { name: 'Kuwait', code: 'KW', flag: '🇰🇼' },
  { name: 'Kyrgyzstan', code: 'KG', flag: '🇰🇬' },
  { name: 'Laos', code: 'LA', flag: '🇱🇦' },
  { name: 'Latvia', code: 'LV', flag: '🇱🇻' },
  { name: 'Lebanon', code: 'LB', flag: '🇱🇧' },
  { name: 'Lesotho', code: 'LS', flag: '🇱🇸' },
  { name: 'Liberia', code: 'LR', flag: '🇱🇷' },
  { name: 'Libya', code: 'LY', flag: '🇱🇾' },
  { name: 'Liechtenstein', code: 'LI', flag: '🇱🇮' },
  { name: 'Lithuania', code: 'LT', flag: '🇱🇹' },
  { name: 'Luxembourg', code: 'LU', flag: '🇱🇺' },
  { name: 'Madagascar', code: 'MG', flag: '🇲🇬' },
  { name: 'Malawi', code: 'MW', flag: '🇲🇼' },
  { name: 'Malaysia', code: 'MY', flag: '🇲🇾' },
  { name: 'Maldives', code: 'MV', flag: '🇲🇻' },
  { name: 'Mali', code: 'ML', flag: '🇲🇱' },
  { name: 'Malta', code: 'MT', flag: '🇲🇹' },
  { name: 'Marshall Islands', code: 'MH', flag: '🇲🇭' },
  { name: 'Mauritania', code: 'MR', flag: '🇲🇷' },
  { name: 'Mauritius', code: 'MU', flag: '🇲🇺' },
  { name: 'Mexico', code: 'MX', flag: '🇲🇽' },
  { name: 'Micronesia', code: 'FM', flag: '🇫🇲' },
  { name: 'Moldova', code: 'MD', flag: '🇲🇩' },
  { name: 'Monaco', code: 'MC', flag: '🇲🇨' },
  { name: 'Mongolia', code: 'MN', flag: '🇲🇳' },
  { name: 'Montenegro', code: 'ME', flag: '🇲🇪' },
  { name: 'Morocco', code: 'MA', flag: '🇲🇦' },
  { name: 'Mozambique', code: 'MZ', flag: '🇲🇿' },
  { name: 'Myanmar', code: 'MM', flag: '🇲🇲' },
  { name: 'Namibia', code: 'NA', flag: '🇳🇦' },
  { name: 'Nauru', code: 'NR', flag: '🇳🇷' },
  { name: 'Nepal', code: 'NP', flag: '🇳🇵' },
  { name: 'Netherlands', code: 'NL', flag: '🇳🇱' },
  { name: 'New Zealand', code: 'NZ', flag: '🇳🇿' },
  { name: 'Nicaragua', code: 'NI', flag: '🇳🇮' },
  { name: 'Niger', code: 'NE', flag: '🇳🇪' },
  { name: 'Nigeria', code: 'NG', flag: '🇳🇬' },
  { name: 'North Macedonia', code: 'MK', flag: '🇲🇰' },
  { name: 'Norway', code: 'NO', flag: '🇳🇴' },
  { name: 'Oman', code: 'OM', flag: '🇴🇲' },
  { name: 'Pakistan', code: 'PK', flag: '🇵🇰' },
  { name: 'Palau', code: 'PW', flag: '🇵🇼' },
  { name: 'Palestine', code: 'PS', flag: '🇵🇸' },
  { name: 'Panama', code: 'PA', flag: '🇵🇦' },
  { name: 'Papua New Guinea', code: 'PG', flag: '🇵🇬' },
  { name: 'Paraguay', code: 'PY', flag: '🇵🇾' },
  { name: 'Peru', code: 'PE', flag: '🇵🇪' },
  { name: 'Philippines', code: 'PH', flag: '🇵🇭' },
  { name: 'Poland', code: 'PL', flag: '🇵🇱' },
  { name: 'Portugal', code: 'PT', flag: '🇵🇹' },
  { name: 'Qatar', code: 'QA', flag: '🇶🇦' },
  { name: 'Romania', code: 'RO', flag: '🇷🇴' },
  { name: 'Russia', code: 'RU', flag: '🇷🇺' },
  { name: 'Rwanda', code: 'RW', flag: '🇷🇼' },
  { name: 'Saint Kitts and Nevis', code: 'KN', flag: '🇰🇳' },
  { name: 'Saint Lucia', code: 'LC', flag: '🇱🇨' },
  { name: 'Saint Vincent', code: 'VC', flag: '🇻🇨' },
  { name: 'Samoa', code: 'WS', flag: '🇼🇸' },
  { name: 'San Marino', code: 'SM', flag: '🇸🇲' },
  { name: 'Sao Tome and Principe', code: 'ST', flag: '🇸🇹' },
  { name: 'Saudi Arabia', code: 'SA', flag: '🇸🇦' },
  { name: 'Senegal', code: 'SN', flag: '🇸🇳' },
  { name: 'Serbia', code: 'RS', flag: '🇷🇸' },
  { name: 'Seychelles', code: 'SC', flag: '🇸🇨' },
  { name: 'Sierra Leone', code: 'SL', flag: '🇸🇱' },
  { name: 'Singapore', code: 'SG', flag: '🇸🇬' },
  { name: 'Slovakia', code: 'SK', flag: '🇸🇰' },
  { name: 'Slovenia', code: 'SI', flag: '🇸🇮' },
  { name: 'Solomon Islands', code: 'SB', flag: '🇸🇧' },
  { name: 'Somalia', code: 'SO', flag: '🇸🇴' },
  { name: 'South Africa', code: 'ZA', flag: '🇿🇦' },
  { name: 'South Sudan', code: 'SS', flag: '🇸🇸' },
  { name: 'Spain', code: 'ES', flag: '🇪🇸' },
  { name: 'Sri Lanka', code: 'LK', flag: '🇱🇰' },
  { name: 'Sudan', code: 'SD', flag: '🇸🇩' },
  { name: 'Suriname', code: 'SR', flag: '🇸🇷' },
  { name: 'Sweden', code: 'SE', flag: '🇸🇪' },
  { name: 'Switzerland', code: 'CH', flag: '🇨🇭' },
  { name: 'Syria', code: 'SY', flag: '🇸🇾' },
  { name: 'Taiwan', code: 'TW', flag: '🇹🇼' },
  { name: 'Tajikistan', code: 'TJ', flag: '🇹🇯' },
  { name: 'Tanzania', code: 'TZ', flag: '🇹🇿' },
  { name: 'Thailand', code: 'TH', flag: '🇹🇭' },
  { name: 'Timor-Leste', code: 'TL', flag: '🇹🇱' },
  { name: 'Togo', code: 'TG', flag: '🇹🇬' },
  { name: 'Tonga', code: 'TO', flag: '🇹🇴' },
  { name: 'Trinidad and Tobago', code: 'TT', flag: '🇹🇹' },
  { name: 'Tunisia', code: 'TN', flag: '🇹🇳' },
  { name: 'Turkey', code: 'TR', flag: '🇹🇷' },
  { name: 'Turkmenistan', code: 'TM', flag: '🇹🇲' },
  { name: 'Tuvalu', code: 'TV', flag: '🇹🇻' },
  { name: 'Uganda', code: 'UG', flag: '🇺🇬' },
  { name: 'Ukraine', code: 'UA', flag: '🇺🇦' },
  { name: 'United Arab Emirates', code: 'AE', flag: '🇦🇪' },
  { name: 'United Kingdom', code: 'GB', flag: '🇬🇧' },
  { name: 'United States', code: 'US', flag: '🇺🇸' },
  { name: 'Uruguay', code: 'UY', flag: '🇺🇾' },
  { name: 'Uzbekistan', code: 'UZ', flag: '🇺🇿' },
  { name: 'Vanuatu', code: 'VU', flag: '🇻🇺' },
  { name: 'Vatican City', code: 'VA', flag: '🇻🇦' },
  { name: 'Venezuela', code: 'VE', flag: '🇻🇪' },
  { name: 'Vietnam', code: 'VN', flag: '🇻🇳' },
  { name: 'Yemen', code: 'YE', flag: '🇾🇪' },
  { name: 'Zambia', code: 'ZM', flag: '🇿🇲' },
  { name: 'Zimbabwe', code: 'ZW', flag: '🇿🇼' },
  { name: 'Scotland', code: 'SCT', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' }
];

export const COUNTRY_SYNONYMS: Record<string, string> = {
  'great britain': 'GB',
  'uk': 'GB',
  'usa': 'US',
  'united states of america': 'US',
  'uae': 'AE',
  'holland': 'NL',
  'brasil': 'BR',
  'czechia': 'CZ',
  'latvija': 'LV'
};



export const ALPHABET_GROUPS = {
  LATIN: "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""),
  GERMAN: ["Ä", "Ö", "Ü"],
  SPANISH: ["Ñ"],
  FRENCH: ["Ç", "É", "È"], // Common starters, kept minimal for UI sanity, can be expanded.
  RUSSIAN: "АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ".split("")
};

export interface RoleOption {
  label: string;
  category: string;
}

export const ROLE_OPTIONS: RoleOption[] = [
  // Leadership Roles
  { label: 'Senior / Lead Pastor', category: 'Leadership' },
  { label: 'Associate Pastor', category: 'Leadership' },
  { label: 'Ministry Leader', category: 'Leadership' },
  { label: 'Evangelist', category: 'Leadership' },
  { label: 'Missionary', category: 'Leadership' },
  { label: 'Prophet / Prophetic Minister', category: 'Leadership' },
  { label: 'Apostle / Apostolic Leader', category: 'Leadership' },
  { label: 'Bible Teacher', category: 'Leadership' },
  { label: 'Revivalist', category: 'Leadership' },
  { label: 'Spiritual Mentor / Discipleship Leader', category: 'Leadership' },
  // Evangelism & Outreach
  { label: 'Evangelism Team Leader', category: 'Evangelism & Outreach' },
  { label: 'Street Evangelist', category: 'Evangelism & Outreach' },
  { label: 'Outreach Coordinator', category: 'Evangelism & Outreach' },
  { label: 'Missions Coordinator', category: 'Evangelism & Outreach' },
  { label: 'Prayer & Intercession Leader', category: 'Evangelism & Outreach' },
  { label: 'Worship Evangelist', category: 'Evangelism & Outreach' },
  { label: 'Creative Evangelist', category: 'Evangelism & Outreach' },
  // Administration & Communication
  { label: 'Social Media Manager', category: 'Administration' },
  { label: 'Communications Coordinator', category: 'Administration' },
  { label: 'Event Organizer', category: 'Administration' },
  { label: 'Project Manager', category: 'Administration' },
  { label: 'Administrative Assistant', category: 'Administration' },
  { label: 'Media & Production Team', category: 'Administration' },
  { label: 'Marketing / Promotion Leader', category: 'Administration' },
  // Worship & Creative Arts
  { label: 'Worship Leader', category: 'Worship & Arts' },
  { label: 'Musician / Instrumentalist', category: 'Worship & Arts' },
  { label: 'Vocalist', category: 'Worship & Arts' },
  { label: 'Sound Technician', category: 'Worship & Arts' },
  { label: 'Visual / Media Artist', category: 'Worship & Arts' },
  { label: 'Creative Director', category: 'Worship & Arts' },
  // Discipleship & Pastoral Care
  { label: 'Small Group Leader', category: 'Discipleship' },
  { label: 'Youth Leader', category: 'Discipleship' },
  { label: 'Children\'s Ministry Leader', category: 'Discipleship' },
  { label: 'Couples Ministry Leader', category: 'Discipleship' },
  { label: 'Pastoral Care / Counselor', category: 'Discipleship' },
  { label: 'Leadership Coach', category: 'Discipleship' },
  // Support & Hospitality
  { label: 'Volunteer Coordinator', category: 'Support & Hospitality' },
  { label: 'Hospitality Team', category: 'Support & Hospitality' },
  { label: 'Logistics Coordinator', category: 'Support & Hospitality' },
  { label: 'Registration Team', category: 'Support & Hospitality' },
  { label: 'Translator / Interpreter', category: 'Support & Hospitality' },
  { label: 'Security or Transport Team', category: 'Support & Hospitality' },
];

export interface SocialPlatform {
  id: string;
  label: string;
  icon: string; // lucide icon name or custom svg id
  color: string;
  urlTemplate: (handle: string) => string;
  placeholder: string;
}

export const SOCIAL_PLATFORMS: SocialPlatform[] = [
  { id: 'instagram', label: 'Instagram', icon: 'instagram', color: '#E1306C', urlTemplate: (h) => `https://instagram.com/${h.replace('@', '')}`, placeholder: '@yourhandle' },
  { id: 'facebook', label: 'Facebook', icon: 'facebook', color: '#1877F2', urlTemplate: (h) => `https://facebook.com/${h.replace('@', '')}`, placeholder: '@page or /username' },
  { id: 'tiktok', label: 'TikTok', icon: 'tiktok', color: '#010101', urlTemplate: (h) => `https://tiktok.com/@${h.replace('@', '')}`, placeholder: '@yourhandle' },
  { id: 'youtube', label: 'YouTube', icon: 'youtube', color: '#FF0000', urlTemplate: (h) => h.startsWith('http') ? h : `https://youtube.com/@${h.replace('@', '')}`, placeholder: '@channel or URL' },
  { id: 'linkedin', label: 'LinkedIn', icon: 'linkedin', color: '#0A66C2', urlTemplate: (h) => `https://linkedin.com/in/${h.replace('@', '')}`, placeholder: '/in/username' },
  { id: 'twitter', label: 'X (Twitter)', icon: 'twitter', color: '#1DA1F2', urlTemplate: (h) => `https://x.com/${h.replace('@', '')}`, placeholder: '@handle' },
  { id: 'website', label: 'Website', icon: 'globe', color: '#BB9446', urlTemplate: (h) => h.startsWith('http') ? h : `https://${h}`, placeholder: 'yourwebsite.com' },
];

export const COUNTRY_CALLING_CODES: Record<string, string> = {
  'AF': '+93', 'AL': '+355', 'DZ': '+213', 'AD': '+376', 'AO': '+244',
  'AG': '+1 268', 'AR': '+54', 'AM': '+374', 'AU': '+61', 'AT': '+43',
  'AZ': '+994', 'BS': '+1 242', 'BH': '+973', 'BD': '+880', 'BB': '+1 246',
  'BY': '+375', 'BE': '+32', 'BZ': '+501', 'BJ': '+229', 'BT': '+975',
  'BO': '+591', 'BA': '+387', 'BW': '+267', 'BR': '+55', 'BN': '+673',
  'BG': '+359', 'BF': '+226', 'BI': '+257', 'CV': '+238', 'KH': '+855',
  'CM': '+237', 'CA': '+1', 'CF': '+236', 'TD': '+235', 'CL': '+56',
  'CN': '+86', 'CO': '+57', 'KM': '+269', 'CD': '+243', 'CG': '+242', 'CR': '+506',
  'CI': '+225', 'HR': '+385', 'CU': '+53', 'CY': '+357', 'CZ': '+420', 'DK': '+45',
  'DJ': '+253', 'DM': '+1 767', 'DO': '+1 809', 'EC': '+593', 'EG': '+20',
  'SV': '+503', 'GQ': '+240', 'ER': '+291', 'EE': '+372', 'SZ': '+268',
  'ET': '+251', 'FJ': '+679', 'FI': '+358', 'FR': '+33', 'GA': '+241',
  'GM': '+220', 'GE': '+995', 'DE': '+49', 'GH': '+233', 'GR': '+30',
  'GD': '+1 473', 'GT': '+502', 'GN': '+224', 'GW': '+245', 'GY': '+592',
  'HT': '+509', 'HN': '+504', 'HU': '+36', 'IS': '+354', 'IN': '+91',
  'ID': '+62', 'IR': '+98', 'IQ': '+964', 'IE': '+353', 'IL': '+972',
  'IT': '+39', 'JM': '+1 876', 'JP': '+81', 'JO': '+962', 'KZ': '+7',
  'KE': '+254', 'KI': '+686', 'KP': '+850', 'KR': '+82', 'KW': '+965',
  'KG': '+996', 'LA': '+856', 'LV': '+371', 'LB': '+961', 'LS': '+266',
  'LR': '+231', 'LY': '+218', 'LI': '+423', 'LT': '+370', 'LU': '+352',
  'MG': '+261', 'MW': '+265', 'MY': '+60', 'MV': '+960', 'ML': '+223',
  'MT': '+356', 'MH': '+692', 'MR': '+222', 'MU': '+230', 'MX': '+52',
  'FM': '+691', 'MD': '+373', 'MC': '+377', 'MN': '+976', 'ME': '+382',
  'MA': '+212', 'MZ': '+258', 'MM': '+95', 'NA': '+264', 'NR': '+674',
  'NP': '+977', 'NL': '+31', 'NZ': '+64', 'NI': '+505', 'NE': '+227',
  'NG': '+234', 'MK': '+389', 'NO': '+47', 'OM': '+968', 'PK': '+92',
  'PW': '+680', 'PS': '+970', 'PA': '+507', 'PG': '+675', 'PY': '+595',
  'PE': '+51', 'PH': '+63', 'PL': '+48', 'PT': '+351', 'QA': '+974',
  'RO': '+40', 'RU': '+7', 'RW': '+250', 'KN': '+1 869', 'LC': '+1 758',
  'VC': '+1 784', 'WS': '+685', 'SM': '+378', 'ST': '+239', 'SA': '+966',
  'SN': '+221', 'RS': '+381', 'SC': '+248', 'SL': '+232', 'SG': '+65',
  'SK': '+421', 'SI': '+386', 'SB': '+677', 'SO': '+252', 'ZA': '+27',
  'SS': '+211', 'ES': '+34', 'LK': '+94', 'SD': '+249', 'SR': '+597',
  'SE': '+46', 'CH': '+41', 'SY': '+963', 'TW': '+886', 'TJ': '+992',
  'TZ': '+255', 'TH': '+66', 'TL': '+670', 'TG': '+228', 'TO': '+676',
  'TT': '+1 868', 'TN': '+216', 'TR': '+90', 'TM': '+993', 'TV': '+688',
  'UG': '+256', 'UA': '+380', 'AE': '+971', 'GB': '+44', 'US': '+1',
  'UY': '+598', 'UZ': '+998', 'VU': '+678', 'VA': '+39', 'VE': '+58',
  'VN': '+84', 'YE': '+967', 'ZM': '+260', 'ZW': '+263', 'SCT': '+44',
  'AS': '+1 684', 'AI': '+1 264', 'AW': '+297', 'BM': '+1 441', 'VG': '+1 284',
  'KY': '+1 345', 'CK': '+682', 'FK': '+500', 'FO': '+298', 'GF': '+594',
  'PF': '+689', 'GI': '+350', 'GL': '+299', 'GP': '+590', 'GU': '+1 671',
  'IM': '+44', 'JE': '+44', 'MO': '+853', 'MQ': '+596',
  'YT': '+262', 'MS': '+1 664', 'NC': '+687', 'NU': '+683', 'NF': '+672',
  'MP': '+1 670', 'RE': '+262', 'SH': '+290', 'PM': '+508', 'TC': '+1 649',
  'TK': '+690', 'WF': '+681', 'EH': '+212',

};
