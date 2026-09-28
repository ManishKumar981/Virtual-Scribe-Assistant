-- ============================================
-- AURA AI Clinical Assistant
-- Database Schema Migration
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    date_of_birth DATE,
    gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. CONSULTATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.consultations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    stage TEXT NOT NULL DEFAULT 'presenting_complaint',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    last_activity_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. MESSAGES TABLE (Chat Transcript)
-- ============================================
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consultation_id UUID NOT NULL REFERENCES public.consultations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('patient', 'assistant', 'system')),
    content TEXT NOT NULL,
    is_voice_input BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. CLINICAL FINDINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.clinical_findings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consultation_id UUID NOT NULL UNIQUE REFERENCES public.consultations(id) ON DELETE CASCADE,
    chief_complaint TEXT,
    symptoms TEXT[] DEFAULT '{}',
    duration TEXT,
    onset TEXT,
    severity TEXT,
    associated_symptoms TEXT[] DEFAULT '{}',
    red_flags TEXT[] DEFAULT '{}',
    medical_history TEXT,
    medications TEXT[] DEFAULT '{}',
    allergies TEXT[] DEFAULT '{}',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. CONSULTATION SUMMARIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.consultation_summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consultation_id UUID NOT NULL UNIQUE REFERENCES public.consultations(id) ON DELETE CASCADE,
    summary_text TEXT NOT NULL,
    clinical_impression TEXT,
    recommended_triage_level TEXT DEFAULT 'routine' CHECK (recommended_triage_level IN ('routine', 'urgent', 'emergency')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES for performance
-- ============================================
CREATE INDEX idx_consultations_profile_id ON public.consultations(profile_id);
CREATE INDEX idx_consultations_started_at ON public.consultations(started_at DESC);
CREATE INDEX idx_consultations_status ON public.consultations(status);
CREATE INDEX idx_messages_consultation_id ON public.messages(consultation_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at);
CREATE INDEX idx_clinical_findings_consultation_id ON public.clinical_findings(consultation_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultation_summaries ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users manage their own profile" 
ON public.profiles FOR ALL 
USING (auth.uid() = id);

CREATE POLICY "Users manage their own consultations" 
ON public.consultations FOR ALL 
USING (auth.uid() = profile_id);

CREATE POLICY "Users access messages in their consultations" 
ON public.messages FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.consultations 
        WHERE consultations.id = messages.consultation_id 
        AND consultations.profile_id = auth.uid()
    )
);

CREATE POLICY "Users access findings in their consultations" 
ON public.clinical_findings FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.consultations 
        WHERE consultations.id = clinical_findings.consultation_id 
        AND consultations.profile_id = auth.uid()
    )
);

CREATE POLICY "Users access summaries of their consultations" 
ON public.consultation_summaries FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.consultations 
        WHERE consultations.id = consultation_summaries.consultation_id 
        AND consultations.profile_id = auth.uid()
    )
);

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at 
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_clinical_findings_updated_at 
    BEFORE UPDATE ON public.clinical_findings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Profile auto-creation on Auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name)
    VALUES (new.id, COALESCE(new.raw_user_meta_data->>'full_name', 'Patient'));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
