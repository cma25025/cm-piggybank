"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useRef, useEffect, useState } from "react";
import { cn, formatCents } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addSubAction, archiveSubAction, type AddSubState, type ArchiveState } from "./actions";

interface Sub {
  id: string;
  displayName: string;
  emoji: string;
  balanceCents: number;
  targetAmountCents: number | null;
  archivedAt: string | null;
}

interface Props {
  bucketId: string;
  bucketKind: "spend" | "save" | "share";
  subs: Sub[];
}

const INITIAL_ADD: AddSubState = {};
const INITIAL_ARCHIVE: ArchiveState = {};

export function SubManagement({ bucketId, bucketKind, subs }: Props) {
  const active = subs.filter((s) => !s.archivedAt);
  const archived = subs.filter((s) => s.archivedAt);

  return (
    <section className="space-y-4">
      <h2 className="font-display text-lg font-bold">Subcategories</h2>

      {active.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line p-6 text-center text-sm text-ink-muted">
          No subcategories yet. Add one below.
        </div>
      ) : (
        <ul className="rounded-2xl bg-card border border-line-soft divide-y divide-line-soft">
          {active.map((s) => (
            <SubRow key={s.id} sub={s} bucketKind={bucketKind} />
          ))}
        </ul>
      )}

      <AddSubForm bucketId={bucketId} bucketKind={bucketKind} />

      {archived.length > 0 ? (
        <details className="text-sm">
          <summary className="cursor-pointer text-ink-muted hover:text-ink">
            Archived ({archived.length})
          </summary>
          <ul className="mt-2 rounded-2xl bg-line-soft/40 border border-line-soft divide-y divide-line-soft">
            {archived.map((s) => (
              <li key={s.id} className="flex items-center gap-3 p-3 opacity-60">
                <span className="text-xl">{s.emoji}</span>
                <span className="flex-1 line-through">{s.displayName}</span>
                <span className="tnum text-xs">{formatCents(s.balanceCents)}</span>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  );
}

function SubRow({ sub, bucketKind }: { sub: Sub; bucketKind: "spend" | "save" | "share" }) {
  const [state, formAction] = useFormState(archiveSubAction, INITIAL_ARCHIVE);
  const pct = sub.targetAmountCents
    ? Math.min(100, Math.round((sub.balanceCents / sub.targetAmountCents) * 100))
    : null;

  return (
    <li className="p-4 flex items-center gap-3">
      <div className="text-2xl shrink-0">{sub.emoji}</div>
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{sub.displayName}</div>
        {pct !== null ? (
          <div className="mt-1 h-1.5 bg-line-soft rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full",
                bucketKind === "save"
                  ? "bg-save"
                  : bucketKind === "share"
                    ? "bg-share"
                    : "bg-spend",
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
        ) : null}
        {sub.targetAmountCents ? (
          <div className="text-xs text-ink-muted mt-1 tnum">
            {formatCents(sub.balanceCents)} of {formatCents(sub.targetAmountCents)}
          </div>
        ) : null}
        {state.error ? (
          <div className="text-xs text-destructive mt-1">{state.error}</div>
        ) : null}
      </div>
      <div className="font-display font-bold tnum shrink-0">
        {formatCents(sub.balanceCents)}
      </div>
      <form action={formAction}>
        <input type="hidden" name="sub_id" value={sub.id} />
        <input type="hidden" name="bucket_kind" value={bucketKind} />
        <ArchiveButton />
      </form>
    </li>
  );
}

function ArchiveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="ghost" size="sm" disabled={pending} className="text-ink-muted">
      {pending ? "..." : "Archive"}
    </Button>
  );
}

function AddSubForm({ bucketId, bucketKind }: { bucketId: string; bucketKind: "spend" | "save" | "share" }) {
  const [state, formAction] = useFormState(addSubAction, INITIAL_ADD);
  const formRef = useRef<HTMLFormElement>(null);
  const [emoji, setEmoji] = useState("🪙");

  useEffect(() => {
    if (!state.error && !state.fieldErrors) {
      formRef.current?.reset();
      setEmoji("🪙");
    }
  }, [state]);

  return (
    <form action={formAction} ref={formRef} className="rounded-2xl border-2 border-dashed border-line p-4 space-y-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
        Add a subcategory
      </div>
      <input type="hidden" name="bucket_id" value={bucketId} />
      <input type="hidden" name="bucket_kind" value={bucketKind} />
      <input type="hidden" name="emoji" value={emoji} />
      <div className="flex gap-2">
        <select
          value={emoji}
          onChange={(e) => setEmoji(e.target.value)}
          className="rounded-md border border-input bg-background px-2 text-2xl w-16"
          aria-label="Emoji"
        >
          {["🪙","🍦","🧸","👕","🎮","📚","🏖️","🧱","❤️","🎁","🐶","🌳"].map((e) => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>
        <div className="flex-1 space-y-1">
          <Label htmlFor="display_name" className="sr-only">Name</Label>
          <Input
            id="display_name"
            name="display_name"
            placeholder={bucketKind === "save" ? "Lego Friends set" : "Treats & snacks"}
            required
            maxLength={60}
          />
        </div>
        <SubmitAddButton />
      </div>
      {state.fieldErrors?.display_name ? (
        <p className="text-xs text-destructive">{state.fieldErrors.display_name}</p>
      ) : null}
      {state.error ? (
        <p className="text-xs text-destructive">{state.error}</p>
      ) : null}
    </form>
  );
}

function SubmitAddButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} size="sm">
      {pending ? "..." : "Add"}
    </Button>
  );
}
