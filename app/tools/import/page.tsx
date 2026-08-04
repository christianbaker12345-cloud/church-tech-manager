"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  LoaderCircle,
  UploadCloud,
} from "lucide-react";

import CsvDropzone from "@/components/import/CsvDropzone";
import CsvPreviewTable from "@/components/import/CsvPreviewTable";
import ImportSummary from "@/components/import/ImportSummary";
import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";
import { Button } from "@/components/ui/button";
import {
  parseEquipmentCsv,
  type EquipmentImportRow,
} from "@/lib/csv";
import { supabase } from "@/lib/supabase";

type DuplicateMode = "skip" | "update" | "create";
type ImportStatus = "idle" | "checking" | "importing" | "complete" | "error";

type ImportResult = {
  imported: number;
  updated: number;
  skipped: number;
  failed: number;
};

function duplicateKey(name: string, category: string) {
  return `${name.trim().toLowerCase()}::${category
    .trim()
    .toLowerCase()}`;
}

export default function ImportCenterPage() {
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<EquipmentImportRow[]>([]);
  const [fileErrors, setFileErrors] = useState<string[]>([]);
  const [duplicateMode, setDuplicateMode] =
    useState<DuplicateMode>("skip");
  const [duplicateCount, setDuplicateCount] = useState(0);
  const [existingByKey, setExistingByKey] = useState<
    Map<string, string>
  >(new Map());
  const [status, setStatus] = useState<ImportStatus>("idle");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [progressMessage, setProgressMessage] = useState("");

  const validRows = useMemo(
    () => rows.filter((row) => row.errors.length === 0),
    [rows]
  );

  const invalidRows = rows.length - validRows.length;
  const importing = status === "importing";
  const checkingDuplicates = status === "checking";

  async function handleFileSelected(file: File) {
    setFileName(file.name);
    setRows([]);
    setFileErrors([]);
    setDuplicateCount(0);
    setExistingByKey(new Map());
    setResult(null);
    setErrorMessage("");
    setProgressMessage("");

    try {
      const text = await file.text();
      const parsed = parseEquipmentCsv(text);

      setRows(parsed.rows);
      setFileErrors(parsed.fileErrors);

      const validParsedRows = parsed.rows.filter(
        (row) => row.errors.length === 0
      );

      if (
        parsed.fileErrors.length === 0 &&
        validParsedRows.length > 0
      ) {
        await checkDuplicates(validParsedRows);
      } else {
        setStatus("idle");
      }
    } catch (error) {
      console.error("CSV read error:", error);
      setFileErrors([
        "The selected CSV file could not be read.",
      ]);
      setStatus("error");
    }
  }

  async function checkDuplicates(
    candidateRows: EquipmentImportRow[]
  ) {
    setStatus("checking");
    setProgressMessage("Checking existing equipment...");
    setErrorMessage("");

    try {
      const { data, error } = await supabase
        .from("equipment")
        .select("id,name,category");

      if (error) {
        throw error;
      }

      const map = new Map<string, string>();

      for (const record of data ?? []) {
        map.set(
          duplicateKey(record.name ?? "", record.category ?? ""),
          record.id
        );
      }

      const duplicates = candidateRows.filter((row) =>
        map.has(duplicateKey(row.name, row.category))
      ).length;

      setExistingByKey(map);
      setDuplicateCount(duplicates);
      setStatus("idle");
      setProgressMessage("");
    } catch (error) {
      console.error("Duplicate check error:", error);

      const message =
        error instanceof Error
          ? error.message
          : "Duplicate checking failed.";

      setErrorMessage(message);
      setStatus("error");
      setProgressMessage("");
    }
  }

  async function importRows() {
    if (
      fileErrors.length > 0 ||
      validRows.length === 0 ||
      importing ||
      checkingDuplicates
    ) {
      return;
    }

    setStatus("importing");
    setProgressMessage(
      `Preparing to import ${validRows.length} rows...`
    );
    setErrorMessage("");
    setResult(null);

    let imported = 0;
    let updated = 0;
    let skipped = 0;
    let failed = 0;

    try {
      const rowsToCreate: Array<{
        name: string;
        category: string;
        quantity: number;
        status: string;
        location: string;
        notes: string | null;
      }> = [];

      for (let index = 0; index < validRows.length; index += 1) {
        const row = validRows[index];
        const key = duplicateKey(row.name, row.category);
        const existingId = existingByKey.get(key);

        setProgressMessage(
          `Processing row ${index + 1} of ${validRows.length}...`
        );

        if (existingId && duplicateMode === "skip") {
          skipped += 1;
          continue;
        }

        const payload = {
          name: row.name,
          category: row.category,
          quantity: row.quantity,
          status: row.status,
          location: row.location,
          notes: row.notes || null,
        };

        if (existingId && duplicateMode === "update") {
          const { error } = await supabase
            .from("equipment")
            .update(payload)
            .eq("id", existingId);

          if (error) {
            console.error(
              `CSV update error on row ${row.rowNumber}:`,
              error
            );
            failed += 1;
          } else {
            updated += 1;
          }

          continue;
        }

        rowsToCreate.push(payload);
      }

      const chunkSize = 50;

      for (
        let start = 0;
        start < rowsToCreate.length;
        start += chunkSize
      ) {
        const chunk = rowsToCreate.slice(
          start,
          start + chunkSize
        );

        setProgressMessage(
          `Importing rows ${start + 1}–${Math.min(
            start + chunk.length,
            rowsToCreate.length
          )} of ${rowsToCreate.length}...`
        );

        const { error } = await supabase
          .from("equipment")
          .insert(chunk);

        if (error) {
          console.error("CSV insert error:", error);
          failed += chunk.length;
          setErrorMessage(error.message);
        } else {
          imported += chunk.length;
        }
      }

      const finalResult = {
        imported,
        updated,
        skipped,
        failed,
      };

      setResult(finalResult);
      setProgressMessage("");
      setStatus(failed > 0 ? "error" : "complete");

      if (failed === 0) {
        await checkDuplicates(validRows);
        setStatus("complete");
      }
    } catch (error) {
      console.error("Unexpected import error:", error);

      const message =
        error instanceof Error
          ? error.message
          : "The import could not be completed.";

      setErrorMessage(message);
      setResult({
        imported,
        updated,
        skipped,
        failed: Math.max(failed, 1),
      });
      setProgressMessage("");
      setStatus("error");
    }
  }

  function resetImport() {
    setFileName("");
    setRows([]);
    setFileErrors([]);
    setDuplicateCount(0);
    setExistingByKey(new Map());
    setResult(null);
    setErrorMessage("");
    setProgressMessage("");
    setStatus("idle");
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Administrative Tools"
        title="Import Center"
        description="Upload, validate, preview, and import equipment records from CSV."
        actions={
          <Link href="/tools/export">
            <Button variant="outline">
              Open Export Center
            </Button>
          </Link>
        }
      />

      {(status === "importing" || status === "checking") && (
        <div className="sticky top-4 z-30 rounded-2xl border border-blue-200 bg-blue-50 p-5 text-blue-800 shadow-lg">
          <div className="flex items-center gap-3">
            <LoaderCircle className="animate-spin" />
            <div>
              <p className="font-bold">
                {status === "importing"
                  ? "Import in progress"
                  : "Checking CSV"}
              </p>
              <p className="mt-1 text-sm">
                {progressMessage || "Please wait..."}
              </p>
            </div>
          </div>
        </div>
      )}

      <SectionCard
        eyebrow="Step 1"
        title="Choose equipment CSV"
        description="No database changes are made until you review the preview and click Import."
      >
        <CsvDropzone
          fileName={fileName}
          disabled={importing}
          onFileSelected={handleFileSelected}
        />
      </SectionCard>

      {fileErrors.length > 0 && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-800">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 shrink-0" />

            <div>
              <p className="font-bold">
                This file cannot be imported.
              </p>

              {fileErrors.map((error) => (
                <p key={error} className="mt-1 text-sm">
                  {error}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-800">
          <p className="font-bold">
            Import error
          </p>
          <p className="mt-1 text-sm">{errorMessage}</p>
        </div>
      )}

      {rows.length > 0 && fileErrors.length === 0 && (
        <>
          <SectionCard
            eyebrow="Step 2"
            title="Review validation"
            description="Invalid rows will not be imported."
          >
            <ImportSummary
              total={rows.length}
              valid={validRows.length}
              invalid={invalidRows}
              duplicates={duplicateCount}
              imported={result?.imported}
              updated={result?.updated}
              skipped={result?.skipped}
              failed={result?.failed}
            />

            <div className="mt-6">
              <CsvPreviewTable rows={rows} />
            </div>
          </SectionCard>

          <SectionCard
            eyebrow="Step 3"
            title="Choose duplicate behavior"
            description="Duplicates are matched by normalized equipment name and category."
          >
            <div className="grid gap-3 md:grid-cols-3">
              {[
                {
                  value: "skip" as const,
                  title: "Skip duplicates",
                  description:
                    "Keep existing records unchanged and import only new equipment.",
                },
                {
                  value: "update" as const,
                  title: "Update duplicates",
                  description:
                    "Replace quantity, status, location, and notes on matching records.",
                },
                {
                  value: "create" as const,
                  title: "Create duplicates",
                  description:
                    "Insert every valid row as a new equipment record.",
                },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`rounded-2xl border p-5 text-left transition ${
                    duplicateMode === option.value
                      ? "border-blue-500 bg-blue-50 ring-4 ring-blue-100"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                  onClick={() =>
                    setDuplicateMode(option.value)
                  }
                >
                  <p className="font-bold text-slate-950">
                    {option.title}
                  </p>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {option.description}
                  </p>
                </button>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-slate-50 p-5">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="text-blue-600" />

                <div>
                  <p className="font-bold text-slate-950">
                    {validRows.length} valid rows ready
                  </p>

                  <p className="text-sm text-slate-500">
                    {checkingDuplicates
                      ? "Checking for duplicates..."
                      : `${duplicateCount} possible duplicates detected`}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  onClick={resetImport}
                  disabled={importing}
                >
                  Start Over
                </Button>

                <Button
                  type="button"
                  onClick={importRows}
                  disabled={
                    importing ||
                    checkingDuplicates ||
                    validRows.length === 0
                  }
                >
                  <UploadCloud />
                  {importing
                    ? "Importing..."
                    : `Import ${validRows.length} Rows`}
                </Button>
              </div>
            </div>
          </SectionCard>
        </>
      )}

      {result && (
        <div
          className={`rounded-2xl border p-6 ${
            result.failed === 0
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-amber-200 bg-amber-50 text-amber-800"
          }`}
        >
          <div className="flex items-start gap-3">
            {result.failed === 0 ? (
              <CheckCircle2 className="mt-0.5 shrink-0" />
            ) : (
              <AlertTriangle className="mt-0.5 shrink-0" />
            )}

            <div>
              <p className="font-bold">
                {result.failed === 0
                  ? "Import completed"
                  : "Import completed with errors"}
              </p>

              <p className="mt-1 text-sm">
                Imported {result.imported}, updated{" "}
                {result.updated}, skipped {result.skipped},
                and failed {result.failed}.
              </p>

              <Link
                href="/inventory"
                className="mt-4 inline-block text-sm font-bold underline underline-offset-4"
              >
                View equipment
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}