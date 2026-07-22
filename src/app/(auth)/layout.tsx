"use client"
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div suppressHydrationWarning className="relative flex min-h-screen flex-col items-center justify-center bg-[#121212] px-4">
      {/* Background gradient/pattern */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-teal-500/5 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-[300px] w-[300px] rounded-full bg-teal-500/5 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-[250px] w-[250px] rounded-full bg-teal-500/5 blur-3xl" />
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(20, 184, 166, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(20, 184, 166, 0.3) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Content wrapper */}
      <div className="relative z-10 flex w-full flex-col items-center">
        {/* Logo */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500 text-lg font-bold text-white">
              E
            </div>
            <span className="text-xl font-semibold text-slate-100">
              English for Healthcare
            </span>
          </div>
        </div>

        {/* Card */}
        <div className="w-full max-w-md">{children}</div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-slate-500">
          &copy; 2026 English for Healthcare Professionals
        </p>
      </div>
    </div>
  );
}
