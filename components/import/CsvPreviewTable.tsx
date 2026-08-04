import type { EquipmentImportRow } from "@/lib/csv";

type CsvPreviewTableProps = {
  rows: EquipmentImportRow[];
  limit?: number;
};

export default function CsvPreviewTable({
  rows,
  limit = 25,
}: CsvPreviewTableProps) {
  const previewRows = rows.slice(0, limit);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1050px] border-collapse">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                Row
              </th>

              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                Name
              </th>

              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                Category
              </th>

              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                Quantity
              </th>

              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                Status
              </th>

              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                Location
              </th>

              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                Validation
              </th>
            </tr>
          </thead>

          <tbody>
            {previewRows.map((row) => (
              <tr
                key={row.rowNumber}
                className="border-t border-slate-100"
              >
                <td className="px-4 py-3 text-sm text-slate-500">
                  {row.rowNumber}
                </td>

                <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                  {row.name || "—"}
                </td>

                <td className="px-4 py-3 text-sm text-slate-700">
                  {row.category || "—"}
                </td>

                <td className="px-4 py-3 text-sm text-slate-700">
                  {row.quantity || "—"}
                </td>

                <td className="px-4 py-3 text-sm text-slate-700">
                  {row.status || "—"}
                </td>

                <td className="px-4 py-3 text-sm text-slate-700">
                  {row.location || "—"}
                </td>

                <td className="px-4 py-3 text-sm">
                  {row.errors.length === 0 ? (
                    <span className="font-semibold text-emerald-700">
                      Valid
                    </span>
                  ) : (
                    <span className="font-semibold text-rose-700">
                      {row.errors.join(" ")}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rows.length > limit && (
        <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
          Showing the first {limit} of {rows.length} rows.
        </div>
      )}
    </div>
  );
}