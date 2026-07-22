"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BookOpen,
  Languages,
  Headphones,
  HelpCircle,
  Mic,
  CheckCircle,
  Star,
  Clock,
  Play,
  Pause,
  RotateCcw,
  AlertCircle,
  Trophy,
  Zap,
  Sparkles,
  ArrowRight,
  Volume2,
  Check,
  X,
} from "lucide-react";
import { cn, needsNativeLanguageSupport } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { Lesson, VocabItem, QuizQuestion } from "@/types";

// ─── Speech helper ──────────────────────────────────────────────

function speakText(text: string) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.9;
  speechSynthesis.speak(utterance);
}

// ─── Live speech recognition helper ──────────────────────────────
// Uses the browser's native Web Speech API (SpeechRecognition) for real,
// live speech-to-text — not a simulation. Only available in Chromium-based
// browsers (Chrome, Edge) as of writing; Firefox/Safari don't support it,
// so every caller must handle the "unsupported" case gracefully.
// This checks REAL word-recognition (did the browser's speech engine hear
// this word), which is an honest proxy for clear pronunciation — it is NOT
// phoneme-level acoustic scoring like a paid pronunciation-assessment API
// (e.g. Azure/Speechace) would give.

interface SpeechRecognitionAlternativeLike {
  transcript: string;
  confidence: number;
}
interface SpeechRecognitionResultLike {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternativeLike;
}
interface SpeechRecognitionResultListLike {
  length: number;
  [index: number]: SpeechRecognitionResultLike;
}
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: SpeechRecognitionResultListLike;
}
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}

function getSpeechRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

