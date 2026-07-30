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
  return (
    <>
      {isCheckedOut && (
        <div className="mt-8 rounded-xl border border-yellow-300 bg-yellow-50 p-6">
          <h2 className="text-xl font-bold text-yellow-900">
            Currently Checked Out
          </h2>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-yellow-700">Checked Out By</p>
              <p className="mt-1 font-semibold text-yellow-950">
                {asset.checked_out_by || "—"}
              </p>
            </div>

            <div>
              <p className="text-sm text-yellow-700">Ministry</p>
              <p className="mt-1 font-semibold text-yellow-950">
                {asset.ministry || "—"}
              </p>
            </div>

            <div>
              <p className="text-sm text-yellow-700">Checkout Date</p>
              <p className="mt-1 font-semibold text-yellow-950">
                {formatDate(asset.checkout_date)}
              </p>
            </div>

            <div>
              <p className="text-sm text-yellow-700">Due Date</p>
              <p className="mt-1 font-semibold text-yellow-950">
                {formatDate(asset.due_date)}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <InformationCard
          label="Equipment Type"
          value={equipment?.name || "—"}
        />
        <InformationCard
          label="Category"
          value={equipment?.category || "—"}
        />
        <InformationCard
          label="Serial Number"
          value={asset.serial_number || "—"}
        />
        <InformationCard
          label="Location"
          value={asset.location || "—"}
        />
        <InformationCard
          label="Purchase Date"
          value={formatDate(asset.purchase_date)}
        />
        <InformationCard
          label="Purchase Price"
          value={formatCurrency(asset.purchase_price)}
        />
        <InformationCard
          label="Warranty Expires"
          value={formatDate(asset.warranty_expires)}
        />
        <InformationCard
          label="Added"
          value={formatDate(asset.created_at)}
        />
      </div>

      <div className="mt-8 rounded-xl border p-6">
        <h2 className="text-xl font-bold">Notes</h2>
        <p className="mt-3 text-gray-700">
          {asset.notes || "No notes available."}
        </p>
      </div>
    </>
  );
}

type InformationCardProps = {
  label: string;
  value: string;
};

function InformationCard({ label, value }: InformationCardProps) {
  return (
    <div className="rounded-xl border p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}