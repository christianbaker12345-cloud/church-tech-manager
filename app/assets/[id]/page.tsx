"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

type Asset = {
  id: string;
  equipment_id: string | null;
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
  checked_out_by: string | null;
  ministry: string | null;
  checkout_date: string | null;
  due_date: string | null;
};

type Equipment = {
  id: string;
  name: string;
  category: string | null;
};

type AssetCheckoutHistory = {
  id: string;
  asset_id: string;
  asset_tag: string | null;
  display_name: string | null;
  checked_out_by: string | null;
  ministry: string | null;
  checkout_date: string | null;
  due_date: string | null;
  checkin_date: string | null;
  status: string | null;
  created_at: string | null;
};

export default function AssetDetailsPage() {
  const params = useParams();

  const assetId = Array.isArray(params.id)
    ? params.id[0]
    : params.id;

  const [asset, setAsset] = useState<Asset | null>(null);
  const [equipment, setEquipment] =
    useState<Equipment | null>(null);

  const [history, setHistory] = useState<
    AssetCheckoutHistory[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [showCheckoutForm, setShowCheckoutForm] =
    useState(false);

  const [checkedOutBy, setCheckedOutBy] = useState("");
  const [ministry, setMinistry] = useState("");
  const [dueDate, setDueDate] = useState("");

  const [checkingOut, setCheckingOut] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);

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
      .select("*")
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
      setErrorMessage(
        "No individual asset was found with this ID."
      );
      setAsset(null);
      setLoading(false);
      return;
    }

    const loadedAsset = assetResult.data as Asset;

    setAsset(loadedAsset);

    if (loadedAsset.equipment_id) {
      const equipmentResult = await supabase
        .from("equipment")
        .select("id,name,category")
        .eq("id", loadedAsset.equipment_id)
        .maybeSingle();

      if (equipmentResult.error) {
        console.error(
          "Equipment load error:",
          equipmentResult.error
        );

        setEquipment(null);
      } else {
        setEquipment(
          (equipmentResult.data as Equipment | null) ?? null
        );
      }
    } else {
      setEquipment(null);
    }

    const historyResult = await supabase
      .from("asset_checkout_history")
      .select("*")
      .eq("asset_id", assetId)
      .order("created_at", { ascending: false });

    if (historyResult.error) {
      console.error(
        "Asset checkout history load error:",
        historyResult.error
      );

      setHistory([]);
    } else {
      setHistory(
        (historyResult.data ?? []) as AssetCheckoutHistory[]
      );
    }

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

  function formatDate(date: string | null) {
    if (!date) return "—";

    const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;

    const parsedDate = dateOnlyPattern.test(date)
      ? new Date(`${date}T00:00:00`)
      : new Date(date);

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

  async function checkOutAsset() {
    if (!asset || !assetId) return;

    if (!checkedOutBy.trim()) {
      alert(
        "Enter the person or group checking out this asset."
      );
      return;
    }

    if (!dueDate) {
      alert("Choose a due date.");
      return;
    }

    const name =
      asset.display_name ||
      asset.asset_tag ||
      "this asset";

    const confirmed = window.confirm(
      `Check out ${name} to ${checkedOutBy.trim()}?`
    );

    if (!confirmed) return;

    setCheckingOut(true);

    const checkoutDate = new Date()
      .toISOString()
      .split("T")[0];

    const { error: assetUpdateError } = await supabase
      .from("assets")
      .update({
        status: "Checked Out",
        checked_out_by: checkedOutBy.trim(),
        ministry: ministry.trim() || null,
        checkout_date: checkoutDate,
        due_date: dueDate,
      })
      .eq("id", assetId);

    if (assetUpdateError) {
      console.error(
        "Asset checkout update error:",
        assetUpdateError
      );

      alert(assetUpdateError.message);
      setCheckingOut(false);
      return;
    }

    const { error: historyInsertError } = await supabase
      .from("asset_checkout_history")
      .insert({
        asset_id: asset.id,
        asset_tag: asset.asset_tag,
        display_name: asset.display_name,
        checked_out_by: checkedOutBy.trim(),
        ministry: ministry.trim() || null,
        checkout_date: checkoutDate,
        due_date: dueDate,
        status: "Checked Out",
      });

    if (historyInsertError) {
      console.error(
        "Asset checkout history insert error:",
        historyInsertError
      );

      alert(
        `The asset was checked out, but its history could not be saved:\n\n${historyInsertError.message}`
      );
    } else {
      alert("Asset checked out successfully.");
    }

    setCheckingOut(false);
    setShowCheckoutForm(false);
    setCheckedOutBy("");
    setMinistry("");
    setDueDate("");

    await loadPage();
  }

  async function checkInAsset() {
    if (!asset || !assetId) return;

    const name =
      asset.display_name ||
      asset.asset_tag ||
      "this asset";

    const confirmed = window.confirm(
      `Check in ${name}?`
    );

    if (!confirmed) return;

    setCheckingIn(true);

    const checkinDate = new Date()
      .toISOString()
      .split("T")[0];

    const { error: assetUpdateError } = await supabase
      .from("assets")
      .update({
        status: "Available",
        checked_out_by: null,
        ministry: null,
        checkout_date: null,
        due_date: null,
      })
      .eq("id", assetId);

    if (assetUpdateError) {
      console.error(
        "Asset check-in update error:",
        assetUpdateError
      );

      alert(assetUpdateError.message);
      setCheckingIn(false);
      return;
    }

    const { error: historyUpdateError } = await supabase
      .from("asset_checkout_history")
      .update({
        checkin_date: checkinDate,
        status: "Returned",
      })
      .eq("asset_id", assetId)
      .eq("status", "Checked Out")
      .is("checkin_date", null);

    if (historyUpdateError) {
      console.error(
        "Asset checkout history update error:",
        historyUpdateError
      );

      alert(
        `The asset was checked in, but its history could not be updated:\n\n${historyUpdateError.message}`
      );
    } else {
      alert("Asset checked in successfully.");
    }

    setCheckingIn(false);

    await loadPage();
  }

  function printQRCode() {
    window.print();
  }

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold">
          Loading asset...
        </h1>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold">
          Asset Not Found
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

  const normalizedStatus = normalizeStatus(asset.status);

  const isAvailable =
    normalizedStatus === "available";

  const isCheckedOut =
    normalizedStatus === "checked out";

  const displayName =
    asset.display_name ||
    equipment?.name ||
    asset.asset_tag ||
    "Unnamed Asset";

  const qrUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/assets/${asset.id}`
      : "";

  return (
    <div className="p-8">
      <Link
        href={
          equipment
            ? `/inventory/${equipment.id}`
            : "/inventory"
        }
        className="text-blue-600 hover:underline"
      >
        ← Back
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-3">
        <div className="rounded-2xl bg-white p-8 shadow lg:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="text-sm font-medium uppercase tracking-wide text-gray-500">
                Individual Asset
              </p>

              <h1 className="mt-2 text-4xl font-bold">
                {displayName}
              </h1>

              <p className="mt-2 text-gray-500">
                Asset Tag:{" "}
                {asset.asset_tag || "Not assigned"}
              </p>
            </div>

            <span
              className={`rounded-full px-4 py-2 font-semibold ${statusClasses(
                asset.status
              )}`}
            >
              {asset.status || "Unknown"}
            </span>
          </div>

          {isCheckedOut && (
            <div className="mt-8 rounded-xl border border-yellow-300 bg-yellow-50 p-6">
              <h2 className="text-xl font-bold text-yellow-900">
                Currently Checked Out
              </h2>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-yellow-700">
                    Checked Out By
                  </p>

                  <p className="mt-1 font-semibold text-yellow-950">
                    {asset.checked_out_by || "—"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-yellow-700">
                    Ministry
                  </p>

                  <p className="mt-1 font-semibold text-yellow-950">
                    {asset.ministry || "—"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-yellow-700">
                    Checkout Date
                  </p>

                  <p className="mt-1 font-semibold text-yellow-950">
                    {formatDate(asset.checkout_date)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-yellow-700">
                    Due Date
                  </p>

                  <p className="mt-1 font-semibold text-yellow-950">
                    {formatDate(asset.due_date)}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border p-5">
              <p className="text-sm text-gray-500">
                Equipment Type
              </p>

              <p className="mt-1 text-xl font-semibold">
                {equipment?.name || "—"}
              </p>
            </div>

            <div className="rounded-xl border p-5">
              <p className="text-sm text-gray-500">
                Category
              </p>

              <p className="mt-1 text-xl font-semibold">
                {equipment?.category || "—"}
              </p>
            </div>

            <div className="rounded-xl border p-5">
              <p className="text-sm text-gray-500">
                Serial Number
              </p>

              <p className="mt-1 text-xl font-semibold">
                {asset.serial_number || "—"}
              </p>
            </div>

            <div className="rounded-xl border p-5">
              <p className="text-sm text-gray-500">
                Location
              </p>

              <p className="mt-1 text-xl font-semibold">
                {asset.location || "—"}
              </p>
            </div>

            <div className="rounded-xl border p-5">
              <p className="text-sm text-gray-500">
                Purchase Date
              </p>

              <p className="mt-1 text-xl font-semibold">
                {formatDate(asset.purchase_date)}
              </p>
            </div>

            <div className="rounded-xl border p-5">
              <p className="text-sm text-gray-500">
                Purchase Price
              </p>

              <p className="mt-1 text-xl font-semibold">
                {formatCurrency(asset.purchase_price)}
              </p>
            </div>

            <div className="rounded-xl border p-5">
              <p className="text-sm text-gray-500">
                Warranty Expires
              </p>

              <p className="mt-1 text-xl font-semibold">
                {formatDate(asset.warranty_expires)}
              </p>
            </div>

            <div className="rounded-xl border p-5">
              <p className="text-sm text-gray-500">
                Added
              </p>

              <p className="mt-1 text-xl font-semibold">
                {formatDate(asset.created_at)}
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-xl border p-6">
            <h2 className="text-xl font-bold">
              Notes
            </h2>

            <p className="mt-3 text-gray-700">
              {asset.notes || "No notes available."}
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-4">
            <Button disabled>
              Edit Asset
            </Button>

            {isAvailable && (
              <Button
                onClick={() =>
                  setShowCheckoutForm(true)
                }
              >
                Check Out Asset
              </Button>
            )}

            {isCheckedOut && (
              <Button
                onClick={checkInAsset}
                disabled={checkingIn}
              >
                {checkingIn
                  ? "Checking In..."
                  : "Check In Asset"}
              </Button>
            )}

            <Button
              variant="outline"
              onClick={printQRCode}
            >
              Print QR Code
            </Button>
          </div>

          {!isAvailable && !isCheckedOut && (
            <p className="mt-4 text-sm text-gray-500">
              This asset cannot be checked out while its
              status is {asset.status || "Unknown"}.
            </p>
          )}

          {showCheckoutForm && isAvailable && (
            <div className="mt-8 rounded-xl border bg-gray-50 p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold">
                    Check Out Asset
                  </h2>

                  <p className="mt-1 text-gray-500">
                    {displayName}
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
                    placeholder="Who is borrowing this asset?"
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
                  onClick={checkOutAsset}
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
            Asset QR Code
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
            Scan this code to open this individual asset.
          </p>
        </div>
      </div>

      <div className="mt-8 rounded-2xl bg-white p-8 shadow">
        <h2 className="text-3xl font-bold">
          Checkout History
        </h2>

        <p className="mt-2 text-gray-500">
          Checkout activity for this individual asset.
        </p>

        {history.length === 0 ? (
          <div className="mt-8 rounded-xl border border-dashed p-10 text-center">
            <h3 className="text-xl font-semibold">
              No checkout history
            </h3>

            <p className="mt-2 text-gray-500">
              Activity will appear here after this asset is
              checked out.
            </p>
          </div>
        ) : (
          <div className="mt-8 overflow-x-auto rounded-xl border">
            <table className="w-full min-w-[850px]">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-4 text-left">
                    Borrower
                  </th>

                  <th className="p-4 text-left">
                    Ministry
                  </th>

                  <th className="p-4 text-left">
                    Checkout Date
                  </th>

                  <th className="p-4 text-left">
                    Due Date
                  </th>

                  <th className="p-4 text-left">
                    Check-In Date
                  </th>

                  <th className="p-4 text-left">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {history.map((record) => (
                  <tr
                    key={record.id}
                    className="border-t"
                  >
                    <td className="p-4 font-medium">
                      {record.checked_out_by || "—"}
                    </td>

                    <td className="p-4">
                      {record.ministry || "—"}
                    </td>

                    <td className="p-4">
                      {formatDate(record.checkout_date)}
                    </td>

                    <td className="p-4">
                      {formatDate(record.due_date)}
                    </td>

                    <td className="p-4">
                      {formatDate(record.checkin_date)}
                    </td>

                    <td className="p-4">
                      <span
                        className={`rounded-full px-3 py-1 text-sm font-medium ${
                          normalizeStatus(record.status) ===
                          "returned"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {record.status || "Unknown"}
                      </span>
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