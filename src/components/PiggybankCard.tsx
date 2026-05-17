"use client";

import { addTransaction, deletePiggybank } from "@/app/dashboard/actions";
import { useState, useRef } from "react";

interface PiggybankCardProps {
  bank: {
    id: string;
    name: string;
    description: string;
    goal_amount: number;
    current_amount: number;
  };
}

export default function PiggybankCard({ bank }: PiggybankCardProps) {
  const [showTransaction, setShowTransaction] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const progress = bank.goal_amount > 0 ? Math.min((bank.current_amount / bank.goal_amount) * 100, 100) : 0;

  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h2 className="font-semibold text-lg">{bank.name}</h2>
          {bank.description && (
            <p className="text-gray-500 text-sm">{bank.description}</p>
          )}
        </div>
        <form action={deletePiggybank}>
          <input type="hidden" name="id" value={bank.id} />
          <button
            type="submit"
            className="text-gray-400 hover:text-red-500 text-sm"
            title="Delete"
          >
            ✕
          </button>
        </form>
      </div>

      <div className="mt-2 mb-3">
        <span className="text-2xl font-bold text-green-600">
          ${(bank.current_amount / 100).toFixed(2)}
        </span>
        <span className="text-gray-400">
          {" "}/ ${(bank.goal_amount / 100).toFixed(2)}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
        <div
          className="bg-green-500 h-2 rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      {!showTransaction ? (
        <div className="flex gap-2">
          <button
            onClick={() => setShowTransaction(true)}
            className="text-sm bg-green-50 text-green-700 px-3 py-1 rounded hover:bg-green-100 transition"
          >
            + Deposit
          </button>
          <button
            onClick={() => setShowTransaction(true)}
            className="text-sm bg-red-50 text-red-700 px-3 py-1 rounded hover:bg-red-100 transition"
          >
            - Withdraw
          </button>
        </div>
      ) : (
        <form
          ref={formRef}
          action={async (formData) => {
            await addTransaction(formData);
            formRef.current?.reset();
            setShowTransaction(false);
          }}
          className="space-y-2 pt-2 border-t"
        >
          <input type="hidden" name="piggybank_id" value={bank.id} />
          <div className="flex gap-2">
            <input
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="Amount ($)"
              required
              className="flex-1 border rounded px-3 py-1.5 text-sm"
            />
            <select name="type" className="border rounded px-2 py-1.5 text-sm">
              <option value="deposit">Deposit</option>
              <option value="withdraw">Withdraw</option>
            </select>
          </div>
          <input
            name="note"
            placeholder="Note (optional)"
            className="w-full border rounded px-3 py-1.5 text-sm"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700 transition"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setShowTransaction(false)}
              className="text-gray-500 px-3 py-1.5 rounded text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
