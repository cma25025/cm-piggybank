import Link from "next/link";

const STEPS = [
  { n: 1, label: "Kid" },
  { n: 2, label: "Split" },
  { n: 3, label: "Funders" },
  { n: 4, label: "Start" },
] as const;

interface StepShellProps {
  step: 1 | 2 | 3 | 4;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function StepShell({ step, title, subtitle, children }: StepShellProps) {
  return (
    <main className="min-h-screen bg-background p-4 sm:p-8">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="text-3xl" aria-hidden>
            🐷
          </div>
          <span className="font-display text-xl text-brand-deep">Piggybank</span>
        </Link>

        <ol className="flex items-center justify-between mb-8 text-sm">
          {STEPS.map((s, i) => {
            const done = s.n < step;
            const current = s.n === step;
            return (
              <li key={s.n} className="flex items-center gap-2 flex-1 last:flex-none">
                <div
                  className={
                    "w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold " +
                    (done
                      ? "bg-brand text-white"
                      : current
                        ? "bg-brand-soft text-brand-deep border-2 border-brand"
                        : "bg-line-soft text-ink-muted")
                  }
                  aria-current={current ? "step" : undefined}
                >
                  {done ? "✓" : s.n}
                </div>
                <span
                  className={
                    "hidden sm:inline " +
                    (current ? "font-medium text-ink" : "text-ink-muted")
                  }
                >
                  {s.label}
                </span>
                {i < STEPS.length - 1 ? (
                  <div className="flex-1 h-px bg-line-soft mx-2" aria-hidden />
                ) : null}
              </li>
            );
          })}
        </ol>

        <div className="bg-card rounded-2xl border border-line-soft p-6 sm:p-8 shadow-sm">
          <h1 className="font-display text-2xl text-ink mb-1">{title}</h1>
          {subtitle ? <p className="text-sm text-ink-muted mb-6">{subtitle}</p> : <div className="mb-4" />}
          {children}
        </div>
      </div>
    </main>
  );
}
