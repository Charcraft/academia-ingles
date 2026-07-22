"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle,
  Star,
  Clock,
  BarChart3,
  Loader2,
} from "lucide-react";
import { cn, formatMinutes } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { Lesson } from "@/types";

// ─── Mock Data ──────────────────────────────────────────────────

const A0_LESSONS: Lesson[] = [
  {
    id: "a0-greetings",
    level: "A0",
    order: 1,
    title: "Greetings in Healthcare",
    subtitle: "Saludos en el entorno medico",
    description:
      "Learn basic greetings used in hospitals and clinics. Aprende saludos basicos para usar en hospitales.",
    vocab_healthcare: [
      {
        en: "Hello, how are you?",
        es: "Hola, como estas?",
        context: "Greeting a patient",
        definition: "",
      },
      {
        en: "Good morning, I am your nurse",
        es: "Buenos dias, soy tu enfermera",
        context: "Introducing yourself",
        definition: "",
      },
      {
        en: "Please, have a seat",
        es: "Por favor, tome asiento",
        context: "Directing a patient",
        definition: "",
      },
      {
        en: "My name is...",
        es: "Mi nombre es...",
        context: "Self-introduction",
        definition: "",
      },
      {
        en: "Nice to meet you",
        es: "Mucho gusto",
        context: "First meeting",
        definition: "",
      },
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
          {
            q: "Who is speaking?",
            options: ["The doctor", "The nurse", "The patient"],
            correct: 1,
          },
        ],
      },
      quiz: [
        {
          q: "Complete: I ___ a nurse",
          options: ["is", "am", "are"],
          correct: 1,
        },
        {
          q: "My name ___ Maria",
          options: ["am", "is", "are"],
          correct: 1,
        },
      ],
    },
    is_checkpoint: false,
    duration_minutes: 20,
    created_at: "",
  },
  {
    id: "a0-body-parts",
    level: "A0",
    order: 2,
    title: "Parts of the Body",
    subtitle: "Partes del cuerpo",
    description:
      "Essential vocabulary for body parts in medical contexts. Vocabulario esencial de partes del cuerpo.",
    vocab_healthcare: [
      {
        en: "head",
        es: "cabeza",
        context: "Patient assessment",
        definition: "",
      },
      {
        en: "arm",
        es: "brazo",
        context: "Taking blood pressure",
        definition: "",
      },
      {
        en: "leg",
        es: "pierna",
        context: "Mobility assessment",
        definition: "",
      },
      {
        en: "chest",
        es: "pecho",
        context: "Listening to heartbeat",
        definition: "",
      },
      {
        en: "back",
        es: "espalda",
        context: "Pain assessment",
        definition: "",
      },
    ],
    grammar_point: {
      topic: "Articles: a/an/the",
      explanation:
        "A before consonant, An before vowel, The for specific",
      examples: ["a headache", "an arm injury", "the patient"],
    },
    content: {
      listening: {
        script:
          "The patient has pain in his left arm. Please check his blood pressure.",
        questions: [
          {
            q: "Where is the pain?",
            options: ["Right arm", "Left arm", "Chest"],
            correct: 1,
          },
        ],
      },
      quiz: [
        {
          q: "The patient has ___ headache",
          options: ["a", "an", "the"],
          correct: 0,
        },
        {
          q: "She has ___ ear infection",
          options: ["a", "an", "the"],
          correct: 1,
        },
      ],
    },
    is_checkpoint: false,
    duration_minutes: 20,
    created_at: "",
  },
  {
    id: "a0-vital-signs",
    level: "A0",
    order: 3,
    title: "Numbers and Vital Signs",
    subtitle: "Numeros y signos vitales",
    description:
      "Learn numbers for taking vital signs. Aprende numeros para tomar signos vitales.",
    vocab_healthcare: [
      {
        en: "blood pressure",
        es: "presion arterial",
        context: "Vital signs measurement",
        definition: "",
      },
      {
        en: "temperature",
        es: "temperatura",
        context: "Fever check",
        definition: "",
      },
      {
        en: "heart rate",
        es: "ritmo cardiaco",
        context: "Pulse check",
        definition: "",
      },
      {
        en: "one hundred twenty over eighty",
        es: "ciento veinte sobre ochenta",
        context: "Reading BP",
        definition: "",
      },
      {
        en: "degrees Celsius",
        es: "grados centigrados",
        context: "Temperature reading",
        definition: "",
      },
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
          {
            q: "What is the blood pressure?",
            options: ["120/80", "130/85", "140/90"],
            correct: 1,
          },
        ],
      },
      quiz: [
        {
          q: "Normal body temperature in Celsius is about ___ degrees",
          options: ["35", "37", "39"],
          correct: 1,
        },
      ],
    },
    is_checkpoint: false,
    duration_minutes: 20,
    created_at: "",
  },
  {
    id: "a0-checkpoint-1",
    level: "A0",
    order: 4,
    title: "Checkpoint: Basic Communication",
    subtitle: "Evaluacion: Comunicacion basica",
    description:
      "Review and assessment of greetings, body parts, and vital signs. Evaluacion de lo aprendido.",
    vocab_healthcare: [],
    grammar_point: { topic: "", explanation: "", examples: [] },
    content: {
      is_checkpoint: true,
      review_lessons: [1, 2, 3],
      passing_score: 70,
      questions: [
        {
          q: "How do you introduce yourself to a patient?",
          options: ["Goodbye", "I am your nurse", "Where is the bathroom?"],
          correct: 1,
        },
        {
          q: "What is the correct article: ___ headache",
          options: ["a", "an", "the"],
          correct: 0,
        },
        {
          q: "Normal blood pressure is around...",
          options: ["200/100", "120/80", "90/60"],
          correct: 1,
        },
        {
          q: "How do you say 'brazo' in English?",
          options: ["Leg", "Arm", "Chest"],
          correct: 1,
        },
        {
          q: "She ___ the doctor",
          options: ["am", "is", "are"],
          correct: 1,
        },
      ],
    },
    is_checkpoint: true,
    duration_minutes: 25,
    created_at: "",
  },
  {
    id: "a0-symptoms",
    level: "A0",
    order: 5,
    title: "Common Symptoms",
    subtitle: "Sintomas comunes",
    description:
      "How to ask about and describe common symptoms. Como preguntar sobre sintomas comunes.",
    vocab_healthcare: [
      {
        en: "headache",
        es: "dolor de cabeza",
        context: "Pain assessment",
        definition: "",
      },
      {
        en: "fever",
        es: "fiebre",
        context: "Vital signs",
        definition: "",
      },
      {
        en: "cough",
        es: "tos",
        context: "Respiratory",
        definition: "",
      },
      {
        en: "nausea",
        es: "nausea",
        context: "General symptoms",
        definition: "",
      },
      {
        en: "dizziness",
        es: "mareo",
        context: "General symptoms",
        definition: "",
      },
    ],
    grammar_point: {
      topic: "Present Simple Questions",
      explanation: "Do/Does for questions",
      examples: [
        "Do you have a headache?",
        "Does the patient have fever?",
      ],
    },
    content: {
      listening: {
        script:
          "Patient says: I have a bad headache and I feel dizzy. I also have a cough since yesterday.",
        questions: [
          {
            q: "How many symptoms does the patient mention?",
            options: ["Two", "Three", "Four"],
            correct: 1,
          },
        ],
      },
      quiz: [
        {
          q: "___ you have a fever?",
          options: ["Do", "Does", "Is"],
          correct: 0,
        },
        {
          q: "The patient complains of ___ and dizziness",
          options: ["fever", "headache", "cough"],
          correct: 1,
        },
      ],
    },
    is_checkpoint: false,
    duration_minutes: 20,
    created_at: "",
  },
];

