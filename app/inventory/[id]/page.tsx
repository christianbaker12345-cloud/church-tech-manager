"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { Archive, Check, Pencil, RotateCcw, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

type UserRole = "Admin" | "Staff" | "Volunteer";

type Equipment = {
  id: string;
  name: string;
  quantity: number | null;
  category: string | null;
  status: string | null;
  location: string | null;
  notes: string | null;
  checked_out_by: string | null;
  ministry: string | null;
  checkout_date: string | null;
  due_date: string | null;
  retired_at: string | null;
  retired_reason: string | null;
  retired_destination: string | null;
  retired_notes: string | null;
  trashed_at: string | null;
  trash_purge_after: string | null;
  trash_reason: string | null;
};

type EditableEquipmentField =
  | "category"
  | "quantity"
  | "location"
  | "notes";

type Asset = {
  id: string;
  equipment_id: string;
  asset_tag: string | null;
  display_name: string | null;
  serial_number: string | null;
  status: string | null;
  location: string | null;
  purchase_date: string | null;
  purchase_price: number | null;
  warranty_expires: string | null;
  notes: string | null;
  created_at: string | null;
};

export default function EquipmentDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const equipmentId = Array.isArray(params.id)
    ? params.id[0]
    : params.id;

  const [item, setItem] = useState<Equipment | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);

  const [accessChecking, setAccessChecking] = useState(true);
  const [currentUserRole, setCurrentUserRole] =
    useState<UserRole>("Volunteer");

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [creatingAssets, setCreatingAssets] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);

  const [showCheckoutForm, setShowCheckoutForm] = useState(false);
  const [checkedOutBy, setCheckedOutBy] = useState("");
  const [ministry, setMinistry] = useState("");
  const [dueDate, setDueDate] = useState("");

  const [editingField, setEditingField] =
    useState<EditableEquipmentField | null>(null);
  const [draftValue, setDraftValue] = useState("");
  const [savingField, setSavingField] =
    useState<EditableEquipmentField | null>(null);
  const [inlineEditError, setInlineEditError] = useState("");

  const [showRetireDialog, setShowRetireDialog] = useState(false);
  const [retireReason, setRetireReason] = useState("");
  const [retireDestination, setRetireDestination] = useState("");
  const [retireNotes, setRetireNotes] = useState("");
  const [retiring, setRetiring] = useState(false);

  const [showTrashDialog, setShowTrashDialog] = useState(false);
  const [trashReason, setTrashReason] = useState("");
  const [trashConfirmation, setTrashConfirmation] = useState("");
  const [trashing, setTrashing] = useState(false);
  const [restoringRetired, setRestoringRetired] = useState(false);
  const [restoringTrash, setRestoringTrash] = useState(false);

  useEffect(() => {
    if (equipmentId) {
      initializePage();
    }
  }, [equipmentId]);

  const canManage =
    currentUserRole === "Admin" || currentUserRole === "Staff";

  const assetStatuses = assets.map((asset) =>
    normalizeStatus(asset.status)
  );

  const hasMaintenanceAsset = assetStatuses.some(
    (status) =>
      status === "maintenance" ||
      status === "in repair"
  );

  const hasCheckedOutAsset = assetStatuses.some(
    (status) => status === "checked out"
  );

  const effectiveEquipmentStatus =
    item?.retired_at || item?.trashed_at
      ? item?.status
      : hasMaintenanceAsset
        ? "Maintenance"
        : hasCheckedOutAsset
          ? "Checked Out"
          : item?.status;

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
        "Unable to verify equipment-detail access:",
        profileError
      );
      setCurrentUserRole("Volunteer");
      await loadPage();
      setAccessChecking(false);
      return;
    }

    const role: UserRole =
      profile?.role === "Admin"
        ? "Admin"
        : profile?.role === "Staff"
          ? "Staff"
          : "Volunteer";

    setCurrentUserRole(role);
    await loadPage();
    setAccessChecking(false);
  }

  async function loadPage() {
    if (!equipmentId) return;

    setLoading(true);
    setErrorMessage("");

    const equipmentResult = await supabase
      .from("equipment")
      .select("*")
      .eq("id", equipmentId)
      .maybeSingle();

    if (equipmentResult.error) {
      console.error(
        "Equipment load error:",
        equipmentResult.error
      );

      setErrorMessage(equipmentResult.error.message);
      setItem(null);
      setLoading(false);
      return;
    }

    if (!equipmentResult.data) {
      setErrorMessage(
        "No equipment record was found with this ID."
      );
      setItem(null);
      setLoading(false);
      return;
    }

    const assetsResult = await supabase
      .from("assets")
      .select("*")
      .eq("equipment_id", equipmentId)
      .order("created_at", { ascending: true });

    if (assetsResult.error) {
      console.error("Assets load error:", assetsResult.error);
      setErrorMessage(assetsResult.error.message);
      setAssets([]);
    } else {
      setAssets((assetsResult.data ?? []) as Asset[]);
    }

    setItem(equipmentResult.data as Equipment);
    setLoading(false);
  }

  function normalizeStatus(status: string | null) {
    return status?.trim().toLowerCase() ?? "";
  }

  function statusClasses(status: string | null) {
    const normalized = normalizeStatus(status);

    if (normalized === "available") {
      return "bg-green-100 text-green-700";
    }

    if (normalized === "checked out") {
      return "bg-yellow-100 text-yellow-700";
    }

    if (
      normalized === "maintenance" ||
      normalized === "in repair"
    ) {
      return "bg-red-100 text-red-700";
    }

    return "bg-gray-100 text-gray-700";
  }

  function makeAssetPrefix(name: string) {
    const words = name
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, "")
      .split(/\s+/)
      .filter(Boolean);

    if (words.length === 0) {
      return "ASSET";
    }

    if (words.length === 1) {
      return words[0].slice(0, 6);
    }

    return words
      .slice(0, 4)
      .map((word) => word.charAt(0))
      .join("");
  }

  async function createMissingAssets() {
    if (!canManage) {
      alert("You do not have permission to create individual assets.")
      return;
    }

    if (!item) return;

    const quantity = Math.max(Number(item.quantity) || 0, 0);
    const missingCount = quantity - assets.length;

    if (missingCount <= 0) {
      alert("All individual assets have already been created.");
      return;
    }

    const confirmed = window.confirm(
      `Create ${missingCount} individual ${
        missingCount === 1 ? "asset" : "assets"
      } for ${item.name}?`
    );

    if (!confirmed) return;

    setCreatingAssets(true);

    const prefix = makeAssetPrefix(item.name);

    const rows = Array.from(
      { length: missingCount },
      (_, index) => {
        const assetNumber = assets.length + index + 1;

        const randomCode = crypto
          .randomUUID()
          .replaceAll("-", "")
          .slice(0, 8)
          .toUpperCase();

        return {
          equipment_id: item.id,
          asset_tag: `${prefix}-${randomCode}`,
          display_name: `${item.name} #${assetNumber}`,
          status: "Available",
          location: item.location,
          notes: item.notes,
        };
      }
    );

    const { error } = await supabase
      .from("assets")
      .insert(rows);

    setCreatingAssets(false);

    if (error) {
      console.error("Asset creation error:", error);
      alert(error.message);
      return;
    }

    alert(
      `${missingCount} ${
        missingCount === 1 ? "asset was" : "assets were"
      } created successfully.`
    );

    await loadPage();
  }

  async function checkOutEquipmentRecord() {
    if (!canManage) {
      alert("You do not have permission to check out equipment.")
      return;
    }

    if (!item || !equipmentId) return;

    if (!checkedOutBy.trim()) {
      alert("Enter the person or group checking this out.");
      return;
    }

    if (!dueDate) {
      alert("Choose a due date.");
      return;
    }

    const confirmed = window.confirm(
      `Check out the equipment record for ${item.name}?`
    );

    if (!confirmed) return;

    setCheckingOut(true);

    const checkoutDate = new Date()
      .toISOString()
      .split("T")[0];

    const { error: equipmentError } = await supabase
      .from("equipment")
      .update({
        status: "Checked Out",
        checked_out_by: checkedOutBy.trim(),
        ministry: ministry.trim() || null,
        checkout_date: checkoutDate,
        due_date: dueDate,
      })
      .eq("id", equipmentId);

    if (equipmentError) {
      console.error(
        "Equipment checkout error:",
        equipmentError
      );

      alert(equipmentError.message);
      setCheckingOut(false);
      return;
    }

    const { error: historyError } = await supabase
      .from("checkout_history")
      .insert({
        equipment_id: item.id,
        equipment_name: item.name,
        checked_out_by: checkedOutBy.trim(),
        ministry: ministry.trim() || null,
        checkout_date: checkoutDate,
        due_date: dueDate,
        status: "Checked Out",
      });

    if (historyError) {
      console.error(
        "Equipment checkout history error:",
        historyError
      );

      alert(
        `The equipment was checked out, but its history could not be saved:\n\n${historyError.message}`
      );
    } else {
      alert("Equipment record checked out.");
    }

    setCheckingOut(false);
    setShowCheckoutForm(false);
    setCheckedOutBy("");
    setMinistry("");
    setDueDate("");

    await loadPage();
  }

  async function checkInEquipmentRecord() {
    if (!canManage) {
      alert("You do not have permission to check in equipment.")
      return;
    }

    if (!item || !equipmentId) return;

    const confirmed = window.confirm(
      `Check in the equipment record for ${item.name}?`
    );

    if (!confirmed) return;

    setCheckingIn(true);

    const checkinDate = new Date()
      .toISOString()
      .split("T")[0];

    const { error: equipmentError } = await supabase
      .from("equipment")
      .update({
        status: "Available",
        checked_out_by: null,
        ministry: null,
        checkout_date: null,
        due_date: null,
      })
      .eq("id", equipmentId);

    if (equipmentError) {
      console.error(
        "Equipment check-in error:",
        equipmentError
      );

      alert(equipmentError.message);
      setCheckingIn(false);
      return;
    }

    const { error: historyError } = await supabase
      .from("checkout_history")
      .update({
        checkin_date: checkinDate,
        status: "Returned",
      })
      .eq("equipment_id", equipmentId)
      .eq("status", "Checked Out")
      .is("checkin_date", null);

    if (historyError) {
      console.error(
        "Equipment history update error:",
        historyError
      );

      alert(
        `The equipment was checked in, but its history could not be updated:\n\n${historyError.message}`
      );
    } else {
      alert("Equipment record checked in.");
    }

    setCheckingIn(false);

    await loadPage();
  }

  function beginInlineEdit(field: EditableEquipmentField) {
    if (!canManage) return;
    if (!item) return;

    const currentValue =
      field === "quantity"
        ? String(Math.max(Number(item.quantity) || 0, 0))
        : item[field] ?? "";

    setInlineEditError("");
    setDraftValue(currentValue);
    setEditingField(field);
  }

  function cancelInlineEdit() {
    setInlineEditError("");
    setDraftValue("");
    setEditingField(null);
  }

  async function saveInlineField(field: EditableEquipmentField) {
    if (!canManage) {
      alert("You do not have permission to edit equipment.")
      return;
    }

    if (!item || !equipmentId) return;

    setInlineEditError("");
    setSavingField(field);

    let databaseValue: string | number | null =
      draftValue.trim() || null;

    if (field === "quantity") {
      const parsedQuantity = Number(draftValue);

      if (
        !Number.isInteger(parsedQuantity) ||
        parsedQuantity < 0
      ) {
        setInlineEditError(
          "Quantity must be a whole number of zero or greater."
        );
        setSavingField(null);
        return;
      }

      if (parsedQuantity < assets.length) {
        setInlineEditError(
          `Quantity cannot be lower than the ${assets.length} individual assets already created.`
        );
        setSavingField(null);
        return;
      }

      databaseValue = parsedQuantity;
    }

    const { error } = await supabase
      .from("equipment")
      .update({
        [field]: databaseValue,
      })
      .eq("id", equipmentId);

    if (error) {
      console.error(
        `Equipment ${field} update error:`,
        error
      );
      setInlineEditError(error.message);
      setSavingField(null);
      return;
    }

    setItem((currentItem) =>
      currentItem
        ? {
            ...currentItem,
            [field]: databaseValue,
          }
        : currentItem
    );

    setSavingField(null);
    setEditingField(null);
    setDraftValue("");
  }

  async function retireEquipment() {
    if (!canManage) {
      alert("You do not have permission to retire equipment.")
      return;
    }

    if (!item || !equipmentId) return;

    if (!retireReason) {
      alert("Choose a reason for retiring this equipment.");
      return;
    }

    setRetiring(true);

    const { error } = await supabase
      .from("equipment")
      .update({
        retired_at: new Date().toISOString(),
        retired_reason: retireReason,
        retired_destination: retireDestination.trim() || null,
        retired_notes: retireNotes.trim() || null,
        status: "Retired",
        trashed_at: null,
        trash_purge_after: null,
        trash_reason: null,
      })
      .eq("id", equipmentId);

    setRetiring(false);

    if (error) {
      console.error("Equipment retirement error:", error);
      alert(error.message);
      return;
    }

    const { error: historyError } = await supabase
      .from("equipment_lifecycle_history")
      .insert({
        equipment_id: equipmentId,
        action: "Retired",
        reason: retireReason,
        destination: retireDestination.trim() || null,
        notes: retireNotes.trim() || null,
      });

    if (historyError) {
      console.error("Retirement history error:", historyError);
      alert(
        `The equipment was retired, but its history entry could not be saved:\n\n${historyError.message}`
      );
    }

    setShowRetireDialog(false);
    setRetireReason("");
    setRetireDestination("");
    setRetireNotes("");

    await loadPage();
  }

  async function moveEquipmentToTrash() {
    if (!canManage) {
      alert("You do not have permission to move equipment to Trash.")
      return;
    }

    if (!item || !equipmentId) return;

    if (!trashReason.trim()) {
      alert("Enter why this equipment is being moved to Trash.");
      return;
    }

    if (trashConfirmation.trim().toUpperCase() !== "TRASH") {
      alert('Type "TRASH" to confirm.');
      return;
    }

    setTrashing(true);

    const trashedAt = new Date();
    const purgeAfter = new Date(trashedAt);
    purgeAfter.setDate(purgeAfter.getDate() + 30);

    const { error } = await supabase
      .from("equipment")
      .update({
        trashed_at: trashedAt.toISOString(),
        trash_purge_after: purgeAfter.toISOString(),
        trash_reason: trashReason.trim(),
      })
      .eq("id", equipmentId);

    setTrashing(false);

    if (error) {
      console.error("Equipment trash error:", error);
      alert(error.message);
      return;
    }

    const { error: historyError } = await supabase
      .from("equipment_lifecycle_history")
      .insert({
        equipment_id: equipmentId,
        action: "Moved to Trash",
        reason: trashReason.trim(),
        destination: null,
        notes: `Scheduled for permanent deletion after ${purgeAfter.toLocaleDateString(
          "en-US"
        )}.`,
      });

    if (historyError) {
      console.error("Trash history error:", historyError);
      alert(
        `The equipment was moved to Trash, but its history entry could not be saved:\n\n${historyError.message}`
      );
    }

    router.push("/inventory");
    router.refresh();
  }

  async function restoreRetiredEquipment() {
    if (!canManage) {
      alert("You do not have permission to restore equipment.")
      return;
    }

    if (!item || !equipmentId) return;

    const confirmed = window.confirm(
      `Restore ${item.name} to active inventory?`
    );

    if (!confirmed) return;

    setRestoringRetired(true);

    const { error } = await supabase
      .from("equipment")
      .update({
        retired_at: null,
        retired_reason: null,
        retired_destination: null,
        retired_notes: null,
        status: "Available",
      })
      .eq("id", equipmentId);

    setRestoringRetired(false);

    if (error) {
      console.error("Equipment restore error:", error);
      alert(error.message);
      return;
    }

    const { error: historyError } = await supabase
      .from("equipment_lifecycle_history")
      .insert({
        equipment_id: equipmentId,
        action: "Restored to Active Inventory",
        reason: null,
        destination: null,
        notes: "Previously retired equipment was restored.",
      });

    if (historyError) {
      console.error("Restore history error:", historyError);
      alert(
        `The equipment was restored, but its history entry could not be saved:\n\n${historyError.message}`
      );
    }

    await loadPage();
  }

  async function restoreEquipmentFromTrash() {
    if (!canManage) {
      alert("You do not have permission to restore equipment from Trash.")
      return;
    }

    if (!item || !equipmentId) return;

    const confirmed = window.confirm(
      `Restore ${item.name} from Trash?`
    );

    if (!confirmed) return;

    setRestoringTrash(true);

    const { error } = await supabase
      .from("equipment")
      .update({
        trashed_at: null,
        trash_purge_after: null,
        trash_reason: null,
      })
      .eq("id", equipmentId);

    setRestoringTrash(false);

    if (error) {
      console.error("Trash restore error:", error);
      alert(error.message);
      return;
    }

    const { error: historyError } = await supabase
      .from("equipment_lifecycle_history")
      .insert({
        equipment_id: equipmentId,
        action: "Restored from Trash",
        reason: null,
        destination: null,
        notes: "Equipment record was restored before permanent deletion.",
      });

    if (historyError) {
      console.error("Trash restore history error:", historyError);
      alert(
        `The equipment was restored from Trash, but its history entry could not be saved:\n\n${historyError.message}`
      );
    }

    await loadPage();
  }

  function formatLifecycleDate(value: string | null) {
    if (!value) return "Not recorded";

    const parsedDate = new Date(value);

    if (Number.isNaN(parsedDate.getTime())) {
      return value;
    }

    return parsedDate.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  function printQRCode() {
    window.print();
  }

  if (accessChecking) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold">
          Verifying permissions...
        </h1>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold">
          Loading equipment...
        </h1>
      </div>
    );
  }

  if (!item) {
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
          ← Back to Inventory
        </Link>
      </div>
    );
  }

  const quantity = Math.max(Number(item.quantity) || 0, 0);

  const missingAssetCount = Math.max(
    quantity - assets.length,
    0
  );

  const normalizedEquipmentStatus = normalizeStatus(
    item.status
  );

  const equipmentIsAvailable =
    normalizedEquipmentStatus === "available";

  const equipmentIsCheckedOut =
    normalizedEquipmentStatus === "checked out";

  const qrUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/inventory/${item.id}`
      : "";

  return (
    <div className="p-8">
      <Link
        href="/inventory"
        className="text-blue-600 hover:underline"
      >
        ← Back to Inventory
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-3">
        <div className="rounded-2xl bg-white p-8 shadow lg:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="text-sm font-medium uppercase tracking-wide text-gray-500">
                Equipment Record
              </p>

              <h1 className="mt-2 text-4xl font-bold">
                {item.name}
              </h1>

              <p className="mt-2 break-all text-sm text-gray-500">
                Equipment ID: {item.id}
              </p>
            </div>

            <span
              className={`rounded-full px-4 py-2 font-semibold ${statusClasses(
                effectiveEquipmentStatus
              )}`}
            >
              {effectiveEquipmentStatus || "Unknown"}
            </span>
          </div>

          {item.retired_at && (
            <div className="mt-8 rounded-xl border border-violet-200 bg-violet-50 p-6">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-violet-700">
                Retired Equipment
              </p>

              <h2 className="mt-2 text-2xl font-bold text-violet-950">
                This equipment was retired on{" "}
                {formatLifecycleDate(item.retired_at)} and is no
                longer part of the active inventory.
              </h2>

              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-sm font-medium text-violet-700">
                    Retired On
                  </p>
                  <p className="mt-1 font-semibold text-violet-950">
                    {formatLifecycleDate(item.retired_at)}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-violet-700">
                    Reason
                  </p>
                  <p className="mt-1 font-semibold text-violet-950">
                    {item.retired_reason || "Not recorded"}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-violet-700">
                    Destination
                  </p>
                  <p className="mt-1 font-semibold text-violet-950">
                    {item.retired_destination || "Not recorded"}
                  </p>
                </div>
              </div>

              {item.retired_notes && (
                <div className="mt-5 rounded-xl border border-violet-200 bg-white/60 p-4">
                  <p className="text-sm font-medium text-violet-700">
                    Retirement Notes
                  </p>

                  <p className="mt-2 whitespace-pre-wrap text-violet-950">
                    {item.retired_notes}
                  </p>
                </div>
              )}

              {canManage && !item.trashed_at && (
                <div className="mt-5">
                  <Button
                    variant="outline"
                    onClick={restoreRetiredEquipment}
                    disabled={restoringRetired}
                    className="border-violet-300 bg-white text-violet-700 hover:bg-violet-100 hover:text-violet-900"
                  >
                    <RotateCcw className="h-4 w-4" />
                    {restoringRetired
                      ? "Restoring..."
                      : "Restore to Active Inventory"}
                  </Button>
                </div>
              )}
            </div>
          )}

          {item.trashed_at && (
            <div className="mt-8 rounded-xl border border-rose-200 bg-rose-50 p-6">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-rose-700">
                In Trash
              </p>

              <h2 className="mt-2 text-2xl font-bold text-rose-950">
                This record was moved to Trash on{" "}
                {formatLifecycleDate(item.trashed_at)}.
              </h2>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-rose-700">
                    Reason
                  </p>

                  <p className="mt-1 font-semibold text-rose-950">
                    {item.trash_reason || "Not recorded"}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-rose-700">
                    Scheduled Purge
                  </p>

                  <p className="mt-1 font-semibold text-rose-950">
                    {formatLifecycleDate(item.trash_purge_after)}
                  </p>
                </div>
              </div>

              {canManage && (
                <div className="mt-5">
                  <Button
                    variant="outline"
                    onClick={restoreEquipmentFromTrash}
                  disabled={restoringTrash}
                  className="border-rose-300 bg-white text-rose-700 hover:bg-rose-100 hover:text-rose-900"
                >
                  <RotateCcw className="h-4 w-4" />
                    {restoringTrash
                      ? "Restoring..."
                      : "Restore from Trash"}
                  </Button>
                </div>
              )}
            </div>
          )}

          {equipmentIsCheckedOut && (
            <div className="mt-8 rounded-xl border border-yellow-300 bg-yellow-50 p-6">
              <h2 className="text-xl font-bold text-yellow-900">
                Equipment Record Checked Out
              </h2>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-yellow-700">
                    Checked Out By
                  </p>

                  <p className="mt-1 font-semibold text-yellow-950">
                    {item.checked_out_by || "—"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-yellow-700">
                    Ministry
                  </p>

                  <p className="mt-1 font-semibold text-yellow-950">
                    {item.ministry || "—"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-yellow-700">
                    Checkout Date
                  </p>

                  <p className="mt-1 font-semibold text-yellow-950">
                    {item.checkout_date || "—"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-yellow-700">
                    Due Date
                  </p>

                  <p className="mt-1 font-semibold text-yellow-950">
                    {item.due_date || "—"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {inlineEditError && (
            <div className="mt-8 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
              {inlineEditError}
            </div>
          )}

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <EditableEquipmentCard
              label="Category"
              readOnly={!canManage}
              value={item.category || "—"}
              field="category"
              inputType="text"
              placeholder="Enter category"
              editing={editingField === "category"}
              saving={savingField === "category"}
              draftValue={draftValue}
              onEdit={() => beginInlineEdit("category")}
              onDraftChange={setDraftValue}
              onSave={() => saveInlineField("category")}
              onCancel={cancelInlineEdit}
            />

            <EditableEquipmentCard
              label="Quantity"
              readOnly={!canManage}
              value={String(quantity)}
              field="quantity"
              inputType="number"
              placeholder="0"
              editing={editingField === "quantity"}
              saving={savingField === "quantity"}
              draftValue={draftValue}
              onEdit={() => beginInlineEdit("quantity")}
              onDraftChange={setDraftValue}
              onSave={() => saveInlineField("quantity")}
              onCancel={cancelInlineEdit}
            />

            <EditableEquipmentCard
              label="Location"
              readOnly={!canManage}
              value={item.location || "—"}
              field="location"
              inputType="text"
              placeholder="Enter location"
              editing={editingField === "location"}
              saving={savingField === "location"}
              draftValue={draftValue}
              onEdit={() => beginInlineEdit("location")}
              onDraftChange={setDraftValue}
              onSave={() => saveInlineField("location")}
              onCancel={cancelInlineEdit}
            />

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm text-gray-500">
                Individual Assets
              </p>

              <p className="mt-1 text-xl font-semibold">
                {assets.length}
              </p>

              <p className="mt-3 text-xs font-medium text-slate-400">
                Calculated automatically
              </p>
            </div>
          </div>

          <EditableNotesCard
            value={item.notes || "No notes available."}
            readOnly={!canManage}
            editing={editingField === "notes"}
            saving={savingField === "notes"}
            draftValue={draftValue}
            onEdit={() => beginInlineEdit("notes")}
            onDraftChange={setDraftValue}
            onSave={() => saveInlineField("notes")}
            onCancel={cancelInlineEdit}
          />

          <div className="mt-8 flex flex-wrap gap-4">
            {canManage && (
              <Link href={`/inventory/${item.id}/edit`}>
                <Button>Edit Equipment</Button>
              </Link>
            )}

            <Link href={`/inventory/${item.id}/history`}>
              <Button variant="outline">
                View Equipment History
              </Button>
            </Link>

            {canManage && equipmentIsAvailable && (
              <Button
                onClick={() =>
                  setShowCheckoutForm(true)
                }
              >
                Check Out Equipment Record
              </Button>
            )}

            {canManage && equipmentIsCheckedOut && (
              <Button
                onClick={checkInEquipmentRecord}
                disabled={checkingIn}
              >
                {checkingIn
                  ? "Checking In..."
                  : "Check In Equipment Record"}
              </Button>
            )}

            <Button
              variant="outline"
              onClick={printQRCode}
            >
              Print QR Code
            </Button>

            {canManage && !item.retired_at && !item.trashed_at && (
              <Button
                variant="outline"
                onClick={() => setShowRetireDialog(true)}
              >
                <Archive className="h-4 w-4" />
                Retire Equipment
              </Button>
            )}

            {canManage && !item.trashed_at && (
              <Button
                variant="outline"
                onClick={() => setShowTrashDialog(true)}
                className="border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
              >
                <Trash2 className="h-4 w-4" />
                Move to Trash
              </Button>
            )}
          </div>

          <p className="mt-4 text-sm text-gray-500">
            Individual assets have their own separate checkout
            buttons on their asset pages.
          </p>

          {canManage && showCheckoutForm && equipmentIsAvailable && (
            <div className="mt-8 rounded-xl border bg-gray-50 p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold">
                    Check Out Equipment Record
                  </h2>

                  <p className="mt-1 text-gray-500">
                    {item.name}
                  </p>
                </div>

                <button
                  type="button"
                  className="text-sm text-gray-500 hover:text-gray-900"
                  onClick={() =>
                    setShowCheckoutForm(false)
                  }
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
                    className="w-full rounded-lg border bg-white p-3"
                    placeholder="Who is borrowing it?"
                    value={checkedOutBy}
                    onChange={(event) =>
                      setCheckedOutBy(event.target.value)
                    }
                  />
                </div>

                <div>
                  <label className="mb-2 block font-medium">
                    Ministry
                  </label>

                  <input
                    type="text"
                    className="w-full rounded-lg border bg-white p-3"
                    placeholder="Worship, Youth, Production..."
                    value={ministry}
                    onChange={(event) =>
                      setMinistry(event.target.value)
                    }
                  />
                </div>

                <div>
                  <label className="mb-2 block font-medium">
                    Due Date
                  </label>

                  <input
                    type="date"
                    className="w-full rounded-lg border bg-white p-3"
                    value={dueDate}
                    onChange={(event) =>
                      setDueDate(event.target.value)
                    }
                  />
                </div>

                <Button
                  onClick={checkOutEquipmentRecord}
                  disabled={checkingOut}
                >
                  {checkingOut
                    ? "Completing Checkout..."
                    : "Complete Checkout"}
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-white p-8 text-center shadow">
          <h2 className="text-2xl font-bold">
            Equipment QR Code
          </h2>

          <div className="mt-6 flex justify-center">
            <QRCodeSVG
              value={qrUrl}
              size={220}
              includeMargin
            />
          </div>

          <p className="mt-6 break-all text-sm text-gray-500">
            {qrUrl}
          </p>

          <p className="mt-4 text-sm text-gray-400">
            This QR code opens the main equipment record.
          </p>
        </div>
      </div>

      {canManage && showRetireDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="border-b border-slate-200 bg-slate-50 p-6 md:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-bold text-slate-950">
                    Retire Equipment
                  </h2>
                  <p className="mt-2 leading-7 text-slate-600">
                    Preserve what happened to this equipment and where it went.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowRetireDialog(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="space-y-6 p-6 md:p-8">
              <div className="rounded-xl border border-violet-200 bg-violet-50 p-4">
                <p className="text-sm font-medium text-violet-700">
                  Retired On
                </p>

                <p className="mt-1 text-lg font-bold text-violet-950">
                  {new Date().toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>

                <p className="mt-1 text-sm text-violet-700">
                  This date is added automatically when you retire the
                  equipment.
                </p>
              </div>

              <div>
                <label className="mb-2 block font-semibold">
                  Reason
                </label>
                <select
                  value={retireReason}
                  onChange={(event) => setRetireReason(event.target.value)}
                  className="w-full rounded-xl border p-3"
                >
                  <option value="">Choose a reason</option>
                  <option value="Sold">Sold</option>
                  <option value="Donated">Donated</option>
                  <option value="Disposed">Disposed</option>
                  <option value="Replaced">Replaced</option>
                  <option value="Transferred">Transferred</option>
                  <option value="Lost or Stolen">Lost or Stolen</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block font-semibold">
                  Where did it go?
                </label>
                <input
                  value={retireDestination}
                  onChange={(event) => setRetireDestination(event.target.value)}
                  placeholder="Sold to, donated to, transferred to..."
                  className="w-full rounded-xl border p-3"
                />
              </div>

              <div>
                <label className="mb-2 block font-semibold">
                  Notes
                </label>
                <textarea
                  rows={5}
                  value={retireNotes}
                  onChange={(event) => setRetireNotes(event.target.value)}
                  placeholder="Explain what happened."
                  className="w-full rounded-xl border p-3"
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowRetireDialog(false)}
                  disabled={retiring}
                >
                  Cancel
                </Button>

                <Button
                  onClick={retireEquipment}
                  disabled={retiring || !retireReason}
                >
                  <Archive className="h-4 w-4" />
                  {retiring ? "Retiring..." : "Retire Equipment"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {canManage && showTrashDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="border-b border-rose-200 bg-rose-50 p-6 md:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-bold text-rose-950">
                    Move Equipment to Trash
                  </h2>
                  <p className="mt-2 leading-7 text-rose-700">
                    Use this for duplicates, mistakes, test records, or bad imports.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowTrashDialog(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-rose-200 bg-white text-rose-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="space-y-6 p-6 md:p-8">
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                Retire equipment instead if you need to preserve the story of something the church owned or used.
              </div>

              <div>
                <label className="mb-2 block font-semibold">
                  Why are you deleting this record?
                </label>
                <textarea
                  rows={4}
                  value={trashReason}
                  onChange={(event) => setTrashReason(event.target.value)}
                  placeholder="Duplicate record, test entry, incorrect import..."
                  className="w-full rounded-xl border p-3"
                />
              </div>

              <div>
                <label className="mb-2 block font-semibold">
                  Type TRASH to confirm
                </label>
                <input
                  value={trashConfirmation}
                  onChange={(event) => setTrashConfirmation(event.target.value)}
                  placeholder="TRASH"
                  className="w-full rounded-xl border p-3 font-mono font-bold uppercase"
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowTrashDialog(false)}
                  disabled={trashing}
                >
                  Cancel
                </Button>

                <Button
                  onClick={moveEquipmentToTrash}
                  disabled={
                    trashing ||
                    !trashReason.trim() ||
                    trashConfirmation.trim().toUpperCase() !== "TRASH"
                  }
                  className="bg-rose-600 hover:bg-rose-700"
                >
                  <Trash2 className="h-4 w-4" />
                  {trashing ? "Moving..." : "Move to Trash"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 rounded-2xl bg-white p-8 shadow">
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div>
            <h2 className="text-3xl font-bold">
              Individual Assets
            </h2>

            <p className="mt-2 text-gray-500">
              {assets.length} of {quantity} assets created
            </p>
          </div>

          {canManage && (
            <Button
              onClick={createMissingAssets}
              disabled={
                creatingAssets || missingAssetCount === 0
              }
            >
              {creatingAssets
                ? "Creating Assets..."
                : missingAssetCount > 0
                  ? `Create ${missingAssetCount} Missing ${
                      missingAssetCount === 1
                        ? "Asset"
                        : "Assets"
                    }`
                  : "All Assets Created"}
            </Button>
          )}
        </div>

        {assets.length > quantity && (
          <div className="mt-6 rounded-lg border border-yellow-300 bg-yellow-50 p-4 text-yellow-800">
            There are more individual assets than the equipment
            quantity.
          </div>
        )}

        {assets.length === 0 ? (
          <div className="mt-8 rounded-xl border border-dashed p-10 text-center">
            <h3 className="text-xl font-semibold">
              No individual assets yet
            </h3>

            <p className="mt-2 text-gray-500">
              Create individual assets so every physical item can
              have its own QR code, status, and checkout history.
            </p>
          </div>
        ) : (
          <div className="mt-8 overflow-x-auto rounded-xl border">
            <table className="w-full min-w-[850px]">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-4 text-left">
                    Asset
                  </th>

                  <th className="p-4 text-left">
                    Asset Tag
                  </th>

                  <th className="p-4 text-left">
                    Serial Number
                  </th>

                  <th className="p-4 text-left">
                    Status
                  </th>

                  <th className="p-4 text-left">
                    Location
                  </th>

                  <th className="p-4 text-left">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {assets.map((asset) => (
                  <tr
                    key={asset.id}
                    className="border-t hover:bg-gray-50"
                  >
                    <td className="p-4 font-semibold">
                      {asset.display_name ||
                        asset.asset_tag ||
                        "Unnamed Asset"}
                    </td>

                    <td className="p-4">
                      {asset.asset_tag || "—"}
                    </td>

                    <td className="p-4">
                      {asset.serial_number || "—"}
                    </td>

                    <td className="p-4">
                      <span
                        className={`rounded-full px-3 py-1 text-sm font-medium ${statusClasses(
                          asset.status
                        )}`}
                      >
                        {asset.status || "Unknown"}
                      </span>
                    </td>

                    <td className="p-4">
                      {asset.location || "—"}
                    </td>

                    <td className="p-4">
                      <Link
                        href={`/assets/${asset.id}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        View Asset
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

