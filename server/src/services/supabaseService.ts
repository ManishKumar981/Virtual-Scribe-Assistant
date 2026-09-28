// ============================================
// AURA - Supabase Service with Resilient In-Memory Fallback
// Database operations using Supabase client (service role)
// with automatic offline/mock fallback when Supabase is unreachable.
// ============================================

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { ClinicalFindings, ConsultationStage, DBConsultation, DBMessage } from '../types/index.js';
import { findingsToDb, dbToFindings } from '../engine/fieldMerger.js';

let supabase: SupabaseClient | null = null;
let useMemoryFallback = false;

// In-memory data store for fallback
const memProfiles = new Map<string, any>();
const memConsultations = new Map<string, DBConsultation>();
const memMessages: DBMessage[] = [];
const memFindings = new Map<string, any>();
const memSummaries = new Map<string, any>();

/**
 * Initialize the Supabase client with service role key (bypasses RLS)
 */
export async function initSupabase(): Promise<SupabaseClient | null> {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey || url.includes('your-project')) {
    console.warn('⚠ Supabase not configured — running with resilient in-memory store.');
    useMemoryFallback = true;
    return null;
  }

  try {
    supabase = createClient(url, serviceKey);

    // Test the connection with a short timeout to detect unreachable Supabase early
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    try {
      const testResult = await supabase.from('profiles').select('id').limit(1).abortSignal(controller.signal);
      clearTimeout(timeoutId);
      if (testResult.error) {
        const errMsg = testResult.error.message || '';
        if (errMsg.includes('AbortError') || errMsg.includes('aborted') || errMsg.includes('fetch failed')) {
          // Supabase is too slow or unreachable — use in-memory
          console.warn(`⚠ Supabase too slow or unreachable (${errMsg}) — using fast in-memory store.`);
          supabase = null;
          useMemoryFallback = true;
          return null;
        }
        // Other query errors (e.g. table doesn't exist) — Supabase IS reachable
        console.warn(`⚠ Supabase reachable but query warning: ${errMsg}`);
      }
    } catch (connErr: any) {
      clearTimeout(timeoutId);
      console.warn(`⚠ Supabase unreachable (${connErr.message}) — using fast in-memory store.`);
      supabase = null;
      useMemoryFallback = true;
      return null;
    }

    return supabase;
  } catch (err: any) {
    console.warn(`⚠ Supabase client initialization error: ${err.message} — using in-memory store`);
    useMemoryFallback = true;
    return null;
  }
}

export function getSupabase(): SupabaseClient | null {
  if (useMemoryFallback) return null;
  return supabase;
}

// ============================================
// Consultation operations
// ============================================

