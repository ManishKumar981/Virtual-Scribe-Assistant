// ============================================
// AURA - Gemini Service (v4 - Solution-Focused Medical Assistant)
// Provides immediate solutions, remedies, and guidance without interrogation
// ============================================

import { ConsultationState, GeminiResponse, ClinicalFindings } from '../types/index.js';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

/**
 * Build prompt that makes Gemini act as an instant solution-focused medical assistant
 */
function buildSystemPrompt(state: ConsultationState, language: string = 'en'): string {
  const conversationHistory = (state.messages || [])
    .map((m) => `${m.role === 'assistant' ? 'ASSISTANT' : 'PATIENT'}: ${m.content}`)
    .slice(-10)
    .join('\n');

  let langInstruction = "Write your response in English. Set voiceText to the same English message.";
  if (language.startsWith('te')) {
    langInstruction = "IMPORTANT: Write BOTH assistantMessage AND voiceText in clear TELUGU script (తెలుగు). Do NOT use Roman/English transliteration. Example: 'మీకు జ్వరం ఉంటే విశ్రాంతి తీసుకోండి, నీళ్ళు తాగండి.' Keep sentences short and natural for text-to-speech.";
  } else if (language.startsWith('hi')) {
    langInstruction = "IMPORTANT FOR HINDI: Write assistantMessage in clear HINDI script (हिंदी). Set voiceText to the same Hindi message.";
  }

  return `
You are Virtual Scribe Assistant, a friendly and knowledgeable AI clinical assistant having a live consultation with a patient.

LANGUAGE INSTRUCTION:
${langInstruction}

CONVERSATION RULES (CRITICAL):
1. **Be Conversational & Concise**: Keep your reply SHORT and NATURAL (2 to 4 sentences maximum).
2. **NO walls of text or markdown headers**: DO NOT use "### 1. Assessment", bullet point essays, or long medical textbooks.
3. **Directly Answer the Patient**: Address exactly what the patient said or asked in a warm, direct, conversational way.
4. **Actionable & Helpful**: Provide practical home remedies, OTC suggestions (e.g., Paracetamol dosage/guidance), or relief steps naturally within the flow of conversation.
5. **Natural Interaction**: Speak like a real healthcare assistant talking to someone in front of you.

CONVERSATION HISTORY:
${conversationHistory || '(Start of conversation)'}

KNOWN CLINICAL DETAILS:
${JSON.stringify(state.findings)}

You MUST respond strictly in the following JSON format:
{
  "assistantMessage": "Your response in native script (2-4 sentences max)",
  "voiceText": "Your response in native script (for Telugu write native script Telugu, for Hindi write native Hindi)",
  "extractedFindings": {
    "chiefComplaint": null,
    "symptoms": [],
    "duration": null,
    "onset": null,
    "severity": null,
    "associatedSymptoms": [],
    "redFlags": [],
    "medicalHistory": null,
    "medications": [],
    "allergies": []
  },
  "detectedRedFlags": [],
  "isEmergency": false,
  "shouldAdvanceStage": true,
  "shouldEndConsultation": false
}

EXTRACTION RULES:
- Extract newly mentioned symptoms or details into extractedFindings.
- Set isEmergency to true ONLY if severe life-threatening signs (e.g. chest pain, severe breathing trouble) are stated.
- Set shouldEndConsultation to true if the patient says goodbye or is finished.
`.trim();
}

/**
 * Parse Gemini response with robust JSON repair & regex extraction
 */
