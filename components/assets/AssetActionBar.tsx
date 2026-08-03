import Link from "next/link";
import { Button } from "@/components/ui/button";

type AssetActionBarProps = {
  assetId: string;
  isAvailable: boolean;
  isCheckedOut: boolean;
  checkingIn: boolean;
  onShowCheckoutForm: () => void;
  onCheckIn: () => void;
  onPrintQRCode: () => void;
};

export default function AssetActionBar({
  assetId,
  isAvailable,
  isCheckedOut,
  checkingIn,
  onShowCheckoutForm,
  onCheckIn,
  onPrintQRCode,
}: AssetActionBarProps) {
  return (
    <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
          Operations
        </p>

        <h2 className="mt-2 text-2xl font-bold text-slate-950">
          Equipment Actions
        </h2>

        <p className="mt-2 text-slate-500">
          Manage this asset throughout its lifecycle.
        </p>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <ActionCard
          icon="✏️"
          title="Edit"
          description="Update equipment information."
        >
          <Link href={`/assets/${assetId}/edit`}>
            <Button className="w-full">Edit Equipment</Button>
          </Link>
        </ActionCard>

        <ActionCard
          icon="🔧"
          title="Maintenance"
          description="Open a repair or maintenance request."
        >
          <Link href={`/assets/${assetId}/maintenance`}>
            <Button className="w-full" variant="outline">
              Report Issue
            </Button>
          </Link>
        </ActionCard>

        {isAvailable && (
          <ActionCard
            icon="🚚"
            title="Transfer"
            description="Temporarily assign this equipment."
          >
            <Button
              className="w-full"
              onClick={onShowCheckoutForm}
            >
              Transfer Equipment
            </Button>
          </ActionCard>
        )}

        {isCheckedOut && (
          <ActionCard
            icon="🔄"
            title="Return"
            description="Mark this equipment as available."
          >
            <Button
              className="w-full"
              onClick={onCheckIn}
              disabled={checkingIn}
            >
              {checkingIn
                ? "Returning..."
                : "Return Equipment"}
            </Button>
          </ActionCard>
        )}

        <ActionCard
          icon="🏷️"
          title="QR Code"
          description="Print a label for this asset."
        >
          <Button
            className="w-full"
            variant="outline"
            onClick={onPrintQRCode}
          >
            Print QR Code
          </Button>
        </ActionCard>
      </div>
    </section>
  );
}

type ActionCardProps = {
  icon: string;
  title: string;
  description: string;
  children: React.ReactNode;
};

function ActionCard({
  icon,
  title,
  description,
  children,
}: ActionCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-1 hover:bg-white hover:shadow-md">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-2xl shadow-sm">
        {icon}
      </div>

      <h3 className="mt-4 text-lg font-semibold text-slate-950">
        {title}
      </h3>

      <p className="mt-2 min-h-[48px] text-sm leading-6 text-slate-500">
        {description}
      </p>

      <div className="mt-5">
        {children}
      </div>
    </div>
  );
}