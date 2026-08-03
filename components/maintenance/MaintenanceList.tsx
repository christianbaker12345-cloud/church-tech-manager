import MaintenanceCard from "./MaintenanceCard";
import type { MaintenanceRecord } from "./types";

type MaintenanceListProps = {
  records: MaintenanceRecord[];
  emptyTitle: string;
  emptyMessage: string;
  showEquipment?: boolean;
  onEdit?: (record: MaintenanceRecord) => void;
  onDelete?: (record: MaintenanceRecord) => void;
};

export default function MaintenanceList({
  records,
  emptyTitle,
  emptyMessage,
  showEquipment = false,
  onEdit,
  onDelete,
}: MaintenanceListProps) {
  if (records.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-10 text-center">
        <h3 className="text-xl font-semibold">{emptyTitle}</h3>
        <p className="mt-2 text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {records.map((record) => (
        <MaintenanceCard
          key={record.id}
          record={record}
          showEquipment={showEquipment}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}