export async function ensureGuestProfile(profileId: string = '00000000-0000-0000-0000-000000000000'): Promise<string> {
  const db = getSupabase();
  if (!db) {
    if (!memProfiles.has(profileId)) {
      memProfiles.set(profileId, { id: profileId, full_name: 'Guest User', created_at: new Date().toISOString() });
    }
    return profileId;
  }

  try {
    const { data: specificProfile } = await db.from('profiles').select('id').eq('id', profileId).maybeSingle();
    if (specificProfile) {
      return specificProfile.id;
    }

    const { data: existing } = await db.from('profiles').select('id').limit(1);
    if (existing && existing.length > 0) {
      return existing[0].id;
    }

    const { data: insertedProfile, error: insertError } = await db.from('profiles').upsert(
      {
        id: profileId,
        full_name: 'Guest User',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    ).select('id').maybeSingle();

    if (!insertError && insertedProfile) {
      return insertedProfile.id;
    }

    const { data: fallback } = await db.from('profiles').select('id').limit(1);
    if (fallback && fallback.length > 0) {
      return fallback[0].id;
    }

    return profileId;
  } catch {
    console.warn('Supabase profile access failed, using fallback profile ID');
    return profileId;
  }
}

export async function createConsultation(profileId: string): Promise<DBConsultation> {
  const db = getSupabase();
  const targetProfileId = profileId || '00000000-0000-0000-0000-000000000000';

  if (!db) {
    const newConsultation: DBConsultation = {
      id: crypto.randomUUID(),
      profile_id: targetProfileId,
      stage: 'presenting_complaint',
      status: 'active',
      started_at: new Date().toISOString(),
      completed_at: null,
      last_activity_at: new Date().toISOString(),
    };
    memConsultations.set(newConsultation.id, newConsultation);
    memFindings.set(newConsultation.id, { consultation_id: newConsultation.id });
    return newConsultation;
  }

  try {
    const resolvedProfileId = await ensureGuestProfile(targetProfileId);

    let { data, error } = await db
      .from('consultations')
      .insert({
        profile_id: resolvedProfileId,
        stage: 'presenting_complaint',
        status: 'active',
      })
      .select()
      .single();

    if (error && error.message.includes('foreign key')) {
      const validId = await ensureGuestProfile();
      const retry = await db
        .from('consultations')
        .insert({
          profile_id: validId,
          stage: 'presenting_complaint',
          status: 'active',
        })
        .select()
        .single();
      data = retry.data;
      error = retry.error;
    }

    if (error || !data) throw new Error(error?.message || 'Database insert failed');

    // Also create empty clinical findings record
    await db.from('clinical_findings').insert({
      consultation_id: data.id,
    });

    return data;
  } catch (err: any) {
    console.warn(`Supabase createConsultation unavailable (${err.message}). Using in-memory consultation session.`);
    const newConsultation: DBConsultation = {
      id: crypto.randomUUID(),
      profile_id: targetProfileId,
      stage: 'presenting_complaint',
      status: 'active',
      started_at: new Date().toISOString(),
      completed_at: null,
      last_activity_at: new Date().toISOString(),
    };
    memConsultations.set(newConsultation.id, newConsultation);
    memFindings.set(newConsultation.id, { consultation_id: newConsultation.id });
    return newConsultation;
  }
}

export async function getConsultation(consultationId: string, profileId: string): Promise<DBConsultation | null> {
  const db = getSupabase();

  if (!db) {
    return memConsultations.get(consultationId) || null;
  }

  try {
    let query = db.from('consultations').select('*').eq('id', consultationId);

    if (profileId && profileId !== '00000000-0000-0000-0000-000000000000') {
      query = query.eq('profile_id', profileId);
    }

    const { data, error } = await query.single();
    if (error || !data) {
      return memConsultations.get(consultationId) || null;
    }
    return data;
  } catch {
    return memConsultations.get(consultationId) || null;
  }
}

export async function updateConsultationStage(
  consultationId: string,
  stage: ConsultationStage,
  status?: 'active' | 'completed' | 'abandoned'
): Promise<void> {
  const db = getSupabase();
  const now = new Date().toISOString();

  // Update in-memory copy
  const mem = memConsultations.get(consultationId);
  if (mem) {
    mem.stage = stage;
    mem.last_activity_at = now;
    if (status) {
      mem.status = status;
      if (status === 'completed') mem.completed_at = now;
    }
  }

  if (!db) return;

  try {
    const updates: Record<string, any> = {
      stage,
      last_activity_at: now,
    };

    if (status) {
      updates.status = status;
      if (status === 'completed') {
        updates.completed_at = now;
      }
    }

    await db.from('consultations').update(updates).eq('id', consultationId);
  } catch (err: any) {
    console.warn(`Supabase updateConsultationStage fallback (${err.message})`);
  }
}

export async function getUserConsultations(
  profileId: string,
  page: number = 1,
  limit: number = 20
): Promise<{ consultations: any[]; total: number }> {
  const db = getSupabase();
  const offset = (page - 1) * limit;

  if (!db) {
    const all = Array.from(memConsultations.values())
      .filter((c) => !profileId || profileId === '00000000-0000-0000-0000-000000000000' || c.profile_id === profileId)
      .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());
    const paginated = all.slice(offset, offset + limit).map((c) => ({
      ...c,
      clinical_findings: memFindings.get(c.id) ? [memFindings.get(c.id)] : [],
      consultation_summaries: memSummaries.get(c.id) ? [memSummaries.get(c.id)] : [],
    }));
    return { consultations: paginated, total: all.length };
  }

  try {
    let query = db
      .from('consultations')
      .select('*, clinical_findings(*), consultation_summaries(*)', { count: 'exact' });

    if (profileId && profileId !== '00000000-0000-0000-0000-000000000000') {
      query = query.eq('profile_id', profileId);
    }

    const { data, error, count } = await query
      .order('started_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(error.message);
    return { consultations: data || [], total: count || 0 };
  } catch (err: any) {
    console.warn(`Supabase getUserConsultations fallback (${err.message})`);
    const all = Array.from(memConsultations.values())
      .filter((c) => !profileId || profileId === '00000000-0000-0000-0000-000000000000' || c.profile_id === profileId)
      .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());
    const paginated = all.slice(offset, offset + limit).map((c) => ({
      ...c,
      clinical_findings: memFindings.get(c.id) ? [memFindings.get(c.id)] : [],
      consultation_summaries: memSummaries.get(c.id) ? [memSummaries.get(c.id)] : [],
    }));
    return { consultations: paginated, total: all.length };
  }
}

// ============================================
// Message operations
// ============================================