type EditableEquipmentCardProps = {
  label: string;
  readOnly: boolean;
  value: string;
  field: EditableEquipmentField;
  inputType: "text" | "number";
  placeholder: string;
  editing: boolean;
  saving: boolean;
  draftValue: string;
  onEdit: () => void;
  onDraftChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
};

function EditableEquipmentCard({
  label,
  readOnly,
  value,
  field,
  inputType,
  placeholder,
  editing,
  saving,
  draftValue,
  onEdit,
  onDraftChange,
  onSave,
  onCancel,
}: EditableEquipmentCardProps) {
  if (readOnly) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
        <p className="text-sm text-gray-500">
          {label}
        </p>
        <p className="mt-1 break-words text-xl font-semibold">
          {value}
        </p>
        <p className="mt-3 text-xs font-medium text-slate-400">
          Read only
        </p>
      </div>
    );
  }

  if (editing) {
    return (
      <div className="rounded-xl border border-blue-300 bg-blue-50 p-5 ring-4 ring-blue-100">
        <div className="flex items-center justify-between gap-3">
          <label className="text-sm font-semibold text-slate-700">
            {label}
          </label>

          <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-700">
            Editing
          </span>
        </div>

        <input
          type={inputType}
          min={field === "quantity" ? "0" : undefined}
          step={field === "quantity" ? "1" : undefined}
          value={draftValue}
          placeholder={placeholder}
          autoFocus
          onChange={(event) =>
            onDraftChange(event.target.value)
          }
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              onSave();
            }

            if (event.key === "Escape") {
              onCancel();
            }
          }}
          className="mt-3 w-full rounded-lg border border-blue-300 bg-white p-3 text-lg font-semibold outline-none focus:ring-4 focus:ring-blue-100"
        />

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Check className="h-4 w-4" />
            {saving ? "Saving..." : "Save"}
          </button>

          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            aria-label={`Cancel editing ${label}`}
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-600 transition hover:bg-slate-100 disabled:opacity-60"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onEdit}
      className="group rounded-xl border border-slate-200 bg-white p-5 text-left transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-gray-500">
          {label}
        </p>

        <Pencil className="h-4 w-4 text-slate-300 transition group-hover:text-blue-600" />
      </div>

      <p className="mt-1 break-words text-xl font-semibold">
        {value}
      </p>

      <p className="mt-3 text-xs font-semibold text-blue-600 opacity-0 transition group-hover:opacity-100">
        Click to edit
      </p>
    </button>
  );
}