const A1_LESSONS: Lesson[] = [
  {
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
  {
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
  {
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
  {
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
  {
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
];

const A2_LESSONS: Lesson[] = [
  {
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
  {
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
  {
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
  {
    id: "a2-checkpoint-1",
    level: "A2",
    order: 4,
    title: "Checkpoint: Describing Change and Giving Instructions",
    subtitle: "Evaluación: Historia clínica, comparativos e instrucciones",
    description:
      "Review past tense history-taking, comparatives, and giving instructions.",
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
  {
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
];

const B1_LESSONS: Lesson[] = [
  {
    id: "b1-isbar",
    level: "B1",
    order: 1,
    title: "Patient Handover - ISBAR",
    subtitle: "Clinical Communication",
    description:
      "Master the ISBAR framework for structured patient handovers between shifts.",
    vocab_healthcare: [
      {
        en: "handover",
        definition:
          "The transfer of patient care responsibility from one provider to another",
        context: "End of shift report",
      },
      {
        en: "deterioration",
        definition: "A decline in patient condition",
        context: "Patient status",
      },
      {
        en: "vital signs stable",
        definition:
          "Blood pressure, heart rate, temperature within normal range",
        context: "Patient assessment",
      },
      {
        en: "plan of care",
        definition: "The documented treatment approach for a patient",
        context: "Nursing process",
      },
      {
        en: "escalation",
        definition: "The process of raising concerns to senior staff",
        context: "Clinical urgency",
      },
    ],
    grammar_point: {
      topic: "ISBAR Framework",
      explanation:
        "Introduction, Situation, Background, Assessment, Recommendation",
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
          {
            q: "What is the ISBAR framework used for?",
            options: [
              "Medication calculation",
              "Patient handover",
              "Diagnosing illness",
            ],
            correct: 1,
          },
          {
            q: "What condition does the nurse suspect?",
            options: ["Pneumonia", "Pulmonary embolism", "Heart attack"],
            correct: 1,
          },
        ],
      },
      quiz: [
        {
          q: "In ISBAR, 'S' stands for:",
          options: ["Symptoms", "Situation", "Surgery"],
          correct: 1,
        },
        {
          q: "Which ISBAR component includes vital signs?",
          options: ["Introduction", "Assessment", "Background"],
          correct: 1,
        },
      ],
    },
    is_checkpoint: false,
    duration_minutes: 30,
    created_at: "",
  },
  {
    id: "b1-patient-history",
    level: "B1",
    order: 2,
    title: "Taking Patient History",
    subtitle: "Clinical Assessment",
    description:
      "Learn to take a comprehensive patient history using the SOCRATES framework for pain assessment and standard history-taking questions.",
    vocab_healthcare: [
      {
        en: "onset",
        definition: "When symptoms began",
        context: "Pain assessment",
      },
      {
        en: "aggravating factors",
        definition: "Things that make the condition worse",
        context: "Assessment",
      },
      {
        en: "past medical history",
        definition: "Previous illnesses and conditions",
        context: "History taking",
      },
      {
        en: "medication reconciliation",
        definition: "Reviewing all current medications",
        context: "Admission process",
      },
      {
        en: "chief complaint",
        definition: "The primary reason for seeking medical attention",
        context: "Patient interview",
      },
    ],
    grammar_point: {
      topic: "Question Formation for History Taking",
      explanation:
        "Open-ended vs closed questions, probing techniques",
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
          {
            q: "What is the patients chief complaint?",
            options: ["Headache", "Chest pain", "Back pain"],
            correct: 1,
          },
          {
            q: "When did the pain start?",
            options: ["Two weeks ago", "Two days ago", "Two hours ago"],
            correct: 1,
          },
        ],
      },
      quiz: [
        {
          q: "What does SOCRATES assess?",
          options: ["Vital signs", "Pain characteristics", "Lab results"],
          correct: 1,
        },
        {
          q: "An 'aggravating factor' makes symptoms...",
          options: ["Better", "Worse", "No change"],
          correct: 1,
        },
      ],
    },
    is_checkpoint: false,
    duration_minutes: 30,
    created_at: "",
  },
  {
    id: "b1-medication",
    level: "B1",
    order: 3,
    title: "Medication Administration",
    subtitle: "Pharmacology Basics",
    description:
      "Vocabulary and communication for safe medication administration including the 5 Rights of medication.",
    vocab_healthcare: [
      {
        en: "dosage",
        definition: "The amount of medication to be given",
        context: "Medication chart",
      },
      {
        en: "route of administration",
        definition: "How medication enters the body (oral, IV, IM, etc.)",
        context: "Drug administration",
      },
      {
        en: "contraindication",
        definition: "A condition where a drug should not be used",
        context: "Drug safety",
      },
      {
        en: "adverse reaction",
        definition: "An unwanted or harmful effect of a medication",
        context: "Patient monitoring",
      },
      {
        en: "therapeutic effect",
        definition: "The intended beneficial result of a medication",
        context: "Treatment outcome",
      },
    ],
    grammar_point: {
      topic: "Passive Voice in Clinical Notes",
      explanation:
        "Using passive voice for objective clinical documentation",
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
          {
            q: "How many rights of medication are mentioned?",
            options: ["Three", "Four", "Five"],
            correct: 2,
          },
          {
            q: "What allergy does the patient have?",
            options: ["Aspirin", "Penicillin", "Ibuprofen"],
            correct: 1,
          },
        ],
      },
      quiz: [
        {
          q: "The medication ___ administered at 0800 (passive)",
          options: ["is", "was", "were"],
          correct: 1,
        },
        {
          q: "A contraindication means the drug...",
          options: ["Should be given", "Should NOT be given", "Is optional"],
          correct: 1,
        },
      ],
    },
    is_checkpoint: false,
    duration_minutes: 30,
    created_at: "",
  },
  {
    id: "b1-checkpoint-1",
    level: "B1",
    order: 4,
    title: "Checkpoint: Clinical Communication",
    subtitle: "Mid-Level Assessment",
    description:
      "Comprehensive review of patient handover, history taking, and medication administration.",
    vocab_healthcare: [],
    grammar_point: { topic: "", explanation: "", examples: [] },
    content: {
      is_checkpoint: true,
      review_lessons: [1, 2, 3],
      passing_score: 75,
      questions: [
        {
          q: "What does ISBAR stand for?",
          options: [
            "Introduction, Situation, Background, Assessment, Recommendation",
            "Identify, Situation, Background, Action, Review",
            "Initial, Status, Basic, Assessment, Response",
          ],
          correct: 0,
        },
        {
          q: "The five rights of medication include all EXCEPT:",
          options: ["Right patient", "Right diagnosis", "Right dose"],
          correct: 1,
        },
        {
          q: "In SOCRATES pain assessment, 'O' stands for:",
          options: ["Observation", "Onset", "Operation"],
          correct: 1,
        },
        {
          q: "A patient says their pain gets 'worse when walking' - this is called:",
          options: [
            "An aggravating factor",
            "A relieving factor",
            "A side effect",
          ],
          correct: 0,
        },
        {
          q: "In a handover, vital signs belong in which ISBAR component?",
          options: ["Introduction", "Situation", "Assessment"],
          correct: 2,
        },
      ],
    },
    is_checkpoint: true,
    duration_minutes: 35,
    created_at: "",
  },
  {
    id: "b1-infection",
    level: "B1",
    order: 5,
    title: "Infection Control",
    subtitle: "Safety & Prevention",
    description:
      "Master infection control terminology including PPE, standard precautions, and isolation protocols.",
    vocab_healthcare: [
      {
        en: "personal protective equipment",
        definition: "Equipment worn to minimize exposure to hazards",
        context: "Infection prevention",
      },
      {
        en: "hand hygiene",
        definition: "Cleaning hands to prevent transmission of pathogens",
        context: "Standard precautions",
      },
      {
        en: "transmission-based precautions",
        definition:
          "Additional infection control measures for specific diseases",
        context: "Isolation protocols",
      },
      {
        en: "aseptic technique",
        definition:
          "Practices to maintain sterility and prevent contamination",
        context: "Clinical procedures",
      },
      {
        en: "nosocomial infection",
        definition: "An infection acquired in a healthcare facility",
        context: "Patient safety",
      },
    ],
    grammar_point: {
      topic: "Modal Verbs for Protocols",
      explanation:
        "Must, should, have to for clinical obligations",
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
          {
            q: "What type of precautions are in effect?",
            options: [
              "Droplet precautions",
              "Contact precautions",
              "Airborne precautions",
            ],
            correct: 1,
          },
          {
            q: "What PPE is required?",
            options: ["Gloves only", "Gloves and gown", "Full PPE including N95"],
            correct: 1,
          },
        ],
      },
      quiz: [
        {
          q: "You ___ wash hands before patient contact",
          options: ["might", "must", "could"],
          correct: 1,
        },
        {
          q: "A nosocomial infection is acquired in a...",
          options: ["Community", "Healthcare facility", "School"],
          correct: 1,
        },
      ],
    },
    is_checkpoint: false,
    duration_minutes: 30,
    created_at: "",
  },
];

const B2_LESSONS: Lesson[] = [
  {
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
  {
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
  {
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
  {
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
  {
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
];

const C1_LESSONS: Lesson[] = [
  {
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
  {
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
  {
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
  {
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
  {
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
];

const LESSONS_MAP: Record<string, Lesson[]> = {
  a0: A0_LESSONS,
  a1: A1_LESSONS,
  a2: A2_LESSONS,
  b1: B1_LESSONS,
  b2: B2_LESSONS,
  c1: C1_LESSONS,
};

const LEVEL_SUBTITLES: Record<string, string> = {
  a0: "Ingles para Profesionales de la Salud",
  a1: "English for Healthcare Professionals",
  a2: "English for Healthcare Professionals",
  b1: "English for Healthcare Professionals",
  b2: "English for Healthcare Professionals",
  c1: "English for Healthcare Professionals",
};

const LEVEL_NAMES: Record<string, string> = {
  a0: "Starter",
  a1: "Elementary",
  a2: "Pre-Intermediate",
  b1: "Intermediate",
  b2: "Upper-Intermediate",
  c1: "Advanced",
};

// ─── Components ─────────────────────────────────────────────────

function LessonCard({
  lesson,
  index,
  isCompleted,
  onClick,
}: {
  lesson: Lesson;
  index: number;
  isCompleted: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      onClick={onClick}
      className={cn(
        "w-full text-left p-4 rounded-2xl border transition-all duration-200",
        "bg-[#1a1a1a] border-white/5",
        "hover:border-teal-500/30 hover:bg-[#1e1e1e]",
        "active:scale-[0.98]",
        lesson.is_checkpoint && "ring-1 ring-teal-500/20"
      )}
    >
      <div className="flex items-center gap-4">
        {/* Order number */}
        <div
          className={cn(
            "flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-sm font-semibold",
            lesson.is_checkpoint
              ? "bg-teal-500/15 text-teal-400"
              : isCompleted
              ? "bg-green-500/15 text-green-400"
              : "bg-white/5 text-slate-400"
          )}
        >
          {lesson.is_checkpoint ? (
            <Star className="w-5 h-5" />
          ) : isCompleted ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            lesson.order
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-white font-medium truncate">
              {lesson.title}
            </h3>
            {lesson.is_checkpoint && (
              <span className="flex-shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-400">
                Checkpoint
              </span>
            )}
            {isCompleted && (
              <span className="flex-shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-green-500/15 text-green-400">
                Done
              </span>
            )}
          </div>
          <p className="text-sm text-slate-400 mt-0.5 truncate">
            {lesson.subtitle}
          </p>
        </div>

        {/* Duration */}
        <div className="flex-shrink-0 flex items-center gap-1.5 text-xs text-slate-500">
          <Clock className="w-3.5 h-3.5" />
          {formatMinutes(lesson.duration_minutes)}
        </div>
      </div>
    </motion.button>
  );
}

function ProgressBar({
  completed,
  total,
}: {
  completed: number;
  total: number;
}) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-400">Progress</span>
        <span className="text-teal-400 font-medium">
          {completed}/{total} lessons
        </span>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full bg-teal-500 rounded-full"
        />
      </div>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────

export default function LevelLessonsPage() {
  const params = useParams<{ level: string }>();
  const router = useRouter();
  const rawLevel = (params?.level ?? "a0").toLowerCase();
  const level = rawLevel.replace(/[^a-z0-9]/g, "");

  const lessons = LESSONS_MAP[level] ?? [];

  const [completedOrders, setCompletedOrders] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadProgress() {
      setLoading(true);
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        if (!cancelled) setLoading(false);
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: dbLessons } = await (supabase as any)
        .from("lessons")
        .select("id, order")
        .eq("level", level.toUpperCase());

      if (!dbLessons || dbLessons.length === 0) {
        if (!cancelled) setLoading(false);
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const lessonIds = (dbLessons as any[]).map((l) => l.id);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: progress } = await (supabase as any)
        .from("user_progress")
        .select("lesson_id")
        .eq("user_id", user.id)
        .eq("completed", true)
        .in("lesson_id", lessonIds);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const completedDbIds = new Set(((progress ?? []) as any[]).map((p) => p.lesson_id));
      const orders = new Set(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (dbLessons as any[]).filter((l) => completedDbIds.has(l.id)).map((l) => l.order)
      );
      if (!cancelled) {
        setCompletedOrders(orders);
        setLoading(false);
      }
    }

    loadProgress();
    return () => {
      cancelled = true;
    };
  }, [level]);

  const completedCount = lessons.filter((l) => completedOrders.has(l.order)).length;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back button */}
        <motion.button
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </motion.button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-bold text-white">
            {level.toUpperCase()} -{" "}
            {LEVEL_NAMES[level] ?? "Lessons"}
          </h1>
          <p className="text-slate-400 mt-1">
            {LEVEL_SUBTITLES[level] ?? "English for Healthcare Professionals"}
          </p>
        </motion.div>

        {/* Progress bar */}
        {lessons.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6 flex items-center gap-2"
          >
            <ProgressBar completed={completedCount} total={lessons.length} />
            {loading && <Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin text-slate-500" />}
          </motion.div>
        )}

        {/* Lessons list */}
        {lessons.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>No lessons available for this level yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {lessons.map((lesson, i) => (
              <LessonCard
                key={lesson.id}
                lesson={lesson}
                index={i}
                isCompleted={completedOrders.has(lesson.order)}
                onClick={() =>
                  router.push(
                    `/lessons/${level.toUpperCase()}/${lesson.id}`
                  )
                }
              />
            ))}
          </div>
        )}
    </div>
  );
}
