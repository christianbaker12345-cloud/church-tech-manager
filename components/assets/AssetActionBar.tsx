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
  canManage: boolean;
};

type ActionCardTone =
  | "blue"
  | "purple"
  | "green"
  | "amber"
  | "orange";

export default function AssetActionBar({
  assetId,
  isAvailable,
  isCheckedOut,
  checkingIn,
  onShowCheckoutForm,
  onCheckIn,
  onPrintQRCode,
  canManage,
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
          {canManage
            ? "Manage this asset throughout its lifecycle."
            : "View asset tools available to your account."}
        </p>
      </div>

<div
  className={`mt-8 grid gap-4 md:grid-cols-2 ${
    canManage
      ? "xl:grid-cols-5"
      : "xl:max-w-2xl xl:grid-cols-2"
  }`}
>
        {canManage && (
          <ActionCard
            icon="✏️"
            title="Edit"
            description="Update equipment information."
            tone="blue"
          >
            <Link
              href={`/assets/${assetId}/edit`}
              className="block"
            >
              <Button className="w-full">
                Edit Equipment
              </Button>
            </Link>
          </ActionCard>
        )}

        <ActionCard
          icon="🔧"
          title="Maintenance"
          description={
            canManage
              ? "Open a repair or maintenance request."
              : "View maintenance history for this asset."
          }
          tone="purple"
        >
          <Link
            href={`/assets/${assetId}/maintenance`}
            className="block"
          >
            <Button
              className={
                canManage
                  ? "w-full whitespace-nowrap"
                  : "w-full whitespace-nowrap border-violet-300 bg-white text-violet-700 hover:bg-violet-50 hover:text-violet-800"
              }
              variant={canManage ? "default" : "outline"}
            >
              {canManage ? "Report Issue" : "View History"}
            </Button>
          </Link>
        </ActionCard>

        {canManage && isAvailable && (
          <ActionCard
            icon="🚚"
            title="Transfer"
            description="Temporarily assign this equipment."
            tone="green"
          >
            <Button
              className="w-full"
              onClick={onShowCheckoutForm}
            >
              Transfer Equipment
            </Button>
          </ActionCard>
        )}

        {canManage && isCheckedOut && (
          <ActionCard
            icon="🔄"
            title="Return"
            description="Mark this equipment as available."
            tone="amber"
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
          tone="orange"
        >
          <Button
            className="w-full whitespace-nowrap border-orange-200 bg-white text-slate-800 hover:bg-orange-50"
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
  tone: ActionCardTone;
  children: React.ReactNode;
};

function ActionCard({
  icon,
  title,
  description,
  tone,
  children,
}: ActionCardProps) {
  const toneClasses = {
    blue: {
      card: "border-blue-100 bg-blue-50/40",
      icon: "bg-blue-100 text-blue-700",
    },
    purple: {
      card: "border-violet-100 bg-violet-50/40",
      icon: "bg-violet-100 text-violet-700",
    },
    green: {
      card: "border-emerald-100 bg-emerald-50/40",
      icon: "bg-emerald-100 text-emerald-700",
    },
    amber: {
      card: "border-amber-100 bg-amber-50/40",
      icon: "bg-amber-100 text-amber-700",
    },
    orange: {
      card: "border-orange-100 bg-orange-50/40",
      icon: "bg-orange-100 text-orange-700",
    },
  };

  const colors = toneClasses[tone];

  return (
    <div
      className={`flex flex-col rounded-2xl border p-5 transition hover:-translate-y-1 hover:bg-white hover:shadow-md ${colors.card}`}
    >
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-xl text-2xl shadow-sm ${colors.icon}`}
      >
        {icon}
      </div>

<h3 className="mt-4 text-center text-lg font-semibold text-slate-950">
  {title}
</h3>

      <p className="mt-2 min-h-[72px] text-sm leading-6 text-slate-500">
        {description}
      </p>

      <div className="mt-auto pt-5">
        {children}
      </div>
    </div>
  );
}