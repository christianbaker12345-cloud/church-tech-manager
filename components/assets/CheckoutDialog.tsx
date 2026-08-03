"use client";

import { Button } from "@/components/ui/button";

type CheckoutDialogProps = {
  open: boolean;
  displayName: string;
  checkedOutBy: string;
  department: string;
  purpose: string;
  dueDate: string;
  notes: string;
  checkingOut: boolean;
  onCheckedOutByChange: (value: string) => void;
  onDepartmentChange: (value: string) => void;
  onPurposeChange: (value: string) => void;
  onDueDateChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
};

export default function CheckoutDialog({
  open,
  displayName,
  checkedOutBy,
  department,
  purpose,
  dueDate,
  notes,
  checkingOut,
  onCheckedOutByChange,
  onDepartmentChange,
  onPurposeChange,
  onDueDateChange,
  onNotesChange,
  onCancel,
  onSubmit,
}: CheckoutDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="mt-8 rounded-xl border bg-gray-50 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">
            Transfer Equipment
          </h2>

          <p className="mt-1 text-gray-500">
            {displayName}
          </p>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-gray-500 hover:text-gray-900"
        >
          Cancel
        </button>
      </div>

      <div className="mt-6 space-y-5">
        <div>
          <label className="mb-2 block font-medium">
            Person or Group
          </label>

          <input
            type="text"
            value={checkedOutBy}
            onChange={(event) =>
              onCheckedOutByChange(event.target.value)
            }
            className="w-full rounded-lg border bg-white p-3"
            placeholder="Who is receiving this equipment?"
          />
        </div>

        <div>
          <label className="mb-2 block font-medium">
            Department
          </label>

          <input
            type="text"
            value={department}
            onChange={(event) =>
              onDepartmentChange(event.target.value)
            }
            className="w-full rounded-lg border bg-white p-3"
            placeholder="Production, Music, IT..."
          />
        </div>

        <div>
          <label className="mb-2 block font-medium">
            Purpose
          </label>

          <input
            type="text"
            value={purpose}
            onChange={(event) =>
              onPurposeChange(event.target.value)
            }
            className="w-full rounded-lg border bg-white p-3"
            placeholder="Youth event, conference, off-site service..."
          />
        </div>

        <div>
          <label className="mb-2 block font-medium">
            Due Date
          </label>

          <input
            type="date"
            value={dueDate}
            onChange={(event) =>
              onDueDateChange(event.target.value)
            }
            className="w-full rounded-lg border bg-white p-3"
          />
        </div>

        <div>
          <label className="mb-2 block font-medium">
            Notes
          </label>

          <textarea
            value={notes}
            onChange={(event) =>
              onNotesChange(event.target.value)
            }
            rows={3}
            className="w-full rounded-lg border bg-white p-3"
            placeholder="Optional transfer details..."
          />
        </div>

        <Button
          type="button"
          onClick={onSubmit}
          disabled={checkingOut}
        >
          {checkingOut
            ? "Transferring..."
            : "Complete Transfer"}
        </Button>
      </div>
    </div>
  );
}