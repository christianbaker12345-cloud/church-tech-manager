import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  maintenancePriorityOptions,
  maintenanceStatusOptions,
  type MaintenancePriority,
  type MaintenanceStatus,
} from "./types";

type MaintenanceFormProps = {
  isEditing: boolean;
  saving: boolean;
  issueTitle: string;
  description: string;
  status: MaintenanceStatus;
  priority: MaintenancePriority;
  technician: string;
  repairCost: string;
  openedDate: string;
  completedDate: string;
  nextServiceDate: string;
  resolutionNotes: string;
  onIssueTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onStatusChange: (value: MaintenanceStatus) => void;
  onPriorityChange: (value: MaintenancePriority) => void;
  onTechnicianChange: (value: string) => void;
  onRepairCostChange: (value: string) => void;
  onOpenedDateChange: (value: string) => void;
  onCompletedDateChange: (value: string) => void;
  onNextServiceDateChange: (value: string) => void;
  onResolutionNotesChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
};

export default function MaintenanceForm({
  isEditing,
  saving,
  issueTitle,
  description,
  status,
  priority,
  technician,
  repairCost,
  openedDate,
  completedDate,
  nextServiceDate,
  resolutionNotes,
  onIssueTitleChange,
  onDescriptionChange,
  onStatusChange,
  onPriorityChange,
  onTechnicianChange,
  onRepairCostChange,
  onOpenedDateChange,
  onCompletedDateChange,
  onNextServiceDateChange,
  onResolutionNotesChange,
  onSubmit,
  onCancel,
}: MaintenanceFormProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="mt-8 rounded-2xl bg-white p-8 shadow"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">
          {isEditing
            ? "Edit Maintenance Record"
            : "New Maintenance Record"}
        </h2>

        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-gray-500 hover:text-gray-900"
        >
          Cancel
        </button>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="mb-2 block font-medium">
            Issue Title
          </label>
          <input
            type="text"
            value={issueTitle}
            onChange={(event) =>
              onIssueTitleChange(event.target.value)
            }
            className="w-full rounded-lg border p-3"
            placeholder="Intermittent audio signal"
            required
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block font-medium">
            Description
          </label>
          <textarea
            value={description}
            onChange={(event) =>
              onDescriptionChange(event.target.value)
            }
            rows={4}
            className="w-full rounded-lg border p-3"
            placeholder="Describe the issue and when it occurs."
          />
        </div>

        <div>
          <label className="mb-2 block font-medium">Status</label>
          <select
            value={status}
            onChange={(event) =>
              onStatusChange(event.target.value as MaintenanceStatus)
            }
            className="w-full rounded-lg border bg-white p-3"
          >
            {maintenanceStatusOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block font-medium">Priority</label>
          <select
            value={priority}
            onChange={(event) =>
              onPriorityChange(
                event.target.value as MaintenancePriority
              )
            }
            className="w-full rounded-lg border bg-white p-3"
          >
            {maintenancePriorityOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block font-medium">
            Technician
          </label>
          <input
            type="text"
            value={technician}
            onChange={(event) =>
              onTechnicianChange(event.target.value)
            }
            className="w-full rounded-lg border p-3"
            placeholder="Technician or service company"
          />
        </div>

        <div>
          <label className="mb-2 block font-medium">
            Repair Cost
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
              $
            </span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={repairCost}
              onChange={(event) =>
                onRepairCostChange(event.target.value)
              }
              className="w-full rounded-lg border py-3 pl-8 pr-3"
              placeholder="0.00"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block font-medium">
            Opened Date
          </label>
          <input
            type="date"
            value={openedDate}
            onChange={(event) =>
              onOpenedDateChange(event.target.value)
            }
            className="w-full rounded-lg border p-3"
            required
          />
        </div>

        <div>
          <label className="mb-2 block font-medium">
            Completed Date
          </label>
          <input
            type="date"
            value={completedDate}
            onChange={(event) =>
              onCompletedDateChange(event.target.value)
            }
            className="w-full rounded-lg border p-3"
          />
        </div>

        <div>
          <label className="mb-2 block font-medium">
            Next Service Date
          </label>
          <input
            type="date"
            value={nextServiceDate}
            onChange={(event) =>
              onNextServiceDateChange(event.target.value)
            }
            className="w-full rounded-lg border p-3"
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block font-medium">
            Resolution Notes
          </label>
          <textarea
            value={resolutionNotes}
            onChange={(event) =>
              onResolutionNotesChange(event.target.value)
            }
            rows={4}
            className="w-full rounded-lg border p-3"
            placeholder="What was repaired or replaced?"
          />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-4">
        <Button type="submit" disabled={saving}>
          {saving
            ? "Saving..."
            : isEditing
              ? "Save Changes"
              : "Create Record"}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}