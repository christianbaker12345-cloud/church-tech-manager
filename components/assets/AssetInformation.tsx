"use client";

import { useEffect, useState } from "react";
import { Check, Pencil, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

type AssetInformationAsset = {
  id: string;
  serial_number: string | null;
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

type AssetInformationEquipment = {
  name: string;
  category: string | null;
};

type AssetInformationProps = {
  asset: AssetInformationAsset;
  equipment: AssetInformationEquipment | null;
  isCheckedOut: boolean;
  formatDate: (date: string | null) => string;
  formatCurrency: (value: number | null) => string;
  canManage: boolean;
};

type EditableField =
  | "serial_number"
  | "location"
  | "purchase_date"
  | "purchase_price"
  | "warranty_expires"
  | "notes";

type EditableValues = {
  serial_number: string;
  location: string;
  purchase_date: string;
  purchase_price: string;
  warranty_expires: string;
  notes: string;
};

export default function AssetInformation({
  asset,
  equipment,
  isCheckedOut,
  formatDate,
  formatCurrency,
  canManage,
}: AssetInformationProps) {
  const [editingField, setEditingField] =
    useState<EditableField | null>(null);

  const [savingField, setSavingField] =
    useState<EditableField | null>(null);

  const [saveError, setSaveError] = useState("");

  const [values, setValues] = useState<EditableValues>({
    serial_number: asset.serial_number ?? "",
    location: asset.location ?? "",
    purchase_date: asset.purchase_date ?? "",
    purchase_price:
      asset.purchase_price !== null
        ? String(asset.purchase_price)
        : "",
    warranty_expires: asset.warranty_expires ?? "",
    notes: asset.notes ?? "",
  });

  useEffect(() => {
    setValues({
      serial_number: asset.serial_number ?? "",
      location: asset.location ?? "",
      purchase_date: asset.purchase_date ?? "",
      purchase_price:
        asset.purchase_price !== null
          ? String(asset.purchase_price)
          : "",
      warranty_expires: asset.warranty_expires ?? "",
      notes: asset.notes ?? "",
    });
  }, [asset]);

  function beginEditing(field: EditableField) {
    if (!canManage) return;

    setSaveError("");
    setEditingField(field);
  }

  function cancelEditing() {
    setValues({
      serial_number: asset.serial_number ?? "",
      location: asset.location ?? "",
      purchase_date: asset.purchase_date ?? "",
      purchase_price:
        asset.purchase_price !== null
          ? String(asset.purchase_price)
          : "",
      warranty_expires: asset.warranty_expires ?? "",
      notes: asset.notes ?? "",
    });

    setSaveError("");
    setEditingField(null);
  }

  function changeValue(field: EditableField, value: string) {
    setValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }));
  }

  async function saveField(field: EditableField) {
    if (!canManage) {
      setSaveError("You do not have permission to edit this asset.");
      return;
    }

    setSavingField(field);
    setSaveError("");

    let databaseValue: string | number | null =
      values[field].trim() || null;

    if (field === "purchase_price") {
      const trimmedPrice = values.purchase_price.trim();

      if (trimmedPrice === "") {
        databaseValue = null;
      } else {
        const parsedPrice = Number(trimmedPrice);

        if (
          Number.isNaN(parsedPrice) ||
          parsedPrice < 0
        ) {
          setSaveError(
            "Purchase price must be a valid positive number."
          );
          setSavingField(null);
          return;
        }

        databaseValue = parsedPrice;
      }
    }

    const { error } = await supabase
      .from("assets")
      .update({
        [field]: databaseValue,
      })
      .eq("id", asset.id);

    if (error) {
      console.error(
        `Asset ${field} update error:`,
        error
      );

      setSaveError(error.message);
      setSavingField(null);
      return;
    }

    setSavingField(null);
    setEditingField(null);
  }

  const details = [
    {
      label: "Equipment Type",
      value: equipment?.name || "Not assigned",
      icon: "📦",
      editable: false as const,
    },
    {
      label: "Category",
      value: equipment?.category || "Not assigned",
      icon: "🏷️",
      editable: false as const,
    },
    {
      label: "Serial Number",
      value: values.serial_number || "Not recorded",
      icon: "🔢",
      editable: true as const,
      field: "serial_number" as const,
      inputType: "text",
      placeholder: "Enter serial number",
    },
    {
      label: "Location",
      value: values.location || "Not assigned",
      icon: "📍",
      editable: true as const,
      field: "location" as const,
      inputType: "text",
      placeholder: "Enter location",
    },
    {
      label: "Purchase Date",
      value: formatDate(values.purchase_date || null),
      icon: "📅",
      editable: true as const,
      field: "purchase_date" as const,
      inputType: "date",
      placeholder: "",
    },
    {
      label: "Purchase Price",
      value: formatCurrency(
        values.purchase_price.trim() === ""
          ? null
          : Number(values.purchase_price)
      ),
      icon: "💰",
      editable: true as const,
      field: "purchase_price" as const,
      inputType: "number",
      placeholder: "0.00",
    },
    {
      label: "Warranty Expires",
      value: formatDate(values.warranty_expires || null),
      icon: "🛡️",
      editable: true as const,
      field: "warranty_expires" as const,
      inputType: "date",
      placeholder: "",
    },
    {
      label: "Added",
      value: formatDate(asset.created_at),
      icon: "🕒",
      editable: false as const,
    },
  ];

  return (
    <div className="mt-8 space-y-8">
      {isCheckedOut && (
        <section className="overflow-hidden rounded-2xl border border-amber-200 bg-amber-50 shadow-sm">
          <div className="border-b border-amber-200 bg-amber-100/70 px-6 py-4">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-amber-700">
              Current Assignment
            </p>

            <h2 className="mt-1 text-2xl font-bold text-amber-950">
              Equipment is currently transferred
            </h2>
          </div>

          <div className="grid gap-6 p-6 sm:grid-cols-2 xl:grid-cols-4">
            <AssignmentItem
              label="Transferred To"
              value={asset.checked_out_by || "Not recorded"}
            />

            <AssignmentItem
              label="Department"
              value={asset.ministry || "Not recorded"}
            />

            <AssignmentItem
              label="Transfer Date"
              value={formatDate(asset.checkout_date)}
            />

            <AssignmentItem
              label="Due Back"
              value={formatDate(asset.due_date)}
              emphasize
            />
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
            Equipment Profile
          </p>

          <h2 className="mt-2 text-2xl font-bold text-slate-950">
            Equipment information
          </h2>

          <p className="mt-2 text-slate-500">
            {canManage
              ? "Click an editable card to update its information."
              : "Asset details and stewardship information."}
          </p>
        </div>

        {saveError && (
          <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
            {saveError}
          </div>
        )}

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {details.map((item) => {
            if (!item.editable || !canManage) {
              return (
                <InformationCard
                  key={item.label}
                  label={item.label}
                  value={item.value}
                  icon={item.icon}
                />
              );
            }

            return (
              <EditableInformationCard
                key={item.label}
                label={item.label}
                value={item.value}
                icon={item.icon}
                field={item.field}
                inputValue={values[item.field]}
                inputType={item.inputType}
                placeholder={item.placeholder}
                editing={editingField === item.field}
                saving={savingField === item.field}
                onEdit={() => beginEditing(item.field)}
                onChange={(value) =>
                  changeValue(item.field, value)
                }
                onSave={() => saveField(item.field)}
                onCancel={cancelEditing}
              />
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xl">
              📝
            </div>

            <div className="min-w-0">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                Notes
              </p>

              <h2 className="mt-2 text-2xl font-bold text-slate-950">
                Internal details
              </h2>
            </div>
          </div>

          {canManage && editingField !== "notes" && (
            <Button
              variant="outline"
              onClick={() => beginEditing("notes")}
            >
              <Pencil className="h-4 w-4" />
              Edit Notes
            </Button>
          )}
        </div>

        {canManage && editingField === "notes" ? (
          <div className="mt-5">
            <textarea
              value={values.notes}
              onChange={(event) =>
                changeValue("notes", event.target.value)
              }
              placeholder="Add internal notes about this asset..."
              rows={6}
              autoFocus
              className="w-full resize-y rounded-xl border border-blue-300 bg-white px-4 py-3 leading-7 text-slate-800 outline-none ring-4 ring-blue-100"
            />

            <div className="mt-4 flex flex-wrap justify-end gap-3">
              <Button
                variant="outline"
                onClick={cancelEditing}
                disabled={savingField === "notes"}
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>

              <Button
                onClick={() => saveField("notes")}
                disabled={savingField === "notes"}
              >
                <Check className="h-4 w-4" />
                {savingField === "notes"
                  ? "Saving..."
                  : "Save Notes"}
              </Button>
            </div>
          </div>
        ) : (
          canManage ? (
            <button
              type="button"
              onClick={() => beginEditing("notes")}
              className="mt-5 w-full rounded-xl bg-slate-50 p-5 text-left transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
            >
              <p className="whitespace-pre-wrap leading-7 text-slate-700">
                {values.notes ||
                  "No notes have been added for this equipment item."}
              </p>
            </button>
          ) : (
            <div className="mt-5 w-full rounded-xl bg-slate-50 p-5 text-left">
              <p className="whitespace-pre-wrap leading-7 text-slate-700">
                {values.notes ||
                  "No notes have been added for this equipment item."}
              </p>
            </div>
          )
        )}
      </section>
    </div>
  );
}

type InformationCardProps = {
  label: string;
  value: string;
  icon: string;
};

function InformationCard({
  label,
  value,
  icon,
}: InformationCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-lg shadow-sm">
        {icon}
      </div>

      <p className="mt-4 text-sm font-medium text-slate-500">
        {label}
      </p>

      <p className="mt-1 break-words text-lg font-semibold text-slate-950">
        {value}
      </p>
    </article>
  );
}

type EditableInformationCardProps = {
  label: string;
  value: string;
  icon: string;
  field: EditableField;
  inputValue: string;
  inputType: string;
  placeholder: string;
  editing: boolean;
  saving: boolean;
  onEdit: () => void;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
};

function EditableInformationCard({
  label,
  value,
  icon,
  field,
  inputValue,
  inputType,
  placeholder,
  editing,
  saving,
  onEdit,
  onChange,
  onSave,
  onCancel,
}: EditableInformationCardProps) {
  if (editing) {
    return (
      <article className="rounded-2xl border border-blue-300 bg-blue-50 p-5 ring-4 ring-blue-100">
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-lg shadow-sm">
            {icon}
          </div>

          <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-700">
            Editing
          </span>
        </div>

        <label className="mt-4 block text-sm font-semibold text-slate-700">
          {label}
        </label>

        <input
          type={inputType}
          value={inputValue}
          min={field === "purchase_price" ? "0" : undefined}
          step={
            field === "purchase_price" ? "0.01" : undefined
          }
          placeholder={placeholder}
          autoFocus
          onChange={(event) =>
            onChange(event.target.value)
          }
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              onSave();
            }

            if (event.key === "Escape") {
              onCancel();
            }
          }}
          className="mt-2 w-full rounded-xl border border-blue-300 bg-white px-3 py-2.5 text-slate-950 outline-none focus:ring-4 focus:ring-blue-100"
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
      </article>
    );
  }

  return (
    <button
      type="button"
      onClick={onEdit}
      className="group rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-white hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-lg shadow-sm">
          {icon}
        </div>

        <Pencil className="h-4 w-4 text-slate-300 transition group-hover:text-blue-600" />
      </div>

      <p className="mt-4 text-sm font-medium text-slate-500">
        {label}
      </p>

      <p className="mt-1 break-words text-lg font-semibold text-slate-950">
        {value}
      </p>

      <p className="mt-3 text-xs font-semibold text-blue-600 opacity-0 transition group-hover:opacity-100">
        Click to edit
      </p>
    </button>
  );
}

type AssignmentItemProps = {
  label: string;
  value: string;
  emphasize?: boolean;
};

function AssignmentItem({
  label,
  value,
  emphasize = false,
}: AssignmentItemProps) {
  return (
    <div>
      <p className="text-sm font-medium text-amber-700">
        {label}
      </p>

      <p
        className={`mt-1 font-semibold ${
          emphasize
            ? "text-lg text-rose-700"
            : "text-amber-950"
        }`}
      >
        {value}
      </p>
    </div>
  );
} 