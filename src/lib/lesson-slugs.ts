// Maps (level, order) -> the frontend mock lesson slug used for routing
// (/lessons/[level]/[lessonId]). Lesson content is still hardcoded on the
// frontend, not fetched from Supabase, so this bridges real DB progress
// data (keyed by level/order) back to the slug the lesson pages expect.
export const LESSON_SLUGS: Record<string, { order: number; id: string }[]> = {
  A0: [
    { order: 1, id: "a0-greetings" },
    { order: 2, id: "a0-body-parts" },
    { order: 3, id: "a0-vital-signs" },
    { order: 4, id: "a0-checkpoint-1" },
    { order: 5, id: "a0-symptoms" },
  ],
  A1: [
    { order: 1, id: "a1-meeting-patient" },
    { order: 2, id: "a1-ward-routine" },
    { order: 3, id: "a1-family-contact" },
    { order: 4, id: "a1-checkpoint-1" },
    { order: 5, id: "a1-how-do-you-feel" },
  ],
  A2: [
    { order: 1, id: "a2-what-happened" },
    { order: 2, id: "a2-comparing-symptoms" },
    { order: 3, id: "a2-instructions-procedures" },
    { order: 4, id: "a2-checkpoint-1" },
    { order: 5, id: "a2-family-history" },
  ],
  B1: [
    { order: 1, id: "b1-isbar" },
    { order: 2, id: "b1-patient-history" },
    { order: 3, id: "b1-medication" },
    { order: 4, id: "b1-checkpoint-1" },
    { order: 5, id: "b1-infection" },
  ],
  B2: [
    { order: 1, id: "b2-diagnosis-treatment" },
    { order: 2, id: "b2-passive-voice-reports" },
    { order: 3, id: "b2-reported-speech" },
    { order: 4, id: "b2-checkpoint-1" },
    { order: 5, id: "b2-difficult-conversations" },
  ],
  C1: [
    { order: 1, id: "c1-differential-diagnosis" },
    { order: 2, id: "c1-advocating-patients" },
    { order: 3, id: "c1-professional-register" },
    { order: 4, id: "c1-checkpoint-1" },
    { order: 5, id: "c1-ethical-discussions" },
  ],
};