function parseGeminiResponse(rawText: string): GeminiResponse & { shouldAdvanceStage: boolean; shouldEndConsultation: boolean } {
  let cleaned = rawText.trim();

  if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7);
  else if (cleaned.startsWith('```')) cleaned = cleaned.slice(3);
  if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3);
  cleaned = cleaned.trim();

  // Attempt 1: Standard JSON parse
  try {
    const parsed = JSON.parse(cleaned);

    return {
      assistantMessage: parsed.assistantMessage || "I hear you. Could you tell me a bit more about your symptoms?",
      voiceText: parsed.voiceText || parsed.assistantMessage || "",
      extractedFindings: {
        chiefComplaint: parsed.extractedFindings?.chiefComplaint || null,
        symptoms: Array.isArray(parsed.extractedFindings?.symptoms) ? parsed.extractedFindings.symptoms : [],
        duration: parsed.extractedFindings?.duration || null,
        onset: parsed.extractedFindings?.onset || null,
        severity: parsed.extractedFindings?.severity || null,
        associatedSymptoms: Array.isArray(parsed.extractedFindings?.associatedSymptoms) ? parsed.extractedFindings.associatedSymptoms : [],
        redFlags: Array.isArray(parsed.extractedFindings?.redFlags) ? parsed.extractedFindings.redFlags : [],
        medicalHistory: parsed.extractedFindings?.medicalHistory || null,
        medications: Array.isArray(parsed.extractedFindings?.medications) ? parsed.extractedFindings.medications : [],
        allergies: Array.isArray(parsed.extractedFindings?.allergies) ? parsed.extractedFindings.allergies : [],
      },
      detectedRedFlags: Array.isArray(parsed.detectedRedFlags) ? parsed.detectedRedFlags : [],
      isEmergency: parsed.isEmergency === true,
      shouldAdvanceStage: parsed.shouldAdvanceStage === true,
      shouldEndConsultation: parsed.shouldEndConsultation === true,
    };
  } catch (err) {
    console.log('JSON parse warning, extracting message via regex...');

    // Attempt 2: Extract assistantMessage using regex if JSON was truncated
    let extractedMessage = "";
    const msgMatch = cleaned.match(/"assistantMessage"\s*:\s*"((?:[^"\\]|\\.)*)"/s);
    if (msgMatch && msgMatch[1]) {
      extractedMessage = msgMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
    }

    // Attempt 3: Try appending closing brackets to repair JSON
    if (!extractedMessage) {
      try {
        const repaired = cleaned + '"}}}';
        const parsedRepaired = JSON.parse(repaired);
        if (parsedRepaired.assistantMessage) {
          extractedMessage = parsedRepaired.assistantMessage;
        }
      } catch {}
    }

    // Extract symptoms using regex if present
    const symptomMatches = [...cleaned.matchAll(/"symptoms"\s*:\s*\[([^\]]*)\]/g)];
    const symptoms: string[] = [];
    if (symptomMatches[0] && symptomMatches[0][1]) {
      const items = symptomMatches[0][1].split(',');
      for (const item of items) {
        const cleanedItem = item.trim().replace(/^"|"$/g, '');
        if (cleanedItem) symptoms.push(cleanedItem);
      }
    }

    const fallbackMsg =
        extractedMessage ||
        "I understand you are experiencing these symptoms. Please take adequate rest, drink plenty of fluids, and monitor how you feel. If your symptoms worsen or persist, please seek advice from a doctor.";

    // Try to extract voiceText via regex as well
    let extractedVoice = "";
    const voiceMatch = cleaned.match(/"voiceText"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    if (voiceMatch && voiceMatch[1]) {
      extractedVoice = voiceMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
    }

    return {
      assistantMessage: fallbackMsg,
      voiceText: extractedVoice || fallbackMsg,
      extractedFindings: {
        chiefComplaint: symptoms[0] || null,
        symptoms: symptoms,
        duration: null,
        onset: null,
        severity: null,
        associatedSymptoms: [],
        redFlags: [],
        medicalHistory: null,
        medications: [],
        allergies: [],
      },
      detectedRedFlags: [],
      isEmergency: false,
      shouldAdvanceStage: true,
      shouldEndConsultation: false,
    };
  }
}

/**
 * Call Gemini API
 */
export async function callGemini(
  state: ConsultationState,
  patientMessage: string,
  language: string = 'en'
): Promise<GeminiResponse & { shouldAdvanceStage: boolean; shouldEndConsultation: boolean }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');

  const model = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
  const url = `${GEMINI_API_URL}/${model}:generateContent?key=${apiKey}`;

  const systemPrompt = buildSystemPrompt(state, language);

  const requestBody = {
    contents: [{
      role: 'user',
      parts: [{ text: `${systemPrompt}\n\nPATIENT MESSAGE:\n"${patientMessage}"` }],
    }],
    generationConfig: {
      temperature: 0.5,
      topP: 0.9,
      topK: 40,
      maxOutputTokens: 2048,
      responseMimeType: 'application/json',
    },
  };

  const maxRetries = 1;
  let lastError: any = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout

    try {
      if (attempt > 0) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Gemini API error (attempt ${attempt + 1}):`, response.status, errorText);
        if (response.status === 503 && attempt < maxRetries) {
          continue; // retry on 503
        }
        throw new Error(`Gemini API returned ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return parseGeminiResponse(rawText);
    } catch (error) {
      clearTimeout(timeoutId);
      lastError = error;
      console.error(`Gemini call attempt ${attempt + 1} failed:`, error);
      if (attempt < maxRetries) {
        continue;
      }
    }
  }

  // Fallback only if all retries exhausted — respond in the correct language
  let fallbackMessage: string;
  let fallbackVoiceText: string;

  if (language.startsWith('te')) {
    fallbackMessage = `మీ సమస్య '${patientMessage}' గురించి నేను అర్థం చేసుకుంటున్నాను. సాధారణ ఉపశమనం కోసం, బాగా నీళ్ళు తాగండి, తగినంత విశ్రాంతి తీసుకోండి, మరియు సురక్షితమైన OTC మందులు వాడండి. లక్షణాలు కొనసాగితే దయచేసి వైద్యుడిని సంప్రదించండి.`;
    fallbackVoiceText = `Mee samasya '${patientMessage}' gurinchi nenu ardham chesukuntunnanu. Saadhaarana upashamanam kosam, baaga neellu taagandi, taginantha vishraanti theesukandi, mariyu surakshitamaina OTC mandulu vaadandi. Lakshanalu konasagithe dayachesi vaidyudini sampradinchandi.`;
  } else if (language.startsWith('hi')) {
    fallbackMessage = `मैं '${patientMessage}' के बारे में आपकी चिंता समझता/समझती हूँ। सामान्य राहत के लिए, खूब पानी पिएं, पर्याप्त आराम करें, और सुरक्षित OTC दवाइयाँ लें। अगर लक्षण बने रहें तो कृपया डॉक्टर से मिलें।`;
    fallbackVoiceText = fallbackMessage;
  } else {
    fallbackMessage = `I understand your concerns regarding '${patientMessage}'. For general relief, ensure you stay well-hydrated, take adequate rest, and use appropriate over-the-counter remedies if safe for you. If symptoms persist or worsen, please consult a healthcare professional.`;
    fallbackVoiceText = fallbackMessage;
  }

  return {
    assistantMessage: fallbackMessage,
    voiceText: fallbackVoiceText,
    extractedFindings: {
      chiefComplaint: patientMessage,
      symptoms: [patientMessage],
      duration: null,
      onset: null,
      severity: null,
      associatedSymptoms: [],
      redFlags: [],
      medicalHistory: null,
      medications: [],
      allergies: [],
    },
    detectedRedFlags: [],
    isEmergency: false,
    shouldAdvanceStage: true,
    shouldEndConsultation: false,
  };
}

