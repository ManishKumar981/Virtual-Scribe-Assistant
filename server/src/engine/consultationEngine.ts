// ============================================
// AURA - Consultation Engine (v3 - Medical Assistant)
// Natural medical consultation, not a questionnaire
// ============================================

import { ConsultationState, ConsultationStage } from '../types/index.js';
import { createEmptyFindings, mergeFindings } from './fieldMerger.js';
import { getAllMissingFields } from './stageManager.js';
import { callGemini, generateSummary } from '../services/geminiService.js';
import * as db from '../services/supabaseService.js';

/**
 * Start a new consultation session
 */
export async function startConsultation(userId: string): Promise<{
  consultationId: string;
  welcomeMessage: string;
  stage: string;
}> {
  const consultation = await db.createConsultation(userId);

  const welcomeMessage =
    "Hello! I'm your Virtual Scribe Assistant. Tell me what health issue or symptoms you are dealing with, and I'll immediately give you clear explanations, effective home remedies, and recommended relief steps.";

  await db.addMessage(consultation.id, 'assistant', welcomeMessage);

  return {
    consultationId: consultation.id,
    welcomeMessage,
    stage: 'presenting_complaint',
  };
}

/**
 * Process a patient message
 */
export async function processMessage(
  consultationId: string,
  userId: string,
  patientMessage: string,
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
  const consultation = await db.getConsultation(consultationId, userId);
  if (!consultation) throw new Error('Consultation not found or access denied');
  if (consultation.status !== 'active') throw new Error('This consultation has already been completed');

  // Save patient message
  await db.addMessage(consultationId, 'patient', patientMessage, isVoiceInput);

  // Get current state
  const currentFindings = await db.getFindings(consultationId);
  const messages = await db.getMessages(consultationId);

  const state: ConsultationState = {
    consultationId,
    userId,
    stage: consultation.stage as any,
    findings: currentFindings,
    askedQuestions: messages.filter((m) => m.role === 'assistant').map((m) => m.content),
    missingFields: getAllMissingFields(currentFindings),
    isComplete: false,
    messages: messages.map((m) => ({
      id: m.id,
      role: m.role as any,
      content: m.content,
      isVoiceInput: m.is_voice_input,
      createdAt: m.created_at,
    })),
  };

  // Call Gemini
  const geminiResponse = await callGemini(state, patientMessage, language);

  // Merge any extracted findings
  const updatedFindings = mergeFindings(currentFindings, geminiResponse.extractedFindings);
  await db.updateFindings(consultationId, updatedFindings);

  let isComplete = false;
  let assistantMessage = geminiResponse.assistantMessage;
  let currentStage = consultation.stage as ConsultationStage;

  // Check if consultation should end
  const patientWantsToEnd = patientMessage.toLowerCase().match(
    /\b(thank|thanks|bye|goodbye|that's all|that's it|done|ok bye|nothing else|no more|all good)\b/
  );

  if (geminiResponse.shouldEndConsultation || patientWantsToEnd) {
    // Generate comprehensive report
    const summaryResult = await generateSummary(
      updatedFindings,
      messages.map((m) => ({ role: m.role, content: m.content }))
    );

    await db.saveSummary(
      consultationId,
      summaryResult.summaryText,
      summaryResult.clinicalImpression,
      summaryResult.triageLevel
    );

    isComplete = true;
    currentStage = 'completed';

    // Add a wrap-up message if the AI didn't already say goodbye
    if (!geminiResponse.shouldEndConsultation) {
      if (language.startsWith('te')) {
        assistantMessage = "ధన్యవాదాలు! మీ సంభాషణ వివరాలతో మరియు మేము చర్చించిన సలహాలతో ఒక వివరణాత్మక నివేదిక తయారు చేశాను. మీరు దాన్ని ఎప్పుడైనా చూడవచ్చు. జాగ్రత్తగా ఉండండి!";
      } else if (language.startsWith('hi')) {
        assistantMessage = "धन्यवाद! मैंने आपकी बातचीत का विस्तृत सारांश तैयार किया है जिसमें सभी सलाह और सिफारिशें शामिल हैं। आप इसे कभी भी देख सकते हैं। अपना ख्याल रखें!";
      } else {
        assistantMessage = "You're welcome! I've put together a detailed summary of our conversation with all the advice and recommendations we discussed. You can view and export it anytime. Take care, and don't hesitate to come back if you need anything!";
      }
    }

    await db.updateConsultationStage(consultationId, 'completed', 'completed');
  } else {
    // Keep the conversation going — update stage based on progress
    const newStage = determineStage(updatedFindings, messages.length);
    currentStage = newStage;
    await db.updateConsultationStage(consultationId, newStage);
  }

  // Save assistant response
  await db.addMessage(consultationId, 'assistant', assistantMessage);

  // Calculate progress
  const patientMsgCount = messages.filter((m) => m.role === 'patient').length;
  const progress = isComplete ? 100 : Math.min(Math.round(patientMsgCount * 20), 90);

  return {
    assistantMessage,
    voiceText: geminiResponse.voiceText || assistantMessage,
    stage: currentStage,
    findings: updatedFindings,
    isComplete,
    isEmergency: geminiResponse.isEmergency,
    detectedRedFlags: geminiResponse.detectedRedFlags,
    progress,
  };
}

/**
 * Determine current stage based on what data we have
 */
function determineStage(findings: any, messageCount: number): ConsultationStage {
  if (!findings.chiefComplaint) return 'presenting_complaint';
  if (findings.symptoms?.length === 0) return 'symptom_details';
  if (messageCount < 4) return 'symptom_details';
  if (!findings.duration && !findings.severity) return 'duration_onset';
  return 'associated_symptoms'; // General consultation stage
}

/**
 * Force-end a consultation and generate the final clinical summary immediately
 */
export async function endConsultation(consultationId: string, userId: string) {
  const consultation = await db.getConsultation(consultationId, userId);
  if (!consultation) throw new Error('Consultation not found or access denied');

  const [findings, messages] = await Promise.all([
    db.getFindings(consultationId),
    db.getMessages(consultationId),
  ]);

  // Generate summary
  const summaryResult = await generateSummary(
    findings,
    messages.map((m) => ({ role: m.role, content: m.content }))
  );

  await db.saveSummary(
    consultationId,
    summaryResult.summaryText,
    summaryResult.clinicalImpression,
    summaryResult.triageLevel
  );

  await db.updateConsultationStage(consultationId, 'completed', 'completed');

  return {
    consultationId,
    isComplete: true,
    summary: summaryResult,
    findings,
  };
}

/**
 * Get full consultation details (for summary page)
 */
export async function getConsultationDetails(consultationId: string, userId: string) {
  const consultation = await db.getConsultation(consultationId, userId);
  if (!consultation) throw new Error('Consultation not found or access denied');

  const [findings, messages, summary] = await Promise.all([
    db.getFindings(consultationId),
    db.getMessages(consultationId),
    db.getSummary(consultationId),
  ]);

  return {
    consultation,
    findings,
    messages: messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      isVoiceInput: m.is_voice_input,
      createdAt: m.created_at,
    })),
    summary,
  };
}


