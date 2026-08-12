"use client";

import Link from "next/link";
import {
  type FormEvent,
  useEffect,
  useState,
} from "react";
import MaintenanceForm from "@/components/maintenance/MaintenanceForm";
import MaintenanceList from "@/components/maintenance/MaintenanceList";
import {
  type MaintenancePriority,
  type MaintenanceRecord,
  type MaintenanceStatus,
} from "@/components/maintenance/types";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useParams } from "next/navigation";

type UserRole = "Admin" | "Staff" | "Volunteer";

type EquipmentItem = {
  id: string;
  asset_tag: string | null;
  display_name: string | null;
  status: string | null;
};

export default function EquipmentMaintenancePage() {
  const params = useParams();

  const equipmentItemId = Array.isArray(params.id)
    ? params.id[0]
    : params.id;

  const [equipmentItem, setEquipmentItem] =
    useState<EquipmentItem | null>(null);

  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] =
    useState<MaintenanceRecord | null>(null);

  const [issueTitle, setIssueTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] =
    useState<MaintenanceStatus>("Open");
  const [priority, setPriority] =
    useState<MaintenancePriority>("Normal");
  const [technician, setTechnician] = useState("");
  const [repairCost, setRepairCost] = useState("");
  const [openedDate, setOpenedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [completedDate, setCompletedDate] = useState("");
  const [nextServiceDate, setNextServiceDate] = useState("");
  const [resolutionNotes, setResolutionNotes] = useState("");

  const [accessChecking, setAccessChecking] = useState(true);
  const [currentUserRole, setCurrentUserRole] =
    useState<UserRole>("Volunteer");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (equipmentItemId) {
      initializePage();
    }
  }, [equipmentItemId]);

  async function initializePage() {
    setAccessChecking(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setCurrentUserRole("Volunteer");
      await loadPage();
      setAccessChecking(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error(
        "Unable to verify maintenance access:",
        profileError
      );
      setCurrentUserRole("Volunteer");
    } else {
      const role: UserRole =
        profile?.role === "Admin"
          ? "Admin"
          : profile?.role === "Staff"
            ? "Staff"
            : "Volunteer";

      setCurrentUserRole(role);
    }

    await loadPage();
    setAccessChecking(false);
  }

  function canManageMaintenance() {
    return (
      currentUserRole === "Admin" ||
      currentUserRole === "Staff"
    );
  }

  async function loadPage() {
    if (!equipmentItemId) return;

    setLoading(true);
    setErrorMessage("");

    const itemResult = await supabase
      .from("assets")
      .select("id,asset_tag,display_name,status")
      .eq("id", equipmentItemId)
      .maybeSingle();

    if (itemResult.error) {
      console.error("Equipment load error:", itemResult.error);
      setErrorMessage(itemResult.error.message);
      setEquipmentItem(null);
      setLoading(false);
      return;
    }

    if (!itemResult.data) {
      setErrorMessage(
        "No equipment item was found with this ID."
      );
      setEquipmentItem(null);
      setLoading(false);
      return;
    }

    setEquipmentItem(itemResult.data as EquipmentItem);

    const maintenanceResult = await supabase
      .from("asset_maintenance")
      .select("*")
      .eq("asset_id", equipmentItemId)
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

  async function syncEquipmentStatus() {
    if (!canManageMaintenance()) {
      throw new Error(
        "You do not have permission to change maintenance status."
      );
    }

    if (!equipmentItemId) return;

    const { data, error } = await supabase
      .from("asset_maintenance")
      .select("id")
      .eq("asset_id", equipmentItemId)
      .in("status", ["Open", "In Progress"])
      .limit(1);

    if (error) {
      console.error(
        "Maintenance status check error:",
        error
      );
      throw error;
    }

    const hasActiveMaintenance = (data ?? []).length > 0;
    const nextEquipmentStatus = hasActiveMaintenance
      ? "Maintenance"
      : "Available";

    const { error: updateError } = await supabase
      .from("assets")
      .update({ status: nextEquipmentStatus })
      .eq("id", equipmentItemId);

    if (updateError) {
      console.error(
        "Equipment status update error:",
        updateError
      );
      throw updateError;
    }
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
    if (!canManageMaintenance()) {
      alert(
        "You do not have permission to add maintenance records."
      );
      return;
    }

    resetForm();
    setShowForm(true);
  }

  function editRecord(record: MaintenanceRecord) {
    if (!canManageMaintenance()) {
      alert(
        "You do not have permission to edit maintenance records."
      );
      return;
    }

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

  async function saveRecord(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!canManageMaintenance()) {
      alert(
        "You do not have permission to save maintenance records."
      );
      return;
    }

    if (!equipmentItemId) return;

    if (!issueTitle.trim()) {
      alert("Enter an issue title.");
      return;
    }

    const parsedRepairCost =
      repairCost.trim() === "" ? null : Number(repairCost);

    if (
      parsedRepairCost !== null &&
      (Number.isNaN(parsedRepairCost) ||
        parsedRepairCost < 0)
    ) {
      alert("Enter a valid repair cost.");
      return;
    }

    setSaving(true);
    setErrorMessage("");

    const recordData = {
      asset_id: equipmentItemId,
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

    try {
      await syncEquipmentStatus();
    } catch (statusError) {
      const message =
        statusError instanceof Error
          ? statusError.message
          : "The maintenance record saved, but the equipment status could not be updated.";

      setErrorMessage(message);
      setSaving(false);
      await loadPage();
      return;
    }

    setSaving(false);
    closeForm();
    await loadPage();
  }

  async function deleteRecord(record: MaintenanceRecord) {
    if (!canManageMaintenance()) {
      alert(
        "You do not have permission to delete maintenance records."
      );
      return;
    }

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

    try {
      await syncEquipmentStatus();
    } catch (statusError) {
      const message =
        statusError instanceof Error
          ? statusError.message
          : "The maintenance record was deleted, but the equipment status could not be updated.";

      setErrorMessage(message);
    }

    await loadPage();
  }

  if (accessChecking || loading) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold">
          Loading maintenance records...
        </h1>
      </div>
    );
  }

  if (!equipmentItem) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold">
          Equipment Not Found
        </h1>

        {errorMessage && (
          <p className="mt-4 text-red-600">
            {errorMessage}
          </p>
        )}

        <Link
          href="/inventory"
          className="mt-6 inline-block text-blue-600 hover:underline"
        >
          ← Back to Equipment
        </Link>
      </div>
    );
  }

  const displayName =
    equipmentItem.display_name ||
    equipmentItem.asset_tag ||
    "Unnamed Equipment";

  const canManage = canManageMaintenance();

  return (
    <div className="p-8">
      <Link
        href={`/assets/${equipmentItem.id}`}
        className="text-blue-600 hover:underline"
      >
        ← Back to Equipment
      </Link>

      <div className="mt-6 flex flex-wrap items-start justify-between gap-6">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-gray-500">
            Equipment Maintenance
          </p>

          <h1 className="mt-2 text-4xl font-bold">
            {displayName}
          </h1>

          <p className="mt-2 text-gray-500">
            Equipment Tag:{" "}
            {equipmentItem.asset_tag || "Not assigned"}
          </p>
        </div>

        {canManage && (
          <Button onClick={openNewRecordForm}>
            Add Maintenance Record
          </Button>
        )}
      </div>

      {errorMessage && (
        <div className="mt-6 rounded-xl border border-red-300 bg-red-50 p-4 text-red-700">
          {errorMessage}
        </div>
      )}

      {canManage && showForm && (
        <MaintenanceForm
          isEditing={editingRecord !== null}
          saving={saving}
          issueTitle={issueTitle}
          description={description}
          status={status}
          priority={priority}
          technician={technician}
          repairCost={repairCost}
          openedDate={openedDate}
          completedDate={completedDate}
          nextServiceDate={nextServiceDate}
          resolutionNotes={resolutionNotes}
          onIssueTitleChange={setIssueTitle}
          onDescriptionChange={setDescription}
          onStatusChange={setStatus}
          onPriorityChange={setPriority}
          onTechnicianChange={setTechnician}
          onRepairCostChange={setRepairCost}
          onOpenedDateChange={setOpenedDate}
          onCompletedDateChange={setCompletedDate}
          onNextServiceDateChange={setNextServiceDate}
          onResolutionNotesChange={setResolutionNotes}
          onSubmit={saveRecord}
          onCancel={closeForm}
        />
      )}

      <div className="mt-8 rounded-2xl bg-white p-8 shadow">
        <h2 className="text-2xl font-bold">
          Maintenance History
        </h2>

        <p className="mt-2 text-gray-500">
          Issues, repairs, service costs, and future maintenance.
        </p>

        <div className="mt-8">
          <MaintenanceList
            records={records}
            emptyTitle="No maintenance records"
            emptyMessage={
              canManage
                ? "Create the first record when this equipment needs service."
                : "No maintenance records have been added for this equipment."
            }
            onEdit={canManage ? editRecord : undefined}
            onDelete={canManage ? deleteRecord : undefined}
          />
        </div>
      </div>
    </div>
  );
}