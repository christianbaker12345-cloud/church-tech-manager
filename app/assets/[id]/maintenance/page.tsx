"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

type Asset = {
  id: string;
  asset_tag: string | null;
  display_name: string | null;
  status: string | null;
};

type MaintenanceRecord = {
  id: string;
  asset_id: string;
  issue_title: string;
  description: string | null;
  status: string;
  priority: string;
  technician: string | null;
  repair_cost: number | null;
  opened_date: string;
  completed_date: string | null;
  next_service_date: string | null;
  resolution_notes: string | null;
  created_at: string;
  updated_at: string;
};

const statusOptions = ["Open", "In Progress", "Completed", "Cancelled"];

const priorityOptions = ["Low", "Normal", "High", "Urgent"];

export default function AssetMaintenancePage() {
  const params = useParams();

  const assetId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [asset, setAsset] = useState<Asset | null>(null);
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);

  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] =
    useState<MaintenanceRecord | null>(null);

  const [issueTitle, setIssueTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("Open");
  const [priority, setPriority] = useState("Normal");
  const [technician, setTechnician] = useState("");
  const [repairCost, setRepairCost] = useState("");
  const [openedDate, setOpenedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [completedDate, setCompletedDate] = useState("");
  const [nextServiceDate, setNextServiceDate] = useState("");
  const [resolutionNotes, setResolutionNotes] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (assetId) {
      loadPage();
    }
  }, [assetId]);

  async function loadPage() {
    if (!assetId) return;

    setLoading(true);
    setErrorMessage("");

    const assetResult = await supabase
      .from("assets")
      .select("id,asset_tag,display_name,status")
      .eq("id", assetId)
      .maybeSingle();

    if (assetResult.error) {
      console.error("Asset load error:", assetResult.error);
      setErrorMessage(assetResult.error.message);
      setAsset(null);
      setLoading(false);
      return;
    }

    if (!assetResult.data) {
      setErrorMessage("No asset was found with this ID.");
      setAsset(null);
      setLoading(false);
      return;
    }

    setAsset(assetResult.data as Asset);

    const maintenanceResult = await supabase
      .from("asset_maintenance")
      .select("*")
      .eq("asset_id", assetId)
      .order("created_at", { ascending: false });

    if (maintenanceResult.error) {
      console.error(
        "Maintenance load error:",
        maintenanceResult.error
      );
      setErrorMessage(maintenanceResult.error.message);
      setRecords([]);
    } else {
      setRecords(
        (maintenanceResult.data ?? []) as MaintenanceRecord[]
      );
    }

    setLoading(false);
  }

  function resetForm() {
    setEditingRecord(null);
    setIssueTitle("");
    setDescription("");
    setStatus("Open");
    setPriority("Normal");
    setTechnician("");
    setRepairCost("");
    setOpenedDate(new Date().toISOString().split("T")[0]);
    setCompletedDate("");
    setNextServiceDate("");
    setResolutionNotes("");
  }

  function openNewRecordForm() {
    resetForm();
    setShowForm(true);
  }

  function editRecord(record: MaintenanceRecord) {
    setEditingRecord(record);
    setIssueTitle(record.issue_title);
    setDescription(record.description ?? "");
    setStatus(record.status);
    setPriority(record.priority);
    setTechnician(record.technician ?? "");
    setRepairCost(
      record.repair_cost !== null
        ? String(record.repair_cost)
        : ""
    );
    setOpenedDate(record.opened_date);
    setCompletedDate(record.completed_date ?? "");
    setNextServiceDate(record.next_service_date ?? "");
    setResolutionNotes(record.resolution_notes ?? "");
    setShowForm(true);
  }

  function closeForm() {
    resetForm();
    setShowForm(false);
  }

  async function saveRecord(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!assetId) return;

    if (!issueTitle.trim()) {
      alert("Enter an issue title.");
      return;
    }

    const parsedRepairCost =
      repairCost.trim() === "" ? null : Number(repairCost);

    if (
      parsedRepairCost !== null &&
      (Number.isNaN(parsedRepairCost) || parsedRepairCost < 0)
    ) {
      alert("Enter a valid repair cost.");
      return;
    }

    setSaving(true);
    setErrorMessage("");

    const recordData = {
      asset_id: assetId,
      issue_title: issueTitle.trim(),
      description: description.trim() || null,
      status,
      priority,
      technician: technician.trim() || null,
      repair_cost: parsedRepairCost,
      opened_date: openedDate,
      completed_date:
        status === "Completed"
          ? completedDate ||
            new Date().toISOString().split("T")[0]
          : completedDate || null,
      next_service_date: nextServiceDate || null,
      resolution_notes: resolutionNotes.trim() || null,
      updated_at: new Date().toISOString(),
    };

    const result = editingRecord
      ? await supabase
          .from("asset_maintenance")
          .update(recordData)
          .eq("id", editingRecord.id)
      : await supabase
          .from("asset_maintenance")
          .insert(recordData);

    if (result.error) {
      console.error("Maintenance save error:", result.error);
      setErrorMessage(result.error.message);
      setSaving(false);
      return;
    }

    setSaving(false);
    closeForm();
    await loadPage();
  }

  async function deleteRecord(record: MaintenanceRecord) {
    const confirmed = window.confirm(
      `Delete the maintenance record "${record.issue_title}"?`
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("asset_maintenance")
      .delete()
      .eq("id", record.id);

    if (error) {
      console.error("Maintenance delete error:", error);
      alert(error.message);
      return;
    }

    await loadPage();
  }

  function formatDate(date: string | null) {
    if (!date) return "—";

    const parsedDate = new Date(`${date}T00:00:00`);

    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }

    return parsedDate.toLocaleDateString("en-US");
  }

  function formatCurrency(value: number | null) {
    if (value === null || value === undefined) {
      return "—";
    }

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  }

  function statusClasses(value: string) {
    const normalized = value.toLowerCase();

    if (normalized === "completed") {
      return "bg-green-100 text-green-700";
    }

    if (normalized === "in progress") {
      return "bg-yellow-100 text-yellow-700";
    }

    if (normalized === "cancelled") {
      return "bg-gray-100 text-gray-700";
    }

    return "bg-red-100 text-red-700";
  }

  function priorityClasses(value: string) {
    const normalized = value.toLowerCase();

    if (normalized === "urgent") {
      return "bg-red-100 text-red-700";
    }

    if (normalized === "high") {
      return "bg-orange-100 text-orange-700";
    }

    if (normalized === "low") {
      return "bg-blue-100 text-blue-700";
    }

    return "bg-gray-100 text-gray-700";
  }

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold">
          Loading maintenance records...
        </h1>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold">Asset Not Found</h1>

        {errorMessage && (
          <p className="mt-4 text-red-600">{errorMessage}</p>
        )}

        <Link
          href="/inventory"
          className="mt-6 inline-block text-blue-600 hover:underline"
        >
          ← Back to Inventory
        </Link>
      </div>
    );
  }

  const displayName =
    asset.display_name || asset.asset_tag || "Unnamed Asset";

  return (
    <div className="p-8">
      <Link
        href={`/assets/${asset.id}`}
        className="text-blue-600 hover:underline"
      >
        ← Back to Asset
      </Link>

      <div className="mt-6 flex flex-wrap items-start justify-between gap-6">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-gray-500">
            Asset Maintenance
          </p>

          <h1 className="mt-2 text-4xl font-bold">{displayName}</h1>

          <p className="mt-2 text-gray-500">
            Asset Tag: {asset.asset_tag || "Not assigned"}
          </p>
        </div>

        <Button onClick={openNewRecordForm}>
          Add Maintenance Record
        </Button>
      </div>

      {errorMessage && (
        <div className="mt-6 rounded-xl border border-red-300 bg-red-50 p-4 text-red-700">
          {errorMessage}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={saveRecord}
          className="mt-8 rounded-2xl bg-white p-8 shadow"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-2xl font-bold">
              {editingRecord
                ? "Edit Maintenance Record"
                : "New Maintenance Record"}
            </h2>

            <button
              type="button"
              onClick={closeForm}
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
                  setIssueTitle(event.target.value)
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
                  setDescription(event.target.value)
                }
                rows={4}
                className="w-full rounded-lg border p-3"
                placeholder="Describe the issue and when it occurs."
              />
            </div>

            <div>
              <label className="mb-2 block font-medium">
                Status
              </label>

              <select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value)
                }
                className="w-full rounded-lg border bg-white p-3"
              >
                {statusOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block font-medium">
                Priority
              </label>

              <select
                value={priority}
                onChange={(event) =>
                  setPriority(event.target.value)
                }
                className="w-full rounded-lg border bg-white p-3"
              >
                {priorityOptions.map((option) => (
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
                  setTechnician(event.target.value)
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
                    setRepairCost(event.target.value)
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
                  setOpenedDate(event.target.value)
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
                  setCompletedDate(event.target.value)
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
                  setNextServiceDate(event.target.value)
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
                  setResolutionNotes(event.target.value)
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
                : editingRecord
                  ? "Save Changes"
                  : "Create Record"}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={closeForm}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      <div className="mt-8 rounded-2xl bg-white p-8 shadow">
        <h2 className="text-2xl font-bold">Maintenance History</h2>

        <p className="mt-2 text-gray-500">
          Issues, repairs, service costs, and future maintenance.
        </p>

        {records.length === 0 ? (
          <div className="mt-8 rounded-xl border border-dashed p-10 text-center">
            <h3 className="text-xl font-semibold">
              No maintenance records
            </h3>

            <p className="mt-2 text-gray-500">
              Create the first record when this asset needs service.
            </p>
          </div>
        ) : (
          <div className="mt-8 space-y-5">
            {records.map((record) => (
              <div
                key={record.id}
                className="rounded-xl border p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold">
                      {record.issue_title}
                    </h3>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-sm font-medium ${statusClasses(
                          record.status
                        )}`}
                      >
                        {record.status}
                      </span>

                      <span
                        className={`rounded-full px-3 py-1 text-sm font-medium ${priorityClasses(
                          record.priority
                        )}`}
                      >
                        {record.priority} Priority
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => editRecord(record)}
                    >
                      Edit
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => deleteRecord(record)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>

                {record.description && (
                  <p className="mt-5 text-gray-700">
                    {record.description}
                  </p>
                )}

                <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <p className="text-sm text-gray-500">
                      Technician
                    </p>

                    <p className="mt-1 font-semibold">
                      {record.technician || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">
                      Repair Cost
                    </p>

                    <p className="mt-1 font-semibold">
                      {formatCurrency(record.repair_cost)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">
                      Opened
                    </p>

                    <p className="mt-1 font-semibold">
                      {formatDate(record.opened_date)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">
                      Completed
                    </p>

                    <p className="mt-1 font-semibold">
                      {formatDate(record.completed_date)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">
                      Next Service
                    </p>

                    <p className="mt-1 font-semibold">
                      {formatDate(record.next_service_date)}
                    </p>
                  </div>
                </div>

                {record.resolution_notes && (
                  <div className="mt-6 rounded-lg bg-gray-50 p-4">
                    <p className="text-sm font-medium text-gray-500">
                      Resolution
                    </p>

                    <p className="mt-2 text-gray-700">
                      {record.resolution_notes}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}