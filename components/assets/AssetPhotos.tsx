"use client";

import { Button } from "@/components/ui/button";

export type AssetPhoto = {
  id: string;
  asset_id: string;
  image_url: string;
  caption: string | null;
  created_at: string | null;
};

type AssetPhotosProps = {
  photos: AssetPhoto[];
  photoCaption: string;
  hasSelectedPhoto: boolean;
  uploadingPhoto: boolean;
  deletingPhotoId: string | null;
  displayName: string;
  formatDate: (date: string | null) => string;
  onPhotoFileChange: (file: File | null) => void;
  onPhotoCaptionChange: (caption: string) => void;
  onUploadPhoto: () => void;
  onDeletePhoto: (photo: AssetPhoto) => void;
};

export default function AssetPhotos({
  photos,
  photoCaption,
  hasSelectedPhoto,
  uploadingPhoto,
  deletingPhotoId,
  displayName,
  formatDate,
  onPhotoFileChange,
  onPhotoCaptionChange,
  onUploadPhoto,
  onDeletePhoto,
}: AssetPhotosProps) {
  return (
    <div className="mt-8 rounded-2xl bg-white p-8 shadow">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold">Asset Photos</h2>

          <p className="mt-2 text-gray-500">
            Add identification, serial-number, damage, and receipt photos.
          </p>
        </div>

        <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
          {photos.length} {photos.length === 1 ? "photo" : "photos"}
        </span>
      </div>

      <div className="mt-8 rounded-xl border bg-gray-50 p-6">
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block font-medium">Photo</label>

            <input
              id="asset-photo-input"
              type="file"
              accept="image/*"
              className="block w-full rounded-lg border bg-white p-3 text-sm"
              onChange={(event) =>
                onPhotoFileChange(event.target.files?.[0] ?? null)
              }
            />

            <p className="mt-2 text-sm text-gray-500">
              JPG, PNG, HEIC, or another image format up to 10 MB.
            </p>
          </div>

          <div>
            <label className="mb-2 block font-medium">Caption</label>

            <input
              type="text"
              value={photoCaption}
              onChange={(event) =>
                onPhotoCaptionChange(event.target.value)
              }
              className="w-full rounded-lg border bg-white p-3"
              placeholder="Front, serial number, damage, receipt..."
            />
          </div>
        </div>

        <Button
          className="mt-5"
          onClick={onUploadPhoto}
          disabled={!hasSelectedPhoto || uploadingPhoto}
        >
          {uploadingPhoto ? "Uploading Photo..." : "Upload Photo"}
        </Button>
      </div>

      {photos.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed p-10 text-center">
          <h3 className="text-xl font-semibold">No photos yet</h3>

          <p className="mt-2 text-gray-500">
            Upload the first photo for this individual asset.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="overflow-hidden rounded-xl border bg-white"
            >
              <a
                href={photo.image_url}
                target="_blank"
                rel="noreferrer"
                className="block"
              >
                <img
                  src={photo.image_url}
                  alt={photo.caption || displayName}
                  className="h-64 w-full object-cover"
                />
              </a>

              <div className="p-4">
                <p className="font-medium">
                  {photo.caption || "Asset photo"}
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Added {formatDate(photo.created_at)}
                </p>

                <Button
                  className="mt-4"
                  type="button"
                  variant="outline"
                  onClick={() => onDeletePhoto(photo)}
                  disabled={deletingPhotoId === photo.id}
                >
                  {deletingPhotoId === photo.id
                    ? "Deleting..."
                    : "Delete Photo"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}