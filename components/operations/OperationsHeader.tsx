import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

type OperationsHeaderProps = {
  onRefresh?: () => void;
};

export default function OperationsHeader({
  onRefresh,
}: OperationsHeaderProps) {
  const hour = new Date().getHours();

  const greeting =
    hour < 12
      ? "Good Morning"
      : hour < 18
      ? "Good Afternoon"
      : "Good Evening";

  return (
    <div className="flex flex-wrap items-center justify-between gap-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-widest text-slate-500">
          Operations Center
        </p>

        <h1 className="mt-2 text-5xl font-extrabold tracking-tight">
          {greeting}, Christian
        </h1>

        <p className="mt-3 max-w-2xl text-lg text-slate-500">
          Monitor Sunday readiness, equipment health,
          maintenance, transfers, and today's production
          activity.
        </p>
      </div>

      <Button onClick={onRefresh}>
        <RefreshCw className="mr-2 h-4 w-4" />
        Refresh
      </Button>
    </div>
  );
}