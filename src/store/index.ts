import { create } from "zustand";
import type { Profile, Lesson, UserProgress } from "@/types";

interface AppState {
  // User
  profile: Profile | null;
  setProfile: (profile: Profile | null) => void;

  // Timer
  dailyMinutes: number;
  setDailyMinutes: (minutes: number) => void;
  addMinutes: (minutes: number) => void;

  // Current lesson
  currentLesson: Lesson | null;
  setCurrentLesson: (lesson: Lesson | null) => void;

  // Progress
  userProgress: UserProgress[];
  setUserProgress: (progress: UserProgress[]) => void;
  addProgress: (progress: UserProgress) => void;

  // UI
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export const useStore = create<AppState>((set) => ({
  profile: null,
  setProfile: (profile) => set({ profile }),

  dailyMinutes: 0,
  setDailyMinutes: (dailyMinutes) => set({ dailyMinutes }),
  addMinutes: (minutes) =>
    set((state) => ({ dailyMinutes: state.dailyMinutes + minutes })),

  currentLesson: null,
  setCurrentLesson: (currentLesson) => set({ currentLesson }),

  userProgress: [],
  setUserProgress: (userProgress) => set({ userProgress }),
  addProgress: (progress) =>
    set((state) => ({ userProgress: [...state.userProgress, progress] })),

  sidebarOpen: false,
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
}));
