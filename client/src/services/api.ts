// ============================================
// AURA - API Service
// Handles all HTTP calls to the backend
// ============================================

import { supabase } from './supabase';

const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
const API_URL = import.meta.env.VITE_API_URL || `http://${host}:5000/api`;

/**
 * Get the current user's JWT token
 */
async function getAuthToken(): Promise<string> {
  try {
    // Race the session check against a 2-second timeout
    // so the app doesn't hang when Supabase is unreachable
    const sessionPromise = supabase.auth.getSession();
    const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000));
    const result = await Promise.race([sessionPromise, timeoutPromise]);

    if (result && 'data' in result && result.data?.session?.access_token) {
      return result.data.session.access_token;
    }
  } catch {}
  return 'guest-token';
}

/**
 * Make an authenticated API request
 */
async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<any> {
  const token = await getAuthToken();

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  let data: any;
  try {
    data = await response.json();
  } catch {
    // Server returned non-JSON (e.g., HTML error page, 502 gateway)
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  if (!response.ok) {
    throw new Error(data.error || `API request failed: ${response.status}`);
  }

  return data;
}

// ============================================
// Consultation API
// ============================================

export async function startConsultation(): Promise<{
  consultationId: string;
  welcomeMessage: string;
  stage: string;
}> {
  const result = await apiRequest('/consultations/start', { method: 'POST' });
  return result.data;
}

export async function sendMessage(
  consultationId: string,
  message: string,
  isVoiceInput: boolean = false,
  language: string = 'en'
): Promise<{
  assistantMessage: string;
  voiceText?: string;
  stage: string;
  findings: any;
  isComplete: boolean;
  isEmergency: boolean;
  detectedRedFlags: string[];
  progress: number;
}> {
  const result = await apiRequest('/consultations/message', {
    method: 'POST',
    body: JSON.stringify({ consultationId, message, isVoiceInput, language }),
  });
  return result.data;
}

export async function getConsultationDetails(consultationId: string): Promise<any> {
  const result = await apiRequest(`/consultations/${consultationId}`);
  return result.data;
}

export async function endConsultation(consultationId: string): Promise<any> {
  const result = await apiRequest(`/consultations/${consultationId}/end`, {
    method: 'POST',
  });
  return result.data;
}


// ============================================
// History API
// ============================================

export async function getHistory(
  page: number = 1,
  limit: number = 20
): Promise<{
  consultations: any[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}> {
  const result = await apiRequest(`/history?page=${page}&limit=${limit}`);
  return result.data;
}
