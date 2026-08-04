export type CsvRow = Record<string, string>;

export type EquipmentImportRow = {
  rowNumber: number;
  name: string;
  category: string;
  quantity: number;
  status: string;
  location: string;
  notes: string;
  errors: string[];
};

export type ParsedEquipmentCsv = {
  headers: string[];
  rows: EquipmentImportRow[];
  fileErrors: string[];
};

export const EQUIPMENT_REQUIRED_HEADERS = [
  "name",
  "category",
  "quantity",
  "status",
  "location",
  "notes",
] as const;

function normalizeHeader(value: string) {
  return value
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function parseCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let insideQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const nextCharacter = line[index + 1];

    if (character === '"') {
      if (insideQuotes && nextCharacter === '"') {
        current += '"';
        index += 1;
      } else {
        insideQuotes = !insideQuotes;
      }

      continue;
    }

    if (character === "," && !insideQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += character;
  }

  values.push(current.trim());

  return values;
}

function splitCsvIntoLines(text: string) {
  const lines: string[] = [];
  let current = "";
  let insideQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const nextCharacter = text[index + 1];

    if (character === '"') {
      current += character;

      if (insideQuotes && nextCharacter === '"') {
        current += nextCharacter;
        index += 1;
      } else {
        insideQuotes = !insideQuotes;
      }

      continue;
    }

    if (
      (character === "\n" || character === "\r") &&
      !insideQuotes
    ) {
      if (character === "\r" && nextCharacter === "\n") {
        index += 1;
      }

      if (current.trim().length > 0) {
        lines.push(current);
      }

      current = "";
      continue;
    }

    current += character;
  }

  if (current.trim().length > 0) {
    lines.push(current);
  }

  return lines;
}

export function parseEquipmentCsv(
  text: string
): ParsedEquipmentCsv {
  const lines = splitCsvIntoLines(text);

  if (lines.length === 0) {
    return {
      headers: [],
      rows: [],
      fileErrors: ["The CSV file is empty."],
    };
  }

  const headers = parseCsvLine(lines[0]).map(
    normalizeHeader
  );

  const missingHeaders = EQUIPMENT_REQUIRED_HEADERS.filter(
    (requiredHeader) => !headers.includes(requiredHeader)
  );

  const fileErrors =
    missingHeaders.length > 0
      ? [
          `Missing required columns: ${missingHeaders.join(
            ", "
          )}.`,
          `Expected columns: ${EQUIPMENT_REQUIRED_HEADERS.join(
            ", "
          )}.`,
        ]
      : [];

  const rows = lines.slice(1).map((line, index) => {
    const values = parseCsvLine(line);
    const rawRow: CsvRow = {};

    headers.forEach((header, headerIndex) => {
      rawRow[header] =
        values[headerIndex]?.trim() ?? "";
    });

    const quantity = Number(rawRow.quantity);
    const errors: string[] = [];

    if (!rawRow.name) {
      errors.push("Name is required.");
    }

    if (!rawRow.category) {
      errors.push("Category is required.");
    }

    if (
      rawRow.quantity === "" ||
      !Number.isInteger(quantity) ||
      quantity < 1
    ) {
      errors.push(
        "Quantity must be a whole number greater than zero."
      );
    }

    if (!rawRow.status) {
      errors.push("Status is required.");
    }

    if (!rawRow.location) {
      errors.push("Location is required.");
    }

    return {
      rowNumber: index + 2,
      name: rawRow.name,
      category: rawRow.category,
      quantity:
        Number.isInteger(quantity) && quantity > 0
          ? quantity
          : 0,
      status: rawRow.status,
      location: rawRow.location,
      notes: rawRow.notes,
      errors,
    };
  });

  return {
    headers,
    rows,
    fileErrors,
  };
}