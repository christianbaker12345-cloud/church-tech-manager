"use client";

import AssetHeader from "@/components/assets/AssetHeader";
import AssetActionBar from "@/components/assets/AssetActionBar";
import AssetInformation from "@/components/assets/AssetInformation";
import AssetQRCode from "@/components/assets/AssetQRCode";
import AssetPhotos from "@/components/assets/AssetPhotos";
import CheckoutHistory, {
  type AssetCheckoutHistory,
} from "@/components/assets/CheckoutHistory";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
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


type AssetPhoto = {
  id: string;
  asset_id: string;
  image_url: string;
  caption: string | null;
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

  const [photos, setPhotos] = useState<AssetPhoto[]>([]);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoCaption, setPhotoCaption] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);

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

    const photosResult = await supabase
      .from("asset_photos")
      .select("*")
      .eq("asset_id", assetId)
      .order("created_at", { ascending: false });

    if (photosResult.error) {
      console.error("Asset photos load error:", photosResult.error);
      setPhotos([]);
    } else {
      setPhotos((photosResult.data ?? []) as AssetPhoto[]);
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

  async function uploadAssetPhoto() {
    if (!asset || !assetId || !photoFile) {
      alert("Choose a photo first.");
      return;
    }

    if (!photoFile.type.startsWith("image/")) {
      alert("Please choose an image file.");
      return;
    }

    const maxFileSize = 10 * 1024 * 1024;

    if (photoFile.size > maxFileSize) {
      alert("Please choose an image smaller than 10 MB.");
      return;
    }

    setUploadingPhoto(true);

    const extension = photoFile.name.split(".").pop()?.toLowerCase() || "jpg";
    const storagePath = `${assetId}/${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("asset-photos")
      .upload(storagePath, photoFile, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Asset photo upload error:", uploadError);
      alert(uploadError.message);
      setUploadingPhoto(false);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from("asset-photos")
      .getPublicUrl(storagePath);

    const { error: photoInsertError } = await supabase
      .from("asset_photos")
      .insert({
        asset_id: asset.id,
        image_url: publicUrlData.publicUrl,
        caption: photoCaption.trim() || null,
      });

    if (photoInsertError) {
      console.error("Asset photo record error:", photoInsertError);

      await supabase.storage
        .from("asset-photos")
        .remove([storagePath]);

      alert(photoInsertError.message);
      setUploadingPhoto(false);
      return;
    }

    setPhotoFile(null);
    setPhotoCaption("");

    const fileInput = document.getElementById(
      "asset-photo-input"
    ) as HTMLInputElement | null;

    if (fileInput) {
      fileInput.value = "";
    }

    setUploadingPhoto(false);
    await loadPage();
  }

  async function deleteAssetPhoto(photo: AssetPhoto) {
    const confirmed = window.confirm(
      "Delete this photo permanently?"
    );

    if (!confirmed) return;

    setDeletingPhotoId(photo.id);

    const storageMarker =
      "/storage/v1/object/public/asset-photos/";
    const markerIndex = photo.image_url.indexOf(storageMarker);

    if (markerIndex !== -1) {
      const encodedPath = photo.image_url.slice(
        markerIndex + storageMarker.length
      );
      const storagePath = decodeURIComponent(encodedPath);

      const { error: storageDeleteError } = await supabase.storage
        .from("asset-photos")
        .remove([storagePath]);

      if (storageDeleteError) {
        console.error(
          "Asset photo storage delete error:",
          storageDeleteError
        );
        alert(storageDeleteError.message);
        setDeletingPhotoId(null);
        return;
      }
    }

    const { error: recordDeleteError } = await supabase
      .from("asset_photos")
      .delete()
      .eq("id", photo.id);

    if (recordDeleteError) {
      console.error(
        "Asset photo record delete error:",
        recordDeleteError
      );
      alert(recordDeleteError.message);
      setDeletingPhotoId(null);
      return;
    }

    setDeletingPhotoId(null);
    await loadPage();
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
          <AssetHeader
            title={displayName}
            assetTag={asset.asset_tag}
            status={asset.status}
            statusClasses={statusClasses}
          />

          <AssetInformation
            asset={asset}
            equipment={equipment}
            isCheckedOut={isCheckedOut}
            formatDate={formatDate}
            formatCurrency={formatCurrency}
          />

          <AssetActionBar
            assetId={asset.id}
            isAvailable={isAvailable}
            isCheckedOut={isCheckedOut}
            checkingIn={checkingIn}
            onShowCheckoutForm={() => setShowCheckoutForm(true)}
            onCheckIn={checkInAsset}
            onPrintQRCode={printQRCode}
          />

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

        <AssetQRCode qrUrl={qrUrl} />
      </div>

      <AssetPhotos
        photos={photos}
        photoCaption={photoCaption}
        hasSelectedPhoto={photoFile !== null}
        uploadingPhoto={uploadingPhoto}
        deletingPhotoId={deletingPhotoId}
        displayName={displayName}
        formatDate={formatDate}
        onPhotoFileChange={setPhotoFile}
        onPhotoCaptionChange={setPhotoCaption}
        onUploadPhoto={uploadAssetPhoto}
        onDeletePhoto={deleteAssetPhoto}
      />

      <CheckoutHistory
        history={history}
        formatDate={formatDate}
        normalizeStatus={normalizeStatus}
      />
    </div>
  );
}