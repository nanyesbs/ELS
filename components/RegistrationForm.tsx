import React, { useState, useMemo } from 'react';
import { api } from '../services/api';
import { Country, State, City } from 'country-state-city';
import {
  ChevronRight, ChevronLeft, Send, Camera, User,
  Mail, Globe, Phone, Loader2, CheckCircle2, Save, FileImage
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Participant } from '../types';

interface RegistrationFormProps {
  mode: 'create' | 'edit' | 'signup';
  token?: string;
  initialData?: Participant;
  onComplete?: (token?: string) => void;
}

// ─── Role Tags (grouped) ──────────────────────────────────────────────────────
const ROLE_GROUPS: { label: string; roles: string[] }[] = [
  {
    label: 'Senior Leadership',
    roles: ['Senior Pastor', 'Lead Pastor', 'Executive Pastor', 'Associate Pastor', 'Assistant Pastor', 'Campus Pastor'],
  },
  {
    label: 'Five-Fold Ministry',
    roles: ['Apostle', 'Prophet', 'Evangelist', 'Pastor', 'Teacher'],
  },
  {
    label: 'Church Leadership',
    roles: ['Bishop', 'Elder', 'Deacon'],
  },
  {
    label: 'Ministry Leadership',
    roles: [
      'Ministry Director', 'Ministry Leader', 'Department Leader', 'Small Group Leader',
      'Cell Group Leader', 'Discipleship Leader', 'Prayer Leader', 'Worship Leader',
      'Missions Leader', 'Evangelism Leader', 'Youth Leader', 'Young Adults Leader',
      "Children's Ministry Leader", "Women's Ministry Leader", "Men's Ministry Leader",
      'Family Ministry Leader', 'Hospitality Leader', 'Media & Communications Leader',
    ],
  },
  {
    label: 'Administration',
    roles: ['Church Administrator', 'Executive Assistant', 'Operations Manager'],
  },
  {
    label: 'Other Roles',
    roles: ['Missionary', 'Church Planter', 'Volunteer Leader', 'Church Staff', 'Others'],
  },
];

const AREAS_OF_INTEREST = [
  'Leadership', 'Ministry', 'Evangelism', 'Missions', 'Worship', 'Prayer',
  'Discipleship', 'Church Growth', 'Community', 'Family', 'Youth', 'Media',
  'Technology', 'Learning', 'Networking', 'Events', 'Outreach',
];

const TOTAL_STEPS = 4;

const DRAFT_KEY = 'els_registration_draft';

// ─── Shared UI helpers ────────────────────────────────────────────────────────
const inputClass =
  'w-full bg-white border border-[#1552ab]/20 p-4 rounded-xl text-sm font-avenir-medium text-[#1552ab] outline-none focus:border-[#1552ab] focus:ring-2 focus:ring-[#1552ab]/10 transition-all placeholder:text-[#1552ab]/30';
const labelClass =
  'text-[10px] font-avenir-bold uppercase tracking-widest text-[#1552ab]/50 pl-1 block mb-1';
const selectClass =
  'w-full bg-[#f5f5f5] border border-[#1552ab]/20 p-4 rounded-xl text-sm font-avenir-medium text-[#1552ab] outline-none focus:border-[#1552ab] transition-all';

function SectionHeader({ step, title }: { step: number; title: string }) {
  return (
    <div className="border-l-4 border-[#1552ab] pl-5 space-y-1 mb-8">
      <p className="text-[10px] font-avenir-bold text-[#1552ab]/50 uppercase tracking-[3px]">
        Section {step} of {TOTAL_STEPS}
      </p>
      <h4 className="text-lg font-avenir-bold text-[#1552ab] uppercase tracking-wider">{title}</h4>
    </div>
  );
}

