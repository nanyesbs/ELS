import React, { useState, useMemo } from 'react';
import { api } from '../services/api';
import { Country } from 'country-state-city';
import { ChevronRight, ChevronLeft, Send, Camera, Sparkles, User, Mail, Globe, Phone, Building, Info, Loader2, CheckCircle2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Participant, SocialAccount } from '../types';

interface RegistrationFormProps {
    mode: 'create' | 'edit' | 'signup';
    token?: string;
    initialData?: Participant;
    onComplete?: (token?: string) => void;
}

const INTERESTS_OPTIONS = [
  'Church Planting', 'Youth Ministry', 'Worship & Arts', 'Missions & Mobilization', 
  'Business as Mission', 'Technology & AI', 'Media & Communications', 'Prayer & Intercession', 
  'Evangelism', 'Theological Education', 'Social Justice & Mercy', 'Family & Marriage'
];

const LANGUAGES_OPTIONS = [
  'English', 'Spanish', 'German', 'French', 'Portuguese', 'Italian', 'Dutch', 'Russian', 'Chinese', 'Korean'
];

const RegistrationForm: React.FC<RegistrationFormProps> = ({ mode, token, initialData, onComplete }) => {
    const { t } = useTranslation();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        country: initialData?.country || '',
        city: initialData?.city || '',
        organization: initialData?.organization || '',
        church: initialData?.church || '',
        ministry: initialData?.ministry || '',
        role: initialData?.role || '',
        short_bio: initialData?.short_bio || '',
        email: initialData?.email || '',
        phone: initialData?.phone || '',
        photo_url: initialData?.photo_url || '',
    });

    const [selectedInterests, setSelectedInterests] = useState<string[]>(initialData?.areas_of_interest || []);
    const [selectedLanguages, setSelectedLanguages] = useState<string[]>(initialData?.languages_spoken || []);
    const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>(initialData?.social_media || [
        { platform: 'Instagram', handle: '' },
        { platform: 'LinkedIn', handle: '' },
        { platform: 'Website', handle: '' }
    ]);

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>(initialData?.photo_url || '');

    const allCountries = useMemo(() => Country.getAllCountries(), []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 5 * 1024 * 1024) {
                alert('File size exceeds the 5MB limit.');
                return;
            }
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const toggleInterest = (interest: string) => {
        setSelectedInterests(prev => 
            prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
        );
    };

    const toggleLanguage = (lang: string) => {
        setSelectedLanguages(prev => 
            prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
        );
    };

    const handleSocialChange = (index: number, value: string) => {
        setSocialAccounts(prev => {
            const next = [...prev];
            next[index].handle = value;
            return next;
        });
    };

    const handleNext = () => setStep(prev => Math.min(prev + 1, 3));
    const handleBack = () => setStep(prev => Math.max(prev - 1, 1));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setStatus('saving');
        setErrorMessage('');

        try {
            let uploadedPhotoUrl = formData.photo_url;

            // 1. Upload photo if a new one is selected
            if (selectedFile) {
                const photoToken = token || `signup-${Date.now()}`;
                uploadedPhotoUrl = await api.uploadImage(selectedFile, `avatar-${photoToken}`);
            }

            if (!uploadedPhotoUrl && (mode === 'create' || mode === 'signup')) {
                throw new Error('Please upload a profile photo.');
            }

            // 2. Build payload matching snake_case schema columns
            const payload: Partial<Participant> = {
                name: formData.name,
                country: formData.country,
                city: formData.city,
                organization: formData.organization,
                church: formData.church,
                ministry: formData.ministry,
                role: formData.role,
                short_bio: formData.short_bio,
                email: formData.email,
                phone: formData.phone,
                photo_url: uploadedPhotoUrl,
                social_media: socialAccounts.filter(s => s.handle.trim() !== ''),
                areas_of_interest: selectedInterests,
                languages_spoken: selectedLanguages
            };

            // 3. Submit payload
            if (mode === 'signup') {
                const result = await api.registerParticipant(formData.name, formData.email, payload);
                if (!result.success) {
                    throw new Error(result.error || 'Failed to complete registration.');
                }
                if (result.duplicate) {
                    setStatus('success');
                    setErrorMessage('duplicate');
                } else if (result.token) {
                    setStatus('success');
                    if (onComplete) {
                        onComplete(result.token);
                    }
                } else {
                    setStatus('success');
                }
            } else {
                const success = await api.submitBioByToken(token!, payload);
                if (!success) {
                    throw new Error('Failed to save profile. Token might be expired or invalid.');
                }
                setStatus('success');
                if (onComplete) {
                    onComplete();
                }
            }
        } catch (err: any) {
            console.error(err);
            setStatus('error');
            setErrorMessage(err.message || 'An error occurred while saving your profile.');
        } finally {
            setLoading(false);
        }
    };

    if (status === 'success') {
        const isDuplicate = errorMessage === 'duplicate';
        return (
            <div className="flex flex-col items-center justify-center py-20 animate-fade-in text-center px-4 max-w-xl mx-auto">
                <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-8 border border-green-500/20 shadow-glow">
                    <CheckCircle2 size={36} className="text-[#1552ab] dark:text-green-600" />
                </div>
                <h2 className="text-3xl font-extrabold text-white dark:text-black uppercase tracking-tight mb-4">
                    {isDuplicate ? 'Access Link Sent!' : t('registration.completeTitle', 'Profile Synchronized!')}
                </h2>
                <p className="text-white/60 dark:text-black/60 text-sm leading-relaxed mb-12">
                    {isDuplicate
                        ? `${formData.email} is already registered. A new access link has been sent.`
                        : t('registration.completeDesc', 'Your bio has been saved successfully. An email has been sent containing your dashboard link and a permanent link to edit your details in the future.')}
                </p>
                {!isDuplicate && onComplete && (
                    <button
                        onClick={() => onComplete()}
                        className="px-10 py-5 bg-[#1552ab] hover:bg-[#1552ab]/90 text-white rounded-xl font-avenir-bold uppercase text-[10px] tracking-[4px] shadow-glow active:scale-95 transition-all"
                    >
                        {t('registration.returnDir', 'Go to Directory')}
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="w-full max-w-3xl mx-auto">
            {/* Header Section */}
            <div className="mb-16 text-center">
                <h2 className="text-xs font-avenir-bold text-[#1552ab] uppercase tracking-[0.4em] mb-4">
                    {t('registration.protocol', 'ELS Madrid 2026')}
                </h2>
                <h1 className="text-3xl md:text-5xl font-extrabold text-white dark:text-black uppercase tracking-tight leading-none italic mb-8">
                    {mode === 'create' ? t('registration.title', 'Complete Your Bio') : 'Edit Your Bio'}
                </h1>
                
                {/* Stepper bar */}
                <div className="max-w-md mx-auto relative flex items-center justify-between mb-12 px-6">
                    {[1, 2, 3].map(num => (
                        <div key={num} className="flex flex-col items-center gap-2 relative z-10">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-avenir-bold transition-all duration-300 border-2 ${
                                step === num 
                                    ? 'bg-black dark:bg-white border-[#1552ab] text-[#1552ab] scale-110' 
                                    : step > num 
                                        ? 'bg-[#1552ab] border-[#1552ab] text-white' 
                                        : 'bg-white/5 dark:bg-black/5 border-white/10 dark:border-black/10 text-white/40 dark:text-black/40'
                            }`}>
                                {step > num ? <CheckCircle2 size={16} /> : `0${num}`}
                            </div>
                        </div>
                    ))}
                    <div className="absolute top-5 left-10 right-10 h-[2px] bg-white/10 dark:bg-black/10 -z-10 rounded-full" />
                </div>
            </div>

            <div className="bg-white/5 dark:bg-black/5 border border-white/10 dark:border-black/5 rounded-3xl p-6 sm:p-10 md:p-12 relative overflow-hidden backdrop-blur-2xl">
                <div className="absolute top-0 right-0 w-48 h-48 bg-[#1552ab]/5 blur-[80px] pointer-events-none" />

                <form onSubmit={handleSubmit} className="space-y-8 relative">
                    
                    {/* STEP 1: Basic Bio Info */}
                    {step === 1 && (
                        <div className="animate-slide-up space-y-6">
                            <div className="border-l-2 border-[#1552ab] pl-6 space-y-2 mb-8">
                                <h3 className="text-[10px] font-avenir-bold text-[#1552ab] uppercase tracking-[3px]">Section 1 of 3</h3>
                                <h4 className="text-lg font-avenir-bold text-white dark:text-black uppercase tracking-wider">Bio Profile Credentials</h4>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-avenir-bold uppercase tracking-widest text-white/50 dark:text-black/50 pl-1 block">Full Name *</label>
                                    <input
                                        type="text" name="name" value={formData.name} onChange={handleChange} required
                                        className="w-full bg-white/5 dark:bg-black/5 border border-white/10 dark:border-black/10 p-4 rounded-xl text-sm font-avenir-medium text-white dark:text-black outline-none focus:border-[#1552ab] transition-all"
                                        placeholder="Full Name"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-avenir-bold uppercase tracking-widest text-white/50 dark:text-black/50 pl-1 block">Country *</label>
                                    <select
                                        name="country" value={formData.country} onChange={handleChange} required
                                        className="w-full bg-[#151515] dark:bg-[#f5f5f5] border border-white/10 dark:border-black/10 p-4 rounded-xl text-sm font-avenir-medium text-white dark:text-black outline-none focus:border-[#1552ab] transition-all"
                                    >
                                        <option value="" disabled>Select country</option>
                                        {allCountries.map(c => (
                                            <option key={c.isoCode} value={c.name}>{c.flag} {c.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-avenir-bold uppercase tracking-widest text-white/50 dark:text-black/50 pl-1 block">City *</label>
                                    <input
                                        type="text" name="city" value={formData.city} onChange={handleChange} required
                                        className="w-full bg-white/5 dark:bg-black/5 border border-white/10 dark:border-black/10 p-4 rounded-xl text-sm font-avenir-medium text-white dark:text-black outline-none focus:border-[#1552ab] transition-all"
                                        placeholder="City (e.g. Madrid)"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-avenir-bold uppercase tracking-widest text-white/50 dark:text-black/50 pl-1 block">Role / Position *</label>
                                    <input
                                        type="text" name="role" value={formData.role} onChange={handleChange} required
                                        className="w-full bg-white/5 dark:bg-black/5 border border-white/10 dark:border-black/10 p-4 rounded-xl text-sm font-avenir-medium text-white dark:text-black outline-none focus:border-[#1552ab] transition-all"
                                        placeholder="e.g. Executive Director, Pastor, Leader"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-avenir-bold uppercase tracking-widest text-white/50 dark:text-black/50 pl-1 block">Organization Name *</label>
                                    <input
                                        type="text" name="organization" value={formData.organization} onChange={handleChange} required
                                        className="w-full bg-white/5 dark:bg-black/5 border border-white/10 dark:border-black/10 p-4 rounded-xl text-sm font-avenir-medium text-white dark:text-black outline-none focus:border-[#1552ab] transition-all"
                                        placeholder="Organization Name"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-avenir-bold uppercase tracking-widest text-white/50 dark:text-black/50 pl-1 block">Church Name *</label>
                                    <input
                                        type="text" name="church" value={formData.church} onChange={handleChange} required
                                        className="w-full bg-white/5 dark:bg-black/5 border border-white/10 dark:border-black/10 p-4 rounded-xl text-sm font-avenir-medium text-white dark:text-black outline-none focus:border-[#1552ab] transition-all"
                                        placeholder="Church Name"
                                    />
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-[10px] font-avenir-bold uppercase tracking-widest text-white/50 dark:text-black/50 pl-1 block">Ministry / Field *</label>
                                    <input
                                        type="text" name="ministry" value={formData.ministry} onChange={handleChange} required
                                        className="w-full bg-white/5 dark:bg-black/5 border border-white/10 dark:border-black/10 p-4 rounded-xl text-sm font-avenir-medium text-white dark:text-black outline-none focus:border-[#1552ab] transition-all"
                                        placeholder="Primary Ministry Focus (e.g. Media Missions, Church Planting)"
                                    />
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <div className="flex justify-between items-center pl-1">
                                        <label className="text-[10px] font-avenir-bold uppercase tracking-widest text-white/50 dark:text-black/50 block">Short Bio *</label>
                                        <span className="text-[9px] font-avenir-bold text-[#1552ab]/70 uppercase">{500 - formData.short_bio.length} chars left</span>
                                    </div>
                                    <textarea
                                        name="short_bio" value={formData.short_bio} onChange={handleChange} required maxLength={500} rows={4}
                                        className="w-full bg-white/5 dark:bg-black/5 border border-white/10 dark:border-black/10 p-4 rounded-xl text-sm font-avenir-medium text-white dark:text-black outline-none focus:border-[#1552ab] transition-all resize-none"
                                        placeholder="A brief bio summarizing your story, mission, and background (max 500 characters)..."
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: Photo upload & selections */}
                    {step === 2 && (
                        <div className="animate-slide-up space-y-6">
                            <div className="border-l-2 border-[#1552ab] pl-6 space-y-2 mb-8">
                                <h3 className="text-[10px] font-avenir-bold text-[#1552ab] uppercase tracking-[3px]">Section 2 of 3</h3>
                                <h4 className="text-lg font-avenir-bold text-white dark:text-black uppercase tracking-wider">Media & Engagement parameters</h4>
                            </div>

                            {/* Photo upload section */}
                            <div className="flex flex-col sm:flex-row gap-6 items-center bg-white/2 dark:bg-black/2 p-6 rounded-2xl border border-white/5 dark:border-black/5">
                                <div className="relative w-24 h-24 rounded-full border border-white/10 dark:border-black/10 bg-black/40 overflow-hidden flex items-center justify-center shadow-inner shrink-0 group">
                                    {previewUrl ? (
                                        <img src={previewUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="text-white/20 dark:text-black/20" size={32} />
                                    )}
                                    <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                                        <Camera className="text-white" size={20} />
                                        <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                                    </label>
                                </div>
                                <div className="space-y-1 text-center sm:text-left">
                                    <h4 className="text-xs font-avenir-bold text-white dark:text-black uppercase tracking-wider">Profile Photo Upload *</h4>
                                    <p className="text-[10px] text-white/40 dark:text-black/40 leading-relaxed max-w-sm">
                                        Please upload a clear portrait of yourself. It will be printed in the participant networking brochure. Max file size: 5MB.
                                    </p>
                                    <label className="mt-2 inline-flex items-center gap-2 px-4 py-2 border border-[#1552ab]/20 hover:border-[#1552ab]/50 hover:bg-[#1552ab]/5 text-[#1552ab] rounded-lg text-[10px] font-avenir-bold uppercase tracking-wider transition-all cursor-pointer">
                                        <Camera size={12} /> Choose Image File
                                        <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                                    </label>
                                </div>
                            </div>

                            {/* Areas of interest */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-avenir-bold uppercase tracking-widest text-white/50 dark:text-black/50 pl-1 block">Areas of Interest (Select all that apply)</label>
                                <div className="flex flex-wrap gap-2">
                                    {INTERESTS_OPTIONS.map(interest => {
                                        const isSelected = selectedInterests.includes(interest);
                                        return (
                                            <button
                                                key={interest} type="button" onClick={() => toggleInterest(interest)}
                                                className={`px-4 py-2 text-[10px] font-avenir-bold uppercase tracking-wider rounded-lg border transition-all ${
                                                    isSelected 
                                                        ? 'bg-[#1552ab] border-[#1552ab] text-white shadow-glow' 
                                                        : 'border-white/10 dark:border-black/10 text-white/50 dark:text-black/50 hover:border-[#1552ab]/50'
                                                }`}
                                            >
                                                {interest}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Languages Spoken */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-avenir-bold uppercase tracking-widest text-white/50 dark:text-black/50 pl-1 block">Languages Spoken (Select all that apply)</label>
                                <div className="flex flex-wrap gap-2">
                                    {LANGUAGES_OPTIONS.map(lang => {
                                        const isSelected = selectedLanguages.includes(lang);
                                        return (
                                            <button
                                                key={lang} type="button" onClick={() => toggleLanguage(lang)}
                                                className={`px-4 py-2 text-[10px] font-avenir-bold uppercase tracking-wider rounded-lg border transition-all ${
                                                    isSelected 
                                                        ? 'bg-[#1552ab] border-[#1552ab] text-white shadow-glow' 
                                                        : 'border-white/10 dark:border-black/10 text-white/50 dark:text-black/50 hover:border-[#1552ab]/50'
                                                }`}
                                            >
                                                {lang}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: Contact & Links */}
                    {step === 3 && (
                        <div className="animate-slide-up space-y-6">
                            <div className="border-l-2 border-[#1552ab] pl-6 space-y-2 mb-8">
                                <h3 className="text-[10px] font-avenir-bold text-[#1552ab] uppercase tracking-[3px]">Section 3 of 3</h3>
                                <h4 className="text-lg font-avenir-bold text-white dark:text-black uppercase tracking-wider">Contact Credentials & Web presence</h4>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-avenir-bold uppercase tracking-widest text-white/50 dark:text-black/50 pl-1 block flex items-center gap-2">
                                        <Mail size={12} /> Contact Email *
                                    </label>
                                    <input
                                        type="email" name="email" value={formData.email} onChange={handleChange} required
                                        className="w-full bg-white/5 dark:bg-black/5 border border-white/10 dark:border-black/10 p-4 rounded-xl text-sm font-avenir-medium text-white dark:text-black outline-none focus:border-[#1552ab] transition-all"
                                        placeholder="public@example.com"
                                    />
                                    <p className="text-[9px] text-white/30 dark:text-black/30 pl-1">Note: This email will be visible to attendees on your profile details card.</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-avenir-bold uppercase tracking-widest text-white/50 dark:text-black/50 pl-1 block flex items-center gap-2">
                                        <Phone size={12} /> Phone Number *
                                    </label>
                                    <input
                                        type="tel" name="phone" value={formData.phone} onChange={handleChange} required
                                        className="w-full bg-white/5 dark:bg-black/5 border border-white/10 dark:border-black/10 p-4 rounded-xl text-sm font-avenir-medium text-white dark:text-black outline-none focus:border-[#1552ab] transition-all"
                                        placeholder="+1 234 567 8900"
                                    />
                                </div>

                                {/* Social handles */}
                                <div className="md:col-span-2 space-y-4 pt-4 border-t border-white/5 dark:border-black/5">
                                    <label className="text-[10px] font-avenir-bold uppercase tracking-widest text-white/50 dark:text-black/50 pl-1 block flex items-center gap-2">
                                        <Globe size={12} /> Social Media Links (Optional)
                                    </label>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        {socialAccounts.map((account, index) => (
                                            <div key={account.platform} className="space-y-2">
                                                <span className="text-[9px] font-avenir-bold uppercase tracking-wide text-white/40 dark:text-black/40 pl-1">{account.platform}</span>
                                                <input
                                                    type="text" 
                                                    value={account.handle} 
                                                    onChange={e => handleSocialChange(index, e.target.value)}
                                                    className="w-full bg-white/5 dark:bg-black/5 border border-white/10 dark:border-black/10 p-4 rounded-xl text-xs font-avenir-medium text-white dark:text-black outline-none focus:border-[#1552ab] transition-all"
                                                    placeholder={account.platform === 'Website' ? 'https://...' : '@handle'}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {errorMessage && (
                        <div className="p-4 bg-red-950/20 border border-red-500/20 text-red-500 text-xs font-avenir-bold rounded-xl uppercase tracking-wider text-center animate-fade-in">
                            {errorMessage}
                        </div>
                    )}

                    {/* Navigation buttons */}
                    <div className="flex justify-between items-center pt-8 border-t border-white/5 dark:border-black/5">
                        {step > 1 ? (
                            <button
                                type="button" onClick={handleBack} disabled={loading}
                                className="px-6 py-4 border border-white/10 dark:border-black/10 text-white/60 dark:text-black/60 rounded-xl font-avenir-bold uppercase text-[10px] tracking-[3px] hover:text-[#1552ab] transition-all flex items-center gap-2"
                            >
                                <ChevronLeft size={14} /> Back
                            </button>
                        ) : (
                            <div />
                        )}

                        {step < 3 ? (
                            <button
                                type="button" onClick={handleNext}
                                className="px-6 py-4 bg-white/5 dark:bg-black/5 border border-[#1552ab]/20 hover:border-[#1552ab] hover:bg-[#1552ab] text-[#1552ab] hover:text-white rounded-xl font-avenir-bold uppercase text-[10px] tracking-[3px] transition-all flex items-center gap-2"
                            >
                                Next <ChevronRight size={14} />
                            </button>
                        ) : (
                            <button
                                type="submit" disabled={loading}
                                className="px-8 py-5 bg-[#1552ab] text-white rounded-xl font-avenir-bold uppercase text-[10px] tracking-[4px] shadow-glow active:scale-95 transition-all flex items-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={14} className="animate-spin" />
                                        <span>SYNCHRONIZING...</span>
                                    </>
                                ) : (
                                    <>
                                        <Send size={14} /> {mode === 'create' ? 'Complete Profile' : 'Save Modifications'}
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RegistrationForm;
