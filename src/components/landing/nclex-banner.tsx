"use client";

// Shared auth for future NCLEX app

import { motion } from "framer-motion";
import { Stethoscope } from "lucide-react";
import { cn } from "@/lib/utils";

export default function NCLEXBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="mx-auto max-w-2xl px-4"
    >
      <div
        className={cn(
          "flex items-center gap-4 rounded-xl border px-5 py-4",
          "border-slate-800/60 bg-charcoal-950/60",
          "transition-colors hover:border-slate-700/60"
        )}
      >
        {/* Icon */}
        <div className="flex-shrink-0 rounded-lg bg-teal-500/10 p-2.5">
          <Stethoscope className="h-5 w-5 text-teal-400" />
        </div>

        {/* Text */}
        <div className="min-w-0 flex-1">
          <p className="text-sm leading-relaxed text-slate-400">
            <span className="font-medium text-slate-300">
              &iquest;Prepar&aacute;ndote para el NCLEX-RN?
            </span>{" "}
            Pr&oacute;ximamente:{" "}
            <span className="font-medium text-teal-400">
              NCLEX Prep Academy
            </span>
            . Mismo login, nueva app.
          </p>
        </div>

        {/* Subtle pill */}
        <span className="flex-shrink-0 rounded-full bg-slate-800/80 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">
          Soon
        </span>
      </div>
    </motion.div>
  );
}
