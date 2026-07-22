"use client";

import { useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import Link from "next/link";
import {
  Stethoscope,
  Heart,
  Activity,
  Clock,
  BookOpen,
  Award,
  ClipboardCheck,
  BookOpenCheck,
  GraduationCap,
  Target,
  Ambulance,
  Smile,
  Brain,
  Apple,
  ChevronDown,
  ArrowRight,
  Sparkles,
  Zap,
  Shield,
  Star,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Shared animation variants                                          */
/* ------------------------------------------------------------------ */
const fadeUpVariant: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

/* ---------- Abstract Medical SVG Illustration (Hero) ---------- */
function MedicalIllustration() {
  return (
    <svg
      viewBox="0 0 400 320"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-full w-full max-w-md"
    >
      {/* Outer glow ring */}
      <circle
        cx="200" cy="160" r="140"
        stroke="#14B8A6" strokeOpacity="0.08" strokeWidth="1.5"
        fill="none"
      />
      <circle
        cx="200" cy="160" r="100"
        stroke="#14B8A6" strokeOpacity="0.12" strokeWidth="1"
        fill="none"
      />

      {/* Medical cross */}
      <rect x="188" y="110" width="24" height="100" rx="6" fill="#14B8A6" fillOpacity="0.18" />
      <rect x="150" y="148" width="100" height="24" rx="6" fill="#14B8A6" fillOpacity="0.18" />

      {/* Heart rate line */}
      <path
        d="M60 200 L90 200 L100 180 L115 220 L130 160 L145 200 L340 200"
        stroke="#14B8A6" strokeOpacity="0.35" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round"
        fill="none"
      />

      {/* Connected nodes */}
      <circle cx="200" cy="70" r="5" fill="#14B8A6" fillOpacity="0.6" />
      <circle cx="130" cy="90" r="4" fill="#14B8A6" fillOpacity="0.4" />
      <circle cx="270" cy="90" r="4" fill="#14B8A6" fillOpacity="0.4" />
      <circle cx="100" cy="160" r="5" fill="#14B8A6" fillOpacity="0.5" />
      <circle cx="300" cy="160" r="5" fill="#14B8A6" fillOpacity="0.5" />

      {/* Connection lines */}
      <line x1="200" y1="70" x2="130" y2="90" stroke="#14B8A6" strokeOpacity="0.1" strokeWidth="1" />
      <line x1="200" y1="70" x2="270" y2="90" stroke="#14B8A6" strokeOpacity="0.1" strokeWidth="1" />
      <line x1="130" y1="90" x2="100" y2="160" stroke="#14B8A6" strokeOpacity="0.08" strokeWidth="1" />
      <line x1="270" y1="90" x2="300" y2="160" stroke="#14B8A6" strokeOpacity="0.08" strokeWidth="1" />

      {/* DNA-like helix */}
      {Array.from({ length: 6 }).map((_, i) => (
        <ellipse
          key={i}
          cx={200 + Math.sin(i * 0.7) * 55}
          cy={210 + i * 18}
          rx="8"
          ry="3"
          transform={`rotate(${i * 15}, ${200 + Math.sin(i * 0.7) * 55}, ${210 + i * 18})`}
          stroke="#14B8A6"
          strokeOpacity="0.12"
          strokeWidth="1"
          fill="none"
        />
      ))}

      {/* Pulse dots on the heart-rate line */}
      <circle cx="200" cy="160" r="3" fill="#14B8A6" fillOpacity="0.7">
        <animate attributeName="r" values="3;6;3" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.7;0.2;0.7" dur="2s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

/* ---------- Section Wrapper ---------- */
function Section({
  id,
  children,
  className = "",
}: {
  id?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`relative px-4 py-16 sm:px-6 md:py-24 lg:px-8 ${className}`}>
      <div className="mx-auto max-w-6xl">{children}</div>
    </section>
  );
}

/* ---------- FAQ Item ---------- */
function FaqItem({
  question,
  answer,
  isOpen,
  onToggle,
  index,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className="glass-card overflow-hidden"
    >
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between px-6 py-5 text-left"
      >
        <span className="pr-4 font-medium text-slate-100">{question}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.25 }}
          className="shrink-0 text-teal-400"
        >
          <ChevronDown className="h-5 w-5" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="px-6 pb-5 text-sm text-slate-400">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ---------- Fixed Mobile CTA Bar ---------- */
function MobileCtaBar() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-charcoal-700/60 bg-charcoal-900/95 px-4 py-3 backdrop-blur-md sm:hidden">
      <Link
        href="/signup"
        className="btn-primary w-full"
      >
        Comenzar Gratis
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

/* ================================================================== */
/*  PAGE                                                               */
/* ================================================================== */
export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: "¿Es realmente gratis?",
      a: "Sí, actualmente todo el contenido es gratuito. Accede a lecciones estructuradas, vocabulario médico, práctica de listening y ejercicios de gramática sin costo alguno.",
    },
    {
      q: "¿Cuánto tiempo toma llegar a C1?",
      a: "Depende de tu constancia. Con 120 min/día, tu meta ideal, puedes alcanzar C1 aproximadamente en 6-8 meses. Esto no es un pasatiempo, es tu convicción y superación profesional.",
    },
    {
      q: "¿Necesito conocimientos previos?",
      a: "No, empezamos desde A0 con instrucciones en español. Nuestro programa está diseñado para acompañarte desde lo más básico hasta el dominio avanzado del inglés médico.",
    },
    {
      q: "¿Los certificados son oficiales?",
      a: "Te preparamos para los exámenes oficiales IELTS Academic, TOEFL iBT y PTE Academic. Nuestro curso incluye simulacros, estrategias y práctica con band scores reales para que llegues con confianza el día del examen.",
    },
  ];

  const professions = [
    { icon: Heart, label: "Enfermeras" },
    { icon: Stethoscope, label: "Doctores" },
    { icon: Activity, label: "Fisioterapeutas" },
    { icon: Ambulance, label: "Paramédicos" },
    { icon: Smile, label: "Odontólogos" },
    { icon: Brain, label: "Psicólogos" },
    { icon: Apple, label: "Nutriólogos" },
  ];

  const testimonials = [
    {
      name: "Maria G.",
      role: "Enfermera, México",
      initial: "MG",
      text: "Pasé de A2 a B2 en 4 meses. Trabajo en Canadá. La metodología y el vocabulario médico real marcaron la diferencia.",
    },
    {
      name: "Carlos L.",
      role: "Enfermero, Colombia",
      initial: "CL",
      text: "El vocabulario médico real me preparó para el día a día en el hospital. Ahora entiendo los handovers sin problema.",
    },
    {
      name: "Juan D.",
      role: "Fisioterapeuta, Filipinas",
      initial: "JD",
      text: "Finalmente entendí el patient handover gracias al ISBAR. La estructura del curso es impecable y práctica.",
    },
  ];

  return (
    <div className="min-h-screen bg-charcoal-900 text-slate-100">
      {/* ============================================================ */}
      {/*  HERO                                                        */}
      {/* ============================================================ */}
      <Section className="pb-0 pt-16 sm:pt-24 md:pt-32">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Text */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.div variants={fadeUpVariant}>
              <span className="badge-teal mb-4">
                <Sparkles className="mr-1 h-3 w-3" />
                Formación profesional para personal de salud
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUpVariant}
              className="mt-4 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl"
            >
              From Care to{" "}
              <span className="text-teal-500">Global Career</span>
            </motion.h1>

            <motion.h2
              variants={fadeUpVariant}
              className="section-subtitle mt-4 text-base sm:text-lg"
            >
              Master English for Healthcare Professionals
            </motion.h2>

            <motion.p
              variants={fadeUpVariant}
              className="mt-4 max-w-lg text-base leading-relaxed text-slate-400 sm:text-lg"
            >
              Programa estructurado de Cero a C1. Preparación integral para
              IELTS Academic, TOEFL iBT y PTE Academic.
            </motion.p>

            <motion.p
              variants={fadeUpVariant}
              className="mt-3 text-sm font-semibold text-teal-400"
            >
              Tu meta ideal: 120 min/día. Esto no es un pasatiempo, es tu
              convicción y superación profesional.
            </motion.p>

            <motion.div
              variants={fadeUpVariant}
              className="mt-8 flex flex-col gap-3 sm:flex-row"
            >
              <Link href="/signup" className="btn-primary text-base sm:text-lg">
                <Sparkles className="h-5 w-5" />
                Comenzar Gratis
              </Link>
              <Link href="#plan" className="btn-secondary text-base">
                <BookOpen className="h-5 w-5" />
                Ver plan de estudios
              </Link>
            </motion.div>
          </motion.div>

          {/* Illustration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex items-center justify-center lg:justify-end"
          >
            <MedicalIllustration />
          </motion.div>
        </div>
      </Section>

      {/* ============================================================ */}
      {/*  BENEFITS                                                    */}
      {/* ============================================================ */}
      <Section id="benefits">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={staggerContainer}
          className="text-center"
        >
          <motion.h2 variants={fadeUpVariant} className="section-title">
            ¿Por qué elegir este programa?
          </motion.h2>
          <motion.p variants={fadeUpVariant} className="section-subtitle">
            Diseñado por y para profesionales de la salud que buscan
            resultados reales.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={staggerContainer}
          className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {/* Card 1 */}
          <motion.div variants={fadeUpVariant} className="glass-card-hover p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/10">
              <Clock className="h-6 w-6 text-teal-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">
              120 min/día, tu meta ideal
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              Esto no es un pasatiempo, es tu convicción profesional.
              Estructura diaria optimizada para profesionales de la salud
              con horarios exigentes.
            </p>
          </motion.div>

          {/* Card 2 */}
          <motion.div variants={fadeUpVariant} className="glass-card-hover p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/10">
              <BookOpen className="h-6 w-6 text-teal-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">
              Vocabulario médico real
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              ISBAR, SOAP, toma de signos vitales, handover. Aprende el
              lenguaje que realmente se usa en hospitales y clínicas.
            </p>
          </motion.div>

          {/* Card 3 */}
          <motion.div variants={fadeUpVariant} className="glass-card-hover p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/10">
              <Award className="h-6 w-6 text-teal-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">
              Band scores reales
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              Preparación para certificaciones internacionales con band
              scores reales. Simulacros de IELTS, TOEFL y PTE calibrados al
              nivel del examen oficial.
            </p>
          </motion.div>
        </motion.div>
      </Section>

      {/* ============================================================ */}
      {/*  HOW IT WORKS                                                */}
      {/* ============================================================ */}
      <Section id="plan">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={staggerContainer}
          className="text-center"
        >
          <motion.h2 variants={fadeUpVariant} className="section-title">
            ¿Cómo funciona?
          </motion.h2>
          <motion.p variants={fadeUpVariant} className="section-subtitle">
            Cuatro pasos hacia tu carrera internacional en salud.
          </motion.p>
        </motion.div>

        <div className="relative mt-16">
          {/* Connecting line (hidden on mobile) */}
          <div className="absolute left-6 top-8 hidden h-0.5 w-[calc(100%-48px)] bg-gradient-to-r from-teal-500/40 via-teal-500/20 to-teal-500/5 md:block" />

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={staggerContainer}
            className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4"
          >
            {[
              {
                icon: ClipboardCheck,
                step: "Paso 1",
                title: "Placement Test",
                desc: "Posicionamiento CEFR para conocer tu nivel real y trazar tu ruta personalizada desde el día uno.",
              },
              {
                icon: BookOpenCheck,
                step: "Paso 2",
                title: "Estudia A0 a C1",
                desc: "Rutas por nivel con lecciones estructuradas, ejercicios interactivos y vocabulario médico progresivo.",
              },
              {
                icon: GraduationCap,
                step: "Paso 3",
                title: "Elige tu examen",
                desc: "IELTS Academic, TOEFL iBT o PTE Academic. Decide según tu destino profesional y requisitos.",
              },
              {
                icon: Target,
                step: "Paso 4",
                title: "Prep. específica",
                desc: "Preparación intensiva con práctica diaria, simulacros y estrategias de examen comprobadas.",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                variants={fadeUpVariant}
                className="relative flex flex-col items-center text-center"
              >
                {/* Step number circle */}
                <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full bg-teal-500 shadow-lg shadow-teal-500/20">
                  <item.icon className="h-6 w-6 text-white" />
                </div>
                <span className="mt-4 text-xs font-semibold uppercase tracking-wider text-teal-400">
                  {item.step}
                </span>
                <h3 className="mt-1 font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </Section>

      {/* ============================================================ */}
      {/*  WHO IS IT FOR                                               */}
      {/* ============================================================ */}
      <Section id="who">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={staggerContainer}
          className="text-center"
        >
          <motion.h2 variants={fadeUpVariant} className="section-title">
            ¿Para quién es?
          </motion.h2>
          <motion.p variants={fadeUpVariant} className="section-subtitle">
            Diseñado para todos los profesionales de la salud que buscan
            ejercer en el extranjero.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={staggerContainer}
          className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7"
        >
          {professions.map((p, _i) => (
            <motion.div
              key={p.label}
              variants={fadeUpVariant}
              className="glass-card-hover flex flex-col items-center gap-3 p-5"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-500/10">
                <p.icon className="h-5 w-5 text-teal-400" />
              </div>
              <span className="text-xs font-medium text-slate-300">
                {p.label}
              </span>
            </motion.div>
          ))}
        </motion.div>
      </Section>

      {/* ============================================================ */}
      {/*  PRICING                                                     */}
      {/* ============================================================ */}
      <Section id="pricing">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={staggerContainer}
          className="flex flex-col items-center text-center"
        >
          <motion.div variants={fadeUpVariant}>
            <span className="badge-success mb-4">
              <Zap className="mr-1 h-3 w-3" />
              Actualmente GRATIS
            </span>
          </motion.div>

          <motion.h2 variants={fadeUpVariant} className="section-title">
            Inversión en tu futuro profesional
          </motion.h2>

          <motion.div
            variants={fadeUpVariant}
            className="mt-10 w-full max-w-md"
          >
            <div className="glass-card relative overflow-hidden p-8">
              {/* Glow effect */}
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-teal-500 blur-3xl" />

              <span className="relative z-10 text-sm font-medium uppercase tracking-widest text-teal-400">
                Plan Gratuito
              </span>
              <div className="relative z-10 mt-4">
                <span className="text-5xl font-extrabold text-white">$0</span>
                <span className="text-slate-400">/mes</span>
              </div>

              <ul className="relative z-10 mt-6 space-y-3 text-left text-sm">
                {[
                  "Acceso completo a lecciones A0-C1",
                  "Vocabulario médico ISBAR, SOAP",
                  "Ejercicios interactivos ilimitados",
                  "Placement test CEFR",
                  "Simulacros IELTS, TOEFL, PTE",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <Shield className="mt-0.5 h-4 w-4 shrink-0 text-teal-400" />
                    <span className="text-slate-300">{item}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/signup"
                className="btn-primary relative z-10 mt-8 w-full"
              >
                <Sparkles className="h-5 w-5" />
                Comenzar Gratis
              </Link>
            </div>
          </motion.div>

          <motion.div
            variants={fadeUpVariant}
            className="glass-card mt-8 max-w-lg p-6 text-center"
          >
            <p className="text-sm leading-relaxed text-slate-400">
              <span className="font-semibold text-teal-400">Próximamente:</span>{" "}
              Plan Premium con evaluación de speaking IA, simulacros de
              examen cronometrados y sesiones 1:1 con case managers.
              Integración con Stripe próximamente.
            </p>
          </motion.div>
        </motion.div>
      </Section>

      {/* ============================================================ */}
      {/*  TESTIMONIALS                                                */}
      {/* ============================================================ */}
      <Section id="testimonials">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={staggerContainer}
          className="text-center"
        >
          <motion.h2 variants={fadeUpVariant} className="section-title">
            Ellos ya lo lograron
          </motion.h2>
          <motion.p variants={fadeUpVariant} className="section-subtitle">
            Profesionales de la salud que transformaron su carrera con
            nuestro programa.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={staggerContainer}
          className="mt-12 grid gap-6 md:grid-cols-3"
        >
          {testimonials.map((t, _i) => (
            <motion.div
              key={t.name}
              variants={fadeUpVariant}
              className="glass-card-hover flex flex-col p-6"
            >
              {/* Stars */}
              <div className="mb-4 flex gap-0.5">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star
                    key={j}
                    className="h-4 w-4 fill-teal-500 text-teal-500"
                  />
                ))}
              </div>

              <p className="flex-1 text-sm leading-relaxed text-slate-300">
                &ldquo;{t.text}&rdquo;
              </p>

              <div className="mt-5 flex items-center gap-3 border-t border-charcoal-700/50 pt-4">
                {/* Avatar placeholder */}
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-500/20 text-xs font-bold text-teal-400">
                  {t.initial}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{t.name}</p>
                  <p className="text-xs text-slate-500">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </Section>

      {/* ============================================================ */}
      {/*  FAQ                                                         */}
      {/* ============================================================ */}
      <Section id="faq">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={staggerContainer}
          className="text-center"
        >
          <motion.h2 variants={fadeUpVariant} className="section-title">
            Preguntas frecuentes
          </motion.h2>
          <motion.p variants={fadeUpVariant} className="section-subtitle">
            Todo lo que necesitas saber antes de empezar.
          </motion.p>
        </motion.div>

        <div className="mx-auto mt-12 max-w-2xl space-y-3">
          {faqs.map((faq, i) => (
            <FaqItem
              key={i}
              index={i}
              question={faq.q}
              answer={faq.a}
              isOpen={openFaq === i}
              onToggle={() => setOpenFaq(openFaq === i ? null : i)}
            />
          ))}
        </div>
      </Section>

      {/* ============================================================ */}
      {/*  FOOTER                                                      */}
      {/* ============================================================ */}
      <footer className="border-t border-charcoal-700/50 bg-charcoal-950 px-4 pt-16 pb-24 sm:pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {/* Brand */}
            <div className="sm:col-span-2 lg:col-span-1">
              <Link href="/" className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/20">
                  <Stethoscope className="h-4 w-4 text-teal-400" />
                </div>
                <span className="text-sm font-bold tracking-tight text-white">
                  English for Healthcare
                  <br />
                  Professionals
                </span>
              </Link>
              <p className="mt-4 max-w-xs text-xs leading-relaxed text-slate-500">
                Tu meta ideal: 120 min/día. Esto no es un pasatiempo, es tu
                convicción y superación profesional.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Navegación
              </h4>
              <ul className="mt-4 space-y-2">
                {[
                  { label: "Inicio", href: "/" },
                  { label: "Plan de estudios", href: "#plan" },
                  { label: "Precios", href: "#pricing" },
                  { label: "FAQ", href: "#faq" },
                ].map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-500 transition-colors hover:text-teal-400"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Legal
              </h4>
              <ul className="mt-4 space-y-2">
                <li>
                  <Link
                    href="/privacy"
                    className="text-sm text-slate-500 transition-colors hover:text-teal-400"
                  >
                    Aviso de Privacidad
                  </Link>
                </li>
                <li>
                  <span className="text-sm text-slate-500">Términos y Condiciones</span>
                </li>
              </ul>
            </div>

            {/* CTA */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Empieza hoy
              </h4>
              <p className="mt-4 text-sm text-slate-500">
                De cero a una carrera global en salud.
              </p>
              <Link
                href="/signup"
                className="btn-primary mt-4 w-full sm:w-auto"
              >
                Comenzar Gratis
              </Link>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-12 border-t border-charcoal-700/30 pt-6 text-center">
            <p className="text-xs text-slate-600">
              &copy; {new Date().getFullYear()} English for Healthcare
              Professionals. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>

      {/* Mobile fixed CTA */}
      <MobileCtaBar />
    </div>
  );
}
