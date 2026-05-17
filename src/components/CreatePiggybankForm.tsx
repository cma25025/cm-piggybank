"use client";

import { createPiggybank } from "@/app/dashboard/actions";
import { useRef, useState } from "react";

export default function CreatePiggybankForm() {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-gray-500 hover:border-blue-400 hover:text-blue-500 transition w-full text-center"
      >
        + New Piggybank
      </button>
    );
  }

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await createPiggybank(formData);
        formRef.current?.reset();
        setOpen(false);
      }}
      className="border rounded-lg p-4 bg-white shadow-sm space-y-3"
    >
      <h3 className="font-semibold">Create a Piggybank</h3>
      <input
        name="name"
        placeholder="Name (e.g., Vacation Fund)"
        required
        className="w-full border rounded px-3 py-2 text-sm"
      />
      <input
        name="description"
        placeholder="Description (optional)"
        className="w-full border rounded px-3 py-2 text-sm"
      />
      <input
        name="goal"
        type="number"
        step="0.01"
        min="0.01"
        placeholder="Goal amount ($)"
        required
        className="w-full border rounded px-3 py-2 text-sm"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition"
        >
          Create
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-gray-500 px-4 py-2 rounded text-sm hover:text-gray-700"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
