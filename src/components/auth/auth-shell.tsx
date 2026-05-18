import Link from "next/link";

interface AuthShellProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

/** Centered card layout shared by signup / login / forgot / reset pages. */
export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="text-4xl" aria-hidden>
            🐷
          </div>
          <span className="font-display text-2xl text-brand-deep">Piggybank</span>
        </Link>
        <div className="bg-card rounded-2xl border border-line-soft p-8 shadow-sm">
          <h1 className="font-display text-2xl text-ink mb-1">{title}</h1>
          {subtitle ? <p className="text-sm text-ink-muted mb-6">{subtitle}</p> : <div className="mb-4" />}
          {children}
        </div>
        {footer ? <div className="mt-6 text-center text-sm text-ink-muted">{footer}</div> : null}
      </div>
    </main>
  );
}