function normalizeWord(word: string): string {
  return word.toLowerCase().replace(/[^a-z']/g, "");
}

function wordsOf(text: string): string[] {
  return text.split(/\s+/).map(normalizeWord).filter(Boolean);
}

// General, honest pronunciation guidance for Spanish speakers learning
// English — not per-word phonetic analysis (we don't have that data), but
// genuinely useful, commonly-taught tips.
const PRONUNCIATION_TIPS = [
  "The 'th' sound (as in 'the', 'health') doesn't exist in Spanish — put your tongue between your teeth and blow air gently.",
  "English 'h' is aspirated (a real breath of air), unlike the silent Spanish 'h' — say 'hello' with a puff of air.",
  "Stress matters in English: 'reCORD' (verb) vs 'REcord' (noun) — the stressed syllable is longer and louder.",
  "The short 'i' (bit) and long 'ee' (beat) are different sounds in English, but often merge in Spanish — listen closely to the model audio.",
  "English 'r' doesn't roll or tap like Spanish 'r' — curl your tongue back without touching the roof of your mouth.",
];

// ─── Bilingual instruction helper ────────────────────────────────
// For beginner levels (A0/A1), UI instructions — not lesson content,
// which already has its own per-lesson translations — get a Spanish line
// underneath the English so first-time users aren't lost in the interface.
// Fades out once needsNativeLanguageSupport() says the level no longer
// needs it (see src/lib/utils.ts for the CEFR-based cutoff).

function Instruction({
  en,
  es,
  showEs,
  className,
}: {
  en: string;
  es: string;
  showEs: boolean;
  className?: string;
}) {
  return (
    <p className={className ?? "text-slate-400 text-sm"}>
      {en}
      {showEs && <span className="block text-slate-500 text-xs mt-0.5">{es}</span>}
    </p>
  );
}

// ─── Mock Lesson Data ───────────────────────────────────────────

interface GrammarPractice {
  q: string;
  options: string[];
  correct: number;
}

interface LessonMockData {
  lesson: Lesson;
  grammarPractice: GrammarPractice[];
  quizQuestions: QuizQuestion[]; // always 5
  speakingPrompt: string;
  speakingContext: string;
}

const ALL_MOCK_DATA: Record<string, LessonMockData> = {
  "a0-greetings": {
    lesson: {
      id: "a0-greetings",
      level: "A0",
      order: 1,
      title: "Greetings in Healthcare",
      subtitle: "Saludos en el entorno medico",
      description:
        "Learn basic greetings used in hospitals and clinics. Aprende saludos basicos para usar en hospitales.",
      vocab_healthcare: [
        { en: "Hello, how are you?", es: "Hola, como estas?", context: "Greeting a patient", definition: "" },
        { en: "Good morning, I am your nurse", es: "Buenos dias, soy tu enfermera", context: "Introducing yourself", definition: "" },
        { en: "Please, have a seat", es: "Por favor, tome asiento", context: "Directing a patient", definition: "" },
        { en: "My name is...", es: "Mi nombre es...", context: "Self-introduction", definition: "" },
        { en: "Nice to meet you", es: "Mucho gusto", context: "First meeting", definition: "" },
      ],
      grammar_point: {
        topic: "Present Simple - Verb To Be",
        explanation: "I am / You are / He is / She is",
        examples: ["I am a nurse", "She is the doctor", "You are the patient"],
      },
      content: {
        listening: {
          script:
            "Good morning. I am Sarah, your nurse today. How are you feeling?",
          questions: [
            { q: "Who is speaking?", options: ["The doctor", "The nurse", "The patient"], correct: 1 },
          ],
        },
      },
      is_checkpoint: false,
      duration_minutes: 20,
      created_at: "",
    },
    grammarPractice: [
      { q: "Complete: She ___ a nurse.", options: ["am", "is", "are"], correct: 1 },
      { q: "Complete: I ___ the doctor.", options: ["am", "is", "are"], correct: 0 },
      { q: "Complete: You ___ the patient.", options: ["am", "is", "are"], correct: 2 },
    ],
    quizQuestions: [
      { q: "Complete: I ___ a nurse", options: ["is", "am", "are"], correct: 1 },
      { q: "My name ___ Maria", options: ["am", "is", "are"], correct: 1 },
      { q: "How do you greet a patient in the morning?", options: ["Good night", "Good morning", "Good afternoon"], correct: 1 },
      { q: "'Nice to meet you' in Spanish is:", options: ["Hola", "Mucho gusto", "Buenos dias"], correct: 1 },
      { q: "He ___ the doctor.", options: ["am", "is", "are"], correct: 1 },
    ],
    speakingPrompt:
      "Introduce yourself as a nurse to a new patient. Say your name, greet them, and ask how they are feeling.",
    speakingContext: "Hospital admission - first meeting with a patient",
  },

  "a0-body-parts": {
    lesson: {
      id: "a0-body-parts",
      level: "A0",
      order: 2,
      title: "Parts of the Body",
      subtitle: "Partes del cuerpo",
      description:
        "Essential vocabulary for body parts in medical contexts. Vocabulario esencial de partes del cuerpo.",
      vocab_healthcare: [
        { en: "head", es: "cabeza", context: "Patient assessment", definition: "" },
        { en: "arm", es: "brazo", context: "Taking blood pressure", definition: "" },
        { en: "leg", es: "pierna", context: "Mobility assessment", definition: "" },
        { en: "chest", es: "pecho", context: "Listening to heartbeat", definition: "" },
        { en: "back", es: "espalda", context: "Pain assessment", definition: "" },
      ],
      grammar_point: {
        topic: "Articles: a/an/the",
        explanation: "A before consonant, An before vowel, The for specific",
        examples: ["a headache", "an arm injury", "the patient"],
      },
      content: {
        listening: {
          script:
            "The patient has pain in his left arm. Please check his blood pressure.",
          questions: [
            { q: "Where is the pain?", options: ["Right arm", "Left arm", "Chest"], correct: 1 },
          ],
        },
      },
      is_checkpoint: false,
      duration_minutes: 20,
      created_at: "",
    },
    grammarPractice: [
      { q: "The patient has ___ headache.", options: ["a", "an", "the"], correct: 0 },
      { q: "She has ___ ear infection.", options: ["a", "an", "the"], correct: 1 },
      { q: "___ patient is in room 4.", options: ["A", "An", "The"], correct: 2 },
    ],
    quizQuestions: [
      { q: "The patient has ___ headache", options: ["a", "an", "the"], correct: 0 },
      { q: "She has ___ ear infection", options: ["a", "an", "the"], correct: 1 },
      { q: "'arm' in Spanish is:", options: ["pierna", "brazo", "cabeza"], correct: 1 },
      { q: "'chest' in Spanish is:", options: ["espalda", "pecho", "brazo"], correct: 1 },
      { q: "A stethoscope is used to listen to the ___", options: ["arm", "chest", "leg"], correct: 1 },
    ],
    speakingPrompt:
      "Describe where a patient has pain using body parts. Say: 'The patient has pain in the...'",
    speakingContext: "Pain assessment in a clinic",
  },

  "a0-vital-signs": {
    lesson: {
      id: "a0-vital-signs",
      level: "A0",
      order: 3,
      title: "Numbers and Vital Signs",
      subtitle: "Numeros y signos vitales",
      description:
        "Learn numbers for taking vital signs. Aprende numeros para tomar signos vitales.",
      vocab_healthcare: [
        { en: "blood pressure", es: "presion arterial", context: "Vital signs measurement", definition: "" },
        { en: "temperature", es: "temperatura", context: "Fever check", definition: "" },
        { en: "heart rate", es: "ritmo cardiaco", context: "Pulse check", definition: "" },
        { en: "one hundred twenty over eighty", es: "ciento veinte sobre ochenta", context: "Reading BP", definition: "" },
        { en: "degrees Celsius", es: "grados centigrados", context: "Temperature reading", definition: "" },
      ],
      grammar_point: {
        topic: "Numbers 1-200",
        explanation: "Cardinal numbers for medical readings",
        examples: ["120/80", "98.6 F", "72 bpm"],
      },
      content: {
        listening: {
          script:
            "The patients blood pressure is one hundred thirty over eighty-five. Temperature is thirty-seven point two.",
          questions: [
            { q: "What is the blood pressure?", options: ["120/80", "130/85", "140/90"], correct: 1 },
          ],
        },
      },
      is_checkpoint: false,
      duration_minutes: 20,
      created_at: "",
    },
    grammarPractice: [
      { q: "The BP reading is 120 ___ 80.", options: ["over", "under", "between"], correct: 0 },
      { q: "Normal body temperature is about ___ degrees Celsius.", options: ["35", "37", "39"], correct: 1 },
      { q: "One hundred is the number ___.", options: ["10", "100", "1000"], correct: 1 },
    ],
    quizQuestions: [
      { q: "Normal body temperature in Celsius is about ___ degrees", options: ["35", "37", "39"], correct: 1 },
      { q: "'blood pressure' in Spanish is:", options: ["presion arterial", "ritmo cardiaco", "temperatura"], correct: 0 },
      { q: "We measure blood pressure with a...", options: ["thermometer", "sphygmomanometer", "stethoscope"], correct: 1 },
      { q: "'heart rate' in Spanish is:", options: ["ritmo cardiaco", "presion arterial", "frecuencia"], correct: 0 },
      { q: "120/80 is a blood pressure reading expressed as 120 ___ 80", options: ["and", "over", "with"], correct: 1 },
    ],
    speakingPrompt:
      "Read these vital signs aloud as if reporting to a doctor: 'Blood pressure 120 over 80, heart rate 72, temperature 37 degrees.'",
    speakingContext: "Nurse reporting vital signs during rounds",
  },

  "a0-checkpoint-1": {
    lesson: {
      id: "a0-checkpoint-1",
      level: "A0",
      order: 4,
      title: "Checkpoint: Basic Communication",
      subtitle: "Evaluacion: Comunicacion basica",
      description:
        "Review and assessment of greetings, body parts, and vital signs. Evaluacion de lo aprendido.",
      vocab_healthcare: [],
      grammar_point: { topic: "Review", explanation: "Review of lessons 1-3", examples: [] },
      content: {
        is_checkpoint: true,
        review_lessons: [1, 2, 3],
        passing_score: 70,
        questions: [
          { q: "How do you introduce yourself to a patient?", options: ["Goodbye", "I am your nurse", "Where is the bathroom?"], correct: 1 },
          { q: "What is the correct article: ___ headache", options: ["a", "an", "the"], correct: 0 },
          { q: "Normal blood pressure is around...", options: ["200/100", "120/80", "90/60"], correct: 1 },
          { q: "How do you say 'brazo' in English?", options: ["Leg", "Arm", "Chest"], correct: 1 },
          { q: "She ___ the doctor", options: ["am", "is", "are"], correct: 1 },
        ],
      },
      is_checkpoint: true,
      duration_minutes: 25,
      created_at: "",
    },
    grammarPractice: [
      { q: "I ___ a nurse.", options: ["am", "is", "are"], correct: 0 },
      { q: "Complete: ___ arm (article)", options: ["a", "an", "the"], correct: 1 },
      { q: "The number after 119 is ___.", options: ["118", "120", "121"], correct: 1 },
    ],
    quizQuestions: [
      { q: "How do you introduce yourself to a patient?", options: ["Goodbye", "I am your nurse", "Where is the bathroom?"], correct: 1 },
      { q: "What is the correct article: ___ headache", options: ["a", "an", "the"], correct: 0 },
      { q: "Normal blood pressure is around...", options: ["200/100", "120/80", "90/60"], correct: 1 },
      { q: "How do you say 'brazo' in English?", options: ["Leg", "Arm", "Chest"], correct: 1 },
      { q: "She ___ the doctor", options: ["am", "is", "are"], correct: 1 },
    ],
    speakingPrompt:
      "Do a full patient greeting: introduce yourself, ask the patient's name, ask where they have pain, and say you will check their blood pressure.",
    speakingContext: "Checkpoint speaking assessment",
  },

  "a0-symptoms": {
    lesson: {
      id: "a0-symptoms",
      level: "A0",
      order: 5,
      title: "Common Symptoms",
      subtitle: "Sintomas comunes",
      description:
        "How to ask about and describe common symptoms. Como preguntar sobre sintomas comunes.",
      vocab_healthcare: [
        { en: "headache", es: "dolor de cabeza", context: "Pain assessment", definition: "" },
        { en: "fever", es: "fiebre", context: "Vital signs", definition: "" },
        { en: "cough", es: "tos", context: "Respiratory", definition: "" },
        { en: "nausea", es: "nausea", context: "General symptoms", definition: "" },
        { en: "dizziness", es: "mareo", context: "General symptoms", definition: "" },
      ],
      grammar_point: {
        topic: "Present Simple Questions",
        explanation: "Do/Does for questions",
        examples: ["Do you have a headache?", "Does the patient have fever?"],
      },
      content: {
        listening: {
          script:
            "Patient says: I have a bad headache and I feel dizzy. I also have a cough since yesterday.",
          questions: [
            { q: "How many symptoms does the patient mention?", options: ["Two", "Three", "Four"], correct: 1 },
          ],
        },
      },
      is_checkpoint: false,
      duration_minutes: 20,
      created_at: "",
    },
    grammarPractice: [
      { q: "___ you have a fever?", options: ["Do", "Does", "Is"], correct: 0 },
      { q: "___ the patient have a headache?", options: ["Do", "Does", "Is"], correct: 1 },
      { q: "___ she feel dizzy?", options: ["Do", "Does", "Is"], correct: 1 },
    ],
    quizQuestions: [
      { q: "___ you have a fever?", options: ["Do", "Does", "Is"], correct: 0 },
      { q: "The patient complains of ___ and dizziness", options: ["fever", "headache", "cough"], correct: 1 },
      { q: "'nausea' in Spanish is:", options: ["mareo", "nausea", "tos"], correct: 1 },
      { q: "'cough' in Spanish is:", options: ["tos", "fiebre", "dolor"], correct: 0 },
      { q: "A patient with high temperature has a ___", options: ["headache", "cough", "fever"], correct: 2 },
    ],
    speakingPrompt:
      "Ask a patient about their symptoms using 'Do you have...?' questions. Ask about headache, fever, cough, and how long they've had symptoms.",
    speakingContext: "Emergency room triage",
  },

  // ─── A1 Lessons ───────────────────────────────────────────────

  "a1-meeting-patient": {
    lesson: {
      id: "a1-meeting-patient",
      level: "A1",
      order: 1,
      title: "Meeting the Patient",
      subtitle: "Preguntas básicas al paciente",
      description:
        "Learn to ask basic questions when meeting a new patient. Aprende a hacer preguntas básicas al conocer a un nuevo paciente.",
      vocab_healthcare: [
        { en: "What's your name?", es: "¿Cómo te llamas?", context: "Patient intake", definition: "" },
        { en: "How old are you?", es: "¿Cuántos años tienes?", context: "Patient intake", definition: "" },
        { en: "Where are you from?", es: "¿De dónde eres?", context: "Getting to know the patient", definition: "" },
        { en: "date of birth", es: "fecha de nacimiento", context: "Registration form", definition: "" },
        { en: "occupation", es: "ocupación", context: "Patient profile", definition: "" },
      ],
      grammar_point: {
        topic: "Present Simple - WH Questions",
        explanation:
          "Use What, How, Where + is/do/does to ask about facts. Usa What, How, Where + is/do/does para preguntar datos.",
        examples: ["What's your name?", "How old are you?", "Where do you live?", "What's your occupation?"],
      },
      content: {
        listening: {
          script:
            "Good morning. Can I ask you a few questions? What's your name, please? And how old are you? Where are you from originally?",
          questions: [
            { q: "What is the nurse asking about?", options: ["Symptoms", "Personal information", "Medication"], correct: 1 },
          ],
        },
        quiz: [
          { q: "___ is your name?", options: ["What", "Where", "How"], correct: 0 },
          { q: "___ old are you?", options: ["What", "How", "Where"], correct: 1 },
        ],
      },
      is_checkpoint: false,
      duration_minutes: 20,
      created_at: "",
    },
    grammarPractice: [
      { q: "Choose the correct question word: ___ are you from?", options: ["What", "Where", "How"], correct: 1 },
      { q: "___ is your date of birth?", options: ["What", "Where", "Who"], correct: 0 },
      { q: "Complete: ___ do you live?", options: ["What", "Where", "When"], correct: 1 },
    ],
    quizQuestions: [
      { q: "'What's your name?' asks about the patient's:", options: ["Age", "Name", "Address"], correct: 1 },
      { q: "'How old are you?' asks about:", options: ["Age", "Occupation", "Origin"], correct: 0 },
      { q: "'Date of birth' means:", options: ["Birthday", "Address", "Phone number"], correct: 0 },
      { q: "'Where are you from?' asks about:", options: ["Occupation", "Origin/country", "Age"], correct: 1 },
      { q: "'Occupation' means:", options: ["Job", "Home", "Family"], correct: 0 },
    ],
    speakingPrompt:
      "Introduce yourself as a nurse and ask a new patient for their name, age, and where they are from.",
    speakingContext: "First meeting with a new patient at intake",
  },

  "a1-ward-routine": {
    lesson: {
      id: "a1-ward-routine",
      level: "A1",
      order: 2,
      title: "Daily Ward Routine",
      subtitle: "Present Simple para rutinas",
      description:
        "Talk about daily hospital routines and schedules. Habla sobre las rutinas y horarios diarios del hospital.",
      vocab_healthcare: [
        { en: "wake up", es: "despertarse", context: "Morning routine", definition: "" },
        { en: "check vitals", es: "revisar signos vitales", context: "Nursing routine", definition: "" },
        { en: "shift", es: "turno", context: "Work schedule", definition: "" },
        { en: "every morning", es: "cada mañana", context: "Frequency", definition: "" },
        { en: "medication round", es: "ronda de medicamentos", context: "Ward routine", definition: "" },
      ],
      grammar_point: {
        topic: "Present Simple for Routines",
        explanation:
          "Use Present Simple (+s for he/she/it) to talk about habits and routines. Usa el presente simple (+s para he/she/it) para hablar de hábitos y rutinas.",
        examples: [
          "The nurse checks vitals every morning.",
          "I start my shift at 7am.",
          "Patients wake up at 6am.",
          "We do medication rounds twice a day.",
        ],
      },
      content: {
        listening: {
          script:
            "My shift starts at seven in the morning. First, I check the patients' vital signs. Then, at eight, we do the medication round. Lunch is at noon.",
          questions: [
            { q: "What time does the shift start?", options: ["6am", "7am", "8am"], correct: 1 },
          ],
        },
        quiz: [
          { q: "The nurse ___ vitals every morning.", options: ["check", "checks", "checking"], correct: 1 },
          { q: "I ___ my shift at 7am.", options: ["start", "starts", "starting"], correct: 0 },
        ],
      },
      is_checkpoint: false,
      duration_minutes: 20,
      created_at: "",
    },
    grammarPractice: [
      { q: "She ___ (check) the patient every hour.", options: ["check", "checks", "checking"], correct: 1 },
      { q: "We ___ (do) rounds twice a day.", options: ["does", "do", "doing"], correct: 1 },
      { q: "The doctor ___ (start) at 8am.", options: ["start", "starting", "starts"], correct: 2 },
    ],
    quizQuestions: [
      { q: "'Shift' means:", options: ["A type of medicine", "A work period", "A patient room"], correct: 1 },
      { q: "'Every morning' shows:", options: ["A single event", "A frequency/habit", "A location"], correct: 1 },
      { q: "'Wake up' means:", options: ["Go to sleep", "Stop sleeping", "Eat breakfast"], correct: 1 },
      { q: "'Medication round' means:", options: ["Giving medicine to all patients", "A round table", "A doctor's meeting"], correct: 0 },
      { q: "Correct form: The nurse ___ vitals.", options: ["check", "checks", "checking"], correct: 1 },
    ],
    speakingPrompt:
      "Describe your typical daily routine as a healthcare worker, from the start to the end of your shift.",
    speakingContext: "Talking to a new colleague about the ward schedule",
  },

  "a1-family-contact": {
    lesson: {
      id: "a1-family-contact",
      level: "A1",
      order: 3,
      title: "Family & Emergency Contact",
      subtitle: "Posesivos y vocabulario familiar",
      description:
        "Ask about a patient's family and emergency contact information. Pregunta sobre la familia del paciente y su contacto de emergencia.",
      vocab_healthcare: [
        { en: "emergency contact", es: "contacto de emergencia", context: "Admission form", definition: "" },
        { en: "spouse", es: "cónyuge / esposo(a)", context: "Family information", definition: "" },
        { en: "next of kin", es: "pariente más cercano", context: "Hospital records", definition: "" },
        { en: "relationship", es: "parentesco", context: "Emergency contact form", definition: "" },
        { en: "phone number", es: "número de teléfono", context: "Contact details", definition: "" },
      ],
      grammar_point: {
        topic: "Possessive 's and Family Vocabulary",
        explanation:
          "Use 's to show who something belongs to. Usa 's para mostrar posesión (ej. the patient's husband).",
        examples: [
          "What's your husband's name?",
          "This is my sister's number.",
          "Who is the patient's next of kin?",
          "Her mother's phone number is...",
        ],
      },
      content: {
        listening: {
          script:
            "Can you give me your emergency contact, please? What's your spouse's name and phone number? What is their relationship to you?",
          questions: [
            { q: "What is the nurse asking for?", options: ["Medical history", "Emergency contact information", "Insurance details"], correct: 1 },
          ],
        },
        quiz: [
          { q: "This is my ___ number. (sister)", options: ["sister", "sister's", "sisters"], correct: 1 },
          { q: "Who is the patient's ___ of kin?", options: ["next", "near", "close"], correct: 0 },
        ],
      },
      is_checkpoint: false,
      duration_minutes: 20,
      created_at: "",
    },
    grammarPractice: [
      { q: "What is your ___ name? (husband)", options: ["husband", "husband's", "husbands"], correct: 1 },
      { q: "'Next of kin' means:", options: ["Closest relative", "Doctor", "Neighbor"], correct: 0 },
      { q: "This is ___ phone number. (my mother)", options: ["my mother", "my mother's", "my mothers"], correct: 1 },
    ],
    quizQuestions: [
      { q: "'Emergency contact' means:", options: ["A person to call in an emergency", "A phone number for billing", "A type of medicine"], correct: 0 },
      { q: "'Spouse' means:", options: ["Husband or wife", "Child", "Sibling"], correct: 0 },
      { q: "'Relationship' in this context means:", options: ["How two people are connected", "A romantic date", "A hospital department"], correct: 0 },
      { q: "Correct: 'the patient___ husband'", options: ["'s", "s'", "es"], correct: 0 },
      { q: "'Next of kin' is usually:", options: ["A stranger", "The closest family member", "A doctor"], correct: 1 },
    ],
    speakingPrompt:
      "Ask a patient for their emergency contact's name, relationship, and phone number.",
    speakingContext: "Completing a hospital admission form with a patient",
  },

  "a1-checkpoint-1": {
    lesson: {
      id: "a1-checkpoint-1",
      level: "A1",
      order: 4,
      title: "Checkpoint: Basic Patient Interaction",
      subtitle: "Evaluación: Interacción básica con el paciente",
      description:
        "Review greetings, patient questions, routines, and family vocabulary. Repaso de preguntas al paciente, rutinas y vocabulario familiar.",
      vocab_healthcare: [],
      grammar_point: { topic: "Review", explanation: "Review of lessons 1-3", examples: [] },
      content: {
        is_checkpoint: true,
        review_lessons: [1, 2, 3],
        passing_score: 70,
        questions: [
          { q: "How do you ask a patient's name?", options: ["What's your name?", "How's your name?", "Who's your name?"], correct: 0 },
          { q: "'Every morning' shows a:", options: ["Single event", "Routine/habit", "Question"], correct: 1 },
          { q: "'Next of kin' means:", options: ["Doctor", "Closest relative", "Medicine"], correct: 1 },
          { q: "The nurse ___ (check) vitals every day.", options: ["check", "checks", "checking"], correct: 1 },
          { q: "'Occupation' means:", options: ["Job", "Age", "Address"], correct: 0 },
        ],
      },
      is_checkpoint: true,
      duration_minutes: 25,
      created_at: "",
    },
    grammarPractice: [
      { q: "What's your ___? (name)", options: ["name", "name's", "names"], correct: 0 },
      { q: "The nurse ___ (check) vitals every day.", options: ["check", "checks", "checking"], correct: 1 },
      { q: "This is my ___ number. (sister)", options: ["sister", "sister's", "sisters"], correct: 1 },
    ],
    quizQuestions: [
      { q: "How do you ask a patient's name?", options: ["What's your name?", "How's your name?", "Who's your name?"], correct: 0 },
      { q: "'Every morning' shows a:", options: ["Single event", "Routine/habit", "Question"], correct: 1 },
      { q: "'Next of kin' means:", options: ["Doctor", "Closest relative", "Medicine"], correct: 1 },
      { q: "The nurse ___ (check) vitals every day.", options: ["check", "checks", "checking"], correct: 1 },
      { q: "'Occupation' means:", options: ["Job", "Age", "Address"], correct: 0 },
    ],
    speakingPrompt:
      "Greet a new patient, ask for their name, age, and emergency contact, and ask about their daily routine.",
    speakingContext: "Checkpoint speaking assessment",
  },

  "a1-how-do-you-feel": {
    lesson: {
      id: "a1-how-do-you-feel",
      level: "A1",
      order: 5,
      title: "How Are You Feeling?",
      subtitle: "Expresar sentimientos y necesidades básicas",
      description:
        "Learn to describe how you feel and express basic needs. Aprende a describir cómo te sientes y expresar necesidades básicas.",
      vocab_healthcare: [
        { en: "I feel...", es: "me siento...", context: "Describing feelings", definition: "" },
        { en: "I have pain", es: "tengo dolor", context: "Describing symptoms", definition: "" },
        { en: "pain scale", es: "escala de dolor", context: "Pain assessment", definition: "" },
        { en: "I need...", es: "necesito...", context: "Expressing needs", definition: "" },
        { en: "thirsty / hungry", es: "con sed / con hambre", context: "Basic needs", definition: "" },
      ],
      grammar_point: {
        topic: "I feel / I have / I need",
        explanation:
          "Use 'I feel' + adjective, 'I have' + noun, and 'I need' + noun to talk about your state and needs. Usa 'I feel' + adjetivo, 'I have' + sustantivo, 'I need' + sustantivo.",
        examples: ["I feel dizzy.", "I have a headache.", "I need some water.", "I feel better today."],
      },
      content: {
        listening: {
          script:
            "On a scale from one to ten, how much pain do you feel? I feel a lot of pain, maybe an eight. I also feel a little dizzy and I need some water.",
          questions: [
            { q: "How much pain does the patient feel?", options: ["Two", "Five", "Eight"], correct: 2 },
          ],
        },
        quiz: [
          { q: "I ___ dizzy.", options: ["feel", "have", "need"], correct: 0 },
          { q: "I ___ a headache.", options: ["feel", "have", "am"], correct: 1 },
        ],
      },
      is_checkpoint: false,
      duration_minutes: 20,
      created_at: "",
    },
    grammarPractice: [
      { q: "I ___ thirsty.", options: ["have", "feel", "need"], correct: 1 },
      { q: "I ___ some water, please.", options: ["feel", "need", "have"], correct: 1 },
      { q: "She ___ a headache.", options: ["feels", "has", "need"], correct: 1 },
    ],
    quizQuestions: [
      { q: "'Pain scale' is used to:", options: ["Weigh the patient", "Measure pain from 1-10", "Measure temperature"], correct: 1 },
      { q: "'I feel dizzy' means:", options: ["I feel happy", "I feel unsteady/lightheaded", "I feel hungry"], correct: 1 },
      { q: "'I need water' expresses:", options: ["A feeling", "A need", "A symptom"], correct: 1 },
      { q: "'Thirsty' means you need:", options: ["Food", "Water", "Sleep"], correct: 1 },
      { q: "Correct: 'I ___ a headache.'", options: ["feel", "have", "am"], correct: 1 },
    ],
    speakingPrompt:
      "Ask a patient to describe their pain using the pain scale, and ask if they need anything (water, food, rest).",
    speakingContext: "Checking on a patient's comfort and needs during rounds",
  },

  // ─── A2 Lessons ───────────────────────────────────────────────

  "a2-what-happened": {
    lesson: {
      id: "a2-what-happened",
      level: "A2",
      order: 1,
      title: "What Happened? Taking a Brief History",
      subtitle: "Simple Past for Patient History",
      description: "Ask and describe what happened using the simple past tense.",
      vocab_healthcare: [
        { en: "fall", definition: "To drop down suddenly by accident", context: "Injury history" },
        { en: "onset", definition: "The moment a symptom or illness begins", context: "Medical history" },
        { en: "twist", definition: "To injure a joint by turning it awkwardly", context: "Injury description" },
        { en: "collapse", definition: "To suddenly fall down, often from weakness or fainting", context: "Emergency history" },
        { en: "since", definition: "From a point in the past until now", context: "Duration of symptoms" },
      ],
      grammar_point: {
        topic: "Simple Past Tense",
        explanation:
          "Use the simple past to describe completed actions or events. Regular verbs add -ed (twisted, collapsed); many common verbs are irregular (fall→fell, break→broke).",
        examples: [
          "The pain started yesterday.",
          "She fell down the stairs.",
          "He twisted his ankle.",
          "I felt dizzy this morning.",
        ],
      },
      content: {
        listening: {
          script:
            "Tell me what happened. I was walking down the stairs and I fell. I twisted my ankle and it started to swell immediately.",
          questions: [
            { q: "What did the patient injure?", options: ["Wrist", "Ankle", "Knee"], correct: 1 },
          ],
        },
        quiz: [
          { q: "The pain ___ (start) yesterday.", options: ["start", "started", "starts"], correct: 1 },
          { q: "She ___ (fall) down the stairs.", options: ["fall", "falled", "fell"], correct: 2 },
        ],
      },
      is_checkpoint: false,
      duration_minutes: 20,
      created_at: "",
    },
    grammarPractice: [
      { q: "He ___ (twist) his ankle.", options: ["twist", "twisted", "twists"], correct: 1 },
      { q: "I ___ (feel) dizzy this morning.", options: ["feel", "felt", "feeled"], correct: 1 },
      { q: "She ___ (collapse) at work.", options: ["collapse", "collapsed", "collapses"], correct: 1 },
    ],
    quizQuestions: [
      { q: "'Onset' means:", options: ["The end of an illness", "The beginning of a symptom", "A type of medicine"], correct: 1 },
      { q: "'Since Monday' means:", options: ["Only on Monday", "From Monday until now", "Before Monday"], correct: 1 },
      { q: "Past tense of 'fall':", options: ["falled", "fell", "fallen"], correct: 1 },
      { q: "'Collapse' means:", options: ["To stand up", "To suddenly fall down", "To walk slowly"], correct: 1 },
      { q: "'Twist an ankle' means:", options: ["Break it", "Injure it by turning awkwardly", "Wash it"], correct: 1 },
    ],
    speakingPrompt:
      "Ask a patient what happened and how their injury occurred, using past tense questions.",
    speakingContext: "Emergency room intake interview",
  },

  "a2-comparing-symptoms": {
    lesson: {
      id: "a2-comparing-symptoms",
      level: "A2",
      order: 2,
      title: "Comparing Symptoms",
      subtitle: "Comparatives for Describing Change",
      description: "Describe whether symptoms are improving or worsening using comparatives.",
      vocab_healthcare: [
        { en: "worse", definition: "More severe or bad than before", context: "Symptom comparison" },
        { en: "better", definition: "Improved compared to before", context: "Symptom comparison" },
        { en: "higher", definition: "Greater in level or amount", context: "Vital signs comparison" },
        { en: "lower", definition: "Smaller in level or amount", context: "Vital signs comparison" },
        { en: "than before", definition: "Compared to an earlier time", context: "Describing change" },
      ],
      grammar_point: {
        topic: "Comparative Adjectives",
        explanation:
          "Use comparatives to compare two states. Short adjectives add -er (higher, lower); irregular ones change completely (bad→worse, good→better).",
        examples: [
          "Is the pain better or worse today?",
          "My fever is higher than yesterday.",
          "I feel worse than before.",
          "Her blood pressure is lower now.",
        ],
      },
      content: {
        listening: {
          script:
            "How do you feel compared to yesterday? Actually, I feel much better. The pain is less than before, but I still feel a little weak.",
          questions: [
            { q: "How does the patient feel today?", options: ["Worse", "Better", "The same"], correct: 1 },
          ],
        },
        quiz: [
          { q: "My fever is ___ than yesterday. (high)", options: ["high", "higher", "highest"], correct: 1 },
          { q: "I feel ___ today. (bad → comparative)", options: ["worse", "bad", "badder"], correct: 0 },
        ],
      },
      is_checkpoint: false,
      duration_minutes: 20,
      created_at: "",
    },
    grammarPractice: [
      { q: "Her pain is ___ than this morning. (bad)", options: ["bad", "worse", "worst"], correct: 1 },
      { q: "His temperature is ___ now. (low)", options: ["low", "lower", "lowest"], correct: 1 },
      { q: "I feel much ___ today. (good)", options: ["good", "gooder", "better"], correct: 2 },
    ],
    quizQuestions: [
      { q: "'Worse' is the comparative of:", options: ["Good", "Bad", "Big"], correct: 1 },
      { q: "'Better' is the comparative of:", options: ["Bad", "Good", "Small"], correct: 1 },
      { q: "'Higher than yesterday' means:", options: ["The same as yesterday", "Greater than yesterday", "Less than yesterday"], correct: 1 },
      { q: "If pain is 'less than before', the patient feels:", options: ["Worse", "Better", "No change"], correct: 1 },
      { q: "'Lower blood pressure' compared to before means it:", options: ["Increased", "Decreased", "Stayed the same"], correct: 1 },
    ],
    speakingPrompt:
      "Ask a patient to compare how they feel today versus yesterday, using comparative language.",
    speakingContext: "Follow-up check during rounds",
  },

  "a2-instructions-procedures": {
    lesson: {
      id: "a2-instructions-procedures",
      level: "A2",
      order: 3,
      title: "Instructions & Procedures",
      subtitle: "Imperatives and Sequencing",
      description: "Give clear step-by-step instructions using imperatives and sequence words.",
      vocab_healthcare: [
        { en: "first", definition: "Used to introduce the initial step", context: "Sequencing instructions" },
        { en: "then / next", definition: "Used to introduce the following step", context: "Sequencing instructions" },
        { en: "finally", definition: "Used to introduce the last step", context: "Sequencing instructions" },
        { en: "breathe in / breathe out", definition: "To inhale / to exhale", context: "Physical exam instructions" },
        { en: "hold still", definition: "Do not move", context: "Procedure instructions" },
      ],
      grammar_point: {
        topic: "Imperatives for Instructions",
        explanation:
          "Use the base form of the verb (no subject) to give instructions. Sequence words like first, then, next, finally help organize steps clearly.",
        examples: [
          "First, take a deep breath.",
          "Then, hold it for five seconds.",
          "Next, breathe out slowly.",
          "Finally, relax your arm.",
        ],
      },
      content: {
        listening: {
          script:
            "Please follow my instructions. First, sit down and relax. Then, breathe in slowly through your nose. Hold it for three seconds. Finally, breathe out through your mouth.",
          questions: [
            { q: "What is the first instruction?", options: ["Breathe out", "Sit down and relax", "Hold your breath"], correct: 1 },
          ],
        },
        quiz: [
          { q: "___, take a deep breath. (first step)", options: ["First", "Finally", "Then"], correct: 0 },
          { q: "Please ___ still while I check your arm.", options: ["holds", "hold", "holding"], correct: 1 },
        ],
      },
      is_checkpoint: false,
      duration_minutes: 20,
      created_at: "",
    },
    grammarPractice: [
      { q: "___, roll up your sleeve. (first step)", options: ["Finally", "First", "Next"], correct: 1 },
      { q: "Please ___ your arm on the table. (instruction)", options: ["place", "placing", "placed"], correct: 0 },
      { q: "___, I will check your pulse. (last step)", options: ["First", "Finally", "Then"], correct: 1 },
    ],
    quizQuestions: [
      { q: "'Hold still' means:", options: ["Move quickly", "Do not move", "Breathe deeply"], correct: 1 },
      { q: "'Finally' introduces:", options: ["The first step", "A middle step", "The last step"], correct: 2 },
      { q: "Imperatives use:", options: ["The base verb form", "The past tense", "The -ing form"], correct: 0 },
      { q: "'Breathe in' means:", options: ["Exhale", "Inhale", "Hold breath"], correct: 1 },
      { q: "'Next' is used to show:", options: ["The first step", "A following step", "A cancelled step"], correct: 1 },
    ],
    speakingPrompt:
      "Give a patient step-by-step instructions for a simple breathing exercise, using first/then/finally.",
    speakingContext: "Guiding a patient through a physical exam procedure",
  },

  "a2-checkpoint-1": {
    lesson: {
      id: "a2-checkpoint-1",
      level: "A2",
      order: 4,
      title: "Checkpoint: Describing Change and Giving Instructions",
      subtitle: "Evaluación: Historia clínica, comparativos e instrucciones",
      description: "Review past tense history-taking, comparatives, and giving instructions.",
      vocab_healthcare: [],
      grammar_point: { topic: "Review", explanation: "Review of lessons 1-3", examples: [] },
      content: {
        is_checkpoint: true,
        review_lessons: [1, 2, 3],
        passing_score: 70,
        questions: [
          { q: "She ___ (fall) down the stairs.", options: ["fall", "falled", "fell"], correct: 2 },
          { q: "My fever is ___ than yesterday. (high)", options: ["high", "higher", "highest"], correct: 1 },
          { q: "___, take a deep breath. (first step)", options: ["First", "Finally", "Then"], correct: 0 },
          { q: "'Onset' means:", options: ["The end of an illness", "The beginning of a symptom", "A type of medicine"], correct: 1 },
          { q: "'Hold still' means:", options: ["Move quickly", "Do not move", "Breathe deeply"], correct: 1 },
        ],
      },
      is_checkpoint: true,
      duration_minutes: 25,
      created_at: "",
    },
    grammarPractice: [
      { q: "The pain ___ (start) yesterday.", options: ["start", "started", "starts"], correct: 1 },
      { q: "I feel ___ today. (bad → comparative)", options: ["worse", "bad", "badder"], correct: 0 },
      { q: "Please ___ still while I check your arm.", options: ["holds", "hold", "holding"], correct: 1 },
    ],
    quizQuestions: [
      { q: "She ___ (fall) down the stairs.", options: ["fall", "falled", "fell"], correct: 2 },
      { q: "My fever is ___ than yesterday. (high)", options: ["high", "higher", "highest"], correct: 1 },
      { q: "___, take a deep breath. (first step)", options: ["First", "Finally", "Then"], correct: 0 },
      { q: "'Onset' means:", options: ["The end of an illness", "The beginning of a symptom", "A type of medicine"], correct: 1 },
      { q: "'Hold still' means:", options: ["Move quickly", "Do not move", "Breathe deeply"], correct: 1 },
    ],
    speakingPrompt:
      "Tell a colleague what happened to a patient, compare their symptoms to yesterday, and give them instructions for a simple exam.",
    speakingContext: "Checkpoint speaking assessment",
  },

  "a2-family-history": {
    lesson: {
      id: "a2-family-history",
      level: "A2",
      order: 5,
      title: "Family Medical History",
      subtitle: "Have/Has for Family Health Background",
      description: "Ask about a patient's family medical history using have/has.",
      vocab_healthcare: [
        { en: "family history", definition: "Health conditions that run in a patient's family", context: "Medical history form" },
        { en: "diabetes", definition: "A condition causing high blood sugar", context: "Common chronic condition" },
        { en: "heart disease", definition: "A condition affecting the heart", context: "Common chronic condition" },
        { en: "allergic to", definition: "Having a bad reaction to a substance", context: "Allergy history" },
        { en: "run in the family", definition: "To be a health condition common among relatives", context: "Family history idiom" },
      ],
      grammar_point: {
        topic: "Have/Has for Possession and Health Conditions",
        explanation:
          "Use 'have' with I/you/we/they and 'has' with he/she/it to talk about health conditions.",
        examples: [
          "Does your mother have diabetes?",
          "My father has heart disease.",
          "Do you have any allergies?",
          "She has no family history of cancer.",
        ],
      },
      content: {
        listening: {
          script:
            "Does anyone in your family have diabetes or heart disease? Yes, my father has heart disease and my grandmother had diabetes.",
          questions: [
            { q: "What condition does the patient's father have?", options: ["Diabetes", "Heart disease", "Allergies"], correct: 1 },
          ],
        },
        quiz: [
          { q: "___ your mother have diabetes?", options: ["Does", "Do", "Is"], correct: 0 },
          { q: "My father ___ heart disease.", options: ["have", "has", "having"], correct: 1 },
        ],
      },
      is_checkpoint: false,
      duration_minutes: 20,
      created_at: "",
    },
    grammarPractice: [
      { q: "___ you have any allergies?", options: ["Does", "Do", "Is"], correct: 1 },
      { q: "She ___ no family history of cancer.", options: ["have", "has", "having"], correct: 1 },
      { q: "___ anyone in your family have asthma?", options: ["Does", "Do", "Is"], correct: 0 },
    ],
    quizQuestions: [
      { q: "'Family history' means:", options: ["A story about the family", "Health conditions common in the family", "The family's address"], correct: 1 },
      { q: "'Runs in the family' means:", options: ["A family activity", "Common among relatives", "A type of exercise"], correct: 1 },
      { q: "'Allergic to' means:", options: ["Enjoys something", "Has a bad reaction to something", "Is immune to something"], correct: 1 },
      { q: "Correct: 'My father ___ heart disease.'", options: ["have", "has", "having"], correct: 1 },
      { q: "'Diabetes' is:", options: ["A condition causing high blood sugar", "A type of allergy", "A broken bone"], correct: 0 },
    ],
    speakingPrompt:
      "Ask a patient about their family's medical history, including diabetes, heart disease, and allergies.",
    speakingContext: "Completing a new patient intake form",
  },

  // ─── B1 Lessons ───────────────────────────────────────────────

  "b1-isbar": {
    lesson: {
      id: "b1-isbar",
      level: "B1",
      order: 1,
      title: "Patient Handover - ISBAR",
      subtitle: "Clinical Communication",
      description:
        "Master the ISBAR framework for structured patient handovers between shifts.",
      vocab_healthcare: [
        { en: "handover", definition: "The transfer of patient care responsibility from one provider to another", context: "End of shift report" },
        { en: "deterioration", definition: "A decline in patient condition", context: "Patient status" },
        { en: "vital signs stable", definition: "Blood pressure, heart rate, temperature within normal range", context: "Patient assessment" },
        { en: "plan of care", definition: "The documented treatment approach for a patient", context: "Nursing process" },
        { en: "escalation", definition: "The process of raising concerns to senior staff", context: "Clinical urgency" },
      ],
      grammar_point: {
        topic: "ISBAR Framework",
        explanation: "Introduction, Situation, Background, Assessment, Recommendation",
        examples: [
          "I: I am calling about Mr. Smith in Room 302",
          "S: His blood pressure has dropped to 90/60",
          "B: He was admitted yesterday with pneumonia",
          "A: I think he may be dehydrated",
          "R: I recommend starting IV fluids",
        ],
      },
      content: {
        listening: {
          script:
            "Hi, this is Nurse Chen from Ward 4B. I am calling about Mrs. Rodriguez, a 68-year-old patient in room 412. She was admitted three days ago post-hip surgery. Her vital signs were stable until an hour ago when her heart rate increased to 110 and her oxygen saturation dropped to 92%. She is also complaining of shortness of breath. Given her recent surgery, I am concerned about a possible pulmonary embolism. I recommend an urgent CT scan and would like you to review her immediately.",
          questions: [
            { q: "What is the ISBAR framework used for?", options: ["Medication calculation", "Patient handover", "Diagnosing illness"], correct: 1 },
            { q: "What condition does the nurse suspect?", options: ["Pneumonia", "Pulmonary embolism", "Heart attack"], correct: 1 },
          ],
        },
      },
      is_checkpoint: false,
      duration_minutes: 30,
      created_at: "",
    },
    grammarPractice: [
      { q: "In ISBAR, 'I' stands for:", options: ["Identify", "Introduction", "Intervention"], correct: 1 },
      { q: "Vital signs belong in which ISBAR component?", options: ["Introduction", "Assessment", "Background"], correct: 1 },
      { q: "The recommendation step involves:", options: ["Stating the problem", "Giving patient history", "Suggesting next actions"], correct: 2 },
    ],
    quizQuestions: [
      { q: "In ISBAR, 'S' stands for:", options: ["Symptoms", "Situation", "Surgery"], correct: 1 },
      { q: "Which ISBAR component includes vital signs?", options: ["Introduction", "Assessment", "Background"], correct: 1 },
      { q: "A handover is:", options: ["A medication list", "Transfer of care responsibility", "A diagnosis"], correct: 1 },
      { q: "'Escalation' means:", options: ["Staying quiet", "Raising concerns to senior staff", "Discharging a patient"], correct: 1 },
      { q: "'Deterioration' refers to:", options: ["Improvement", "A decline in condition", "Stable condition"], correct: 1 },
    ],
    speakingPrompt:
      "Give an ISBAR handover report for a patient with chest pain. Structure your report: Introduction, Situation, Background, Assessment, Recommendation.",
    speakingContext: "Shift change handover at the nursing station",
  },

  "b1-patient-history": {
    lesson: {
      id: "b1-patient-history",
      level: "B1",
      order: 2,
      title: "Taking Patient History",
      subtitle: "Clinical Assessment",
      description:
        "Learn to take a comprehensive patient history using the SOCRATES framework for pain assessment and standard history-taking questions.",
      vocab_healthcare: [
        { en: "onset", definition: "When symptoms began", context: "Pain assessment" },
        { en: "aggravating factors", definition: "Things that make the condition worse", context: "Assessment" },
        { en: "past medical history", definition: "Previous illnesses and conditions", context: "History taking" },
        { en: "medication reconciliation", definition: "Reviewing all current medications", context: "Admission process" },
        { en: "chief complaint", definition: "The primary reason for seeking medical attention", context: "Patient interview" },
      ],
      grammar_point: {
        topic: "Question Formation for History Taking",
        explanation: "Open-ended vs closed questions, probing techniques",
        examples: [
          "Can you describe the pain?",
          "When did it start?",
          "What makes it better or worse?",
          "Have you had this before?",
        ],
      },
      content: {
        listening: {
          script:
            "Patient interview: I have been having this chest pain for about two days. It started suddenly while I was walking. It feels like pressure, not sharp. On a scale of 1 to 10, I would say it is a 6. It gets worse when I walk and better when I sit down. I also feel a bit short of breath. I have high blood pressure and I take lisinopril 10mg daily.",
          questions: [
            { q: "What is the patients chief complaint?", options: ["Headache", "Chest pain", "Back pain"], correct: 1 },
            { q: "When did the pain start?", options: ["Two weeks ago", "Two days ago", "Two hours ago"], correct: 1 },
          ],
        },
      },
      is_checkpoint: false,
      duration_minutes: 30,
      created_at: "",
    },
    grammarPractice: [
      { q: "Which is an open-ended question?", options: ["Do you have pain?", "Can you describe the pain?", "Is it sharp?"], correct: 1 },
      { q: "'When did it start?' asks about the ___ of symptoms.", options: ["location", "onset", "severity"], correct: 1 },
      { q: "SOCRATES is used to assess:", options: ["Vital signs", "Pain characteristics", "Medication dosages"], correct: 1 },
    ],
    quizQuestions: [
      { q: "What does SOCRATES assess?", options: ["Vital signs", "Pain characteristics", "Lab results"], correct: 1 },
      { q: "An 'aggravating factor' makes symptoms...", options: ["Better", "Worse", "No change"], correct: 1 },
      { q: "'Chief complaint' means:", options: ["The main symptom", "A minor issue", "The discharge plan"], correct: 0 },
      { q: "'Onset' refers to:", options: ["Pain location", "When symptoms began", "Pain severity"], correct: 1 },
      { q: "'Past medical history' includes:", options: ["Current medications only", "Previous illnesses and conditions", "Family contact info"], correct: 1 },
    ],
    speakingPrompt:
      "Take a patient history using the SOCRATES framework. Ask about site, onset, character, radiation, associated symptoms, time course, exacerbating factors, and severity.",
    speakingContext: "Initial patient assessment in the emergency department",
  },

  "b1-medication": {
    lesson: {
      id: "b1-medication",
      level: "B1",
      order: 3,
      title: "Medication Administration",
      subtitle: "Pharmacology Basics",
      description:
        "Vocabulary and communication for safe medication administration including the 5 Rights of medication.",
      vocab_healthcare: [
        { en: "dosage", definition: "The amount of medication to be given", context: "Medication chart" },
        { en: "route of administration", definition: "How medication enters the body (oral, IV, IM, etc.)", context: "Drug administration" },
        { en: "contraindication", definition: "A condition where a drug should not be used", context: "Drug safety" },
        { en: "adverse reaction", definition: "An unwanted or harmful effect of a medication", context: "Patient monitoring" },
        { en: "therapeutic effect", definition: "The intended beneficial result of a medication", context: "Treatment outcome" },
      ],
      grammar_point: {
        topic: "Passive Voice in Clinical Notes",
        explanation: "Using passive voice for objective clinical documentation",
        examples: [
          "The medication was administered at 0800",
          "Vital signs were recorded before administration",
          "The patient was observed for 30 minutes post-injection",
        ],
      },
      content: {
        listening: {
          script:
            "Before administering this medication, please verify the five rights: right patient, right drug, right dose, right route, and right time. Check the patients ID band and ask for their name and date of birth. This patient is allergic to penicillin, so make sure you document that clearly.",
          questions: [
            { q: "How many rights of medication are mentioned?", options: ["Three", "Four", "Five"], correct: 2 },
            { q: "What allergy does the patient have?", options: ["Aspirin", "Penicillin", "Ibuprofen"], correct: 1 },
          ],
        },
      },
      is_checkpoint: false,
      duration_minutes: 30,
      created_at: "",
    },
    grammarPractice: [
      { q: "The medication ___ administered at 0800 (passive voice).", options: ["is", "was", "were"], correct: 1 },
      { q: "Vital signs ___ recorded (passive voice).", options: ["were", "was", "is"], correct: 0 },
      { q: "The patient ___ observed for 30 minutes (passive voice).", options: ["was", "were", "is"], correct: 0 },
    ],
    quizQuestions: [
      { q: "The medication ___ administered at 0800 (passive)", options: ["is", "was", "were"], correct: 1 },
      { q: "A contraindication means the drug...", options: ["Should be given", "Should NOT be given", "Is optional"], correct: 1 },
      { q: "'Dosage' means:", options: ["The route", "The amount", "The time"], correct: 1 },
      { q: "An 'adverse reaction' is:", options: ["The desired effect", "A harmful effect", "No effect"], correct: 1 },
      { q: "'Route of administration' refers to:", options: ["The hospital", "How medication enters the body", "The pharmacy"], correct: 1 },
    ],
    speakingPrompt:
      "Explain the 5 Rights of Medication Administration to a nursing student. Include: right patient, right drug, right dose, right route, right time.",
    speakingContext: "Mentoring a new nurse on the ward",
  },

  "b1-checkpoint-1": {
    lesson: {
      id: "b1-checkpoint-1",
      level: "B1",
      order: 4,
      title: "Checkpoint: Clinical Communication",
      subtitle: "Mid-Level Assessment",
      description:
        "Comprehensive review of patient handover, history taking, and medication administration.",
      vocab_healthcare: [],
      grammar_point: { topic: "Review", explanation: "Review of lessons 1-3", examples: [] },
      content: {
        is_checkpoint: true,
        review_lessons: [1, 2, 3],
        passing_score: 75,
        questions: [
          { q: "What does ISBAR stand for?", options: ["Introduction, Situation, Background, Assessment, Recommendation", "Identify, Situation, Background, Action, Review", "Initial, Status, Basic, Assessment, Response"], correct: 0 },
          { q: "The five rights of medication include all EXCEPT:", options: ["Right patient", "Right diagnosis", "Right dose"], correct: 1 },
          { q: "In SOCRATES pain assessment, 'O' stands for:", options: ["Observation", "Onset", "Operation"], correct: 1 },
          { q: "A patient says their pain gets 'worse when walking' - this is called:", options: ["An aggravating factor", "A relieving factor", "A side effect"], correct: 0 },
          { q: "In a handover, vital signs belong in which ISBAR component?", options: ["Introduction", "Situation", "Assessment"], correct: 2 },
        ],
      },
      is_checkpoint: true,
      duration_minutes: 35,
      created_at: "",
    },
    grammarPractice: [
      { q: "ISBAR 'A' stands for:", options: ["Action", "Assessment", "Admission"], correct: 1 },
      { q: "Which is NOT a medication right?", options: ["Right patient", "Right diagnosis", "Right dose"], correct: 1 },
      { q: "SOCRATES 'O' stands for:", options: ["Observation", "Onset", "Operation"], correct: 1 },
    ],
    quizQuestions: [
      { q: "What does ISBAR stand for?", options: ["Introduction, Situation, Background, Assessment, Recommendation", "Identify, Situation, Background, Action, Review", "Initial, Status, Basic, Assessment, Response"], correct: 0 },
      { q: "The five rights of medication include all EXCEPT:", options: ["Right patient", "Right diagnosis", "Right dose"], correct: 1 },
      { q: "In SOCRATES pain assessment, 'O' stands for:", options: ["Observation", "Onset", "Operation"], correct: 1 },
      { q: "A patient says their pain gets 'worse when walking' - this is called:", options: ["An aggravating factor", "A relieving factor", "A side effect"], correct: 0 },
      { q: "In a handover, vital signs belong in which ISBAR component?", options: ["Introduction", "Situation", "Assessment"], correct: 2 },
    ],
    speakingPrompt:
      "Give a complete clinical handover of a patient you have been caring for. Include their history, current status, any changes, and your recommendations.",
    speakingContext: "Checkpoint speaking assessment - clinical communication",
  },

  "b1-infection": {
    lesson: {
      id: "b1-infection",
      level: "B1",
      order: 5,
      title: "Infection Control",
      subtitle: "Safety & Prevention",
      description:
        "Master infection control terminology including PPE, standard precautions, and isolation protocols.",
      vocab_healthcare: [
        { en: "personal protective equipment", definition: "Equipment worn to minimize exposure to hazards", context: "Infection prevention" },
        { en: "hand hygiene", definition: "Cleaning hands to prevent transmission of pathogens", context: "Standard precautions" },
        { en: "transmission-based precautions", definition: "Additional infection control measures for specific diseases", context: "Isolation protocols" },
        { en: "aseptic technique", definition: "Practices to maintain sterility and prevent contamination", context: "Clinical procedures" },
        { en: "nosocomial infection", definition: "An infection acquired in a healthcare facility", context: "Patient safety" },
      ],
      grammar_point: {
        topic: "Modal Verbs for Protocols",
        explanation: "Must, should, have to for clinical obligations",
        examples: [
          "You must wash your hands before patient contact",
          "PPE should be worn in isolation rooms",
          "Staff have to complete annual infection control training",
        ],
      },
      content: {
        listening: {
          script:
            "Attention all staff: we have a confirmed case of MRSA in Ward 3. Contact precautions are now in effect. You must wear gloves and a gown when entering the patient's room. Hand hygiene must be performed before and after patient contact. The patient has been moved to a single room. Visitors are limited to two at a time and must also wear PPE.",
          questions: [
            { q: "What type of precautions are in effect?", options: ["Droplet precautions", "Contact precautions", "Airborne precautions"], correct: 1 },
            { q: "What PPE is required?", options: ["Gloves only", "Gloves and gown", "Full PPE including N95"], correct: 1 },
          ],
        },
      },
      is_checkpoint: false,
      duration_minutes: 30,
      created_at: "",
    },
    grammarPractice: [
      { q: "You ___ wash your hands before patient contact.", options: ["might", "must", "could"], correct: 1 },
      { q: "PPE ___ be worn in isolation rooms.", options: ["should", "might", "could"], correct: 0 },
      { q: "Staff ___ complete annual training.", options: ["have to", "might", "could"], correct: 0 },
    ],
    quizQuestions: [
      { q: "You ___ wash hands before patient contact", options: ["might", "must", "could"], correct: 1 },
      { q: "A nosocomial infection is acquired in a...", options: ["Community", "Healthcare facility", "School"], correct: 1 },
      { q: "'Hand hygiene' means:", options: ["Wearing gloves", "Cleaning hands", "Using hand lotion"], correct: 1 },
      { q: "'Aseptic technique' is used to:", options: ["Contaminate", "Maintain sterility", "Speed up procedures"], correct: 1 },
      { q: "PPE stands for:", options: ["Patient Protection Equipment", "Personal Protective Equipment", "Professional Practice Exam"], correct: 1 },
    ],
    speakingPrompt:
      "Explain infection control protocols to a visitor. Explain what PPE is needed, why hand hygiene is important, and how to properly put on and remove gloves.",
    speakingContext: "Orienting a family member visiting an isolation room",
  },

  // ─── B2 Lessons ───────────────────────────────────────────────

  "b2-diagnosis-treatment": {
    lesson: {
      id: "b2-diagnosis-treatment",
      level: "B2",
      order: 1,
      title: "Explaining Diagnosis & Treatment Options",
      subtitle: "Modals for Advice and Possibility",
      description: "Explain diagnoses and discuss treatment options using modal verbs.",
      vocab_healthcare: [
        { en: "prognosis", definition: "The likely course or outcome of a medical condition", context: "Discussing diagnosis" },
        { en: "side effect", definition: "An unwanted effect of a medication or treatment", context: "Treatment options" },
        { en: "recommend", definition: "To suggest something as the best option", context: "Giving medical advice" },
        { en: "underlying condition", definition: "A health problem that is the root cause of symptoms", context: "Diagnosis" },
        { en: "risk factor", definition: "Something that increases the chance of developing a condition", context: "Assessing risk" },
      ],
      grammar_point: {
        topic: "Modal Verbs for Advice and Possibility",
        explanation:
          "Use 'should' for recommendations, 'might/could' for possibility, and 'must' for strong necessity when discussing diagnosis and treatment.",
        examples: [
          "You should take this medication twice a day.",
          "This might be a side effect of the treatment.",
          "We could try a different approach.",
          "You must avoid alcohol with this medication.",
        ],
      },
      content: {
        listening: {
          script:
            "Based on your symptoms, this could be related to your blood pressure medication. You should schedule a follow-up in two weeks. We might need to adjust your dosage.",
          questions: [
            { q: "What does the doctor suggest?", options: ["Stop all medication", "Schedule a follow-up", "Go to the emergency room"], correct: 1 },
          ],
        },
        quiz: [
          { q: "You ___ take this medication with food.", options: ["should", "must not", "couldn't"], correct: 0 },
          { q: "This ___ be a side effect.", options: ["should", "might", "must"], correct: 1 },
        ],
      },
      is_checkpoint: false,
      duration_minutes: 25,
      created_at: "",
    },
    grammarPractice: [
      { q: "We ___ try a different medication. (possibility)", options: ["should", "could", "must"], correct: 1 },
      { q: "You ___ avoid alcohol with this medication. (strong necessity)", options: ["might", "could", "must"], correct: 2 },
      { q: "This ___ be related to stress. (possibility)", options: ["might", "must", "should"], correct: 0 },
    ],
    quizQuestions: [
      { q: "'Prognosis' means:", options: ["A type of medication", "The likely outcome of a condition", "A hospital department"], correct: 1 },
      { q: "'Side effect' means:", options: ["The main effect of a drug", "An unwanted effect of a treatment", "A type of surgery"], correct: 1 },
      { q: "'Risk factor' means:", options: ["A guaranteed outcome", "Something that increases risk", "A type of insurance"], correct: 1 },
      { q: "'Underlying condition' means:", options: ["A visible symptom", "The root cause of symptoms", "A hospital policy"], correct: 1 },
      { q: "Correct modal for strong necessity:", options: ["might", "could", "must"], correct: 2 },
    ],
    speakingPrompt:
      "Explain a diagnosis to a patient and discuss two possible treatment options, using should/might/could appropriately.",
    speakingContext: "Discussing treatment options in an outpatient consultation",
  },

  "b2-passive-voice-reports": {
    lesson: {
      id: "b2-passive-voice-reports",
      level: "B2",
      order: 2,
      title: "Passive Voice in Clinical Reports",
      subtitle: "Passive Voice for Objective Reporting",
      description: "Use passive voice to write and speak about clinical procedures and reports objectively.",
      vocab_healthcare: [
        { en: "administered", definition: "Given to a patient (medication or treatment)", context: "Clinical documentation" },
        { en: "documented", definition: "Recorded in writing, usually in medical notes", context: "Clinical documentation" },
        { en: "referred", definition: "Sent to see another specialist or department", context: "Patient care coordination" },
        { en: "discharged", definition: "Formally allowed to leave the hospital", context: "End of treatment" },
        { en: "conducted", definition: "Carried out or performed (a test or procedure)", context: "Clinical procedures" },
      ],
      grammar_point: {
        topic: "Passive Voice (is/was + past participle)",
        explanation:
          "Use the passive voice when the action matters more than who did it — common in clinical documentation and handovers.",
        examples: [
          "The medication was administered at 8am.",
          "Tests were conducted this morning.",
          "The patient was referred to cardiology.",
          "She was discharged yesterday.",
        ],
      },
      content: {
        listening: {
          script:
            "The patient was admitted last night with chest pain. An ECG was conducted and blood tests were ordered. She was referred to cardiology for further evaluation.",
          questions: [
            { q: "Why was the patient referred to cardiology?", options: ["Routine checkup", "Chest pain", "A broken bone"], correct: 1 },
          ],
        },
        quiz: [
          { q: "The medication ___ administered at 8am.", options: ["was", "is being", "has"], correct: 0 },
          { q: "Tests ___ conducted this morning.", options: ["was", "were", "is"], correct: 1 },
        ],
      },
      is_checkpoint: false,
      duration_minutes: 25,
      created_at: "",
    },
    grammarPractice: [
      { q: "The patient ___ discharged yesterday.", options: ["was", "were", "is"], correct: 0 },
      { q: "Blood tests ___ ordered this morning.", options: ["was", "were", "is"], correct: 1 },
      { q: "She ___ referred to a specialist.", options: ["was", "were", "did"], correct: 0 },
    ],
    quizQuestions: [
      { q: "'Administered' means:", options: ["Given to a patient", "Removed from a patient", "Ordered by a patient"], correct: 0 },
      { q: "'Discharged' means:", options: ["Admitted to hospital", "Formally allowed to leave", "Diagnosed with a condition"], correct: 1 },
      { q: "'Referred' means:", options: ["Treated immediately", "Sent to another specialist", "Discharged home"], correct: 1 },
      { q: "Passive voice structure is:", options: ["subject + verb + object", "be + past participle", "modal + base verb"], correct: 1 },
      { q: "'Conducted' means:", options: ["Cancelled", "Carried out or performed", "Documented only"], correct: 1 },
    ],
    speakingPrompt:
      "Give a clinical handover using passive voice: describe what tests were conducted and what was documented for a patient.",
    speakingContext: "End-of-shift handover to the next nurse",
  },

  "b2-reported-speech": {
    lesson: {
      id: "b2-reported-speech",
      level: "B2",
      order: 3,
      title: "Reported Speech: Relaying Patient Information",
      subtitle: "Indirect Speech for Handovers",
      description: "Relay what a patient or colleague said using reported speech.",
      vocab_healthcare: [
        { en: "mentioned", definition: "Said something briefly, often in passing", context: "Reporting what someone said" },
        { en: "complained of", definition: "Reported a symptom or problem", context: "Reporting patient symptoms" },
        { en: "stated", definition: "Said clearly and directly", context: "Formal reporting" },
        { en: "denied", definition: "Said that something was not true", context: "Reporting negative findings" },
        { en: "according to", definition: "As stated or reported by", context: "Attributing information" },
      ],
      grammar_point: {
        topic: "Reported Speech",
        explanation:
          "When relaying what someone said, shift the tense back: 'I feel dizzy' becomes 'She said she felt dizzy'. Common reporting verbs: said, mentioned, stated, complained of, denied.",
        examples: [
          "She said she felt dizzy.",
          "He mentioned that the pain started yesterday.",
          "The patient complained of nausea.",
          "He denied having any allergies.",
        ],
      },
      content: {
        listening: {
          script:
            "The patient said she had been feeling tired for two weeks. She mentioned that she also had trouble sleeping. She denied any chest pain or shortness of breath.",
          questions: [
            { q: "What did the patient deny?", options: ["Feeling tired", "Trouble sleeping", "Chest pain"], correct: 2 },
          ],
        },
        quiz: [
          { q: "She said she ___ dizzy. (feel)", options: ["feels", "felt", "feeling"], correct: 1 },
          { q: "He ___ having any allergies.", options: ["denied", "denies", "deny"], correct: 0 },
        ],
      },
      is_checkpoint: false,
      duration_minutes: 25,
      created_at: "",
    },
    grammarPractice: [
      { q: "He said he ___ pain in his chest. (have)", options: ["has", "had", "having"], correct: 1 },
      { q: "She ___ of a severe headache. (complain)", options: ["complained", "complains", "complaining"], correct: 0 },
      { q: "The patient ___ any history of surgery. (deny)", options: ["deny", "denies", "denied"], correct: 2 },
    ],
    quizQuestions: [
      { q: "'Complained of' is used to report:", options: ["A symptom", "A payment", "An appointment"], correct: 0 },
      { q: "'Denied' means the patient said:", options: ["Something was true", "Something was not true", "Nothing at all"], correct: 1 },
      { q: "'Stated' means:", options: ["Whispered unclearly", "Said clearly and directly", "Wrote in a letter"], correct: 1 },
      { q: "Reported speech usually shifts the tense:", options: ["Forward", "Back", "It never changes"], correct: 1 },
      { q: "'According to the patient' means:", options: ["In the doctor's opinion", "As the patient reported", "As shown on a scan"], correct: 1 },
    ],
    speakingPrompt:
      "Relay to a colleague what a patient told you during intake, using reported speech (said, mentioned, complained of, denied).",
    speakingContext: "Handing over patient information to the next shift",
  },

  "b2-checkpoint-1": {
    lesson: {
      id: "b2-checkpoint-1",
      level: "B2",
      order: 4,
      title: "Checkpoint: Clinical Reporting & Modals",
      subtitle: "Evaluación: Modales, voz pasiva y discurso indirecto",
      description: "Review modals, passive voice, and reported speech for clinical communication.",
      vocab_healthcare: [],
      grammar_point: { topic: "Review", explanation: "Review of lessons 1-3", examples: [] },
      content: {
        is_checkpoint: true,
        review_lessons: [1, 2, 3],
        passing_score: 70,
        questions: [
          { q: "You ___ take this medication with food.", options: ["should", "must not", "couldn't"], correct: 0 },
          { q: "The medication ___ administered at 8am.", options: ["was", "is being", "has"], correct: 0 },
          { q: "She said she ___ dizzy. (feel)", options: ["feels", "felt", "feeling"], correct: 1 },
          { q: "'Prognosis' means:", options: ["A type of medication", "The likely outcome of a condition", "A hospital department"], correct: 1 },
          { q: "'Discharged' means:", options: ["Admitted to hospital", "Formally allowed to leave", "Given medication"], correct: 1 },
        ],
      },
      is_checkpoint: true,
      duration_minutes: 30,
      created_at: "",
    },
    grammarPractice: [
      { q: "This ___ be a side effect. (possibility)", options: ["should", "might", "must"], correct: 1 },
      { q: "Tests ___ conducted this morning.", options: ["was", "were", "is"], correct: 1 },
      { q: "He ___ having any allergies. (deny)", options: ["denied", "denies", "deny"], correct: 0 },
    ],
    quizQuestions: [
      { q: "You ___ take this medication with food.", options: ["should", "must not", "couldn't"], correct: 0 },
      { q: "The medication ___ administered at 8am.", options: ["was", "is being", "has"], correct: 0 },
      { q: "She said she ___ dizzy. (feel)", options: ["feels", "felt", "feeling"], correct: 1 },
      { q: "'Prognosis' means:", options: ["A type of medication", "The likely outcome of a condition", "A hospital department"], correct: 1 },
      { q: "'Discharged' means:", options: ["Admitted to hospital", "Formally allowed to leave", "Given medication"], correct: 1 },
    ],
    speakingPrompt:
      "Give a full clinical handover: explain a diagnosis using modals, describe what tests were conducted using passive voice, and relay what the patient told you using reported speech.",
    speakingContext: "Checkpoint speaking assessment",
  },

  "b2-difficult-conversations": {
    lesson: {
      id: "b2-difficult-conversations",
      level: "B2",
      order: 5,
      title: "Difficult Conversations: Breaking News & Handling Concerns",
      subtitle: "Softening Language and Empathy Phrases",
      description: "Use softening language and empathy phrases to handle difficult conversations with patients.",
      vocab_healthcare: [
        { en: "I'm afraid...", definition: "A polite way to introduce bad or difficult news", context: "Breaking news" },
        { en: "unfortunately", definition: "Used to introduce disappointing information", context: "Delivering bad news" },
        { en: "I understand this is difficult", definition: "An empathy phrase acknowledging emotional impact", context: "Showing empathy" },
        { en: "reassure", definition: "To say something to reduce someone's worry", context: "Comforting a patient" },
        { en: "address your concerns", definition: "To respond to and deal with someone's worries", context: "Handling complaints" },
      ],
      grammar_point: {
        topic: "Softening Language for Sensitive Topics",
        explanation:
          "Use hedging phrases and empathy statements to deliver difficult news gently: 'I'm afraid...', 'Unfortunately...', 'I understand this is difficult, but...'",
        examples: [
          "I'm afraid the results show...",
          "Unfortunately, we need to run more tests.",
          "I understand this is difficult news.",
          "Let me reassure you that we'll take good care of you.",
        ],
      },
      content: {
        listening: {
          script:
            "I'm afraid the test results show some abnormalities. I understand this is difficult news to hear. Let me explain what the next steps will be, and I want to reassure you that we're here to support you.",
          questions: [
            { q: "What is the doctor's tone in this conversation?", options: ["Angry", "Empathetic and reassuring", "Indifferent"], correct: 1 },
          ],
        },
        quiz: [
          { q: "'I'm afraid...' is used to:", options: ["Show fear", "Introduce difficult news gently", "Ask a question"], correct: 1 },
          { q: "'Reassure' means to:", options: ["Increase worry", "Reduce someone's worry", "Ignore someone"], correct: 1 },
        ],
      },
      is_checkpoint: false,
      duration_minutes: 25,
      created_at: "",
    },
    grammarPractice: [
      { q: "___ the results are not what we hoped for. (soften bad news)", options: ["I'm afraid", "I'm happy", "I guess"], correct: 0 },
      { q: "Let me ___ you that we'll take good care of you.", options: ["worry", "reassure", "scare"], correct: 1 },
      { q: "I understand this is ___ news to hear.", options: ["exciting", "difficult", "boring"], correct: 1 },
    ],
    quizQuestions: [
      { q: "'Unfortunately' is used to introduce:", options: ["Good news", "Disappointing news", "A question"], correct: 1 },
      { q: "'Address your concerns' means:", options: ["Ignore your worries", "Respond to and deal with your worries", "Write down your address"], correct: 1 },
      { q: "'I understand this is difficult' is an example of:", options: ["A diagnosis", "An empathy phrase", "A medication order"], correct: 1 },
      { q: "Softening language is used to:", options: ["Confuse the patient", "Deliver sensitive news gently", "Speed up the conversation"], correct: 1 },
      { q: "'Reassure' means to:", options: ["Increase someone's worry", "Reduce someone's worry", "Diagnose a condition"], correct: 1 },
    ],
    speakingPrompt:
      "Deliver difficult test results to a patient using softening language and empathy phrases, then reassure them about next steps.",
    speakingContext: "Delivering sensitive diagnostic results in a consultation room",
  },

  // ─── C1 Lessons ───────────────────────────────────────────────

  "c1-differential-diagnosis": {
    lesson: {
      id: "c1-differential-diagnosis",
      level: "C1",
      order: 1,
      title: "Advanced Clinical Reasoning & Differential Diagnosis",
      subtitle: "Hedging Language for Clinical Uncertainty",
      description: "Discuss differential diagnoses and clinical uncertainty using advanced hedging language.",
      vocab_healthcare: [
        { en: "differential diagnosis", definition: "A list of possible conditions that could explain a patient's symptoms", context: "Clinical reasoning" },
        { en: "presumptive", definition: "Assumed to be true based on available evidence, though not confirmed", context: "Diagnosis" },
        { en: "rule out", definition: "To eliminate a possibility through testing", context: "Diagnostic process" },
        { en: "inconclusive", definition: "Not leading to a definite conclusion", context: "Test results" },
        { en: "warrant further investigation", definition: "To justify additional testing or examination", context: "Clinical decision-making" },
      ],
      grammar_point: {
        topic: "Hedging Language for Clinical Uncertainty",
        explanation:
          "Use hedging expressions to communicate uncertainty professionally: 'This could indicate...', 'It's possible that...', 'I suspect...', 'This may warrant further investigation.'",
        examples: [
          "This could indicate an underlying infection.",
          "It's possible that the symptoms are unrelated.",
          "I suspect this may be a drug interaction.",
          "These results warrant further investigation.",
        ],
      },
      content: {
        listening: {
          script:
            "Based on the presenting symptoms, this could indicate several possibilities. It's possible we're dealing with an atypical presentation of pneumonia, though I can't rule out a pulmonary embolism at this stage. The inconclusive chest X-ray certainly warrants further investigation — I'd recommend a CT angiogram to clarify.",
          questions: [
            { q: "What does the speaker want to do next?", options: ["Discharge the patient", "Order a CT angiogram", "Stop all tests"], correct: 1 },
          ],
        },
        quiz: [
          { q: "'Rule out' means to:", options: ["Confirm a diagnosis", "Eliminate a possibility", "Schedule a test"], correct: 1 },
          { q: "'Presumptive' means:", options: ["Confirmed with certainty", "Assumed based on evidence, not confirmed", "Completely unknown"], correct: 1 },
        ],
      },
      is_checkpoint: false,
      duration_minutes: 30,
      created_at: "",
    },
    grammarPractice: [
      { q: "This ___ indicate an underlying infection. (hedge)", options: ["definitely", "could", "never"], correct: 1 },
      { q: "I can't ___ a pulmonary embolism at this stage.", options: ["rule out", "rule in", "cure"], correct: 0 },
      { q: "These results ___ further investigation.", options: ["warrant", "ignore", "cancel"], correct: 0 },
    ],
    quizQuestions: [
      { q: "'Differential diagnosis' means:", options: ["The final confirmed diagnosis", "A list of possible conditions to consider", "A type of medication"], correct: 1 },
      { q: "'Inconclusive' means:", options: ["Completely certain", "Not leading to a definite conclusion", "Confirmed by two doctors"], correct: 1 },
      { q: "'Warrant further investigation' means:", options: ["Requires no more testing", "Justifies additional testing", "Is a legal document"], correct: 1 },
      { q: "'Rule out' means to:", options: ["Confirm a diagnosis", "Eliminate a possibility", "Schedule a test"], correct: 1 },
      { q: "'Presumptive' means:", options: ["Confirmed with certainty", "Assumed based on evidence, not confirmed", "Completely unknown"], correct: 1 },
    ],
    speakingPrompt:
      "Present a differential diagnosis for a complex case to a colleague, using hedging language to express appropriate clinical uncertainty.",
    speakingContext: "Case discussion during a multidisciplinary team meeting",
  },

  "c1-advocating-patients": {
    lesson: {
      id: "c1-advocating-patients",
      level: "C1",
      order: 2,
      title: "Persuasive Communication: Advocating for Patients",
      subtitle: "Emphatic Structures and Argumentation",
      description: "Advocate effectively for patients using emphatic and persuasive language structures.",
      vocab_healthcare: [
        { en: "advocate for", definition: "To publicly support or argue in favor of someone's needs", context: "Patient advocacy" },
        { en: "it is imperative that", definition: "A formal way to stress something is essential", context: "Emphatic argumentation" },
        { en: "compelling", definition: "Convincing or persuasive", context: "Making a case" },
        { en: "undermine", definition: "To weaken or damage, often gradually", context: "Discussing risks" },
        { en: "in light of", definition: "Considering or taking into account", context: "Making a case based on evidence" },
      ],
      grammar_point: {
        topic: "Emphatic Structures for Advocacy",
        explanation:
          "Use emphatic structures to make a persuasive case: 'It is imperative that...', 'What concerns me most is...', 'In light of these findings, I strongly recommend...'",
        examples: [
          "It is imperative that we address this immediately.",
          "What concerns me most is the delay in treatment.",
          "In light of these findings, I strongly recommend a specialist referral.",
          "This is a compelling case for immediate action.",
        ],
      },
      content: {
        listening: {
          script:
            "It is imperative that we escalate this case. What concerns me most is that the patient's condition has been deteriorating for hours without adequate intervention. In light of these findings, I strongly recommend an immediate consultation with the on-call specialist.",
          questions: [
            { q: "What is the speaker's main concern?", options: ["Paperwork delays", "The patient's deteriorating condition", "Staff scheduling"], correct: 1 },
          ],
        },
        quiz: [
          { q: "'It is imperative that' expresses:", options: ["A suggestion", "Something essential/urgent", "A minor preference"], correct: 1 },
          { q: "'Advocate for' means to:", options: ["Argue against someone", "Support someone's needs", "Ignore a situation"], correct: 1 },
        ],
      },
      is_checkpoint: false,
      duration_minutes: 30,
      created_at: "",
    },
    grammarPractice: [
      { q: "It is ___ that we address this immediately. (essential)", options: ["imperative", "optional", "irrelevant"], correct: 0 },
      { q: "What concerns me ___ is the delay in treatment.", options: ["most", "least", "never"], correct: 0 },
      { q: "___ these findings, I recommend a referral. (considering)", options: ["In light of", "Despite of", "Regardless"], correct: 0 },
    ],
    quizQuestions: [
      { q: "'Compelling' means:", options: ["Boring", "Convincing or persuasive", "Confusing"], correct: 1 },
      { q: "'Undermine' means to:", options: ["Strengthen", "Weaken or damage", "Ignore"], correct: 1 },
      { q: "'In light of' means:", options: ["Ignoring", "Considering / taking into account", "Instead of"], correct: 1 },
      { q: "'It is imperative that' expresses:", options: ["A suggestion", "Something essential/urgent", "A minor preference"], correct: 1 },
      { q: "'Advocate for' means to:", options: ["Argue against someone", "Support someone's needs", "Ignore a situation"], correct: 1 },
    ],
    speakingPrompt:
      "Advocate to a physician for a patient who needs urgent attention, using emphatic structures to make your case compelling.",
    speakingContext: "Escalating a patient concern to the attending physician",
  },

  "c1-professional-register": {
    lesson: {
      id: "c1-professional-register",
      level: "C1",
      order: 3,
      title: "Idiomatic & Professional Register",
      subtitle: "Register Switching in Clinical Settings",
      description: "Recognize and use appropriate professional register, adjusting tone between colleagues and patients.",
      vocab_healthcare: [
        { en: "on the mend", definition: "Recovering well (informal, used with patients/families)", context: "Informal patient update" },
        { en: "stable but guarded", definition: "A formal clinical phrase meaning stable but with some risk of decline", context: "Formal clinical register" },
        { en: "a rocky recovery", definition: "A recovery with complications or setbacks (informal)", context: "Informal patient update" },
        { en: "touch and go", definition: "A critical, uncertain situation (informal idiom)", context: "Informal discussion among colleagues" },
        { en: "register", definition: "The level of formality used in language depending on context", context: "Professional communication" },
      ],
      grammar_point: {
        topic: "Register Switching",
        explanation:
          "Professional healthcare English requires switching between formal register (with colleagues, in documentation) and warmer, informal register (with patients and families) — both convey the same information differently.",
        examples: [
          "Formal: 'The patient's condition is stable but guarded.' Informal: 'She's doing okay, but we're keeping a close eye on her.'",
          "Formal: 'Recovery has been complicated by post-operative infection.' Informal: 'It's been a bit of a rocky recovery.'",
        ],
      },
      content: {
        listening: {
          script:
            "To the family: Good news — he's on the mend and should be home by the weekend. To a colleague: It was touch and go for the first 48 hours, but he's stabilized now.",
          questions: [
            { q: "Which phrase is used with the colleague, not the family?", options: ["On the mend", "Touch and go", "Home by the weekend"], correct: 1 },
          ],
        },
        quiz: [
          { q: "'On the mend' is an example of:", options: ["Formal clinical register", "Informal, warm register", "Technical jargon"], correct: 1 },
          { q: "'Touch and go' means:", options: ["A routine situation", "A critical, uncertain situation", "A scheduled appointment"], correct: 1 },
        ],
      },
      is_checkpoint: false,
      duration_minutes: 30,
      created_at: "",
    },
    grammarPractice: [
      { q: "Formal version of 'she's doing okay':", options: ["Stable but guarded", "On the mend", "Touch and go"], correct: 0 },
      { q: "Informal version of 'recovery complicated by infection':", options: ["A rocky recovery", "Stable but guarded", "Presumptive diagnosis"], correct: 0 },
      { q: "'Register' in this context means:", options: ["A cash register", "Level of formality", "A patient list"], correct: 1 },
    ],
    quizQuestions: [
      { q: "'On the mend' is best used with:", options: ["A colleague in documentation", "A patient's family", "A formal report"], correct: 1 },
      { q: "'Stable but guarded' is:", options: ["Informal, warm register", "Formal clinical register", "Slang"], correct: 1 },
      { q: "'A rocky recovery' means:", options: ["A smooth recovery", "A recovery with complications", "No recovery at all"], correct: 1 },
      { q: "'Touch and go' means:", options: ["A routine situation", "A critical, uncertain situation", "A scheduled appointment"], correct: 1 },
      { q: "'Register' refers to:", options: ["Level of formality in language", "A hospital department", "A medication chart"], correct: 0 },
    ],
    speakingPrompt:
      "Describe the same patient update twice — once formally to a colleague, and once warmly to the patient's family — adjusting your register appropriately.",
    speakingContext: "Updating both a colleague and a worried family member",
  },

  "c1-checkpoint-1": {
    lesson: {
      id: "c1-checkpoint-1",
      level: "C1",
      order: 4,
      title: "Checkpoint: Advanced Clinical Communication",
      subtitle: "Evaluación: Razonamiento clínico, persuasión y registro",
      description: "Review hedging language, emphatic structures, and professional register.",
      vocab_healthcare: [],
      grammar_point: { topic: "Review", explanation: "Review of lessons 1-3", examples: [] },
      content: {
        is_checkpoint: true,
        review_lessons: [1, 2, 3],
        passing_score: 75,
        questions: [
          { q: "'Rule out' means to:", options: ["Confirm a diagnosis", "Eliminate a possibility", "Schedule a test"], correct: 1 },
          { q: "'It is imperative that' expresses:", options: ["A suggestion", "Something essential/urgent", "A minor preference"], correct: 1 },
          { q: "'Touch and go' means:", options: ["A routine situation", "A critical, uncertain situation", "A scheduled appointment"], correct: 1 },
          { q: "'Presumptive' means:", options: ["Confirmed with certainty", "Assumed based on evidence, not confirmed", "Completely unknown"], correct: 1 },
          { q: "'Advocate for' means to:", options: ["Argue against someone", "Support someone's needs", "Ignore a situation"], correct: 1 },
        ],
      },
      is_checkpoint: true,
      duration_minutes: 35,
      created_at: "",
    },
    grammarPractice: [
      { q: "This ___ indicate an underlying infection. (hedge)", options: ["definitely", "could", "never"], correct: 1 },
      { q: "It is ___ that we address this immediately.", options: ["imperative", "optional", "irrelevant"], correct: 0 },
      { q: "Formal version of 'she's doing okay':", options: ["Stable but guarded", "On the mend", "Touch and go"], correct: 0 },
    ],
    quizQuestions: [
      { q: "'Rule out' means to:", options: ["Confirm a diagnosis", "Eliminate a possibility", "Schedule a test"], correct: 1 },
      { q: "'It is imperative that' expresses:", options: ["A suggestion", "Something essential/urgent", "A minor preference"], correct: 1 },
      { q: "'Touch and go' means:", options: ["A routine situation", "A critical, uncertain situation", "A scheduled appointment"], correct: 1 },
      { q: "'Presumptive' means:", options: ["Confirmed with certainty", "Assumed based on evidence, not confirmed", "Completely unknown"], correct: 1 },
      { q: "'Advocate for' means to:", options: ["Argue against someone", "Support someone's needs", "Ignore a situation"], correct: 1 },
    ],
    speakingPrompt:
      "Present a complex case: discuss the differential diagnosis with hedging language, advocate for urgent action with emphatic structures, and update the family in a warmer register.",
    speakingContext: "Checkpoint speaking assessment",
  },

  "c1-ethical-discussions": {
    lesson: {
      id: "c1-ethical-discussions",
      level: "C1",
      order: 5,
      title: "Cross-Cultural Communication & Ethical Discussions",
      subtitle: "Diplomatic Disagreement and Ethical Nuance",
      description: "Navigate disagreement and ethical discussions diplomatically in a multicultural healthcare setting.",
      vocab_healthcare: [
        { en: "with all due respect", definition: "A polite phrase used to introduce respectful disagreement", context: "Diplomatic disagreement" },
        { en: "I see your point, but", definition: "A phrase acknowledging another view before disagreeing", context: "Diplomatic disagreement" },
        { en: "cultural sensitivity", definition: "Awareness and respect for cultural differences in care", context: "Cross-cultural care" },
        { en: "informed consent", definition: "A patient's agreement to treatment based on full understanding of risks", context: "Medical ethics" },
        { en: "autonomy", definition: "A patient's right to make their own healthcare decisions", context: "Medical ethics" },
      ],
      grammar_point: {
        topic: "Diplomatic Language for Disagreement",
        explanation:
          "Use softened disagreement structures to maintain professionalism: 'I see your point, but...', 'With all due respect, I would suggest...', 'While I understand your perspective, I'm concerned that...'",
        examples: [
          "I see your point, but I think we should consider the family's wishes.",
          "With all due respect, I'd like to propose an alternative approach.",
          "While I understand your perspective, patient autonomy is a key concern here.",
          "I hear what you're saying, but I have some reservations.",
        ],
      },
      content: {
        listening: {
          script:
            "I see your point about the treatment timeline, but with all due respect, I think we need to prioritize the patient's informed consent here. While I understand your perspective, respecting her autonomy is essential given her cultural background and personal wishes.",
          questions: [
            { q: "What is the main ethical concern discussed?", options: ["Cost of treatment", "Patient autonomy and informed consent", "Hospital scheduling"], correct: 1 },
          ],
        },
        quiz: [
          { q: "'With all due respect' is used to:", options: ["Insult someone", "Introduce respectful disagreement", "End a conversation"], correct: 1 },
          { q: "'Autonomy' refers to:", options: ["A patient's right to decide", "A hospital policy", "A type of medication"], correct: 0 },
        ],
      },
      is_checkpoint: false,
      duration_minutes: 30,
      created_at: "",
    },
    grammarPractice: [
      { q: "___, I'd like to propose an alternative. (respectful disagreement)", options: ["With all due respect", "Whatever", "I don't care"], correct: 0 },
      { q: "I see your point, ___ I think we should reconsider.", options: ["but", "and", "so"], correct: 0 },
      { q: "Respecting patient ___ means honoring their right to decide.", options: ["autonomy", "schedule", "paperwork"], correct: 0 },
    ],
    quizQuestions: [
      { q: "'With all due respect' is used to:", options: ["Insult someone", "Introduce respectful disagreement", "End a conversation"], correct: 1 },
      { q: "'Informed consent' means:", options: ["Agreement without explanation", "Agreement based on full understanding", "A signature only"], correct: 1 },
      { q: "'Cultural sensitivity' means:", options: ["Ignoring cultural differences", "Awareness and respect for cultural differences", "Following only one culture's norms"], correct: 1 },
      { q: "'Autonomy' refers to:", options: ["A patient's right to decide", "A hospital policy", "A type of medication"], correct: 0 },
      { q: "'I see your point, but' is used to:", options: ["Fully agree", "Acknowledge before disagreeing", "Change the subject"], correct: 1 },
    ],
    speakingPrompt:
      "Diplomatically disagree with a colleague's treatment plan, respecting their view while advocating for the patient's autonomy and cultural preferences.",
    speakingContext: "Ethics discussion in a multidisciplinary team meeting",
  },
};

// ─── Sub-Components ─────────────────────────────────────────────

function TabButton({
  label,
  icon: Icon,
  isActive,
  isCompleted,
  isLocked,
  onClick,
}: {
  label: string;
  icon: React.ElementType;
  isActive: boolean;
  isCompleted: boolean;
  isLocked: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={isLocked}
      className={cn(
        "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200",
        isActive && "bg-teal-500/20 text-teal-400",
        !isActive && !isLocked && "text-slate-400 hover:text-white hover:bg-white/5",
        isLocked && "text-slate-600 cursor-not-allowed",
        isCompleted && !isActive && "text-green-400"
      )}
    >
      {isCompleted ? <CheckCircle className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function FlipCard({
  item,
  isA0,
}: {
  item: VocabItem;
  isA0: boolean;
}) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      onClick={() => setFlipped(!flipped)}
      className="cursor-pointer"
      style={{ perspective: "1000px" }}
    >
      <motion.div
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.4 }}
        className="relative w-full h-32"
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Front */}
        <div
          className={cn(
            "absolute inset-0 rounded-xl p-4 flex flex-col items-center justify-center",
            "bg-white/5 border border-white/10"
          )}
          style={{ backfaceVisibility: "hidden" }}
        >
          <p className="text-white font-medium text-center">{item.en}</p>
          <p className="text-slate-500 text-xs mt-1 text-center">{item.context}</p>
          <p className="text-teal-400/60 text-[10px] mt-2">Tap to flip</p>
        </div>

        {/* Back */}
        <div
          className={cn(
            "absolute inset-0 rounded-xl p-4 flex flex-col items-center justify-center",
            "bg-teal-500/10 border border-teal-500/20",
          )}
          style={{ transform: "rotateY(180deg)", backfaceVisibility: "hidden" }}
        >
          {isA0 && item.es ? (
            <>
              <p className="text-teal-300 font-medium text-center">{item.es}</p>
              <p className="text-slate-500 text-xs mt-1">{item.en}</p>
            </>
          ) : (
            <>
              <p className="text-teal-300 text-sm text-center leading-snug">
                {item.definition}
              </p>
              <p className="text-slate-500 text-xs mt-1">{item.en}</p>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────

export default function LessonPage() {
  const params = useParams<{ level: string; lessonId: string }>();
  const router = useRouter();
  const lessonId = params?.lessonId ?? "";

  const mockData = ALL_MOCK_DATA[lessonId];
  const lesson = mockData?.lesson;

  // Tab state
  const [activeTab, setActiveTab] = useState(0);
  const [completedTabs, setCompletedTabs] = useState<number[]>([]);

  // Tab scores
  const [grammarScore, setGrammarScore] = useState(0);
  const [listeningScore, setListeningScore] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [_speakingScore, setSpeakingScore] = useState<number | null>(null);
  const [speakingBandScore, setSpeakingBandScore] = useState<number | null>(null);
  const [speakingFluency, setSpeakingFluency] = useState<number | null>(null);

  // Timer
  const [startTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [lessonCompleted, setLessonCompleted] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const completeTab = useCallback(
    (tabIndex: number) => {
      setCompletedTabs((prev) => {
        if (prev.includes(tabIndex)) return prev;
        return [...prev, tabIndex];
      });
    },
    []
  );

  const isLocked = (tabIndex: number) => {
    if (tabIndex === 0) return false;
    return !completedTabs.includes(tabIndex - 1);
  };

  const allTabsCompleted = completedTabs.length >= 5;

  const persistCompletion = useCallback(
    async (scores: {
      quizScore: number;
      quizTotal: number;
      listeningScore: number;
      listeningTotal: number;
      speakingBand: number | null;
    }) => {
      if (!lesson) return;
      setSaving(true);
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        // Mock lesson content isn't backed by a real DB row yet — resolve
        // the matching lessons.id via the (level, order) it was seeded with.
        // NOTE: "order" is a reserved PostgREST query param — filtering with
        // .eq("order", ...) silently breaks (it gets parsed as a sort
        // directive, not a column filter). Filter by level only, then match
        // order client-side.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: levelLessons } = await (supabase as any)
          .from("lessons")
          .select("id, order")
          .eq("level", lesson.level);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const dbLesson = ((levelLessons ?? []) as any[]).find(
          (l) => l.order === lesson.order
        );
        if (!dbLesson) return;

        const overallScore = Math.round(
          ((scores.quizTotal > 0 ? scores.quizScore / scores.quizTotal : 0) +
            (scores.listeningTotal > 0
              ? scores.listeningScore / scores.listeningTotal
              : 1)) *
            50
        );

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).from("user_progress").upsert(
          {
            user_id: user.id,
            lesson_id: dbLesson.id,
            completed: true,
            score: overallScore,
            time_spent: elapsed,
            vocab_score: completedTabs.includes(0) ? 100 : null,
            grammar_score: grammarScore,
            listening_score: scores.listeningScore,
            speaking_score: scores.speakingBand,
            completed_at: new Date().toISOString(),
          },
          { onConflict: "user_id,lesson_id" }
        );
      } finally {
        setSaving(false);
      }
    },
    [lesson, elapsed, completedTabs, grammarScore]
  );

  const _formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (!lesson) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-slate-600" />
          <p className="text-lg">Lesson not found</p>
          <button
            onClick={() => router.back()}
            className="mt-4 text-teal-400 hover:text-teal-300 text-sm"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  const isA0 = needsNativeLanguageSupport(lesson.level);

  const tabs = [
    { label: "Vocab", icon: BookOpen },
    { label: "Grammar", icon: Languages },
    { label: "Listening", icon: Headphones },
    { label: "Quiz", icon: HelpCircle },
    { label: "Speaking", icon: Mic },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to lessons{isA0 && " / Volver a lecciones"}
          </button>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-teal-500/15 text-teal-400">
              {lesson.level}
            </span>
            {lesson.is_checkpoint && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-teal-500/15 text-teal-400 flex items-center gap-1">
                <Star className="w-3 h-3" /> Checkpoint
              </span>
            )}
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {lesson.duration_minutes} min
            </span>
          </div>
          <h1 className="text-xl font-bold">{lesson.title}</h1>
          <p className="text-slate-400 text-sm mt-1">{lesson.subtitle}</p>
        </motion.div>

        {/* Tab navigation */}
        <div className="flex gap-1 mb-6 overflow-x-auto pb-2">
          {tabs.map((tab, i) => (
            <TabButton
              key={i}
              label={tab.label}
              icon={tab.icon}
              isActive={activeTab === i}
              isCompleted={completedTabs.includes(i)}
              isLocked={isLocked(i)}
              onClick={() => {
                if (!isLocked(i)) setActiveTab(i);
              }}
            />
          ))}
        </div>

        {/* Tab content */}
        <div>
          {/* Tab 0: Vocabulary */}
          {activeTab === 0 && (
            <VocabularyTab
              key="vocab"
              lesson={lesson}
              isA0={isA0}
              onComplete={() => {
                completeTab(0);
                setActiveTab(1);
              }}
            />
          )}

          {/* Tab 1: Grammar */}
          {activeTab === 1 && (
            <GrammarTab
              key="grammar"
              lesson={lesson}
              practice={mockData.grammarPractice}
              isA0={isA0}
              onComplete={(score) => {
                setGrammarScore(score);
                completeTab(1);
                setActiveTab(2);
              }}
            />
          )}

          {/* Tab 2: Listening */}
          {activeTab === 2 && (
            <ListeningTab
              key="listening"
              lesson={lesson}
              isA0={isA0}
              onComplete={(score) => {
                setListeningScore(score);
                completeTab(2);
                setActiveTab(3);
              }}
            />
          )}

          {/* Tab 3: Quiz */}
          {activeTab === 3 && (
            <QuizTab
              key="quiz"
              questions={mockData.quizQuestions}
              isA0={isA0}
              onComplete={(score) => {
                setQuizScore(score);
                completeTab(3);
                setActiveTab(4);
              }}
            />
          )}

          {/* Tab 4: Speaking */}
          {activeTab === 4 && (
            <SpeakingTab
              key="speaking"
              prompt={mockData.speakingPrompt}
              context={mockData.speakingContext}
              vocabItems={lesson.vocab_healthcare}
              isA0={isA0}
              lessonId={lesson.id}
              userId=""
              onComplete={(scores) => {
                setSpeakingScore(scores.pronunciation ?? scores.band * 10);
                setSpeakingBandScore(scores.band);
                setSpeakingFluency(scores.fluency);
                completeTab(4);
              }}
            />
          )}
        </div>

        {/* Completion overlay */}
        {allTabsCompleted && !lessonCompleted && (
          <CompletionSummary
            key="summary"
            lesson={lesson}
            vocabDone={completedTabs.includes(0)}
            grammarScore={grammarScore}
            listeningScore={listeningScore}
            quizScore={quizScore}
            speakingBandScore={speakingBandScore}
            speakingFluency={speakingFluency}
            elapsed={elapsed}
            saving={saving}
            isA0={isA0}
            onCompleteLesson={async () => {
              await persistCompletion({
                quizScore,
                quizTotal: mockData.quizQuestions.length,
                listeningScore,
                listeningTotal: lesson.content.listening?.questions.length ?? 0,
                speakingBand: speakingBandScore,
              });
              setLessonCompleted(true);
            }}
          />
        )}

        {lessonCompleted && (
          <CelebrationScreen
            lesson={lesson}
            isA0={isA0}
            onNextLesson={() => router.back()}
          />
        )}
      </div>
  );
}

// ─── Tab Components ─────────────────────────────────────────────

function VocabularyTab({
  lesson,
  isA0,
  onComplete,
}: {
  lesson: Lesson;
  isA0: boolean;
  onComplete: () => void;
}) {
  const [reviewedAll, setReviewedAll] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);

  const handleCardFlip = (_idx: number) => {
    setReviewedCount((c) => Math.min(c + 1, lesson.vocab_healthcare.length));
  };

  useEffect(() => {
    if (reviewedCount >= lesson.vocab_healthcare.length) {
      setReviewedAll(true);
    }
  }, [reviewedCount, lesson.vocab_healthcare.length]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-lg font-semibold mb-1">Healthcare Vocabulary</h2>
        <p className="text-slate-400 text-sm">
          {isA0
            ? "Tap each card to flip between English and Spanish."
            : "Tap each card to flip between term and definition."}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {lesson.vocab_healthcare.map((item, i) => (
          <div key={i} onClick={() => handleCardFlip(i)}>
            <FlipCard item={item} isA0={isA0} />
          </div>
        ))}
      </div>

      {lesson.vocab_healthcare.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>This is a checkpoint lesson. No new vocabulary.</p>
          <p className="text-sm mt-1">Review your knowledge from previous lessons.</p>
          <button
            onClick={onComplete}
            className="mt-6 px-6 py-2.5 rounded-xl bg-teal-500 text-black font-semibold hover:bg-teal-400 transition-colors"
          >
            Continue
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 pt-2">
          <p className="text-xs text-slate-500">
            {reviewedCount}/{lesson.vocab_healthcare.length} cards reviewed
          </p>
          <button
            onClick={onComplete}
            disabled={!reviewedAll}
            className={cn(
              "px-6 py-2.5 rounded-xl font-semibold transition-all",
              reviewedAll
                ? "bg-teal-500 text-black hover:bg-teal-400"
                : "bg-white/5 text-slate-500 cursor-not-allowed"
            )}
          >
            {reviewedAll ? "I've learned these" : "Review all cards first"}
          </button>
        </div>
      )}
    </motion.div>
  );
}

