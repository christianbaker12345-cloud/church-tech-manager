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
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
          Equipment Activity
        </p>

        <h2 className="mt-2 text-3xl font-bold text-slate-950">
          Transfer History
        </h2>

        <p className="mt-2 text-slate-500">
          A chronological record of where this equipment has been assigned.
        </p>
      </div>

      {history.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
            🚚
          </div>

          <h3 className="mt-5 text-xl font-semibold text-slate-950">
            No transfer history
          </h3>

          <p className="mt-2 text-slate-500">
            Activity will appear here after this equipment is transferred.
          </p>
        </div>
      ) : (
        <div className="relative mt-8">
          <div className="absolute bottom-0 left-5 top-0 w-px bg-slate-200" />

          <div className="space-y-6">
            {history.map((record) => {
              const isReturned =
                normalizeStatus(record.status) === "returned";

              return (
                <article
                  key={record.id}
                  className="relative pl-14"
                >
                  <div
                    className={`absolute left-0 top-1 flex h-10 w-10 items-center justify-center rounded-full border-4 border-white text-lg shadow-sm ${
                      isReturned
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {isReturned ? "✓" : "🚚"}
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:border-slate-300 hover:bg-white hover:shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-slate-500">
                          {isReturned
                            ? "Transfer completed"
                            : "Equipment transferred"}
                        </p>

                        <h3 className="mt-1 text-lg font-semibold text-slate-950">
                          {record.checked_out_by || "Unknown recipient"}
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                          {record.ministry || "No department recorded"}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-sm font-semibold ${
                          isReturned
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {record.status || "Unknown"}
                      </span>
                    </div>

                    <div className="mt-5 grid gap-4 border-t border-slate-200 pt-5 sm:grid-cols-2 xl:grid-cols-4">
                      <TimelineDetail
                        label="Transfer Date"
                        value={formatDate(record.checkout_date)}
                      />

                      <TimelineDetail
                        label="Due Date"
                        value={formatDate(record.due_date)}
                      />

                      <TimelineDetail
                        label="Return Date"
                        value={formatDate(record.checkin_date)}
                      />

                      <TimelineDetail
                        label="Recorded"
                        value={formatDate(record.created_at)}
                      />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

type TimelineDetailProps = {
  label: string;
  value: string;
};

function TimelineDetail({
  label,
  value,
}: TimelineDetailProps) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>

      <p className="mt-1 font-medium text-slate-800">
        {value}
      </p>
    </div>
  );
}