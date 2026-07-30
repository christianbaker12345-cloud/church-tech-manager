export type AssetCheckoutHistory = {
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

type CheckoutHistoryProps = {
  history: AssetCheckoutHistory[];
  formatDate: (date: string | null) => string;
  normalizeStatus: (status: string | null) => string;
};

export default function CheckoutHistory({
  history,
  formatDate,
  normalizeStatus,
}: CheckoutHistoryProps) {
  return (
    <div className="mt-8 rounded-2xl bg-white p-8 shadow">
      <h2 className="text-3xl font-bold">Checkout History</h2>

      <p className="mt-2 text-gray-500">
        Checkout activity for this individual asset.
      </p>

      {history.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed p-10 text-center">
          <h3 className="text-xl font-semibold">No checkout history</h3>

          <p className="mt-2 text-gray-500">
            Activity will appear here after this asset is checked out.
          </p>
        </div>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[850px]">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-4 text-left">Borrower</th>
                <th className="p-4 text-left">Ministry</th>
                <th className="p-4 text-left">Checkout Date</th>
                <th className="p-4 text-left">Due Date</th>
                <th className="p-4 text-left">Check-In Date</th>
                <th className="p-4 text-left">Status</th>
              </tr>
            </thead>

            <tbody>
              {history.map((record) => (
                <tr key={record.id} className="border-t">
                  <td className="p-4 font-medium">
                    {record.checked_out_by || "—"}
                  </td>

                  <td className="p-4">{record.ministry || "—"}</td>

                  <td className="p-4">
                    {formatDate(record.checkout_date)}
                  </td>

                  <td className="p-4">{formatDate(record.due_date)}</td>

                  <td className="p-4">
                    {formatDate(record.checkin_date)}
                  </td>

                  <td className="p-4">
                    <span
                      className={`rounded-full px-3 py-1 text-sm font-medium ${
                        normalizeStatus(record.status) === "returned"
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
  );
}