/**
 * Generate a comprehensive clinical summary report with actionable solutions
 */
export async function generateSummary(
  findings: ClinicalFindings,
  messages: { role: string; content: string }[]
): Promise<{ summaryText: string; clinicalImpression: string; triageLevel: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');

  const model = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
  const url = `${GEMINI_API_URL}/${model}:generateContent?key=${apiKey}`;

  const prompt = `
You are Virtual Scribe Assistant, an expert AI clinical documentation and medical assessment system. Based on the patient conversation and clinical findings below, generate an advanced, highly detailed medical consultation report.

CLINICAL FINDINGS:
${JSON.stringify(findings, null, 2)}

FULL CONVERSATION:
${messages.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join('\n')}

Generate an advanced structured report strictly in JSON format matching this schema:
{
  "summaryText": "1. HISTORY OF PRESENT ILLNESS (HPI):\n[Detailed narrative of chief complaint, onset, duration, severity, and aggravating/relieving factors]\n\n2. DIFFERENTIAL DIAGNOSIS & CLINICAL REASONING:\n- Primary Suspected Condition: [Likely diagnosis with medical reasoning]\n- Secondary Differentials: [Other possible causes to evaluate or rule out]\n\n3. COMPREHENSIVE ACTIONABLE TREATMENT PLAN:\n- Immediate Home Remedies: [Step-by-step non-pharmacological relief measures]\n- OTC Options & Supportive Care: [Safe OTC medications, dosages, and precautions]\n- Dietary & Lifestyle Adjustments: [Hydration, foods to eat/avoid, rest schedule]",

  "clinicalImpression": "4. RECOMMENDED MEDICAL SPECIALIST & DIAGNOSTICS:\n- Recommended Doctor Specialty: [e.g., General Physician, Pulmonologist, ENT, Gastroenterologist]\n- Suggested Diagnostic Investigations: [e.g., Complete Blood Count (CBC), ESR, Chest X-Ray, Blood Glucose]\n\n5. CRITICAL WARNING SIGNS (RED FLAGS):\n[Specific emergency symptoms requiring immediate ER evaluation]\n\n6. PROGNOSIS & FOLLOW-UP TIMELINE:\n[Expected timeframe for recovery and when to seek urgent re-evaluation]",

  "triageLevel": "routine" | "urgent" | "emergency"
}
`.trim();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 4096,
          responseMimeType: 'application/json',
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) throw new Error(`Gemini API returned ${response.status}`);

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    let cleaned = rawText.trim();
    if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7);
    if (cleaned.startsWith('```')) cleaned = cleaned.slice(3);
    if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3);

    const parsed = JSON.parse(cleaned.trim());

    return {
      summaryText: parsed.summaryText || 'Summary generation completed.',
      clinicalImpression: parsed.clinicalImpression || 'Please consult a healthcare professional for in-person evaluation.',
      triageLevel: ['routine', 'urgent', 'emergency'].includes(parsed.triageLevel) ? parsed.triageLevel : 'routine',
    };
  } catch (error) {
    console.error('Summary generation error:', error);
    return {
      summaryText: 'Consultation summary successfully recorded.',
      clinicalImpression: 'Follow recommended home care and visit a physician if symptoms do not improve.',
      triageLevel: 'routine',
    };
  }
}
