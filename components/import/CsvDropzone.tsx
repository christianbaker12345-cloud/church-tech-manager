"use client";

import {
  ChangeEvent,
  DragEvent,
  useRef,
  useState,
} from "react";
import {
  FileSpreadsheet,
  Upload,
} from "lucide-react";

import { Button } from "@/components/ui/button";

type CsvDropzoneProps = {
  fileName: string;
  disabled?: boolean;
  onFileSelected: (file: File) => void;
};

export default function CsvDropzone({
  fileName,
  disabled = false,
  onFileSelected,
}: CsvDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [fileError, setFileError] = useState("");

  function acceptFile(file: File | undefined) {
    if (!file) {
      return;
    }

    const isCsv =
      file.type === "text/csv" ||
      file.name.toLowerCase().endsWith(".csv");

    if (!isCsv) {
      setFileError("Please choose a CSV file.");
      return;
    }

    setFileError("");
    onFileSelected(file);
  }

  function handleInputChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    acceptFile(event.target.files?.[0]);

    event.target.value = "";
  }

  function handleDrop(
    event: DragEvent<HTMLDivElement>
  ) {
    event.preventDefault();
    setDragging(false);

    acceptFile(event.dataTransfer.files?.[0]);
  }

  return (
    <div>
      <div
        className={`rounded-3xl border-2 border-dashed p-8 text-center transition md:p-12 ${
          dragging
            ? "border-blue-500 bg-blue-50"
            : "border-slate-300 bg-slate-50 hover:border-blue-300 hover:bg-blue-50/40"
        }`}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          disabled={disabled}
          onChange={handleInputChange}
        />

        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm ring-1 ring-slate-200">
          {fileName ? (
            <FileSpreadsheet size={28} />
          ) : (
            <Upload size={28} />
          )}
        </div>

        <h2 className="mt-5 text-xl font-bold text-slate-950">
          {fileName || "Drop your equipment CSV here"}
        </h2>

        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
          Your CSV should contain these columns: name,
          category, quantity, status, location, and notes.
        </p>

        <Button
          className="mt-6"
          variant="outline"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
        >
          Choose CSV File
        </Button>
      </div>

      {fileError && (
        <p className="mt-3 text-sm font-semibold text-rose-700">
          {fileError}
        </p>
      )}
    </div>
  );
}