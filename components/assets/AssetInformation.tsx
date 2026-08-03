type AssetInformationAsset = {
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
};

export default function AssetInformation({
  asset,
  equipment,
  isCheckedOut,
  formatDate,
  formatCurrency,
}: AssetInformationProps) {
  const details = [
    {
      label: "Equipment Type",
      value: equipment?.name || "Not assigned",
      icon: "📦",
    },
    {
      label: "Category",
      value: equipment?.category || "Not assigned",
      icon: "🏷️",
    },
    {
      label: "Serial Number",
      value: asset.serial_number || "Not recorded",
      icon: "🔢",
    },
    {
      label: "Location",
      value: asset.location || "Not assigned",
      icon: "📍",
    },
    {
      label: "Purchase Date",
      value: formatDate(asset.purchase_date),
      icon: "📅",
    },
    {
      label: "Purchase Price",
      value: formatCurrency(asset.purchase_price),
      icon: "💰",
    },
    {
      label: "Warranty Expires",
      value: formatDate(asset.warranty_expires),
      icon: "🛡️",
    },
    {
      label: "Added",
      value: formatDate(asset.created_at),
      icon: "🕒",
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
            Identification, location, purchase, and warranty details.
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {details.map((item) => (
            <InformationCard
              key={item.label}
              label={item.label}
              value={item.value}
              icon={item.icon}
            />
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
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

        <div className="mt-5 rounded-xl bg-slate-50 p-5">
          <p className="whitespace-pre-wrap leading-7 text-slate-700">
            {asset.notes || "No notes have been added for this equipment item."}
          </p>
        </div>
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
    <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:border-slate-300 hover:bg-white hover:shadow-sm">
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