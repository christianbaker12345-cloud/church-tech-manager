"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

type ExportType =
  | "equipment-summary"
  | "equipment-items"
  | "maintenance"
  | "transfers";

export default function ExportCenterPage() {
  const [exporting, setExporting] = useState<ExportType | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  function escapeCsvValue(value: unknown) {
    if (value === null || value === undefined) {
      return "";
    }

    const text = String(value).replace(/"/g, '""');
    return `"${text}"`;
  }

  function downloadCsv(
    filename: string,
    headers: string[],
    rows: unknown[][]
  ) {
    const csvContent = [
      headers.map(escapeCsvValue).join(","),
      ...rows.map((row) =>
        row.map(escapeCsvValue).join(",")
      ),
    ].join("\n");

    const csvWithBom = `\uFEFF${csvContent}`;
    const blob = new Blob([csvWithBom], {
      type: "text/csv;charset=utf-8;",
    });

    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = downloadUrl;
    link.download = filename;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);
  }

  function today() {
    return new Date().toISOString().split("T")[0];
  }

  async function exportEquipmentSummary() {
    setExporting("equipment-summary");
    setErrorMessage("");

    const { data, error } = await supabase
      .from("equipment")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error("Equipment summary export error:", error);
      setErrorMessage(error.message);
      setExporting(null);
      return;
    }

    const rows = (data ?? []).map((item) => [
      item.id,
      item.name,
      item.category,
      item.quantity ?? 0,
      item.status,
      item.location,
      item.notes,
      item.created_at,
    ]);

    downloadCsv(
      `equipment-summary-${today()}.csv`,
      [
        "Equipment ID",
        "Equipment Name",
        "Category",
        "Quantity",
        "Status",
        "Location",
        "Notes",
        "Created Date",
      ],
      rows
    );

    setExporting(null);
  }

  async function exportEquipmentItems() {
    setExporting("equipment-items");
    setErrorMessage("");

    const { data, error } = await supabase
      .from("assets")
      .select(
        `
          id,
          equipment_id,
          asset_tag,
          display_name,
          serial_number,
          status,
          location,
          purchase_date,
          purchase_price,
          warranty_expires,
          notes,
          created_at,
          checked_out_by,
          ministry,
          checkout_date,
          due_date,
          equipment (
            name,
            category
          )
        `
      )
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Equipment item export error:", error);
      setErrorMessage(error.message);
      setExporting(null);
      return;
    }

    const rows = (data ?? []).map((item) => {
      const equipment = Array.isArray(item.equipment)
        ? item.equipment[0]
        : item.equipment;

      return [
        item.id,
        item.asset_tag,
        item.display_name,
        equipment?.name,
        equipment?.category,
        item.serial_number,
        item.status,
        item.location,
        item.purchase_date,
        item.purchase_price,
        item.warranty_expires,
        item.checked_out_by,
        item.ministry,
        item.checkout_date,
        item.due_date,
        item.notes,
        item.created_at,
      ];
    });

    downloadCsv(
      `equipment-items-${today()}.csv`,
      [
        "Equipment Item ID",
        "Equipment Tag",
        "Display Name",
        "Equipment Model",
        "Category",
        "Serial Number",
        "Status",
        "Location",
        "Purchase Date",
        "Purchase Price",
        "Warranty Expiration",
        "Transferred To",
        "Ministry",
        "Transfer Date",
        "Due Date",
        "Notes",
        "Created Date",
      ],
      rows
    );

    setExporting(null);
  }

  async function exportMaintenanceHistory() {
    setExporting("maintenance");
    setErrorMessage("");

    const { data, error } = await supabase
      .from("asset_maintenance")
      .select(
        `
          id,
          asset_id,
          issue_title,
          description,
          status,
          priority,
          technician,
          repair_cost,
          opened_date,
          completed_date,
          next_service_date,
          resolution_notes,
          created_at,
          updated_at,
          assets (
            asset_tag,
            display_name,
            serial_number,
            location
          )
        `
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Maintenance export error:", error);
      setErrorMessage(error.message);
      setExporting(null);
      return;
    }

    const rows = (data ?? []).map((record) => {
      const equipment = Array.isArray(record.assets)
        ? record.assets[0]
        : record.assets;

      return [
        record.id,
        record.asset_id,
        equipment?.asset_tag,
        equipment?.display_name,
        equipment?.serial_number,
        equipment?.location,
        record.issue_title,
        record.description,
        record.priority,
        record.status,
        record.technician,
        record.repair_cost,
        record.opened_date,
        record.completed_date,
        record.next_service_date,
        record.resolution_notes,
        record.created_at,
        record.updated_at,
      ];
    });

    downloadCsv(
      `maintenance-history-${today()}.csv`,
      [
        "Maintenance Record ID",
        "Equipment Item ID",
        "Equipment Tag",
        "Display Name",
        "Serial Number",
        "Location",
        "Issue Title",
        "Description",
        "Priority",
        "Status",
        "Technician",
        "Repair Cost",
        "Opened Date",
        "Completed Date",
        "Next Service Date",
        "Resolution Notes",
        "Created Date",
        "Updated Date",
      ],
      rows
    );

    setExporting(null);
  }

  async function exportTransferHistory() {
    setExporting("transfers");
    setErrorMessage("");

    const { data, error } = await supabase
      .from("asset_checkout_history")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Transfer history export error:", error);
      setErrorMessage(error.message);
      setExporting(null);
      return;
    }

    const rows = (data ?? []).map((record) => [
      record.id,
      record.asset_id,
      record.asset_tag,
      record.display_name,
      record.checked_out_by,
      record.ministry,
      record.checkout_date,
      record.due_date,
      record.checkin_date,
      record.status,
      record.created_at,
    ]);

    downloadCsv(
      `equipment-transfer-history-${today()}.csv`,
      [
        "Transfer Record ID",
        "Equipment Item ID",
        "Equipment Tag",
        "Display Name",
        "Transferred To",
        "Ministry",
        "Transfer Date",
        "Due Date",
        "Return Date",
        "Status",
        "Created Date",
      ],
      rows
    );

    setExporting(null);
  }

  const exportCards = [
    {
      id: "equipment-summary" as const,
      title: "Equipment Summary",
      description:
        "One row per equipment type, including quantity, category, status, and location.",
      buttonText: "Export Summary",
      onClick: exportEquipmentSummary,
    },
    {
      id: "equipment-items" as const,
      title: "Individual Equipment Items",
      description:
        "One row per tagged item, including serial number, purchase details, warranty, and current status.",
      buttonText: "Export Items",
      onClick: exportEquipmentItems,
    },
    {
      id: "maintenance" as const,
      title: "Maintenance History",
      description:
        "All maintenance records with issue details, priority, technician, repair cost, and resolution.",
      buttonText: "Export Maintenance",
      onClick: exportMaintenanceHistory,
    },
    {
      id: "transfers" as const,
      title: "Transfer History",
      description:
        "All temporary equipment transfers, due dates, returns, ministries, and recipients.",
      buttonText: "Export Transfers",
      onClick: exportTransferHistory,
    },
  ];

  return (
    <div className="p-8">
      <Link
        href="/inventory"
        className="text-blue-600 hover:underline"
      >
        ← Back to Equipment
      </Link>

      <div className="mt-6">
        <p className="text-sm font-medium uppercase tracking-wide text-gray-500">
          Administrative Tools
        </p>

        <h1 className="mt-2 text-4xl font-bold">
          Export Center
        </h1>

        <p className="mt-2 max-w-3xl text-gray-500">
          Download equipment, maintenance, and transfer data as CSV files
          for audits, insurance, budgeting, and record keeping.
        </p>
      </div>

      {errorMessage && (
        <div className="mt-6 rounded-xl border border-red-300 bg-red-50 p-4 text-red-700">
          <p className="font-semibold">The export could not be completed.</p>
          <p className="mt-1 text-sm">{errorMessage}</p>
        </div>
      )}

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {exportCards.map((card) => (
          <section
            key={card.id}
            className="rounded-2xl bg-white p-8 shadow"
          >
            <h2 className="text-2xl font-bold">{card.title}</h2>

            <p className="mt-3 text-gray-500">
              {card.description}
            </p>

            <Button
              className="mt-6"
              onClick={card.onClick}
              disabled={exporting !== null}
            >
              {exporting === card.id
                ? "Preparing CSV..."
                : card.buttonText}
            </Button>
          </section>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-dashed bg-white p-8">
        <h2 className="text-xl font-bold">Coming Next</h2>

        <p className="mt-2 text-gray-500">
          Insurance reports, purchase reports, CSV import, duplicate
          detection, bulk updates, and printable QR labels.
        </p>
      </div>
    </div>
  );
}