type EditableNotesCardProps = {
  value: string;
  readOnly: boolean;
  editing: boolean;
  saving: boolean;
  draftValue: string;
  onEdit: () => void;
  onDraftChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
};

function EditableNotesCard({
  value,
  readOnly,
  editing,
  saving,
  draftValue,
  onEdit,
  onDraftChange,
  onSave,
  onCancel,
}: EditableNotesCardProps) {
  if (readOnly) {
    return (
      <div className="mt-8 w-full rounded-xl border border-slate-200 bg-slate-50 p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold">
            Notes
          </h2>

          <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-bold text-slate-600">
            Read only
          </span>
        </div>

        <p className="mt-3 whitespace-pre-wrap text-gray-700">
          {value}
        </p>
      </div>
    );
  }

  if (editing) {
    return (
      <div className="mt-8 rounded-xl border border-blue-300 bg-blue-50 p-6 ring-4 ring-blue-100">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold">
            Notes
          </h2>

          <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-700">
            Editing
          </span>
        </div>

        <textarea
          rows={5}
          value={draftValue}
          autoFocus
          placeholder="Add notes about this equipment record..."
          onChange={(event) =>
            onDraftChange(event.target.value)
          }
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              onCancel();
            }
          }}
          className="mt-4 w-full resize-y rounded-lg border border-blue-300 bg-white p-3 leading-7 text-slate-800 outline-none focus:ring-4 focus:ring-blue-100"
        />

        <div className="mt-4 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={saving}
          >
            <X className="h-4 w-4" />
            Cancel
          </Button>

          <Button
            onClick={onSave}
            disabled={saving}
          >
            <Check className="h-4 w-4" />
            {saving ? "Saving..." : "Save Notes"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onEdit}
      className="group mt-8 w-full rounded-xl border border-slate-200 bg-white p-6 text-left transition hover:border-blue-300 hover:bg-blue-50/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold">
          Notes
        </h2>

        <Pencil className="h-4 w-4 text-slate-300 transition group-hover:text-blue-600" />
      </div>

      <p className="mt-3 whitespace-pre-wrap text-gray-700">
        {value}
      </p>

      <p className="mt-3 text-xs font-semibold text-blue-600 opacity-0 transition group-hover:opacity-100">
        Click to edit
      </p>
    </button>
  );
}