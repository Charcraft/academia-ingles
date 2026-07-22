"use client";

import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle,
  Star,
  Clock,
  BarChart3,
} from "lucide-react";
import { cn, formatMinutes } from "@/lib/utils";
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

const LESSONS_MAP: Record<string, Lesson[]> = {
  a0: A0_LESSONS,
  a1: [],
  a2: [],
  b1: B1_LESSONS,
  b2: [],
  c1: [],
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

const COMPLETED_LESSONS: Record<string, string[]> = {
  a0: ["a0-greetings", "a0-body-parts"],
  b1: ["b1-isbar"],
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
  const completedIds = COMPLETED_LESSONS[level] ?? [];
  const completedCount = lessons.filter((l) =>
    completedIds.includes(l.id)
  ).length;

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
            className="mb-6"
          >
            <ProgressBar completed={completedCount} total={lessons.length} />
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
                isCompleted={completedIds.includes(lesson.id)}
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