function GrammarTab({
  lesson,
  practice,
  isA0,
  onComplete,
}: {
  lesson: Lesson;
  practice: GrammarPractice[];
  isA0: boolean;
  onComplete: (score: number) => void;
}) {
  const [answers, setAnswers] = useState<(number | null)[]>(
    new Array(practice.length).fill(null)
  );
  const [submitted, setSubmitted] = useState(false);

  const allAnswered = answers.every((a) => a !== null);
  const correctCount = answers.filter((a, i) => a === practice[i].correct).length;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* Theory */}
      <div className="bg-white/5 rounded-xl p-4 border border-white/5">
        <h2 className="text-lg font-semibold text-teal-400 mb-2">
          {lesson.grammar_point.topic}
        </h2>
        <p className="text-slate-300 text-sm mb-3">
          {lesson.grammar_point.explanation}
        </p>
        <div className="space-y-1.5">
          <Instruction
            en="Examples"
            es="Ejemplos"
            showEs={isA0}
            className="text-xs text-slate-500 uppercase tracking-wide"
          />
          {lesson.grammar_point.examples.map((ex, i) => (
            <p
              key={i}
              className="text-sm text-slate-400 bg-white/[0.03] rounded-lg px-3 py-2"
            >
              {ex}
            </p>
          ))}
        </div>
      </div>

      {/* Practice */}
      <div>
        <h3 className="text-sm font-semibold text-slate-300 mb-3">
          Practice ({practice.length} questions - need {Math.ceil(practice.length * 2/3)}/3 to pass)
          {isA0 && (
            <span className="block text-xs font-normal text-slate-500 mt-0.5">
              Práctica ({practice.length} preguntas — necesitas {Math.ceil(practice.length * 2/3)}/3 para pasar)
            </span>
          )}
        </h3>
        <div className="space-y-4">
          {practice.map((pq, i) => (
            <div
              key={i}
              className={cn(
                "bg-white/5 rounded-xl p-4 border",
                submitted && answers[i] === pq.correct
                  ? "border-green-500/20"
                  : submitted && answers[i] !== null
                  ? "border-red-500/20"
                  : "border-white/5"
              )}
            >
              <p className="text-sm text-white mb-3">
                {i + 1}. {pq.q}
              </p>
              <div className="flex flex-wrap gap-2">
                {pq.options.map((opt, j) => {
                  const isSelected = answers[i] === j;
                  const isCorrect = pq.correct === j;
                  let btnClass = "bg-white/5 text-slate-400 hover:bg-white/10";

                  if (submitted) {
                    if (isCorrect) btnClass = "bg-green-500/20 text-green-400";
                    else if (isSelected) btnClass = "bg-red-500/20 text-red-400";
                  } else if (isSelected) {
                    btnClass = "bg-teal-500/20 text-teal-400";
                  }

                  return (
                    <button
                      key={j}
                      disabled={submitted}
                      onClick={() => {
                        const next = [...answers];
                        next[i] = j;
                        setAnswers(next);
                      }}
                      className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all", btnClass)}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
              {submitted && answers[i] === pq.correct && (
                <p className="text-green-400 text-xs mt-2 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Correct!{isA0 && " ¡Correcto!"}
                </p>
              )}
              {submitted && answers[i] !== null && answers[i] !== pq.correct && (
                <p className="text-red-400 text-xs mt-2 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Incorrect{isA0 && " Incorrecto"}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col items-center gap-3">
        {!submitted ? (
          <button
            onClick={() => setSubmitted(true)}
            disabled={!allAnswered}
            className={cn(
              "px-6 py-2.5 rounded-xl font-semibold transition-all",
              allAnswered
                ? "bg-teal-500 text-black hover:bg-teal-400"
                : "bg-white/5 text-slate-500 cursor-not-allowed"
            )}
          >
            Check answers{isA0 && <span className="block text-xs font-normal">Revisar respuestas</span>}
          </button>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-3"
          >
            <p className="text-lg font-semibold">
              {correctCount}/{practice.length} correct
            </p>
            {correctCount >= Math.ceil(practice.length * 2/3) ? (
              <button
                onClick={() => onComplete(correctCount)}
                className="px-6 py-2.5 rounded-xl bg-teal-500 text-black font-semibold hover:bg-teal-400 transition-all"
              >
                Continue to Listening{isA0 && <span className="block text-xs font-normal">Continuar a Listening</span>}
              </button>
            ) : (
              <button
                onClick={() => {
                  setSubmitted(false);
                  setAnswers(new Array(practice.length).fill(null));
                }}
                className="px-6 py-2.5 rounded-xl bg-white/5 text-slate-300 font-semibold hover:bg-white/10 transition-all flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" /> Retry{isA0 && " / Reintentar"}
              </button>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

function ListeningTab({
  lesson,
  isA0,
  onComplete,
}: {
  lesson: Lesson;
  isA0: boolean;
  onComplete: (score: number) => void;
}) {
  const [playing, setPlaying] = useState(false);
  const [answers, setAnswers] = useState<(number | null)[]>(
    new Array(lesson.content.listening?.questions.length ?? 0).fill(null)
  );
  const [submitted, setSubmitted] = useState(false);

  const listening = lesson.content.listening;
  const questions = listening?.questions ?? [];

  const allAnswered = answers.every((a) => a !== null);
  const correctCount = answers.filter((a, i) => a === questions[i].correct).length;

  const handlePlay = () => {
    if (!listening) return;
    setPlaying(true);
    speakText(listening.script);
    // Simulate audio ending
    const estimatedDuration = listening.script.length * 50;
    setTimeout(() => setPlaying(false), Math.max(estimatedDuration, 2000));
  };

  if (!listening) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="text-center py-8 space-y-4"
      >
        <Headphones className="w-12 h-12 mx-auto text-slate-600" />
        <Instruction
          en="No listening content for this checkpoint."
          es="Este checkpoint no tiene contenido de listening."
          showEs={isA0}
        />
        <button
          onClick={() => onComplete(3)}
          className="px-6 py-2.5 rounded-xl bg-teal-500 text-black font-semibold hover:bg-teal-400"
        >
          Continue{isA0 && <span className="block text-xs font-normal">Continuar</span>}
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* Audio player */}
      <div className="bg-white/5 rounded-xl p-4 border border-white/5">
        <h2 className="text-lg font-semibold mb-3">Listening Comprehension</h2>
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={handlePlay}
            disabled={playing}
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center transition-all",
              playing
                ? "bg-teal-500/30 text-teal-300"
                : "bg-teal-500 text-black hover:bg-teal-400"
            )}
          >
            {playing ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5 ml-0.5" />
            )}
          </button>
          <div>
            <p className="text-sm text-white font-medium">
              {playing ? "Playing..." : "Tap to listen"}
              {isA0 && (
                <span className="block text-xs font-normal text-slate-500">
                  {playing ? "Reproduciendo..." : "Toca para escuchar"}
                </span>
              )}
            </p>
            <p className="text-xs text-slate-500">
              American English accent
            </p>
          </div>
        </div>
        {playing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-1 items-end h-6"
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <motion.div
                key={i}
                className="w-1 bg-teal-400 rounded-full"
                animate={{ height: [8, 24, 8] }}
                transition={{
                  repeat: Infinity,
                  duration: 0.8,
                  delay: i * 0.1,
                }}
              />
            ))}
          </motion.div>
        )}
      </div>

      {/* Script (shown after first play or always visible) */}
      <div className="bg-white/[0.02] rounded-xl p-4 border border-white/5">
        <Instruction
          en="Audio Script"
          es="Guión de audio"
          showEs={isA0}
          className="text-xs text-slate-500 mb-2 uppercase tracking-wide"
        />
        <p className="text-sm text-slate-300 leading-relaxed">
          {listening.script}
        </p>
        <button
          onClick={() => speakText(listening.script)}
          className="mt-3 text-xs text-teal-400 hover:text-teal-300 transition-colors"
        >
          Read aloud again{isA0 && " / Leer de nuevo"}
        </button>
      </div>

      {/* Questions */}
      {questions.length > 0 && (
        <>
          <div>
            <h3 className="text-sm font-semibold text-slate-300 mb-3">
              Comprehension Questions
              {isA0 && (
                <span className="block text-xs font-normal text-slate-500 mt-0.5">
                  Preguntas de comprensión
                </span>
              )}
            </h3>
            <div className="space-y-4">
              {questions.map((q, i) => (
                <div
                  key={i}
                  className={cn(
                    "bg-white/5 rounded-xl p-4 border",
                    submitted && answers[i] === q.correct
                      ? "border-green-500/20"
                      : submitted && answers[i] !== null
                      ? "border-red-500/20"
                      : "border-white/5"
                  )}
                >
                  <p className="text-sm text-white mb-3">
                    {i + 1}. {q.q}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {q.options.map((opt, j) => {
                      const isSelected = answers[i] === j;
                      const isCorrect = q.correct === j;
                      let btnClass = "bg-white/5 text-slate-400 hover:bg-white/10";

                      if (submitted) {
                        if (isCorrect) btnClass = "bg-green-500/20 text-green-400";
                        else if (isSelected) btnClass = "bg-red-500/20 text-red-400";
                      } else if (isSelected) {
                        btnClass = "bg-teal-500/20 text-teal-400";
                      }

                      return (
                        <button
                          key={j}
                          disabled={submitted}
                          onClick={() => {
                            const next = [...answers];
                            next[i] = j;
                            setAnswers(next);
                          }}
                          className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all", btnClass)}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-center gap-3">
            {!submitted ? (
              <button
                onClick={() => setSubmitted(true)}
                disabled={!allAnswered}
                className={cn(
                  "px-6 py-2.5 rounded-xl font-semibold transition-all",
                  allAnswered
                    ? "bg-teal-500 text-black hover:bg-teal-400"
                    : "bg-white/5 text-slate-500 cursor-not-allowed"
                )}
              >
                Submit answers{isA0 && <span className="block text-xs font-normal">Enviar respuestas</span>}
              </button>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-3"
              >
                <p className="text-lg font-semibold">
                  {correctCount}/{questions.length} correct
                </p>
                {correctCount === questions.length ? (
                  <button
                    onClick={() => onComplete(correctCount)}
                    className="px-6 py-2.5 rounded-xl bg-teal-500 text-black font-semibold hover:bg-teal-400"
                  >
                    Continue to Quiz{isA0 && <span className="block text-xs font-normal">Continuar a Quiz</span>}
                  </button>
                ) : (
                  <div className="space-y-3">
                    <Instruction
                      en="Answer all correctly to proceed."
                      es="Responde todo correctamente para continuar."
                      showEs={isA0}
                      className="text-sm text-red-400"
                    />
                    <button
                      onClick={() => {
                        setSubmitted(false);
                        setAnswers(new Array(questions.length).fill(null));
                      }}
                      className="px-6 py-2.5 rounded-xl bg-white/5 text-slate-300 font-semibold hover:bg-white/10 flex items-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" /> Retry{isA0 && " / Reintentar"}
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </>
      )}
    </motion.div>
  );
}

function QuizTab({
  questions,
  isA0,
  onComplete,
}: {
  questions: QuizQuestion[];
  isA0: boolean;
  onComplete: (score: number) => void;
}) {
  const [answers, setAnswers] = useState<(number | null)[]>(
    new Array(questions.length).fill(null)
  );
  const [submitted, setSubmitted] = useState(false);

  const allAnswered = answers.every((a) => a !== null);
  const correctCount = answers.filter((a, i) => a === questions[i].correct).length;
  const passed = correctCount >= 3;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-lg font-semibold mb-1">Quiz</h2>
        <Instruction
          en="5 multiple choice questions. Pass with 3/5 correct."
          es="5 preguntas de opción múltiple. Necesitas 3/5 correctas para pasar."
          showEs={isA0}
        />
      </div>

      <div className="space-y-4">
        {questions.map((q, i) => (
          <div
            key={i}
            className={cn(
              "bg-white/5 rounded-xl p-4 border",
              submitted && answers[i] === q.correct
                ? "border-green-500/20"
                : submitted && answers[i] !== null
                ? "border-red-500/20"
                : "border-white/5"
            )}
          >
            <p className="text-sm text-white mb-3">
              {i + 1}. {q.q}
            </p>
            <div className="space-y-2">
              {q.options.map((opt, j) => {
                const isSelected = answers[i] === j;
                const isCorrect = q.correct === j;
                let btnClass = "bg-white/5 text-slate-400 hover:bg-white/10 w-full text-left";

                if (submitted) {
                  if (isCorrect) btnClass = "bg-green-500/20 text-green-400 w-full text-left";
                  else if (isSelected) btnClass = "bg-red-500/20 text-red-400 w-full text-left";
                } else if (isSelected) {
                  btnClass = "bg-teal-500/20 text-teal-400 w-full text-left";
                }

                return (
                  <button
                    key={j}
                    disabled={submitted}
                    onClick={() => {
                      const next = [...answers];
                      next[i] = j;
                      setAnswers(next);
                    }}
                    className={cn("px-4 py-2.5 rounded-lg text-sm font-medium transition-all", btnClass)}
                  >
                    {String.fromCharCode(65 + j)}. {opt}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col items-center gap-3">
        {!submitted ? (
          <button
            onClick={() => setSubmitted(true)}
            disabled={!allAnswered}
            className={cn(
              "px-6 py-2.5 rounded-xl font-semibold transition-all",
              allAnswered
                ? "bg-teal-500 text-black hover:bg-teal-400"
                : "bg-white/5 text-slate-500 cursor-not-allowed"
            )}
          >
            Submit quiz{isA0 && <span className="block text-xs font-normal">Enviar quiz</span>}
          </button>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-4"
          >
            <div>
              <p className="text-2xl font-bold">
                <span className={passed ? "text-green-400" : "text-red-400"}>
                  {correctCount}/5
                </span>{" "}
                correct
              </p>
              <p className="text-slate-400 text-sm mt-1">
                {passed ? "Passed! (minimum 3/5)" : "Need 3/5 to pass"}
                {isA0 && (
                  <span className="block text-xs">
                    {passed ? "¡Aprobado! (mínimo 3/5)" : "Necesitas 3/5 para pasar"}
                  </span>
                )}
              </p>
            </div>
            {passed ? (
              <button
                onClick={() => onComplete(correctCount)}
                className="px-6 py-2.5 rounded-xl bg-teal-500 text-black font-semibold hover:bg-teal-400"
              >
                Continue to Speaking{isA0 && <span className="block text-xs font-normal">Continuar a Speaking</span>}
              </button>
            ) : (
              <button
                onClick={() => {
                  setSubmitted(false);
                  setAnswers(new Array(questions.length).fill(null));
                }}
                className="px-6 py-2.5 rounded-xl bg-white/5 text-slate-300 font-semibold hover:bg-white/10 flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" /> Retry quiz{isA0 && " / Reintentar quiz"}
              </button>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Live pronunciation drill (real speech recognition) ──────────

function PronunciationDrill({
  items,
  isA0,
  onProgress,
}: {
  items: VocabItem[];
  isA0: boolean;
  onProgress: (matchedCount: number, total: number) => void;
}) {
  const supported = useMemo(() => !!getSpeechRecognitionCtor(), []);
  const [index, setIndex] = useState(0);
  const [listening, setListening] = useState(false);
  const [matchedWords, setMatchedWords] = useState<Set<number>>(new Set());
  const [itemDone, setItemDone] = useState<boolean[]>(() => new Array(items.length).fill(false));
  const [micError, setMicError] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const current = items[index];
  const targetWords = useMemo(() => (current ? wordsOf(current.en) : []), [current]);
  const tip = PRONUNCIATION_TIPS[index % PRONUNCIATION_TIPS.length];

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  useEffect(() => {
    setMatchedWords(new Set());
  }, [index]);

  useEffect(() => {
    if (targetWords.length > 0 && matchedWords.size === targetWords.length && !itemDone[index]) {
      setItemDone((prev) => {
        const next = [...prev];
        next[index] = true;
        return next;
      });
      stopListening();
    }
  }, [matchedWords, targetWords.length, itemDone, index, stopListening]);

  useEffect(() => {
    const doneCount = itemDone.filter(Boolean).length;
    onProgress(doneCount, items.length);
  }, [itemDone, items.length, onProgress]);

  const startListening = () => {
    const SR = getSpeechRecognitionCtor();
    if (!SR) return;
    setMicError(false);
    const recognition = new SR();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += " " + event.results[i][0].transcript;
      }
      const spoken = wordsOf(transcript);
      setMatchedWords((prev) => {
        const next = new Set(prev);
        targetWords.forEach((tw, i) => {
          if (spoken.includes(tw)) next.add(i);
        });
        return next;
      });
    };
    recognition.onerror = () => {
      setMicError(true);
      setListening(false);
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    try {
      recognition.start();
      setListening(true);
    } catch {
      setMicError(true);
    }
  };

  const allDone = items.length > 0 && itemDone.every(Boolean);
  const doneCount = itemDone.filter(Boolean).length;

  if (items.length === 0 || !current) {
    return null;
  }

  if (!supported) {
    return (
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-sm text-amber-300">
        Live pronunciation checking needs Chrome or Edge (this browser doesn&apos;t
        support real-time speech recognition). You can still listen to the
        model audio below and practice out loud on your own.
        {isA0 && (
          <span className="block text-xs mt-1 text-amber-400/80">
            La verificación de pronunciación en vivo necesita Chrome o Edge.
            Igual puedes escuchar el audio modelo abajo y practicar en voz alta.
          </span>
        )}
        <div className="mt-3 space-y-2">
          {items.map((item, i) => (
            <button
              key={i}
              onClick={() => speakText(item.en)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-left text-slate-200 text-sm"
            >
              <Volume2 className="w-4 h-4 text-teal-400 shrink-0" />
              {item.en}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>Pronunciation practice{isA0 && " / Práctica de pronunciación"}</span>
        <span>{doneCount}/{items.length} phrases done</span>
      </div>

      <div className="bg-white/5 border border-white/5 rounded-xl p-5">
        <div className="flex flex-wrap gap-2 justify-center mb-4">
          {targetWords.map((tw, i) => (
            <span
              key={i}
              className={cn(
                "px-2.5 py-1 rounded-lg text-sm font-medium border transition-colors",
                matchedWords.has(i)
                  ? "bg-green-500/15 text-green-400 border-green-500/30"
                  : "bg-white/5 text-slate-400 border-white/10"
              )}
            >
              {tw}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => speakText(current.en)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 text-sm font-medium transition-colors"
          >
            <Volume2 className="w-4 h-4 text-teal-400" />
            Listen{isA0 && " / Escuchar"}
          </button>
          {!listening ? (
            <button
              onClick={startListening}
              disabled={itemDone[index]}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-500 text-black font-semibold hover:bg-teal-400 transition-colors disabled:opacity-40"
            >
              <Mic className="w-4 h-4" />
              {itemDone[index] ? `Done${isA0 ? " / Listo" : ""}` : `Say it${isA0 ? " / Dilo" : ""}`}
            </button>
          ) : (
            <button
              onClick={stopListening}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500/20 text-red-400 font-semibold hover:bg-red-500/30 transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              Listening...{isA0 && " Escuchando..."}
            </button>
          )}
        </div>

        {itemDone[index] && (
          <p className="text-center text-green-400 text-xs mt-3 flex items-center justify-center gap-1">
            <Check className="w-3.5 h-3.5" /> All words recognized{isA0 && " / Todas las palabras reconocidas"}
          </p>
        )}
        {micError && (
          <p className="text-center text-red-400 text-xs mt-3 flex items-center justify-center gap-1">
            <X className="w-3.5 h-3.5" /> Microphone access failed. Check your browser permissions.
            {isA0 && " / No se pudo acceder al micrófono. Revisa los permisos del navegador."}
          </p>
        )}
      </div>

      <div className="bg-teal-500/10 border border-teal-500/20 rounded-lg p-3">
        <p className="text-xs text-teal-400 font-medium mb-1">
          Pronunciation tip{isA0 && " / Consejo de pronunciación"}
        </p>
        <p className="text-sm text-slate-300">{tip}</p>
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
          className="text-xs text-slate-400 hover:text-slate-200 disabled:opacity-30"
        >
          ← Previous{isA0 && " / Anterior"}
        </button>
        <div className="flex gap-1">
          {items.map((_, i) => (
            <span
              key={i}
              className={cn(
                "w-1.5 h-1.5 rounded-full",
                itemDone[i] ? "bg-green-400" : i === index ? "bg-teal-400" : "bg-white/10"
              )}
            />
          ))}
        </div>
        <button
          onClick={() => setIndex((i) => Math.min(items.length - 1, i + 1))}
          disabled={index === items.length - 1}
          className="text-xs text-slate-400 hover:text-slate-200 disabled:opacity-30"
        >
          Next{isA0 && " / Siguiente"} →
        </button>
      </div>

      {allDone && (
        <p className="text-center text-sm text-green-400">
          All phrases practiced! Scroll down to record your response to the task.
          {isA0 && (
            <span className="block">
              ¡Todas las frases practicadas! Baja para grabar tu respuesta a la tarea.
            </span>
          )}
        </p>
      )}
    </div>
  );
}

function SpeakingTab({
  prompt,
  context,
  vocabItems,
  isA0,
  lessonId: _lessonId,
  userId: _userId,
  onComplete,
}: {
  prompt: string;
  context: string;
  vocabItems: VocabItem[];
  isA0: boolean;
  lessonId: string;
  userId: string;
  onComplete: (scores: { band: number; pronunciation: number; fluency: number }) => void;
}) {
  const [stage, setStage] = useState<"idle" | "recording" | "playback" | "done">("idle");
  const [_audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [taskTranscript, setTaskTranscript] = useState("");
  const [feedback, setFeedback] = useState<{
    band: number;
    pronunciation: number;
    fluency: number;
    tips: string;
  } | null>(null);
  const [drillProgress, setDrillProgress] = useState({ done: 0, total: 0 });
  const handleDrillProgress = useCallback((done: number, total: number) => {
    setDrillProgress({ done, total });
  }, []);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const taskRecognitionRef = useRef<SpeechRecognitionLike | null>(null);

  // Cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      taskRecognitionRef.current?.stop();
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      setTaskTranscript("");

      // Live transcript alongside the recording — real speech-to-text,
      // used afterward to compute honest fluency/pronunciation signals
      // instead of a random number. Optional: only Chrome/Edge support it.
      const SR = getSpeechRecognitionCtor();
      if (SR) {
        const recognition = new SR();
        recognition.lang = "en-US";
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.onresult = (event) => {
          let transcript = "";
          for (let i = 0; i < event.results.length; i++) {
            transcript += " " + event.results[i][0].transcript;
          }
          setTaskTranscript(transcript.trim());
        };
        recognition.onerror = () => {};
        recognition.onend = () => {};
        taskRecognitionRef.current = recognition;
        try {
          recognition.start();
        } catch {
          // ignore — falls back to duration-only scoring
        }
      }

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
        taskRecognitionRef.current?.stop();
        setStage("playback");
      };

      recorder.start();
      setStage("recording");
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= 59) {
            recorder.stop();
            if (timerRef.current) clearInterval(timerRef.current);
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
    } catch {
      alert("Microphone access is required for speaking practice.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  // Honest scoring from real signals: how many drill phrases were
  // recognized correctly, how much of the task was actually said, and how
  // long it took. No random numbers. This is still an estimate, not a
  // certified assessment — clearly labeled as such in the UI.
  const finishEvaluation = () => {
    const wordCount = wordsOf(taskTranscript).length;
    const minutes = Math.max(recordingTime, 1) / 60;
    const wpm = wordCount / minutes;

    const drillRatio = drillProgress.total > 0 ? drillProgress.done / drillProgress.total : null;
    const pronunciation =
      drillRatio !== null
        ? Math.round(drillRatio * 100)
        : wordCount > 0
          ? 70
          : 0;

    const fluency =
      wordCount === 0
        ? 0
        : Math.round(Math.max(30, Math.min(100, 40 + (Math.min(wpm, 140) / 140) * 60)));

    const band = Math.round(((pronunciation + fluency) / 2 / 100) * 4 * 2 + 8) / 2; // 4.0–8.0, nearest 0.5

    const tips =
      wordCount === 0
        ? "We couldn't detect any recognized speech — check your microphone and try speaking closer to it."
        : pronunciation < 60
          ? "Some words weren't recognized clearly. Try the pronunciation drill above again, speaking a bit slower."
          : fluency < 60
            ? "Good pronunciation! Try to speak with fewer long pauses to sound more fluent."
            : "Great job — clear pronunciation and a natural pace.";

    setFeedback({ band, pronunciation, fluency, tips });
    setStage("done");
    onComplete({ band, pronunciation, fluency });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-lg font-semibold mb-1">
          Speaking Practice
          {isA0 && <span className="block text-sm font-normal text-slate-500">Práctica oral</span>}
        </h2>
        <p className="text-slate-400 text-sm">{context}</p>
      </div>

      {/* Live pronunciation drill */}
      {vocabItems.length > 0 && (
        <PronunciationDrill
          items={vocabItems}
          isA0={isA0}
          onProgress={handleDrillProgress}
        />
      )}

      {/* Prompt */}
      <div className="bg-teal-500/10 border border-teal-500/20 rounded-xl p-4">
        <Instruction
          en="Your Task"
          es="Tu tarea"
          showEs={isA0}
          className="text-xs text-teal-400 uppercase tracking-wide mb-2"
        />
        <p className="text-white text-sm leading-relaxed">{prompt}</p>
      </div>

      {/* Recording UI */}
      <div className="bg-white/5 rounded-xl p-6 border border-white/5 flex flex-col items-center gap-4">
        {stage === "idle" && (
          <>
            <div className="w-16 h-16 rounded-full bg-teal-500/20 flex items-center justify-center">
              <Mic className="w-8 h-8 text-teal-400" />
            </div>
            <Instruction
              en="Record up to 60 seconds. Speak clearly into your microphone."
              es="Graba hasta 60 segundos. Habla claro en tu micrófono."
              showEs={isA0}
              className="text-slate-400 text-sm text-center"
            />
            <button
              onClick={startRecording}
              className="px-6 py-2.5 rounded-xl bg-teal-500 text-black font-semibold hover:bg-teal-400 transition-all"
            >
              Start Recording{isA0 && <span className="block text-xs font-normal">Empezar a grabar</span>}
            </button>
          </>
        )}

        {stage === "recording" && (
          <>
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="w-4 h-4 rounded-full bg-red-500"
                />
              </div>
            </div>
            <p className="text-red-400 font-mono text-lg">
              0:{recordingTime.toString().padStart(2, "0")} / 1:00
            </p>
            <p className="text-slate-500 text-xs">Recording...{isA0 && " Grabando..."}</p>
            {taskTranscript && (
              <p className="text-slate-400 text-xs italic text-center max-w-sm">
                &ldquo;{taskTranscript}&rdquo;
              </p>
            )}
            <button
              onClick={stopRecording}
              className="px-6 py-2.5 rounded-xl bg-red-500/20 text-red-400 font-semibold hover:bg-red-500/30 transition-all"
            >
              Stop Recording{isA0 && <span className="block text-xs font-normal">Detener grabación</span>}
            </button>
          </>
        )}

        {stage === "playback" && audioUrl && (
          <>
            <div className="w-16 h-16 rounded-full bg-teal-500/20 flex items-center justify-center">
              <Play className="w-8 h-8 text-teal-400" />
            </div>
            <p className="text-slate-300 text-sm">Recording saved{isA0 && " / Grabación guardada"}</p>
            <audio src={audioUrl} controls className="w-full max-w-xs" />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setStage("idle");
                  setAudioBlob(null);
                  setAudioUrl(null);
                }}
                className="px-4 py-2 rounded-lg bg-white/5 text-slate-400 hover:bg-white/10 transition-all text-sm flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" /> Record again{isA0 && " / Grabar de nuevo"}
              </button>
              <button
                onClick={finishEvaluation}
                className="px-4 py-2 rounded-lg bg-teal-500 text-black font-semibold hover:bg-teal-400 transition-all text-sm"
              >
                Finish & See Results{isA0 && <span className="block text-xs font-normal">Terminar y ver resultados</span>}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Evaluation results */}
      {stage === "done" && feedback && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-4"
        >
          <h3 className="text-sm font-semibold text-white">
            Speaking Results
          </h3>

          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-teal-400">{feedback.band}</p>
              <p className="text-[10px] text-slate-500 uppercase mt-1">Band Score</p>
              <p className="text-[10px] text-slate-600">IELTS-style estimate</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-teal-400">
                {feedback.pronunciation}/100
              </p>
              <p className="text-[10px] text-slate-500 uppercase mt-1">Pronunciation</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-teal-400">
                {feedback.fluency}/100
              </p>
              <p className="text-[10px] text-slate-500 uppercase mt-1">Fluency</p>
            </div>
          </div>

          <div className="bg-teal-500/10 border border-teal-500/20 rounded-lg p-3">
            <p className="text-xs text-teal-400 font-medium mb-1">Tips</p>
            <p className="text-sm text-slate-300">{feedback.tips}</p>
          </div>

          <p className="text-xs text-slate-500 italic text-center pt-2">
            Estimated from real speech recognition (drill accuracy + speaking
            pace) — not an official pronunciation certification.
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}

// ─── Completion & Celebration ───────────────────────────────────

function CompletionSummary({
  lesson,
  vocabDone,
  grammarScore,
  listeningScore,
  quizScore,
  speakingBandScore,
  speakingFluency,
  elapsed,
  saving,
  isA0,
  onCompleteLesson,
}: {
  lesson: Lesson;
  vocabDone: boolean;
  grammarScore: number;
  listeningScore: number;
  quizScore: number;
  speakingBandScore: number | null;
  speakingFluency: number | null;
  elapsed: number;
  saving: boolean;
  isA0: boolean;
  onCompleteLesson: () => void;
}) {
  const xpEarned = Math.round(
    (lesson.duration_minutes * 2) + (quizScore * 5) + 10
  );

  const formatMins = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 bg-[#121212]/95 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-6"
      >
        <div className="text-center">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 0.6, repeat: 0 }}
            className="w-16 h-16 rounded-full bg-teal-500/20 flex items-center justify-center mx-auto mb-3"
          >
            <Trophy className="w-8 h-8 text-teal-400" />
          </motion.div>
          <h2 className="text-xl font-bold">
            Lesson Complete!{isA0 && <span className="block text-sm font-normal text-slate-400">¡Lección completada!</span>}
          </h2>
          <p className="text-slate-400 text-sm mt-1">{lesson.title}</p>
        </div>

        {/* Score summary */}
        <div className="space-y-2 text-sm">
          {vocabDone && (
            <div className="flex justify-between">
              <span className="text-slate-400">Vocabulary{isA0 && " / Vocabulario"}</span>
              <span className="text-green-400">Complete{isA0 && " / Completo"}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-slate-400">Grammar{isA0 && " / Gramática"}</span>
            <span className="text-white">{grammarScore}/3</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Listening</span>
            <span className="text-white">{listeningScore}/{lesson.content.listening?.questions.length ?? "N/A"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Quiz</span>
            <span className="text-white">{quizScore}/5</span>
          </div>
          {speakingBandScore && (
            <>
              <div className="flex justify-between">
                <span className="text-slate-400">Speaking Band</span>
                <span className="text-teal-400">{speakingBandScore}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Fluency{isA0 && " / Fluidez"}</span>
                <span className="text-teal-400">{speakingFluency}/100</span>
              </div>
            </>
          )}
          <div className="border-t border-white/5 pt-2 flex justify-between">
            <span className="text-slate-400">Time spent{isA0 && " / Tiempo usado"}</span>
            <span className="text-white">{formatMins(elapsed)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">XP earned{isA0 && " / XP ganado"}</span>
            <span className="text-teal-400 font-semibold flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" /> +{xpEarned} XP
            </span>
          </div>
        </div>

        <button
          onClick={onCompleteLesson}
          disabled={saving}
          className="w-full py-3 rounded-xl bg-teal-500 text-black font-semibold hover:bg-teal-400 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {saving
            ? `Saving...${isA0 ? " / Guardando..." : ""}`
            : `Complete Lesson${isA0 ? " / Completar lección" : ""}`}{" "}
          <CheckCircle className="w-4 h-4" />
        </button>
      </motion.div>
    </motion.div>
  );
}

function CelebrationScreen({
  lesson,
  isA0,
  onNextLesson,
}: {
  lesson: Lesson;
  isA0: boolean;
  onNextLesson: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 bg-[#121212] flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: "spring" }}
        className="text-center space-y-6 max-w-sm"
      >
        {lesson.is_checkpoint && (
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="w-20 h-20 rounded-full bg-teal-500/20 flex items-center justify-center mx-auto"
          >
            <Star className="w-10 h-10 text-teal-400" />
          </motion.div>
        )}

        <div>
          <h1 className="text-2xl font-bold">
            {lesson.is_checkpoint ? "Checkpoint Complete!" : "Lesson Completed!"}
            {isA0 && (
              <span className="block text-base font-normal text-slate-400 mt-1">
                {lesson.is_checkpoint ? "¡Checkpoint completado!" : "¡Lección completada!"}
              </span>
            )}
          </h1>
          {lesson.is_checkpoint && (
            <p className="text-teal-400 mt-2 flex items-center justify-center gap-1">
              <Sparkles className="w-4 h-4" />
              Great progress! You are advancing well.
              <Sparkles className="w-4 h-4" />
            </p>
          )}
          <p className="text-slate-400 mt-2 text-sm">{lesson.title}</p>
        </div>

        <div className="bg-white/5 rounded-xl p-4 space-y-2">
          <Instruction
            en="Your progress has been saved. Keep up the great work."
            es="Tu progreso se guardó. ¡Sigue así!"
            showEs={isA0}
            className="text-sm text-slate-300"
          />
        </div>

        <button
          onClick={onNextLesson}
          className="px-8 py-3 rounded-xl bg-teal-500 text-black font-semibold hover:bg-teal-400 transition-all flex items-center gap-2 mx-auto"
        >
          Next Lesson{isA0 && " / Siguiente lección"} <ArrowRight className="w-4 h-4" />
        </button>
      </motion.div>
    </motion.div>
  );
}