function TagButton({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 text-[10px] font-avenir-bold uppercase tracking-wider rounded-lg border transition-all ${
        selected
          ? 'bg-[#1552ab] border-[#1552ab] text-white shadow-sm'
          : 'border-[#1552ab]/20 text-[#1552ab]/60 hover:border-[#1552ab]/60 bg-white'
      }`}
    >
      {label}
    </button>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
const RegistrationForm: React.FC<RegistrationFormProps> = ({ mode, token, initialData, onComplete }) => {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // ── Form state ──────────────────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    // Section 1
    email: initialData?.email || '',
    name: initialData?.name || '',
    country: initialData?.country || '',
    state: initialData?.state || '',
    city: initialData?.city || '',
    nationality: initialData?.nationality || '',
    short_bio: initialData?.short_bio || '',
    // Section 2
    organization: initialData?.organization || '',
    org_description: initialData?.org_description || '',
    // Section 3
    public_phone: initialData?.public_phone || '',
    public_email: initialData?.public_email || '',
    public_website: initialData?.public_website || '',
    public_other: initialData?.public_other || '',
    // Section 4
    testimony: initialData?.testimony || '',
    upcoming_kingdom_events: initialData?.upcoming_kingdom_events || '',
    dietary_restrictions: initialData?.dietary_restrictions || '',
  });

  const [selectedRoles, setSelectedRoles] = useState<string[]>(initialData?.role_tags || []);
  const [selectedInterests, setSelectedInterests] = useState<string[]>(initialData?.areas_of_interest || []);

  // Profile photo
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState<string>(initialData?.photo_url || '');

  // Promo photo
  const [promoFile, setPromoFile] = useState<File | null>(null);
  const [promoPreview, setPromoPreview] = useState<string>(initialData?.promotional_picture_url || '');

  const allCountries = useMemo(() => Country.getAllCountries(), []);

  // Derived state/city lists based on selected country/state
  const selectedCountryIso = useMemo(
    () => allCountries.find(c => c.name === formData.country)?.isoCode || '',
    [formData.country, allCountries]
  );
  const selectedStateIso = useMemo(
    () => State.getStatesOfCountry(selectedCountryIso).find(s => s.name === formData.state)?.isoCode || '',
    [formData.state, selectedCountryIso]
  );
  const statesList = useMemo(
    () => selectedCountryIso ? State.getStatesOfCountry(selectedCountryIso) : [],
    [selectedCountryIso]
  );
  const citiesList = useMemo(
    () => selectedCountryIso && selectedStateIso ? City.getCitiesOfState(selectedCountryIso, selectedStateIso) : [],
    [selectedCountryIso, selectedStateIso]
  );

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) { alert('Max file size: 5MB.'); return; }
      setProfileFile(file);
      setProfilePreview(URL.createObjectURL(file));
    }
  };

  const handlePromoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) { alert('Max file size: 10MB.'); return; }
      setPromoFile(file);
      setPromoPreview(URL.createObjectURL(file));
    }
  };

  const toggleRole = (r: string) =>
    setSelectedRoles((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]));

  const toggleInterest = (i: string) =>
    setSelectedInterests((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));

  const handleNext = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  const handleBack = () => setStep((s) => Math.max(s - 1, 1));

  // Validate required fields per step before advancing
  const validateStep = (s: number): string | null => {
    if (s === 1) {
      if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
        return 'Please enter a valid email address.';
      if (!formData.name.trim()) return 'Full name is required.';
      if (!formData.nationality) return 'Nationality is required.';
    }
    if (s === 2) {
      if (!formData.organization.trim()) return 'Ministry / Organization name is required.';
      if (selectedRoles.length === 0) return 'Please select at least one role.';
      if (!profilePreview && (mode === 'create' || mode === 'signup'))
        return 'A profile photo is required.';
    }
    if (s === 4) {
      if (!formData.testimony.trim()) return 'Testimony is required.';
      if (!formData.dietary_restrictions.trim())
        return 'Please state dietary restrictions or write N/A.';
    }
    return null;
  };

  const handleNextValidated = () => {
    const err = validateStep(step);
    if (err) { setErrorMessage(err); return; }
    setErrorMessage('');
    handleNext();
  };

  // Save draft to localStorage
  const handleSaveDraft = () => {
    const draft = { formData, selectedRoles, selectedInterests, profilePreview, promoPreview };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    alert('Draft saved locally.');
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateStep(4);
    if (err) { setErrorMessage(err); return; }

    setLoading(true);
    setStatus('saving');
    setErrorMessage('');

    try {
      // 1. Upload profile photo
      let uploadedPhotoUrl = initialData?.photo_url || '';
      if (profileFile) {
        const photoToken = token || `signup-${Date.now()}`;
        uploadedPhotoUrl = await api.uploadImage(profileFile, `avatar-${photoToken}`);
      }
      if (!uploadedPhotoUrl && (mode === 'create' || mode === 'signup')) {
        throw new Error('Please upload a profile photo.');
      }

      // 2. Upload promo photo (optional)
      let uploadedPromoUrl = initialData?.promotional_picture_url || '';
      if (promoFile) {
        const promoToken = token || `promo-${Date.now()}`;
        uploadedPromoUrl = await api.uploadImage(promoFile, `promo-${promoToken}`);
      }

      // 3. Build payload
      const roleString = selectedRoles.join(', ');
      const payload: Partial<Participant> = {
        name: formData.name,
        email: formData.email,
        country: formData.country,
        state: formData.state,
        city: formData.city,
        nationality: formData.nationality,
        short_bio: formData.short_bio,
        organization: formData.organization,
        role: roleString,          // legacy text field — keeps AdminConsole working
        role_tags: selectedRoles,
        org_description: formData.org_description,
        photo_url: uploadedPhotoUrl,
        promotional_picture_url: uploadedPromoUrl || undefined,
        public_phone: formData.public_phone,
        public_email: formData.public_email,
        public_website: formData.public_website,
        public_other: formData.public_other,
        areas_of_interest: selectedInterests,
        testimony: formData.testimony,
        upcoming_kingdom_events: formData.upcoming_kingdom_events,
        dietary_restrictions: formData.dietary_restrictions,
      };

      // 4. Submit
      if (mode === 'signup') {
        const result = await api.registerParticipant(formData.name, formData.email, payload);
        if (!result.success) throw new Error(result.error || 'Registration failed.');
        if (result.duplicate) {
          setStatus('success');
          setErrorMessage('duplicate');
        } else {
          setStatus('success');
          if (result.token && onComplete) onComplete(result.token);
          else setStatus('success');
        }
      } else {
        const success = await api.submitBioByToken(token!, payload);
        if (!success) throw new Error('Failed to save profile. Token might be expired.');
        localStorage.removeItem(DRAFT_KEY);
        setStatus('success');
        if (onComplete) onComplete();
      }
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setErrorMessage(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  // ── Success screen ───────────────────────────────────────────────────────────
  if (status === 'success') {
    const isDuplicate = errorMessage === 'duplicate';
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4 max-w-xl mx-auto">
        <div className="w-20 h-20 bg-[#1552ab]/10 rounded-full flex items-center justify-center mb-8 border border-[#1552ab]/20">
          <CheckCircle2 size={36} className="text-[#1552ab]" />
        </div>
        <h2 className="text-3xl font-extrabold text-[#1552ab] uppercase tracking-tight mb-4">
          {isDuplicate ? 'Access Link Sent!' : t('registration.completeTitle', 'Profile Synchronized!')}
        </h2>
        <p className="text-[#1552ab]/60 text-sm leading-relaxed mb-12">
          {isDuplicate
            ? `${formData.email} is already registered. A new access link has been sent.`
            : t('registration.completeDesc', 'Your bio has been saved. An email was sent with your permanent access link.')}
        </p>
        {!isDuplicate && onComplete && (
          <button
            onClick={() => onComplete()}
            className="px-10 py-5 bg-[#1552ab] hover:bg-[#1552ab]/90 text-white rounded-xl font-avenir-bold uppercase text-[10px] tracking-[4px] transition-all"
          >
            {t('registration.returnDir', 'Go to Directory')}
          </button>
        )}
      </div>
    );
  }

  // ── Stepper ─────────────────────────────────────────────────────────────────
  const stepLabels = ['Personal', 'Ministry', 'Contact', 'Testimonies'];

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-12 text-center">
        <h2 className="text-xs font-avenir-bold text-[#1552ab] uppercase tracking-[0.4em] mb-3">
          ELS Madrid 2026
        </h2>
        <h1 className="text-3xl md:text-4xl font-extrabold text-[#1552ab] uppercase tracking-tight italic mb-8">
          {mode === 'edit' ? 'Edit Your Bio' : 'Complete Your Bio'}
        </h1>

        {/* Step indicators */}
        <div className="max-w-lg mx-auto flex items-center justify-between relative px-4">
          <div className="absolute top-5 left-8 right-8 h-[2px] bg-[#1552ab]/10 rounded-full" />
          {stepLabels.map((label, i) => {
            const num = i + 1;
            const isActive = step === num;
            const isDone = step > num;
            return (
              <div key={num} className="flex flex-col items-center gap-1.5 relative z-10">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-avenir-bold transition-all duration-300 border-2 ${
                    isActive
                      ? 'bg-white border-[#1552ab] text-[#1552ab] scale-110 shadow-sm'
                      : isDone
                      ? 'bg-[#1552ab] border-[#1552ab] text-white'
                      : 'bg-[#efefef] border-[#1552ab]/15 text-[#1552ab]/30'
                  }`}
                >
                  {isDone ? <CheckCircle2 size={14} /> : `0${num}`}
                </div>
                <span className={`text-[9px] font-avenir-bold uppercase tracking-wider ${isActive ? 'text-[#1552ab]' : 'text-[#1552ab]/30'}`}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Form card */}
      <div className="bg-white border border-[#1552ab]/10 rounded-3xl p-6 sm:p-10 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-8">

          {/* ── STEP 1: Personal Information ─────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <SectionHeader step={1} title="Personal Information" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                <div className="space-y-1 md:col-span-2">
                  <label className={labelClass}>Email Address *</label>
                  <input
                    type="email" name="email" value={formData.email} onChange={handleChange}
                    required className={inputClass} placeholder="your@email.com"
                    readOnly={mode === 'edit'}
                  />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className={labelClass}>Full Name *</label>
                  <input
                    type="text" name="name" value={formData.name} onChange={handleChange}
                    required className={inputClass} placeholder="Full Name"
                  />
                  <p className="text-[9px] text-[#1552ab]/40 pl-1 mt-0.5">This name will appear on your badge.</p>
                </div>

                {/* Country / State / City cascade */}
                <div className="space-y-1 md:col-span-2">
                  <label className={labelClass}>Resident Country</label>
                  <select
                    name="country"
                    value={formData.country}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, country: e.target.value, state: '', city: '' }));
                    }}
                    className={selectClass}
                  >
                    <option value="">Select country</option>
                    {allCountries.map((c) => (
                      <option key={c.isoCode} value={c.name}>{c.flag} {c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className={labelClass}>State / Province / Region</label>
                  <select
                    name="state"
                    value={formData.state}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, state: e.target.value, city: '' }));
                    }}
                    className={selectClass}
                    disabled={statesList.length === 0}
                  >
                    <option value="">{statesList.length === 0 ? 'Select country first' : 'Select state'}</option>
                    {statesList.map((s) => (
                      <option key={s.isoCode} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className={labelClass}>City</label>
                  <select
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className={selectClass}
                    disabled={citiesList.length === 0}
                  >
                    <option value="">{citiesList.length === 0 ? (formData.state ? 'No cities available' : 'Select state first') : 'Select city'}</option>
                    {citiesList.map((c, i) => (
                      <option key={i} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className={labelClass}>Nationality *</label>
                  <select name="nationality" value={formData.nationality} onChange={handleChange} required className={selectClass}>
                    <option value="">Select nationality</option>
                    {allCountries.map((c) => (
                      <option key={c.isoCode} value={c.name}>{c.flag} {c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className={labelClass}>Bio / Background</label>
                  <textarea
                    name="short_bio" value={formData.short_bio} onChange={handleChange}
                    rows={4} maxLength={600}
                    className={`${inputClass} resize-none`}
                    placeholder="Brief background and vision..."
                  />
                  <p className="text-[9px] text-[#1552ab]/30 pl-1 text-right">{600 - formData.short_bio.length} chars left</p>
                </div>

              </div>
            </div>
          )}

          {/* ── STEP 2: Ministry Information ─────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-8 animate-fade-in">
              <SectionHeader step={2} title="Ministry Information" />

              <div className="space-y-1">
                <label className={labelClass}>Name of Ministry / Church / Organization / Business *</label>
                <input
                  type="text" name="organization" value={formData.organization} onChange={handleChange}
                  required className={inputClass} placeholder="Organization Name"
                />
              </div>

              {/* Role tags grouped */}
              <div className="space-y-4">
                <label className={labelClass}>Role(s) in the Organization *</label>
                {ROLE_GROUPS.map((group) => (
                  <div key={group.label} className="space-y-2">
                    <p className="text-[9px] font-avenir-bold text-[#1552ab]/40 uppercase tracking-widest pl-1">
                      {group.label}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {group.roles.map((r) => (
                        <TagButton key={r} label={r} selected={selectedRoles.includes(r)} onClick={() => toggleRole(r)} />
                      ))}
                    </div>
                  </div>
                ))}
                {selectedRoles.length > 0 && (
                  <p className="text-[9px] text-[#1552ab]/50 pl-1 pt-1">
                    Selected: {selectedRoles.join(', ')}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className={labelClass}>Description of Your Organization</label>
                <textarea
                  name="org_description" value={formData.org_description} onChange={handleChange}
                  rows={3} className={`${inputClass} resize-none`}
                  placeholder="Brief description of your ministry or organization..."
                />
              </div>

              {/* Profile photo */}
              <div className="p-6 bg-[#efefef]/50 rounded-2xl border border-[#1552ab]/10 space-y-4">
                <label className={labelClass}>Profile Photo * — This photo will appear in the Leaders' Brochure</label>
                <div className="flex items-center gap-6">
                  <div className="relative w-20 h-20 rounded-full border-2 border-[#1552ab]/20 bg-white overflow-hidden flex items-center justify-center shrink-0 group cursor-pointer">
                    {profilePreview
                      ? <img src={profilePreview} alt="Profile" className="w-full h-full object-cover" />
                      : <User className="text-[#1552ab]/20" size={28} />}
                    <label className="absolute inset-0 bg-[#1552ab]/10 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                      <Camera className="text-[#1552ab]" size={16} />
                      <input type="file" accept="image/jpeg,image/png" onChange={handleProfileFile} className="hidden" />
                    </label>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] text-[#1552ab]/50 leading-relaxed">JPG or PNG · Max 5MB · Clear portrait photo</p>
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-[#1552ab]/20 hover:border-[#1552ab]/60 text-[#1552ab] rounded-lg text-[10px] font-avenir-bold uppercase tracking-wider transition-all cursor-pointer">
                      <Camera size={12} /> Choose Photo
                      <input type="file" accept="image/jpeg,image/png" onChange={handleProfileFile} className="hidden" />
                    </label>
                  </div>
                </div>
              </div>

              {/* Promo photo */}
              <div className="p-6 bg-[#efefef]/50 rounded-2xl border border-[#1552ab]/10 space-y-4">
                <label className={labelClass}>Company Flyer / Logo / Promo (Optional)</label>
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-xl border-2 border-[#1552ab]/10 bg-white overflow-hidden flex items-center justify-center shrink-0">
                    {promoPreview
                      ? <img src={promoPreview} alt="Promo" className="w-full h-full object-cover" />
                      : <FileImage className="text-[#1552ab]/20" size={28} />}
                  </div>
                  <label className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-[#1552ab]/20 hover:border-[#1552ab]/60 text-[#1552ab] rounded-lg text-[10px] font-avenir-bold uppercase tracking-wider transition-all cursor-pointer">
                    <FileImage size={12} /> Choose File
                    <input type="file" accept="image/jpeg,image/png" onChange={handlePromoFile} className="hidden" />
                  </label>
                </div>
              </div>

            </div>
          )}

          {/* ── STEP 3: Public Contact Information ───────────────────────── */}
          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <SectionHeader step={3} title="Public Contact Information" />
              <div className="p-4 bg-[#1552ab]/5 border border-[#1552ab]/15 rounded-xl">
                <p className="text-[11px] text-[#1552ab]/70 leading-relaxed font-avenir-medium">
                  ℹ️ This information will be public and visible to other attendees in the directory.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                <div className="space-y-1">
                  <label className={`${labelClass} flex items-center gap-1.5`}><Phone size={10} /> Phone Number</label>
                  <input
                    type="tel" name="public_phone" value={formData.public_phone} onChange={handleChange}
                    className={inputClass} placeholder="+1 234 567 890"
                  />
                </div>

                <div className="space-y-1">
                  <label className={`${labelClass} flex items-center gap-1.5`}><Mail size={10} /> Email Address (public)</label>
                  <input
                    type="email" name="public_email" value={formData.public_email} onChange={handleChange}
                    className={inputClass} placeholder="public@email.com"
                  />
                </div>

                <div className="space-y-1">
                  <label className={`${labelClass} flex items-center gap-1.5`}><Globe size={10} /> Website</label>
                  <input
                    type="url" name="public_website" value={formData.public_website} onChange={handleChange}
                    className={inputClass} placeholder="https://..."
                  />
                </div>

                <div className="space-y-1">
                  <label className={labelClass}>Other (Instagram / Social)</label>
                  <input
                    type="text" name="public_other" value={formData.public_other} onChange={handleChange}
                    className={inputClass} placeholder="@instagram / handle"
                  />
                </div>

              </div>
            </div>
          )}

          {/* ── STEP 4: Testimonies & Additional Information ─────────────── */}
          {step === 4 && (
            <div className="space-y-6 animate-fade-in">
              <SectionHeader step={4} title="Testimonies & Additional Information" />

              <div className="space-y-1">
                <label className={labelClass}>Testimony * — Share what God has done through your ministry last year</label>
                <textarea
                  name="testimony" value={formData.testimony} onChange={handleChange}
                  required rows={5} className={`${inputClass} resize-none`}
                  placeholder="Share what God has done through your ministry..."
                />
              </div>

              <div className="space-y-1">
                <label className={labelClass}>Upcoming Kingdom Events</label>
                <textarea
                  name="upcoming_kingdom_events" value={formData.upcoming_kingdom_events} onChange={handleChange}
                  rows={3} className={`${inputClass} resize-none`}
                  placeholder="Future events with national or continental impact (dates, location, vision)"
                />
              </div>

              <div className="space-y-1">
                <label className={labelClass}>Dietary Restrictions *</label>
                <input
                  type="text" name="dietary_restrictions" value={formData.dietary_restrictions}
                  onChange={handleChange} required className={inputClass}
                  placeholder="State dietary restrictions or write N/A"
                />
              </div>

              {/* Areas of interest */}
              <div className="space-y-3">
                <label className={labelClass}>Areas of Interest (Select all that apply)</label>
                <div className="flex flex-wrap gap-2">
                  {AREAS_OF_INTEREST.map((area) => (
                    <TagButton
                      key={area} label={area}
                      selected={selectedInterests.includes(area)}
                      onClick={() => toggleInterest(area)}
                    />
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* ── Error message ───────────────────────────────────────────────── */}
          {errorMessage && errorMessage !== 'duplicate' && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-600 text-xs font-avenir-bold rounded-xl uppercase tracking-wider text-center">
              {errorMessage}
            </div>
          )}

          {/* ── Navigation ──────────────────────────────────────────────────── */}
          <div className="flex justify-between items-center pt-8 border-t border-[#1552ab]/10">
            {step > 1 ? (
              <button
                type="button" onClick={handleBack} disabled={loading}
                className="px-6 py-3 border border-[#1552ab]/20 text-[#1552ab]/60 rounded-xl font-avenir-bold uppercase text-[10px] tracking-[3px] hover:text-[#1552ab] hover:border-[#1552ab]/50 transition-all flex items-center gap-2"
              >
                <ChevronLeft size={14} /> Back
              </button>
            ) : <div />}

            <div className="flex items-center gap-3">
              {step < TOTAL_STEPS ? (
                <button
                  type="button" onClick={handleNextValidated}
                  className="px-7 py-3 bg-[#1552ab] text-white rounded-xl font-avenir-bold uppercase text-[10px] tracking-[3px] hover:bg-[#0f387a] transition-all flex items-center gap-2 shadow-sm"
                >
                  Next <ChevronRight size={14} />
                </button>
              ) : (
                <>
                  <button
                    type="button" onClick={handleSaveDraft} disabled={loading}
                    className="px-5 py-3 border border-[#1552ab]/20 text-[#1552ab]/60 rounded-xl font-avenir-bold uppercase text-[10px] tracking-[3px] hover:text-[#1552ab] hover:border-[#1552ab]/50 transition-all flex items-center gap-2"
                  >
                    <Save size={13} /> Save Draft
                  </button>
                  <button
                    type="submit" disabled={loading}
                    className="px-7 py-3 bg-[#1552ab] text-white rounded-xl font-avenir-bold uppercase text-[10px] tracking-[4px] hover:bg-[#0f387a] transition-all flex items-center gap-2 shadow-sm active:scale-95"
                  >
                    {loading ? (
                      <><Loader2 size={13} className="animate-spin" /><span>Synchronizing...</span></>
                    ) : (
                      <><Send size={13} /> Synchronize Bio</>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};

export default RegistrationForm;
