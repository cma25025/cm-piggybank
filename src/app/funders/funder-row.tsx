"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCents, initial } from "@/lib/utils";
import {
  editFunderAction,
  archiveFunderAction,
  unarchiveFunderAction,
  type FunderActionState,
} from "./actions";

interface Props {
  funderId: string;
  displayName: string;
  relationship: string | null;
  totalContributedCents: number;
  depositCount: number;
  lastContributionAt: string | null;
  archived: boolean;
}

const INITIAL: FunderActionState = {};

export function FunderRow({
  funderId,
  displayName,
  relationship,
  totalContributedCents,
  depositCount,
  lastContributionAt,
  archived,
}: Props) {
  const [editOpen, setEditOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);

  const lastDate = lastContributionAt
    ? new Date(lastContributionAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "never";

  return (
    <>
      <li
        className={
          "rounded-2xl border border-line-soft bg-card p-4 flex items-center gap-4 " +
          (archived ? "opacity-60" : "")
        }
      >
        <div className="w-11 h-11 shrink-0 rounded-full bg-brand text-white flex items-center justify-center font-display text-lg">
          {initial(displayName)}
        </div>
        <Link
          href={archived ? "#" : `/funders/${funderId}`}
          className={
            "flex-1 min-w-0 " +
            (archived ? "pointer-events-none" : "hover:opacity-80 transition")
          }
        >
          <div className="font-medium truncate">
            {displayName}
            {archived ? (
              <span className="ml-2 text-[10px] uppercase tracking-wide bg-line-soft text-ink-muted px-1.5 py-0.5 rounded">
                Archived
              </span>
            ) : null}
          </div>
          {relationship ? (
            <div className="text-xs text-ink-muted truncate">{relationship}</div>
          ) : null}
        </Link>
        <div className="text-right shrink-0">
          <div className="font-display font-bold text-lg tnum">
            {formatCents(totalContributedCents)}
          </div>
          <div className="text-[11px] text-ink-muted tnum">
            {depositCount} {depositCount === 1 ? "deposit" : "deposits"} · last {lastDate}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="shrink-0"
              aria-label={`More actions for ${displayName}`}
            >
              <span aria-hidden>⋯</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {!archived ? (
              <>
                <DropdownMenuItem onSelect={() => setEditOpen(true)}>Edit</DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => setArchiveOpen(true)}
                  className="text-destructive focus:text-destructive"
                >
                  Archive
                </DropdownMenuItem>
              </>
            ) : (
              <UnarchiveItem funderId={funderId} />
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </li>

      <EditFunderDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        funderId={funderId}
        currentName={displayName}
        currentRelationship={relationship}
      />
      <ArchiveFunderDialog
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        funderId={funderId}
        displayName={displayName}
      />
    </>
  );
}

function EditSubmit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : "Save"}
    </Button>
  );
}

function EditFunderDialog({
  open,
  onOpenChange,
  funderId,
  currentName,
  currentRelationship,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  funderId: string;
  currentName: string;
  currentRelationship: string | null;
}) {
  const [state, formAction] = useFormState(editFunderAction, INITIAL);

  useEffect(() => {
    if (state.success) onOpenChange(false);
  }, [state.success, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit funder</DialogTitle>
          <DialogDescription>Rename or update the relationship label.</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="funder_id" value={funderId} />
          <div className="space-y-2">
            <Label htmlFor="edit-display-name">Name</Label>
            <Input
              id="edit-display-name"
              name="display_name"
              defaultValue={currentName}
              required
              maxLength={80}
            />
            {state.fieldErrors?.display_name ? (
              <p className="text-sm text-destructive">{state.fieldErrors.display_name}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-relationship">Relationship (optional)</Label>
            <Input
              id="edit-relationship"
              name="relationship"
              defaultValue={currentRelationship ?? ""}
              maxLength={40}
            />
          </div>
          {state.error ? (
            <p className="text-sm text-destructive bg-destructive/10 rounded-md p-3">
              {state.error}
            </p>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <EditSubmit />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ArchiveSubmit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="destructive" disabled={pending}>
      {pending ? "Archiving..." : "Archive"}
    </Button>
  );
}

function ArchiveFunderDialog({
  open,
  onOpenChange,
  funderId,
  displayName,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  funderId: string;
  displayName: string;
}) {
  const [state, formAction] = useFormState(archiveFunderAction, INITIAL);

  useEffect(() => {
    if (state.success) onOpenChange(false);
  }, [state.success, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Archive {displayName}?</DialogTitle>
          <DialogDescription>
            They'll disappear from the Add Money picker but stay attached to their past
            contributions. You can restore them later.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction}>
          <input type="hidden" name="funder_id" value={funderId} />
          {state.error ? (
            <p className="text-sm text-destructive bg-destructive/10 rounded-md p-3 mb-3">
              {state.error}
            </p>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Keep them
            </Button>
            <ArchiveSubmit />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function UnarchiveItem({ funderId }: { funderId: string }) {
  const [state, formAction] = useFormState(unarchiveFunderAction, INITIAL);
  return (
    <form action={formAction}>
      <input type="hidden" name="funder_id" value={funderId} />
      <button
        type="submit"
        className="w-full text-left px-2 py-1.5 text-sm hover:bg-accent rounded"
      >
        Restore
      </button>
      {state.error ? (
        <p className="text-xs text-destructive px-2 pb-1">{state.error}</p>
      ) : null}
    </form>
  );
}
