import { Participant } from '../types';
import { supabase } from './supabase';

const getEdgeFunctionUrl = (name: string): string => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
  return `${supabaseUrl}/functions/v1/${name}`;
};

export const api = {
  // --- Public Dashboard ---
  getPublicParticipants: async (): Promise<Omit<Participant, 'email' | 'phone'>[]> => {
    const { data, error } = await supabase
      .from('public_participants')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Failed to fetch public participants:', error);
      return [];
    }
    return data || [];
  },

  // --- Native Sign-Up (calls register-participant Edge Function) ---
  registerParticipant: async (
    name: string,
    email: string
  ): Promise<{ success: boolean; duplicate?: boolean; message?: string; error?: string }> => {
    const url = getEdgeFunctionUrl('register-participant');
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'Registration failed.' };
    }

    return { success: true, duplicate: data.duplicate, message: data.message };
  },

  // --- Token-based Participant Methods ---
  getParticipantByToken: async (token: string): Promise<Participant | null> => {
    const { data, error } = await supabase.rpc('get_participant_by_token', {
      p_token: token,
    });

    if (error) {
      console.error('Token verification failed:', error);
      return null;
    }

    if (data && data.length > 0) {
      return data[0] as Participant;
    }
    return null;
  },

  submitBioByToken: async (
    token: string,
    bioData: Partial<Participant>
  ): Promise<boolean> => {
    const { data, error } = await supabase.rpc('submit_bio_by_token', {
      p_token: token,
      p_bio_data: bioData,
    });

    if (error) {
      console.error('Profile submission failed:', error);
      return false;
    }
    return !!data;
  },

  // --- Admin Panel Methods ---
  adminGetParticipants: async (): Promise<Participant[]> => {
    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  adminUpdateParticipant: async (
    id: string,
    updates: Partial<Participant>
  ): Promise<Participant> => {
    const { data, error } = await supabase
      .from('participants')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Participant;
  },

  adminDeleteParticipant: async (id: string): Promise<void> => {
    const { error } = await supabase.from('participants').delete().eq('id', id);
    if (error) throw error;
  },

  // Admin resend access email — rotates token + calls register-participant resend path
  adminResendAccess: async (
    participantId: string,
    email: string,
    registeredName: string
  ): Promise<boolean> => {
    // Generate new token
    const rawToken = crypto.randomUUID();
    const tokenHash = await sha256(rawToken);
    // token_expires_at = null: permanent credential, no auto-expiry.
    // Manual revocation: set token_expires_at to a past timestamp via admin console.

    const { error: updateError } = await supabase
      .from('participants')
      .update({
        token_hash: tokenHash,
        token_created_at: new Date().toISOString(),
        token_expires_at: null,
      })
      .eq('id', participantId);

    if (updateError) {
      console.error('Token rotation failed:', updateError);
      return false;
    }

    // Trigger email via edge function (POST to register-participant handles email)
    // We re-use it by sending an already-registered email — the function detects
    // the duplicate and sends a new access link without creating a new record.
    const url = getEdgeFunctionUrl('register-participant');
    const { data: { session } } = await supabase.auth.getSession();
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token || ''}`,
      },
      body: JSON.stringify({ name: registeredName, email }),
    });

    return response.ok;
  },

  // --- Storage Bucket Upload ---
  uploadImage: async (file: File, _path: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { data, error } = await supabase.storage
      .from('picture')
      .upload(filePath, file, { cacheControl: '3600', upsert: false });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('picture')
      .getPublicUrl(data.path);

    return publicUrl;
  },
};

// Client-side SHA-256 for token rotation in adminResendAccess
async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
