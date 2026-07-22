"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Lesson, VocabItem, QuizQuestion } from "@/types";

// ─── Speech helper ──────────────────────────────────────────────

function speakText(text: string) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.9;
  speechSynthesis.speak(utterance);
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

  const isA0 = lesson.level === "A0";

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
            Back to lessons
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
        <AnimatePresence mode="wait">
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
        </AnimatePresence>

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
            onCompleteLesson={() => setLessonCompleted(true)}
          />
        )}

        {lessonCompleted && (
          <CelebrationScreen
            lesson={lesson}
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
  onComplete,
}: {
  lesson: Lesson;
  practice: GrammarPractice[];
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
          <p className="text-xs text-slate-500 uppercase tracking-wide">Examples</p>
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
                  <CheckCircle className="w-3 h-3" /> Correct!
                </p>
              )}
              {submitted && answers[i] !== null && answers[i] !== pq.correct && (
                <p className="text-red-400 text-xs mt-2 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Incorrect
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
            Check answers
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
                Continue to Listening
              </button>
            ) : (
              <button
                onClick={() => {
                  setSubmitted(false);
                  setAnswers(new Array(practice.length).fill(null));
                }}
                className="px-6 py-2.5 rounded-xl bg-white/5 text-slate-300 font-semibold hover:bg-white/10 transition-all flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" /> Retry
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
  onComplete,
}: {
  lesson: Lesson;
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
        <p className="text-slate-400">No listening content for this checkpoint.</p>
        <button
          onClick={() => onComplete(3)}
          className="px-6 py-2.5 rounded-xl bg-teal-500 text-black font-semibold hover:bg-teal-400"
        >
          Continue
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
        <p className="text-xs text-slate-500 mb-2 uppercase tracking-wide">
          Audio Script
        </p>
        <p className="text-sm text-slate-300 leading-relaxed">
          {listening.script}
        </p>
        <button
          onClick={() => speakText(listening.script)}
          className="mt-3 text-xs text-teal-400 hover:text-teal-300 transition-colors"
        >
          Read aloud again
        </button>
      </div>

      {/* Questions */}
      {questions.length > 0 && (
        <>
          <div>
            <h3 className="text-sm font-semibold text-slate-300 mb-3">
              Comprehension Questions
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
                Submit answers
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
                    Continue to Quiz
                  </button>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-red-400">
                      Answer all correctly to proceed.
                    </p>
                    <button
                      onClick={() => {
                        setSubmitted(false);
                        setAnswers(new Array(questions.length).fill(null));
                      }}
                      className="px-6 py-2.5 rounded-xl bg-white/5 text-slate-300 font-semibold hover:bg-white/10 flex items-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" /> Retry
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
  onComplete,
}: {
  questions: QuizQuestion[];
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
        <p className="text-slate-400 text-sm">
          5 multiple choice questions. Pass with 3/5 correct.
        </p>
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
            Submit quiz
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
              </p>
            </div>
            {passed ? (
              <button
                onClick={() => onComplete(correctCount)}
                className="px-6 py-2.5 rounded-xl bg-teal-500 text-black font-semibold hover:bg-teal-400"
              >
                Continue to Speaking
              </button>
            ) : (
              <button
                onClick={() => {
                  setSubmitted(false);
                  setAnswers(new Array(questions.length).fill(null));
                }}
                className="px-6 py-2.5 rounded-xl bg-white/5 text-slate-300 font-semibold hover:bg-white/10 flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" /> Retry quiz
              </button>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

function SpeakingTab({
  prompt,
  context,
  lessonId: _lessonId,
  userId: _userId,
  onComplete,
}: {
  prompt: string;
  context: string;
  lessonId: string;
  userId: string;
  onComplete: (scores: { band: number; pronunciation: number; fluency: number }) => void;
}) {
  const [stage, setStage] = useState<"idle" | "recording" | "playback" | "evaluating" | "done">("idle");
  const [_audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [feedback, setFeedback] = useState<{
    band: number;
    pronunciation: number;
    fluency: number;
    tips: string;
  } | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
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

  const simulateEvaluation = () => {
    setStage("evaluating");

    // Simulate AI evaluation delay
    setTimeout(() => {
      const band = parseFloat((5.0 + Math.random() * 2.5).toFixed(1));
      const pronunciation = Math.floor(60 + Math.random() * 30);
      const fluency = Math.floor(55 + Math.random() * 35);
      const tips = [
        "Try to speak more slowly and clearly.",
        "Practice the 'th' sound for better pronunciation.",
        "Use more connecting words to improve fluency.",
        "Pause briefly between sentences for clarity.",
        "Focus on word stress in medical terminology.",
      ][Math.floor(Math.random() * 5)];

      setFeedback({ band, pronunciation, fluency, tips });
      setStage("done");
      onComplete({ band, pronunciation, fluency });
    }, 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-lg font-semibold mb-1">Speaking Practice</h2>
        <p className="text-slate-400 text-sm">{context}</p>
      </div>

      {/* Prompt */}
      <div className="bg-teal-500/10 border border-teal-500/20 rounded-xl p-4">
        <p className="text-xs text-teal-400 uppercase tracking-wide mb-2">
          Your Task
        </p>
        <p className="text-white text-sm leading-relaxed">{prompt}</p>
      </div>

      {/* Recording UI */}
      <div className="bg-white/5 rounded-xl p-6 border border-white/5 flex flex-col items-center gap-4">
        {stage === "idle" && (
          <>
            <div className="w-16 h-16 rounded-full bg-teal-500/20 flex items-center justify-center">
              <Mic className="w-8 h-8 text-teal-400" />
            </div>
            <p className="text-slate-400 text-sm text-center">
              Record up to 60 seconds. Speak clearly into your microphone.
            </p>
            <button
              onClick={startRecording}
              className="px-6 py-2.5 rounded-xl bg-teal-500 text-black font-semibold hover:bg-teal-400 transition-all"
            >
              Start Recording
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
            <p className="text-slate-500 text-xs">Recording...</p>
            <button
              onClick={stopRecording}
              className="px-6 py-2.5 rounded-xl bg-red-500/20 text-red-400 font-semibold hover:bg-red-500/30 transition-all"
            >
              Stop Recording
            </button>
          </>
        )}

        {stage === "playback" && audioUrl && (
          <>
            <div className="w-16 h-16 rounded-full bg-teal-500/20 flex items-center justify-center">
              <Play className="w-8 h-8 text-teal-400" />
            </div>
            <p className="text-slate-300 text-sm">Recording saved</p>
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
                <RotateCcw className="w-4 h-4" /> Record again
              </button>
              <button
                onClick={simulateEvaluation}
                className="px-4 py-2 rounded-lg bg-teal-500 text-black font-semibold hover:bg-teal-400 transition-all text-sm"
              >
                Submit & Evaluate
              </button>
            </div>
          </>
        )}

        {stage === "evaluating" && (
          <div className="flex flex-col items-center gap-4 py-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
              className="w-12 h-12 border-2 border-teal-500 border-t-transparent rounded-full"
            />
            <p className="text-slate-400 text-sm">Evaluating your speech...</p>
          </div>
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
            AI Evaluation Results
          </h3>

          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-teal-400">{feedback.band}</p>
              <p className="text-[10px] text-slate-500 uppercase mt-1">Band Score</p>
              <p className="text-[10px] text-slate-600">IELTS style</p>
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
            Case Manager does not grade, only sees score.
          </p>

          <button
            onClick={() => {}}
            className="w-full py-2.5 rounded-xl bg-teal-500 text-black font-semibold hover:bg-teal-400 transition-all text-sm"
          >
            Submit Recording
          </button>
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
          <h2 className="text-xl font-bold">Lesson Complete!</h2>
          <p className="text-slate-400 text-sm mt-1">{lesson.title}</p>
        </div>

        {/* Score summary */}
        <div className="space-y-2 text-sm">
          {vocabDone && (
            <div className="flex justify-between">
              <span className="text-slate-400">Vocabulary</span>
              <span className="text-green-400">Complete</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-slate-400">Grammar</span>
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
                <span className="text-slate-400">Fluency</span>
                <span className="text-teal-400">{speakingFluency}/100</span>
              </div>
            </>
          )}
          <div className="border-t border-white/5 pt-2 flex justify-between">
            <span className="text-slate-400">Time spent</span>
            <span className="text-white">{formatMins(elapsed)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">XP earned</span>
            <span className="text-teal-400 font-semibold flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" /> +{xpEarned} XP
            </span>
          </div>
        </div>

        <button
          onClick={onCompleteLesson}
          className="w-full py-3 rounded-xl bg-teal-500 text-black font-semibold hover:bg-teal-400 transition-all flex items-center justify-center gap-2"
        >
          Complete Lesson <CheckCircle className="w-4 h-4" />
        </button>
      </motion.div>
    </motion.div>
  );
}

function CelebrationScreen({
  lesson,
  onNextLesson,
}: {
  lesson: Lesson;
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
          <p className="text-sm text-slate-300">
            Your progress has been saved. Keep up the great work.
          </p>
        </div>

        <button
          onClick={onNextLesson}
          className="px-8 py-3 rounded-xl bg-teal-500 text-black font-semibold hover:bg-teal-400 transition-all flex items-center gap-2 mx-auto"
        >
          Next Lesson <ArrowRight className="w-4 h-4" />
        </button>
      </motion.div>
    </motion.div>
  );
}
