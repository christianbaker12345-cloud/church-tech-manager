"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

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
  manufacturer: string | null;
  model: string | null;
  condition: string | null;
  notes: string | null;
};

type Equipment = {
  id: string;
  name: string;
};

const statusOptions = [
  "Available",
  "Checked Out",
  "Maintenance",
  "In Repair",
  "Retired",
];

const conditionOptions = [
  "New",
  "Excellent",
  "Good",
  "Fair",
  "Poor",
  "Damaged",
];

export default function EditAssetPage() {
  const params = useParams();
  const router = useRouter();

  const assetId = Array.isArray(params.id)
    ? params.id[0]
    : params.id;

  const [asset, setAsset] = useState<Asset | null>(null);
  const [equipment, setEquipment] = useState<Equipment | null>(
    null
  );

  const [displayName, setDisplayName] = useState("");
  const [assetTag, setAssetTag] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [model, setModel] = useState("");
  const [condition, setCondition] = useState("Good");
  const [status, setStatus] = useState("Available");
  const [location, setLocation] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [warrantyExpires, setWarrantyExpires] = useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (assetId) {
      loadAsset();
    }
  }, [assetId]);

  async function loadAsset() {
    if (!assetId) return;

    setLoading(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("assets")
      .select("*")
      .eq("id", assetId)
      .maybeSingle();

    if (error) {
      console.error("Asset load error:", error);
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }

    if (!data) {
      setErrorMessage("No asset was found with this ID.");
      setLoading(false);
      return;
    }

    const loadedAsset = data as Asset;

    setAsset(loadedAsset);
    setDisplayName(loadedAsset.display_name ?? "");
    setAssetTag(loadedAsset.asset_tag ?? "");
    setSerialNumber(loadedAsset.serial_number ?? "");
    setManufacturer(loadedAsset.manufacturer ?? "");
    setModel(loadedAsset.model ?? "");
    setCondition(loadedAsset.condition ?? "Good");
    setStatus(loadedAsset.status ?? "Available");
    setLocation(loadedAsset.location ?? "");
    setPurchaseDate(loadedAsset.purchase_date ?? "");
    setPurchasePrice(
      loadedAsset.purchase_price !== null
        ? String(loadedAsset.purchase_price)
        : ""
    );
    setWarrantyExpires(loadedAsset.warranty_expires ?? "");
    setNotes(loadedAsset.notes ?? "");

    if (loadedAsset.equipment_id) {
      const { data: equipmentData, error: equipmentError } =
        await supabase
          .from("equipment")
          .select("id,name")
          .eq("id", loadedAsset.equipment_id)
          .maybeSingle();

      if (equipmentError) {
        console.error(
          "Equipment load error:",
          equipmentError
        );
      } else {
        setEquipment(
          (equipmentData as Equipment | null) ?? null
        );
      }
    }

    setLoading(false);
  }

  async function saveAsset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!asset || !assetId) return;

    if (!displayName.trim()) {
      alert("Enter an asset name.");
      return;
    }

    if (!assetTag.trim()) {
      alert("Enter an asset tag.");
      return;
    }

    const parsedPurchasePrice =
      purchasePrice.trim() === ""
        ? null
        : Number(purchasePrice);

    if (
      parsedPurchasePrice !== null &&
      (Number.isNaN(parsedPurchasePrice) ||
        parsedPurchasePrice < 0)
    ) {
      alert("Enter a valid purchase price.");
      return;
    }

    setSaving(true);
    setErrorMessage("");

    const { error } = await supabase
      .from("assets")
      .update({
        display_name: displayName.trim(),
        asset_tag: assetTag.trim(),
        serial_number: serialNumber.trim() || null,
        manufacturer: manufacturer.trim() || null,
        model: model.trim() || null,
        condition: condition || null,
        status: status || null,
        location: location.trim() || null,
        purchase_date: purchaseDate || null,
        purchase_price: parsedPurchasePrice,
        warranty_expires: warrantyExpires || null,
        notes: notes.trim() || null,
      })
      .eq("id", assetId);

    setSaving(false);

    if (error) {
      console.error("Asset update error:", error);

      if (
        error.message
          .toLowerCase()
          .includes("duplicate key")
      ) {
        setErrorMessage(
          "That asset tag is already being used by another asset."
        );
      } else {
        setErrorMessage(error.message);
      }

      return;
    }

    router.push(`/assets/${assetId}`);
    router.refresh();
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

  return (
    <div className="p-8">
      <Link
        href={`/assets/${asset.id}`}
        className="text-blue-600 hover:underline"
      >
        ← Back to Asset
      </Link>

      <div className="mt-6">
        <p className="text-sm font-medium uppercase tracking-wide text-gray-500">
          Individual Asset
        </p>

        <h1 className="mt-2 text-4xl font-bold">
          Edit Asset
        </h1>

        <p className="mt-2 text-gray-500">
          {equipment?.name
            ? `Equipment type: ${equipment.name}`
            : "Update this asset’s details."}
        </p>
      </div>

      {errorMessage && (
        <div className="mt-6 rounded-xl border border-red-300 bg-red-50 p-4 text-red-700">
          {errorMessage}
        </div>
      )}

      <form
        onSubmit={saveAsset}
        className="mt-8 space-y-8"
      >
        <div className="rounded-2xl bg-white p-8 shadow">
          <h2 className="text-2xl font-bold">
            Identification
          </h2>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block font-medium">
                Asset Name
              </label>

              <input
                type="text"
                value={displayName}
                onChange={(event) =>
                  setDisplayName(event.target.value)
                }
                className="w-full rounded-lg border p-3"
                placeholder="Boss Tuner Pedal #1"
                required
              />
            </div>

            <div>
              <label className="mb-2 block font-medium">
                Asset Tag
              </label>

              <input
                type="text"
                value={assetTag}
                onChange={(event) =>
                  setAssetTag(event.target.value)
                }
                className="w-full rounded-lg border p-3"
                placeholder="BTP-0001"
                required
              />
            </div>

            <div>
              <label className="mb-2 block font-medium">
                Serial Number
              </label>

              <input
                type="text"
                value={serialNumber}
                onChange={(event) =>
                  setSerialNumber(event.target.value)
                }
                className="w-full rounded-lg border p-3"
                placeholder="Manufacturer serial number"
              />
            </div>

            <div>
              <label className="mb-2 block font-medium">
                Manufacturer
              </label>

              <input
                type="text"
                value={manufacturer}
                onChange={(event) =>
                  setManufacturer(event.target.value)
                }
                className="w-full rounded-lg border p-3"
                placeholder="Boss"
              />
            </div>

            <div>
              <label className="mb-2 block font-medium">
                Model
              </label>

              <input
                type="text"
                value={model}
                onChange={(event) =>
                  setModel(event.target.value)
                }
                className="w-full rounded-lg border p-3"
                placeholder="TU-3"
              />
            </div>

            <div>
              <label className="mb-2 block font-medium">
                Condition
              </label>

              <select
                value={condition}
                onChange={(event) =>
                  setCondition(event.target.value)
                }
                className="w-full rounded-lg border bg-white p-3"
              >
                {conditionOptions.map((option) => (
                  <option
                    key={option}
                    value={option}
                  >
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow">
          <h2 className="text-2xl font-bold">
            Status and Location
          </h2>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
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
                  <option
                    key={option}
                    value={option}
                  >
                    {option}
                  </option>
                ))}
              </select>

              <p className="mt-2 text-sm text-gray-500">
                Checkout and check-in will also update this field.
              </p>
            </div>

            <div>
              <label className="mb-2 block font-medium">
                Location
              </label>

              <input
                type="text"
                value={location}
                onChange={(event) =>
                  setLocation(event.target.value)
                }
                className="w-full rounded-lg border p-3"
                placeholder="Stage Rack A"
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow">
          <h2 className="text-2xl font-bold">
            Purchase and Warranty
          </h2>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block font-medium">
                Purchase Date
              </label>

              <input
                type="date"
                value={purchaseDate}
                onChange={(event) =>
                  setPurchaseDate(event.target.value)
                }
                className="w-full rounded-lg border p-3"
              />
            </div>

            <div>
              <label className="mb-2 block font-medium">
                Purchase Price
              </label>

              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  $
                </span>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={purchasePrice}
                  onChange={(event) =>
                    setPurchasePrice(event.target.value)
                  }
                  className="w-full rounded-lg border py-3 pl-8 pr-3"
                  placeholder="99.99"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block font-medium">
                Warranty Expiration
              </label>

              <input
                type="date"
                value={warrantyExpires}
                onChange={(event) =>
                  setWarrantyExpires(event.target.value)
                }
                className="w-full rounded-lg border p-3"
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow">
          <h2 className="text-2xl font-bold">
            Notes
          </h2>

          <textarea
            value={notes}
            onChange={(event) =>
              setNotes(event.target.value)
            }
            rows={6}
            className="mt-6 w-full rounded-lg border p-3"
            placeholder="Condition details, accessories, damage, service notes..."
          />
        </div>

        <div className="flex flex-wrap gap-4">
          <Button
            type="submit"
            disabled={saving}
          >
            {saving ? "Saving Asset..." : "Save Asset"}
          </Button>

          <Link href={`/assets/${asset.id}`}>
            <Button
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}