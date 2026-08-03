"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeftRight,
  CheckCircle2,
  Lightbulb,
  Mic2,
  PackageCheck,
  Radio,
  RefreshCw,
  ShieldCheck,
  Video,
  Wrench,
} from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import SystemHealthCard from "@/components/operations/SystemHealthCard";
import SectionCard from "@/components/ui/SectionCard";
import StatsCard from "@/components/ui/StatsCard";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

type AssetRecord = {
  status: string | null;
  due_date: string | null;
};

type OperationsStats = {
  total: number;
  available: number;
  transferred: number;
  maintenance: number;
  overdue: number;
  criticalRepairs: number;
};

const emptyStats: OperationsStats = {
  total: 0,
  available: 0,
  transferred: 0,
  maintenance: 0,
  overdue: 0,
  criticalRepairs: 0,
};

function normalizeStatus(status: string | null) {
  return status?.trim().toLowerCase() ?? "";
}

function formatToday() {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());
}

export default function OperationsPage() {
  const [stats, setStats] = useState<OperationsStats>(emptyStats);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadOperations();
  }, []);

  async function loadOperations() {
    setLoading(true);
    setErrorMessage("");

    const today = new Date().toISOString().split("T")[0];

    const [assetsResult, criticalRepairsResult] = await Promise.all([
      supabase.from("assets").select("status,due_date"),
      supabase
        .from("asset_maintenance")
        .select("id")
        .in("status", ["Open", "In Progress"])
        .in("priority", ["High", "Urgent"]),
    ]);

    if (assetsResult.error) {
      console.error("Operations assets load error:", assetsResult.error);
      setErrorMessage(assetsResult.error.message);
      setStats(emptyStats);
      setLoading(false);
      return;
    }

    const assets = (assetsResult.data ?? []) as AssetRecord[];

    const available = assets.filter(
      (asset) => normalizeStatus(asset.status) === "available"
    ).length;

    const transferred = assets.filter(
      (asset) => normalizeStatus(asset.status) === "checked out"
    ).length;

    const maintenance = assets.filter((asset) => {
      const status = normalizeStatus(asset.status);

      return status === "maintenance" || status === "in repair";
    }).length;

    const overdue = assets.filter(
      (asset) =>
        normalizeStatus(asset.status) === "checked out" &&
        asset.due_date !== null &&
        asset.due_date < today
    ).length;

    if (criticalRepairsResult.error) {
      console.error(
        "Operations critical repairs load error:",
        criticalRepairsResult.error
      );
      setErrorMessage(criticalRepairsResult.error.message);
    }

    setStats({
      total: assets.length,
      available,
      transferred,
      maintenance,
      overdue,
      criticalRepairs: criticalRepairsResult.error
        ? 0
        : (criticalRepairsResult.data ?? []).length,
    });

    setLoading(false);
  }

  const readinessScore = useMemo(() => {
    return Math.max(
      0,
      Math.min(
        100,
        100 -
          stats.maintenance * 5 -
          stats.criticalRepairs * 10 -
          stats.overdue * 5
      )
    );
  }, [stats]);

  const readiness = useMemo(() => {
    if (readinessScore >= 95) {
      return {
        label: "Ready",
        message: "Production systems are ready with no major blockers.",
        textClassName: "text-emerald-700",
        backgroundClassName: "bg-emerald-50",
        borderClassName: "border-emerald-200",
        progressClassName: "bg-emerald-500",
        icon: CheckCircle2,
      };
    }

    if (readinessScore >= 80) {
      return {
        label: "Needs Attention",
        message:
          "Production can proceed, but some equipment needs attention.",
        textClassName: "text-amber-700",
        backgroundClassName: "bg-amber-50",
        borderClassName: "border-amber-200",
        progressClassName: "bg-amber-500",
        icon: AlertTriangle,
      };
    }

    return {
      label: "Action Required",
      message:
        "Resolve critical equipment issues before the next production.",
      textClassName: "text-rose-700",
      backgroundClassName: "bg-rose-50",
      borderClassName: "border-rose-200",
      progressClassName: "bg-rose-500",
      icon: AlertTriangle,
    };
  }, [readinessScore]);

  const ReadinessIcon = readiness.icon;

  const blockers =
    stats.maintenance + stats.criticalRepairs + stats.overdue;

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Live Production"
        title="Operations Center"
        description={`${formatToday()} · Monitor readiness, active transfers, maintenance, and production health.`}
        actions={
          <Button
            variant="outline"
            onClick={loadOperations}
            disabled={loading}
          >
            <RefreshCw className={loading ? "animate-spin" : ""} />
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
        }
      />

      {errorMessage && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-800 shadow-sm">
          <p className="font-semibold">
            Some operations information could not be loaded.
          </p>

          <p className="mt-1 text-sm">{errorMessage}</p>

          <Button
            className="mt-4"
            variant="outline"
            onClick={loadOperations}
          >
            Try Again
          </Button>
        </section>
      )}

      <section
        className={`overflow-hidden rounded-3xl border ${readiness.borderClassName} ${readiness.backgroundClassName} shadow-sm`}
      >
        <div className="grid gap-8 p-7 md:p-10 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
                <ShieldCheck className={readiness.textClassName} />
              </div>

              <div>
                <p className="text-sm font-bold uppercase tracking-[0.16em] text-slate-500">
                  Production Readiness
                </p>

                <p className={`mt-1 font-bold ${readiness.textClassName}`}>
                  {loading ? "Calculating..." : readiness.label}
                </p>
              </div>
            </div>

            <h2
              className={`mt-6 text-6xl font-black tracking-tight md:text-7xl ${readiness.textClassName}`}
            >
              {loading ? "—" : `${readinessScore}%`}
            </h2>

            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              {loading
                ? "Reviewing equipment status and open maintenance records."
                : readiness.message}
            </p>

            <div className="mt-7 h-3 overflow-hidden rounded-full bg-white/80">
              <div
                className={`h-full rounded-full transition-all duration-500 ${readiness.progressClassName}`}
                style={{
                  width: `${loading ? 0 : readinessScore}%`,
                }}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-white/80 bg-white/80 p-6 shadow-sm backdrop-blur">
            <div className="flex items-center gap-3">
              <ReadinessIcon className={readiness.textClassName} />

              <div>
                <p className="text-sm font-medium text-slate-500">
                  Items affecting readiness
                </p>

                <p className="mt-1 text-3xl font-black text-slate-950">
                  {loading ? "—" : blockers}
                </p>
              </div>
            </div>

            <p className="mt-4 max-w-xs text-sm leading-6 text-slate-500">
              Includes equipment in maintenance, critical repairs, and
              overdue transfers.
            </p>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
            Live Status
          </p>

          <h2 className="mt-2 text-2xl font-bold text-slate-950">
            Production health
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
          <StatsCard
            label="Available"
            value={stats.available}
            description="Ready for production use"
            accentClassName="bg-emerald-500"
            valueClassName="text-emerald-700"
            loading={loading}
          />

          <StatsCard
            label="Transferred"
            value={stats.transferred}
            description="Assigned away from storage"
            accentClassName="bg-sky-500"
            valueClassName="text-sky-700"
            loading={loading}
          />

          <StatsCard
            label="Maintenance"
            value={stats.maintenance}
            description="Unavailable for regular use"
            accentClassName="bg-amber-500"
            valueClassName="text-amber-700"
            loading={loading}
          />

          <StatsCard
            label="Overdue"
            value={stats.overdue}
            description="Past the expected return date"
            accentClassName="bg-orange-500"
            valueClassName="text-orange-700"
            loading={loading}
          />

          <StatsCard
            label="Critical Repairs"
            value={stats.criticalRepairs}
            description="High or urgent open issues"
            accentClassName="bg-rose-500"
            valueClassName="text-rose-700"
            loading={loading}
          />
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
            Ministry Systems
          </p>

          <h2 className="mt-2 text-2xl font-bold text-slate-950">
            Production health by system
          </h2>

          <p className="mt-2 max-w-3xl text-slate-500">
            A quick view of the systems that support worship, production,
            and broadcast ministry.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <SystemHealthCard
            title="Audio"
            score={98}
            status="Ready"
            icon={Mic2}
          />

          <SystemHealthCard
            title="Video"
            score={94}
            status="Needs Attention"
            icon={Video}
          />

          <SystemHealthCard
            title="Lighting"
            score={100}
            status="Ready"
            icon={Lightbulb}
          />

          <SystemHealthCard
            title="Broadcast"
            score={91}
            status="Monitoring"
            icon={Radio}
          />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard
          eyebrow="Attention"
          title="Current blockers"
          description="Issues that may affect the next production."
        >
          <div className="space-y-4">
            <StatusRow
              icon={Wrench}
              label="Equipment in maintenance"
              value={stats.maintenance}
              tone="warning"
              loading={loading}
            />

            <StatusRow
              icon={AlertTriangle}
              label="Critical repairs"
              value={stats.criticalRepairs}
              tone="danger"
              loading={loading}
            />

            <StatusRow
              icon={ArrowLeftRight}
              label="Overdue transfers"
              value={stats.overdue}
              tone="warning"
              loading={loading}
            />
          </div>
        </SectionCard>

        <SectionCard
          eyebrow="Shortcuts"
          title="Operations actions"
          description="Jump directly into the most common production tasks."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Link href="/inventory">
              <Button className="w-full justify-start" variant="outline">
                <PackageCheck />
                View Equipment
              </Button>
            </Link>

            <Link href="/transfers">
              <Button className="w-full justify-start" variant="outline">
                <ArrowLeftRight />
                Manage Transfers
              </Button>
            </Link>

            <Link href="/maintenance">
              <Button className="w-full justify-start" variant="outline">
                <Wrench />
                Review Maintenance
              </Button>
            </Link>

            <Link href="/inventory/new">
              <Button className="w-full justify-start">
                <PackageCheck />
                Add Equipment
              </Button>
            </Link>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

type StatusRowProps = {
  icon: typeof Wrench;
  label: string;
  value: number;
  tone: "warning" | "danger";
  loading: boolean;
};

function StatusRow({
  icon: Icon,
  label,
  value,
  tone,
  loading,
}: StatusRowProps) {
  const toneClasses =
    tone === "danger"
      ? "bg-rose-100 text-rose-700"
      : "bg-amber-100 text-amber-700";

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${toneClasses}`}
      >
        <Icon size={19} />
      </div>

      <p className="min-w-0 flex-1 font-semibold text-slate-800">
        {label}
      </p>

      <p className="text-2xl font-black text-slate-950">
        {loading ? "—" : value}
      </p>
    </div>
  );
}