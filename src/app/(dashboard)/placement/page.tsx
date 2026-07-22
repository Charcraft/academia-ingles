"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Play,
  Brain,
  BookOpen,
  Headphones,
  Clock,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { placementQuestions, getLevelFromScore } from "@/lib/placement-data";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type QuestionType = "grammar" | "vocabulary" | "listening";

const typeConfig: Record<QuestionType, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  grammar: { label: "Grammar", icon: Brain, color: "bg-purple-500/10 text-purple-400 border-purple-500/30" },
  vocabulary: { label: "Vocabulary", icon: BookOpen, color: "bg-blue-500/10 text-blue-400 border-blue-500/30" },
  listening: { label: "Listening", icon: Headphones, color: "bg-teal-500/10 text-teal-400 border-teal-500/30" },
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function TypeBadge({ type }: { type: QuestionType }) {
  const cfg = typeConfig[type];
  const Icon = cfg.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium",
        cfg.color
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {cfg.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function PlacementPage() {
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase: any = createClient();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [finished, setFinished] = useState(false);
  const [startTime] = useState<number>(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [score, setScore] = useState(0);
  const [cefrResult, setCefrResult] = useState<{ level: string; label: string } | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentQuestion = placementQuestions[currentIndex];
  const totalQuestions = placementQuestions.length;

  // Timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startTime]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleSelectOption = useCallback(
    (optionIdx: number) => {
      if (selectedOption !== null) return; // already answered this question
      setSelectedOption(optionIdx);

      setAnswers((prev) => ({ ...prev, [currentQuestion.id]: optionIdx }));

      // Move to next question after a short delay
      setTimeout(() => {
        if (currentIndex < totalQuestions - 1) {
          setCurrentIndex((prev) => prev + 1);
          setSelectedOption(null);
        } else {
          // Finished
          if (timerRef.current) clearInterval(timerRef.current);
          setFinished(true);
        }
      }, 600);
    },
    [selectedOption, currentQuestion, currentIndex, totalQuestions]
  );

  // Calculate score on finish
  useEffect(() => {
    if (!finished) return ()=>{
      setScore(0);
      setCefrResult(null);
    };

    let correctCount = 0;
    for (const [qIdStr, chosenIdx] of Object.entries(answers)) {
      const qId = Number(qIdStr);
      const q = placementQuestions.find((pq) => pq.id === qId);
      if (q && q.correct === chosenIdx) {
        correctCount++;
      }
    }
    const pct = Math.round((correctCount / totalQuestions) * 100);
    setScore(pct);
    setCefrResult(getLevelFromScore(pct));
  }, [finished, answers, totalQuestions]);

  const handleSubmitPlacement = useCallback(async () => {
    if (!cefrResult) return;
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Save placement result
        await supabase.from("placement_results").insert({
          user_id: user.id,
          initial_level: cefrResult.level,
          score,
          answers,
        });

        // Update profile current_level
        await supabase
          .from("profiles")
          .update({ current_level: cefrResult.level })
          .eq("id", user.id);
      }

      router.push("/dashboard");
    } catch {
      // Still navigate even if save fails
      router.push("/dashboard");
    } finally {
      setIsSubmitting(false);
    }
  }, [cefrResult, score, answers, supabase, router]);

  const handleSkip = useCallback(async () => {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        await supabase.from("placement_results").insert({
          user_id: user.id,
          initial_level: "A0",
          score: 0,
          answers: {},
        });

        await supabase
          .from("profiles")
          .update({ current_level: "A0" })
          .eq("id", user.id);
      }
    } catch {
      // silent fail, still redirect
    } finally {
      setIsSubmitting(false);
      router.push("/dashboard");
    }
  }, [supabase, router]);

  // ── Results view ──
  if (finished && cefrResult) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="glass-card w-full max-w-md p-8 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-teal-500/15"
          >
            <CheckCircle className="h-10 w-10 text-teal-400" />
          </motion.div>

          <h2 className="text-2xl font-bold text-slate-100">Placement Complete</h2>

          <div className="mt-4 space-y-3">
            <div className="rounded-xl bg-charcoal-800/60 px-4 py-3">
              <p className="text-sm text-slate-400">Your Score</p>
              <p className="text-3xl font-bold text-teal-400">{score}%</p>
              <p className="text-xs text-slate-500">
                {score >= 50
                  ? "Great job! You're building real healthcare communication skills."
                  : "This is your starting point. Let's build from here."}
              </p>
            </div>

            <div className="rounded-xl bg-teal-500/10 px-4 py-3">
              <p className="text-sm text-slate-400">Your CEFR Level</p>
              <p className="text-xl font-bold text-teal-300">{cefrResult.label}</p>
            </div>
          </div>

          <button
            onClick={handleSubmitPlacement}
            disabled={isSubmitting}
            className="btn-primary mt-8 w-full"
          >
            {isSubmitting ? "Saving..." : "Start Learning"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </motion.div>
      </div>
    );
  }

  // ── Question view ──
  return (
    <div className="mx-auto max-w-2xl">
      {/* Progress bar */}
      <div className="mb-6 space-y-2">
        <div className="flex items-center justify-between text-sm text-slate-400">
          <span>
            Question {currentIndex + 1}/{totalQuestions}
          </span>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              <span>{formatTime(elapsed)}</span>
            </div>
            <button
              onClick={handleSkip}
              className="btn-ghost text-xs"
            >
              Skip test
            </button>
          </div>
        </div>

        <div className="h-1.5 overflow-hidden rounded-full bg-charcoal-700">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-teal-500 to-teal-400"
            initial={{ width: `${((currentIndex) / totalQuestions) * 100}%` }}
            animate={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>

      {/* Question card */}
      <motion.div
        key={currentQuestion.id}
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="glass-card p-8"
      >
          {/* Type badge */}
          <div className="mb-4">
            <TypeBadge type={currentQuestion.type} />
          </div>

          {/* Listening play button */}
          {currentQuestion.type === "listening" && (
            <div className="mb-4 flex items-center gap-3 rounded-xl bg-teal-500/5 border border-teal-500/20 px-4 py-3">
              <button
                className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-500/15 text-teal-400 transition hover:bg-teal-500/25"
                aria-label="Play audio"
              >
                <Play className="h-5 w-5" />
              </button>
              <span className="text-xs text-slate-400">
                Audio placeholder - [{currentQuestion.question.replace(/^Listen: '(.+)'.*/, "$1")}]
              </span>
            </div>
          )}

          {/* Question text */}
          <p className="mb-8 text-lg font-medium text-slate-100 leading-relaxed">
            {currentQuestion.question}
          </p>

          {/* Options */}
          <div className="space-y-3">
            {currentQuestion.options.map((option, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrect = currentQuestion.correct === idx;
              const showResult = selectedOption !== null;

              return (
                <motion.button
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  disabled={showResult}
                  whileHover={!showResult ? { scale: 1.01 } : undefined}
                  whileTap={!showResult ? { scale: 0.99 } : undefined}
                  className={cn(
                    "w-full rounded-xl border px-5 py-4 text-left font-medium transition-all duration-200",
                    !showResult &&
                      "border-charcoal-600 bg-charcoal-800/60 text-slate-200 hover:border-teal-500/40 hover:bg-charcoal-800",
                    showResult && isCorrect && "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
                    showResult && isSelected && !isCorrect && "border-red-500/40 bg-red-500/10 text-red-400",
                    showResult && !isSelected && !isCorrect && "border-charcoal-600/30 bg-charcoal-800/30 text-slate-500"
                  )}
                >
                  <span className="mr-3 inline-flex h-7 w-7 items-center justify-center rounded-lg border border-charcoal-600 text-xs font-semibold text-slate-400">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  {option}
                </motion.button>
              );
            })}
          </div>
      </motion.div>
    </div>
  );
}