export async function addMessage(
  consultationId: string,
  role: 'patient' | 'assistant' | 'system',
  content: string,
  isVoiceInput: boolean = false
): Promise<DBMessage> {
  const db = getSupabase();
  const now = new Date().toISOString();

  const msg: DBMessage = {
    id: crypto.randomUUID(),
    consultation_id: consultationId,
    role,
    content,
    is_voice_input: isVoiceInput,
    created_at: now,
  };
  memMessages.push(msg);

  // Update memory consultation
  const mem = memConsultations.get(consultationId);
  if (mem) {
    mem.last_activity_at = now;
  }

  if (!db) {
    return msg;
  }

  try {
    const { data, error } = await db
      .from('messages')
      .insert({
        consultation_id: consultationId,
        role,
        content,
        is_voice_input: isVoiceInput,
      })
      .select()
      .single();

    if (error || !data) {
      return msg;
    }

    await db
      .from('consultations')
      .update({ last_activity_at: now })
      .eq('id', consultationId);

    return data;
  } catch {
    return msg;
  }
}

export async function getMessages(consultationId: string): Promise<DBMessage[]> {
  const db = getSupabase();

  if (!db) {
    return memMessages.filter((m) => m.consultation_id === consultationId);
  }

  try {
    const { data, error } = await db
      .from('messages')
      .select('*')
      .eq('consultation_id', consultationId)
      .order('created_at', { ascending: true });

    if (error || !data) {
      return memMessages.filter((m) => m.consultation_id === consultationId);
    }
    return data;
  } catch {
    return memMessages.filter((m) => m.consultation_id === consultationId);
  }
}

// ============================================
// Clinical findings operations
// ============================================

export async function getFindings(consultationId: string): Promise<ClinicalFindings> {
  const db = getSupabase();

  if (!db) {
    const data = memFindings.get(consultationId);
    if (data) return dbToFindings(data);
    return {
      chiefComplaint: null,
      symptoms: [],
      duration: null,
      onset: null,
      severity: null,
      associatedSymptoms: [],
      redFlags: [],
      medicalHistory: null,
      medications: [],
      allergies: [],
    };
  }

  try {
    const { data, error } = await db
      .from('clinical_findings')
      .select('*')
      .eq('consultation_id', consultationId)
      .single();

    if (error || !data) {
      const memData = memFindings.get(consultationId);
      if (memData) return dbToFindings(memData);
      return {
        chiefComplaint: null,
        symptoms: [],
        duration: null,
        onset: null,
        severity: null,
        associatedSymptoms: [],
        redFlags: [],
        medicalHistory: null,
        medications: [],
        allergies: [],
      };
    }

    return dbToFindings(data);
  } catch {
    const memData = memFindings.get(consultationId);
    if (memData) return dbToFindings(memData);
    return {
      chiefComplaint: null,
      symptoms: [],
      duration: null,
      onset: null,
      severity: null,
      associatedSymptoms: [],
      redFlags: [],
      medicalHistory: null,
      medications: [],
      allergies: [],
    };
  }
}

export async function updateFindings(
  consultationId: string,
  findings: ClinicalFindings
): Promise<void> {
  const db = getSupabase();
  const dbData = findingsToDb(findings);
  memFindings.set(consultationId, { ...dbData, consultation_id: consultationId });

  if (!db) return;

  try {
    await db.from('clinical_findings').update(dbData).eq('consultation_id', consultationId);
  } catch (err: any) {
    console.warn(`Supabase updateFindings fallback (${err.message})`);
  }
}

// ============================================
// Summary operations
// ============================================

export async function saveSummary(
  consultationId: string,
  summaryText: string,
  clinicalImpression: string | null,
  triageLevel: string
): Promise<void> {
  const db = getSupabase();
  const summaryObj = {
    consultation_id: consultationId,
    summary_text: summaryText,
    clinical_impression: clinicalImpression,
    recommended_triage_level: triageLevel,
    created_at: new Date().toISOString(),
  };
  memSummaries.set(consultationId, summaryObj);

  if (!db) return;

  try {
    await db.from('consultation_summaries').upsert(
      {
        consultation_id: consultationId,
        summary_text: summaryText,
        clinical_impression: clinicalImpression,
        recommended_triage_level: triageLevel,
      },
      { onConflict: 'consultation_id' }
    );
  } catch (err: any) {
    console.warn(`Supabase saveSummary fallback (${err.message})`);
  }
}

export async function getSummary(consultationId: string): Promise<any | null> {
  const db = getSupabase();

  if (!db) {
    return memSummaries.get(consultationId) || null;
  }

  try {
    const { data, error } = await db
      .from('consultation_summaries')
      .select('*')
      .eq('consultation_id', consultationId)
      .single();

    if (error || !data) {
      return memSummaries.get(consultationId) || null;
    }
    return data;
  } catch {
    return memSummaries.get(consultationId) || null;
  }
}
