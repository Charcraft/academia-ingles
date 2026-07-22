import type { PlacementQuestion } from "@/types";

export const placementQuestions: PlacementQuestion[] = [
  // Section 1: Grammar (questions 1-8) — progressively harder
  {
    id: 1, type: "grammar", level: "A0",
    question: "I ___ a nurse.",
    options: ["am", "is", "are", "be"],
    correct: 0,
  },
  {
    id: 2, type: "grammar", level: "A0",
    question: "She ___ from Mexico.",
    options: ["come", "comes", "coming", "came"],
    correct: 1,
  },
  {
    id: 3, type: "grammar", level: "A1",
    question: "The patient ___ to the hospital yesterday.",
    options: ["go", "goes", "went", "going"],
    correct: 2,
  },
  {
    id: 4, type: "grammar", level: "A1",
    question: "There ___ three patients waiting.",
    options: ["is", "are", "was", "be"],
    correct: 1,
  },
  {
    id: 5, type: "grammar", level: "A2",
    question: "If the patient's condition ___ , call the doctor immediately.",
    options: ["worsen", "worsens", "will worsen", "worsened"],
    correct: 1,
  },
  {
    id: 6, type: "grammar", level: "A2",
    question: "The medication ___ before meals.",
    options: ["should take", "should be taken", "should be took", "should taken"],
    correct: 1,
  },
  {
    id: 7, type: "grammar", level: "B1",
    question: "By the time the doctor arrived, the nurse ___ the patient's vitals.",
    options: ["already recorded", "has already recorded", "had already recorded", "was already recording"],
    correct: 2,
  },
  {
    id: 8, type: "grammar", level: "B2",
    question: "Had the infection been detected earlier, the patient ___ a full recovery.",
    options: ["would make", "would have made", "will make", "made"],
    correct: 1,
  },
  // Section 2: Vocabulary (questions 9-14) — healthcare focused
  {
    id: 9, type: "vocabulary", level: "A0",
    question: "What is the English word for 'enfermera'?",
    options: ["Doctor", "Nurse", "Patient", "Surgeon"],
    correct: 1,
  },
  {
    id: 10, type: "vocabulary", level: "A1",
    question: "The patient has a high ___ . We need to give antipyretics.",
    options: ["pressure", "fever", "cough", "wound"],
    correct: 1,
  },
  {
    id: 11, type: "vocabulary", level: "A1",
    question: "Please ___ the patient's blood pressure every 4 hours.",
    options: ["measure", "cook", "write", "call"],
    correct: 0,
  },
  {
    id: 12, type: "vocabulary", level: "A2",
    question: "The patient is experiencing shortness of ___ .",
    options: ["breath", "breathe", "breathing", "breadth"],
    correct: 0,
  },
  {
    id: 13, type: "vocabulary", level: "B1",
    question: "The doctor ordered a CBC to check for ___ .",
    options: ["infection", "anemia", "dehydration", "all of the above"],
    correct: 3,
  },
  {
    id: 14, type: "vocabulary", level: "B1",
    question: "After surgery, the patient was ___ to the recovery room.",
    options: ["transferred", "transported", "moved", "carried"],
    correct: 0,
  },
  // Section 3: Listening comprehension (questions 15-20)
  {
    id: 15, type: "listening", level: "A0",
    question: "Listen: 'Good morning, I am your nurse. How are you feeling today?' — What is the speaker's role?",
    options: ["Doctor", "Nurse", "Patient", "Visitor"],
    correct: 1,
    audioUrl: "/audio/placement-q15.mp3",
  },
  {
    id: 16, type: "listening", level: "A1",
    question: "Listen: 'The patient's blood pressure is 140 over 90. Please document this and notify the charge nurse.' — What should you do first?",
    options: ["Give medication", "Document and notify", "Discharge the patient", "Ignore it"],
    correct: 1,
    audioUrl: "/audio/placement-q16.mp3",
  },
  {
    id: 17, type: "listening", level: "A1",
    question: "Listen: 'I've had this headache for three days. It gets worse when I bend over.' — How long has the patient had the headache?",
    options: ["Three hours", "Three days", "Three weeks", "One day"],
    correct: 1,
    audioUrl: "/audio/placement-q17.mp3",
  },
  {
    id: 18, type: "listening", level: "A2",
    question: "Listen: 'Before administering the IV medication, verify the patient's identity using two identifiers, check for allergies, and confirm the order with the MAR.' — What must you check before giving IV medication?",
    options: ["Only the patient's name", "Identity, allergies, and MAR", "Just the MAR", "Only the medication name"],
    correct: 1,
    audioUrl: "/audio/placement-q18.mp3",
  },
  {
    id: 19, type: "listening", level: "B1",
    question: "Listen: 'I'm calling about Mr. Thompson in room 302. He was admitted yesterday with pneumonia. His oxygen saturation has dropped to 89% on room air. I've started him on 2L nasal cannula, but I'm concerned he may need to be transferred to the ICU.' — What ISBAR component is this primarily?",
    options: ["Introduction", "Situation and Assessment", "Background only", "Recommendation only"],
    correct: 1,
    audioUrl: "/audio/placement-q19.mp3",
  },
  {
    id: 20, type: "listening", level: "B2",
    question: "Listen: 'Considering the patient's deteriorating renal function and the potential nephrotoxicity of the current antibiotic regimen, I recommend switching to a renal-adjusted dose of ceftriaxone and monitoring creatinine levels every 12 hours.' — Why is the doctor recommending a change in antibiotics?",
    options: ["The patient is allergic", "Renal function concerns and nephrotoxicity risk", "The antibiotic is not available", "Cost reduction"],
    correct: 1,
    audioUrl: "/audio/placement-q20.mp3",
  },
];

export function getLevelFromScore(score: number) {
  // 20 questions, each worth 5 points = max 100
  if (score >= 85) return { level: "B2" as const, label: "Upper Intermediate (B2)" };
  if (score >= 70) return { level: "B1" as const, label: "Intermediate (B1)" };
  if (score >= 50) return { level: "A2" as const, label: "Elementary (A2)" };
  if (score >= 30) return { level: "A1" as const, label: "Beginner (A1)" };
  return { level: "A0" as const, label: "Starter (A0)" };
}
