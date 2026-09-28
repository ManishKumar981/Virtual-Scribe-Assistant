# AURA AI CLINICAL ASSISTANT
## Complete Architecture, Database Schema, State Machine & Implementation Blueprint

---

## 1. Executive Summary & Purpose

**AURA AI Clinical Assistant** is a voice-first, deterministic AI clinical history-taking and medical documentation web application.

### Key Objectives:
1. **User Authentication**: Secure signup, login, session management via Supabase Auth.
2. **Consultation Flow**: Patient communicates symptoms via text or real-time voice.
3. **Deterministic Progression**: The consultation engine strictly controls the clinical stage flow and field tracking. Gemini acts solely as a natural language and reasoning component, **not** the controller of the clinical state.
4. **Voice Pipeline**: Full browser-native speech recognition with silence detection (1.5s–2.0s), distinct handling of intentional vs unexpected stops, and browser speech synthesis for AI responses.
5. **Documentation & Summary**: Generates structured clinical findings (chief complaint, duration, severity, red flags, allergies, etc.) and complete transcripts exportable as summary reports.
6. **Clinical Safety Boundary**: The assistant explicitly does **not** diagnose or prescribe medications; it functions strictly as a clinical history-taking and intake documentation assistant.

---

## 2. System Architecture

```
                               ┌─────────────────────────┐
                               │     PATIENT / USER      │
                               └────────────┬────────────┘
                                            │
                                Text / Microphone Voice
                                            │
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               FRONTEND (React + Vite + TS + Tailwind)                  │
│                                                                                        │
│  [ Auth / Login ]  [ Dashboard ]  [ Consultation UI ]  [ Summary View ]  [ History ]   │
│                                                                                        │
│  Voice Subsystem:                                                                      │
│  • Web Speech API (SpeechRecognition) -> Live Interim -> Final Transcript              │
│  • Silence Detector (1.5 - 2.0s) -> Single atomic submission                           │
│  • Web Speech API (SpeechSynthesis) -> Audio playback of AI questions                  │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │ HTTPS / JSON (Bearer JWT)
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              BACKEND (Node.js + Express + TS)                          │
│                                                                                        │
│  ├── 1. Auth Middleware (Verifies Supabase JWT)                                        │
│  ├── 2. Consultation Engine (Deterministic Clinical State Machine)                     │
│  │     • Stage Progression (Stages 1 to 10)                                            │
│  │     • Answered vs Missing Clinical Fields                                           │
│  │     • Question History (Prevents duplicate questioning)                             │
│  │     • Red-Flag Screening & Detection                                                │
│  ├── 3. Gemini Service (Server-side ONLY; API Key never exposed to client)             │
│  │     • Structured JSON prompts with clinical context injection                       │
│  │     • Response validation and fallback guards                                       │
│  └── 4. Supabase Service (PostgreSQL Database + Row Level Security)                    │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
                                 ┌──────────┴──────────┐
                                 ▼                     ▼
                     ┌───────────────────────┐  ┌───────────────────────┐
                     │    GOOGLE GEMINI API  │  │       SUPABASE        │
                     │                       │  │                       │
                     │ • Natural Language    │  │ • Auth (JWT)          │
                     │ • Entity Extraction   │  │ • PostgreSQL          │
                     │ • Adaptive Follow-ups │  │ • Row Level Security  │
                     │ • Clinical Summaries  │  │ • Relational Tables   │
                     └───────────────────────┘  └───────────────────────┘
```

---

## 3. Database Schema & RLS Policies (PostgreSQL / Supabase)

### Relational Hierarchy:
```
auth.users
   └── profiles (1 : 1)
         └── consultations (1 : N)
               ├── messages (1 : N)
               ├── clinical_findings (1 : 1)
               └── consultation_summaries (1 : 1)
```

### Complete SQL Migration (`supabase/migrations/001_initial_schema.sql`):

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    date_of_birth DATE,
    gender TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CONSULTATIONS TABLE
CREATE TABLE IF NOT EXISTS public.consultations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    stage TEXT NOT NULL DEFAULT 'presenting_complaint',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- 3. MESSAGES TABLE (Chat Transcript)
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consultation_id UUID NOT NULL REFERENCES public.consultations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('patient', 'assistant', 'system')),
    content TEXT NOT NULL,
    audio_transcription BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CLINICAL FINDINGS TABLE
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

