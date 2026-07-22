"use client";

// Stripe integration ready - set NEXT_PUBLIC_PAYMENTS_ENABLED=true to activate

import { motion } from "framer-motion";
import { Check, Clock, CreditCard, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

/* ==================== Feature Row ==================== */

interface FeatureRowProps {
  label: string;
  free: boolean | string;
  premium: boolean | string;
  delay?: number;
}

function _FeatureRow({ label, free, premium, delay = 0.3 }: FeatureRowProps) {
  const renderValue = (value: boolean | string, isPremium: boolean) => {
    if (typeof value === "boolean") {
      if (value) {
        return (
          <Check
            className={cn(
              "h-4 w-4",
              isPremium ? "text-teal-400" : "text-teal-500"
            )}
          />
        );
      }
      return (
        <span
          className={cn(
            "text-sm",
            isPremium ? "text-slate-600" : "text-slate-600"
          )}
        >
          &mdash;
        </span>
      );
    }
    return (
      <span
        className={cn(
          "text-xs font-medium",
          isPremium ? "text-teal-400" : "text-slate-400"
        )}
      >
        {value}
      </span>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3, delay }}
      className="grid grid-cols-[1fr,80px,80px] items-center gap-4 border-b border-slate-800/60 py-3 text-sm"
    >
      <span className="text-slate-400">{label}</span>
      <span className="flex justify-center">{renderValue(free, false)}</span>
      <span className="flex justify-center">{renderValue(premium, true)}</span>
    </motion.div>
  );
}

/* ==================== Pricing Table ==================== */

export default function PricingTable() {
  const _paymentsEnabled =
    process.env.NEXT_PUBLIC_PAYMENTS_ENABLED === "true";

  return (
    <section className="w-full bg-charcoal-900 py-20">
      <div className="mx-auto max-w-4xl px-6 sm:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <h2 className="mb-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Planes y Precios
          </h2>
          <p className="text-slate-400">
            Elige el plan que mejor se adapte a tu preparaci&oacute;n
            profesional
          </p>
        </motion.div>

        {/* Pricing cards */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Free Plan */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className={cn(
              "relative flex flex-col rounded-2xl border p-6 sm:p-8",
              "border-teal-500/30 bg-charcoal-950",
              "shadow-[0_0_30px_rgba(20,184,166,0.08)]"
            )}
          >
            {/* Badge */}
            <span className="mb-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-teal-500/10 px-3 py-1 text-xs font-semibold text-teal-400">
              <Sparkles className="h-3 w-3" />
              Currently FREE
            </span>

            <h3 className="text-xl font-bold text-white">Free</h3>
            <p className="mt-1 text-sm text-slate-500">
              Acceso completo sin costo
            </p>

            <div className="mt-4 mb-6">
              <span className="text-4xl font-bold text-white">$0</span>
              <span className="text-slate-500"> /mes</span>
            </div>

            {/* Features */}
            <div className="mb-8 flex-1 space-y-3">
              <Feature label="Lecciones A0 &ndash; C1" free={true} premium={true} delay={0.15} />
              <Feature label="Placement test (CEFR)" free={true} premium={true} delay={0.2} />
              <Feature label="Seguimiento de progreso" free={true} premium={true} delay={0.25} />
              <Feature label="Soporte de comunidad" free={true} premium={true} delay={0.3} />
              <Feature label="AI Speaking (DeepSeek)" free={false} premium={true} delay={0.35} />
              <Feature label="Mock exams (IELTS/TOEFL/PTE)" free={false} premium={true} delay={0.4} />
              <Feature label="1:1 Case Manager" free={false} premium={true} delay={0.45} />
              <Feature label="Soporte prioritario" free={false} premium={true} delay={0.5} />
              <Feature label="Certificados de finalizaci&oacute;n" free={false} premium={true} delay={0.55} />
            </div>

            {/* CTA */}
            <a
              href="/signup"
              className={cn(
                "flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all",
                "bg-teal-500 text-white hover:bg-teal-400",
                "shadow-[0_0_20px_rgba(20,184,166,0.3)] hover:shadow-[0_0_30px_rgba(20,184,166,0.5)]"
              )}
            >
              <Sparkles className="h-4 w-4" />
              Start Free
            </a>
          </motion.div>

          {/* Premium Plan */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className={cn(
              "relative flex flex-col rounded-2xl border p-6 sm:p-8",
              "border-slate-800 bg-charcoal-950/60"
            )}
          >
            {/* Badge */}
            <span className="mb-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-400">
              <Clock className="h-3 w-3" />
              Coming Soon
            </span>

            <h3 className="text-xl font-bold text-slate-400">Premium</h3>
            <p className="mt-1 text-sm text-slate-600">
              Preparaci&oacute;n avanzada
            </p>

            <div className="mt-4 mb-6">
              <span className="text-4xl font-bold text-slate-500">TBD</span>
              <span className="text-slate-600"> /mes</span>
            </div>

            {/* Features (grayed out) */}
            <div className="mb-8 flex-1 space-y-3 opacity-50">
              <Feature label="Lecciones A0 &ndash; C1" free={true} premium={true} delay={0.15} />
              <Feature label="Placement test (CEFR)" free={true} premium={true} delay={0.2} />
              <Feature label="Seguimiento de progreso" free={true} premium={true} delay={0.25} />
              <Feature label="Soporte de comunidad" free={true} premium={true} delay={0.3} />
              <Feature label="AI Speaking (DeepSeek)" free={false} premium={true} delay={0.35} />
              <Feature label="Mock exams (IELTS/TOEFL/PTE)" free={false} premium={true} delay={0.4} />
              <Feature label="1:1 Case Manager" free={false} premium={true} delay={0.45} />
              <Feature label="Soporte prioritario" free={false} premium={true} delay={0.5} />
              <Feature label="Certificados de finalizaci&oacute;n" free={false} premium={true} delay={0.55} />
            </div>

            {/* CTA (disabled) */}
            <button
              disabled
              className={cn(
                "flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold",
                "cursor-not-allowed border border-slate-700 bg-slate-800/50 text-slate-500"
              )}
            >
              <CreditCard className="h-4 w-4" />
              Join Waitlist
            </button>
          </motion.div>
        </div>

        {/* Stripe placeholder comment */}
        {/*
          Stripe integration ready.
          Replace the Free plan card above with:

          {process.env.NEXT_PUBLIC_PAYMENTS_ENABLED === 'true' ? (
            <StripeCheckout />
          ) : (
            <FreePricing />
          )}

          Set NEXT_PUBLIC_PAYMENTS_ENABLED=true to activate.
        */}
      </div>
    </section>
  );
}

/* ==================== Inline Feature ==================== */

function Feature({
  label,
  free,
  premium,
  delay,
}: FeatureRowProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.25, delay }}
      className="flex items-center gap-2.5 text-sm"
    >
      <span className="flex-shrink-0">
        {free ? (
          <Check className="h-4 w-4 text-teal-500" />
        ) : (
          <span className="block h-4 w-4" />
        )}
      </span>
      <span
        className={cn(
          "flex-shrink-0",
          premium ? "text-slate-400" : "text-slate-600 line-through"
        )}
      >
        {label}
      </span>
    </motion.div>
  );
}