-- 5. CONSULTATION SUMMARIES TABLE
CREATE TABLE IF NOT EXISTS public.consultation_summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consultation_id UUID NOT NULL UNIQUE REFERENCES public.consultations(id) ON DELETE CASCADE,
    summary_text TEXT NOT NULL,
    clinical_impression TEXT,
    recommended_triage_level TEXT DEFAULT 'routine' CHECK (recommended_triage_level IN ('routine', 'urgent', 'emergency')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ROW LEVEL SECURITY (RLS)
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

-- Profile Auto-creation trigger on Auth Signup
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
```

---

## 4. Deterministic Consultation Engine Design

### 10 Consultation Stages:
1. `presenting_complaint`: Chief issue or primary reason for consultation.
2. `symptom_details`: Location, quality, character, radiation.
3. `duration_onset`: When it started, acute vs gradual, progression.
4. `severity`: Pain/distress scale (1–10 or mild/moderate/severe).
5. `associated_symptoms`: Accompanying symptoms (e.g. nausea, chills, dizziness).
6. `red_flag_screening`: Critical danger signs (e.g. chest pain, shortness of breath, sudden neurological deficits, severe hemoptysis).
7. `medical_history`: Pre-existing conditions, past surgeries.
8. `medications_allergies`: Current prescriptions, OTC medicines, drug allergies.
9. `final_summary`: Compilation and presentation of full clinical history for patient review.
10. `completed`: Finalized consultation state with immutable record.

### State Machine Model:
```typescript
export interface ClinicalFindings {
  chiefComplaint: string | null;
  symptoms: string[];
  duration: string | null;
  onset: string | null;
  severity: string | null;
  associatedSymptoms: string[];
  redFlags: string[];
  medicalHistory: string | null;
  medications: string[];
  allergies: string[];
}

export interface ConsultationState {
  consultationId: string;
  userId: string;
  stage: ConsultationStage;
  findings: ClinicalFindings;
  askedQuestions: string[];
  missingFields: string[];
  isComplete: boolean;
}
```

### Deterministic Rules:
1. **Multi-entity extraction**: If patient says *"I've had a severe throbbing headache and fever for 3 days"*, the engine extracts:
   - `chiefComplaint`: "Headache and fever"
   - `symptoms`: ["Throbbing headache", "Fever"]
   - `severity`: "Severe"
   - `duration`: "3 days"
2. **Never re-ask answered fields**: Duration and severity are marked answered. Engine skips stages 3 & 4 and proceeds directly to stage 5 (`associated_symptoms`) or 6 (`red_flag_screening`).
3. **Stage progression**: A stage completes when its mandatory fields are present in `findings` or explicitly marked not applicable.

---

## 5. Server-Side Gemini Integration & Structured Schema

### Gemini Prompt Injection Model:
```typescript
const systemPrompt = `
You are AURA, an AI clinical history-taking documentation assistant.
You are NOT an autonomous doctor. Do not provide definitive medical diagnoses, drug prescriptions, or treatment plans.

CURRENT CLINICAL CONTEXT:
- Stage: ${state.stage}
- Known Findings: ${JSON.stringify(state.findings)}
- Missing Required Fields: ${JSON.stringify(state.missingFields)}
- Previously Asked Questions: ${JSON.stringify(state.askedQuestions)}

PATIENT MESSAGE:
"${patientMessage}"

YOUR TASKS:
1. Extract any newly stated clinical findings accurately.
2. Formulate a single, empathetic, conversational response with the NEXT required follow-up question.
3. NEVER re-ask questions regarding information already present in Known Findings.
4. Screen for any urgent medical red flags immediately.

You MUST respond strictly in the following valid JSON format:
{
  "assistantMessage": "Conversational reply with follow-up question",
  "extractedFindings": {
    "chiefComplaint": null | "string",
    "symptoms": ["string"],
    "duration": null | "string",
    "onset": null | "string",
    "severity": null | "string",
    "associatedSymptoms": ["string"],
    "redFlags": ["string"],
    "medicalHistory": null | "string",
    "medications": ["string"],
    "allergies": ["string"]
  },
  "detectedRedFlags": ["string"],
  "isEmergency": false
}
`;
```

---

## 6. Voice Engine Architecture (Web Speech API)

### State Machine for Voice Input:
```
[ IDLE ] ──(Mic Click)──► [ STARTING ] ──► [ LISTENING ]
                                                 │
                             ┌───────────────────┴───────────────────┐
                             │                                       │
                    (Speech Detected)                        (Silence >= 1.7s)
                             │                                       │
                             ▼                                       ▼
                   [ CAPTURING_INTERIM ]                    [ STOPPING / FINALIZE ]
                             │                                       │
                             └──────────► [ FINAL_TEXT ] ────────────┘
                                               │
                                               ▼
                                      [ SUBMITTING (Locked) ]
                                               │ (API Call)
                                               ▼
                                      [ SPEAKING (AI Response) ]
                                               │ (OnEnd)
                                               ▼
                                            [ IDLE ]
```

### Critical Voice Safeguards:
1. **Silence Timer (1.7s)**: Automatically finalizes transcript and triggers a single submission.
2. **Submission Lock**: Prevents duplicate API triggers while a query is in-flight.
3. **Intentional vs Unintentional Stop**:
   - *Intentional* (User stopped or silence timeout reached) -> Proceed to consultation engine.
   - *Unintentional* (Browser micro-disconnect or recognition glitch) -> Gracefully recover or resume without losing previous interim text.
4. **Text vs Voice Independence**: Text input can be typed anytime without interfering with or resetting voice buffers.

---

## 7. Folder Structure

```
aura-clinical-assistant/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/ (LoginForm.tsx, RegisterForm.tsx, ProtectedRoute.tsx)
│   │   │   ├── consultation/ (ChatWindow.tsx, ChatBubble.tsx, VoiceButton.tsx, TextInput.tsx, StageProgress.tsx)
│   │   │   ├── summary/ (SummaryCard.tsx, FindingsTable.tsx, RedFlagAlert.tsx, TranscriptView.tsx)
│   │   │   ├── history/ (ConsultationList.tsx, ConsultationCard.tsx)
│   │   │   └── ui/ (Button.tsx, Input.tsx, Modal.tsx, Badge.tsx, Spinner.tsx)
│   │   ├── context/ (AuthContext.tsx, ConsultationContext.tsx)
│   │   ├── hooks/ (useVoice.ts, useSpeechSynthesis.ts, useConsultation.ts)
│   │   ├── services/ (api.ts, supabase.ts)
│   │   ├── types/ (index.ts)
│   │   ├── pages/ (LoginPage.tsx, RegisterPage.tsx, DashboardPage.tsx, ConsultationPage.tsx, SummaryPage.tsx, HistoryPage.tsx)
│   │   ├── App.tsx
│   │   ├── index.css
│   │   └── main.tsx
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── server/
│   ├── src/
│   │   ├── engine/
│   │   │   ├── consultationEngine.ts
│   │   │   ├── stageManager.ts
│   │   │   └── fieldMerger.ts
│   │   ├── services/
│   │   │   ├── geminiService.ts
│   │   │   └── supabaseService.ts
│   │   ├── middleware/
│   │   │   ├── authMiddleware.ts
│   │   │   └── errorHandler.ts
│   │   ├── routes/
│   │   │   ├── consultationRoutes.ts
│   │   │   └── historyRoutes.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
└── supabase/
    └── migrations/
        └── 001_initial_schema.sql
```

---

## 8. Security & Environment Configuration

### Environment Variables Template:

**Server (`server/.env`):**
```env
PORT=5000
NODE_ENV=development
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
GEMINI_API_KEY=your-gemini-api-key
CLIENT_ORIGIN=http://localhost:5173
```

**Client (`client/.env`):**
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_API_URL=http://localhost:5000/api
```

---

## 9. Phase-by-Phase Implementation Roadmap

- **Phase 1: Project Setup & Authentication**
  - Vite + React + Tailwind + Lucide icons setup.
  - Express + TypeScript backend scaffold.
  - Supabase database schema migration + RLS setup.
  - AuthContext & login/register pages.
- **Phase 2: Deterministic Consultation Engine**
  - Implement 10-stage state machine and field merger.
  - Setup API endpoints (`/api/consultations/start`, `/api/consultations/message`).
- **Phase 3: Server-side Gemini AI Integration**
  - Implement structured JSON generation via Gemini 1.5/2.0 API.
  - Implement fallback validation & red flag detection.
- **Phase 4: Robust Browser Voice Subsystem**
  - Web Speech API integration with silence detection (1.7s).
  - SpeechSynthesis integration for conversational AI voice output.
- **Phase 5: Documentation, Summaries & History**
  - Post-consultation summary dashboard with exportable clinical report & transcript.
  - Historical consultations archive.
- **Phase 6: Verification & End-to-End Testing**
  - Verify complete consultation path, voice reliability, and security boundary compliance.
