"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeftRight,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Eye,
  PackageCheck,
  RefreshCw,
  Search,
  UserRound,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import EmptyState from "@/components/ui/EmptyState";
import { supabase } from "@/lib/supabase";

type EquipmentSummary = {
  name: string | null;
  category: string | null;
};

type Asset = {
  id: string;
  equipment_id: string;
  asset_tag: string | null;
  display_name: string | null;
  serial_number: string | null;
  status: string | null;
  location: string | null;
  checked_out_by: string | null;
  ministry: string | null;
  checkout_date: string | null;
  due_date: string | null;
  checkout_purpose_event: string | null;
  equipment:
    | EquipmentSummary
    | EquipmentSummary[]
    | null;
};

type CheckoutView = "Available" | "Checked Out";

export default function CheckInOutPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [view, setView] =
    useState<CheckoutView>("Available");
  const [search, setSearch] = useState("");

  const [selectedAsset, setSelectedAsset] =
    useState<Asset | null>(null);
  const [checkedOutBy, setCheckedOutBy] = useState("");
  const [ministry, setMinistry] = useState("");
  const [purposeEvent, setPurposeEvent] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [checkingOut, setCheckingOut] = useState(false);

  const [checkingInId, setCheckingInId] =
    useState<string | null>(null);

  useEffect(() => {
    loadAssets();
  }, []);

  async function loadAssets() {
    setLoading(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("assets")
      .select(`
        id,
        equipment_id,
        asset_tag,
        display_name,
        serial_number,
        status,
        location,
        checked_out_by,
        ministry,
        checkout_date,
        due_date,
        checkout_purpose_event,
        equipment (
          name,
          category
        )
      `)
      .order("display_name", { ascending: true });

    if (error) {
      console.error("Check In / Out asset load error:", error);
      setErrorMessage(error.message);
      setAssets([]);
      setLoading(false);
      return;
    }

    setAssets((data ?? []) as Asset[]);
    setLoading(false);
  }

  function normalizeStatus(status: string | null) {
    return status?.trim().toLowerCase() ?? "";
  }

  function getEquipment(asset: Asset) {
    if (Array.isArray(asset.equipment)) {
      return asset.equipment[0] ?? null;
    }

    return asset.equipment;
  }

  function assetName(asset: Asset) {
    const equipment = getEquipment(asset);

    return (
      asset.display_name ||
      asset.asset_tag ||
      equipment?.name ||
      "Unnamed Asset"
    );
  }

  function formatDate(value: string | null) {
    if (!value) return "Not recorded";

    const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? new Date(`${value}T00:00:00`)
      : new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function isOverdue(asset: Asset) {
    if (!asset.due_date) return false;
    if (normalizeStatus(asset.status) !== "checked out") {
      return false;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueDateValue = new Date(
      `${asset.due_date}T00:00:00`
    );

    return dueDateValue.getTime() < today.getTime();
  }

  const counts = useMemo(() => {
    const available = assets.filter(
      (asset) => normalizeStatus(asset.status) === "available"
    ).length;

    const checkedOut = assets.filter(
      (asset) =>
        normalizeStatus(asset.status) === "checked out"
    ).length;

    const overdue = assets.filter(isOverdue).length;

    return {
      available,
      checkedOut,
      overdue,
    };
  }, [assets]);

  const filteredAssets = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return assets.filter((asset) => {
      const status = normalizeStatus(asset.status);
      const matchesView =
        view === "Available"
          ? status === "available"
          : status === "checked out";

      if (!matchesView) return false;

      if (!normalizedSearch) return true;

      const equipment = getEquipment(asset);

      return [
        asset.display_name,
        asset.asset_tag,
        asset.serial_number,
        asset.location,
        asset.checked_out_by,
        asset.ministry,
        asset.checkout_purpose_event,
        equipment?.name,
        equipment?.category,
      ].some((value) =>
        value?.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [assets, search, view]);

  function openCheckout(asset: Asset) {
    setSelectedAsset(asset);
    setCheckedOutBy("");
    setMinistry("");
    setPurposeEvent("");
    setDueDate("");
  }

  function closeCheckout() {
    if (checkingOut) return;

    setSelectedAsset(null);
    setCheckedOutBy("");
    setMinistry("");
    setPurposeEvent("");
    setDueDate("");
  }

  async function checkOutAsset() {
    if (!selectedAsset) return;

    if (!checkedOutBy.trim()) {
      alert("Enter the person or group checking this out.");
      return;
    }

    if (!purposeEvent.trim()) {
      alert("Enter the purpose or event.");
      return;
    }

    if (!dueDate) {
      alert("Choose a due date.");
      return;
    }

    setCheckingOut(true);

    const checkoutDate = new Date()
      .toISOString()
      .split("T")[0];

    const { error: assetUpdateError } = await supabase
      .from("assets")
      .update({
        status: "Checked Out",
        checked_out_by: checkedOutBy.trim(),
        ministry: ministry.trim() || null,
        checkout_date: checkoutDate,
        due_date: dueDate,
        checkout_purpose_event: purposeEvent.trim(),
      })
      .eq("id", selectedAsset.id);

    if (assetUpdateError) {
      console.error(
        "Asset checkout update error:",
        assetUpdateError
      );
      alert(assetUpdateError.message);
      setCheckingOut(false);
      return;
    }

    const { error: historyError } = await supabase
      .from("asset_checkout_history")
      .insert({
        asset_id: selectedAsset.id,
        asset_tag: selectedAsset.asset_tag,
        display_name: selectedAsset.display_name,
        checked_out_by: checkedOutBy.trim(),
        ministry: ministry.trim() || null,
        purpose_event: purposeEvent.trim(),
        checkout_date: checkoutDate,
        due_date: dueDate,
        status: "Checked Out",
      });

    if (historyError) {
      console.error(
        "Asset checkout history error:",
        historyError
      );
      alert(
        `The asset was checked out, but its history could not be saved:\n\n${historyError.message}`
      );
    }

    setCheckingOut(false);
    closeCheckout();
    setView("Checked Out");
    await loadAssets();
  }

  async function checkInAsset(asset: Asset) {
    const name = assetName(asset);

    const confirmed = window.confirm(
      `Check in ${name}?`
    );

    if (!confirmed) return;

    setCheckingInId(asset.id);

    const checkinDate = new Date()
      .toISOString()
      .split("T")[0];

    const { error: assetUpdateError } = await supabase
      .from("assets")
      .update({
        status: "Available",
        checked_out_by: null,
        ministry: null,
        checkout_date: null,
        due_date: null,
        checkout_purpose_event: null,
      })
      .eq("id", asset.id);

    if (assetUpdateError) {
      console.error(
        "Asset check-in update error:",
        assetUpdateError
      );
      alert(assetUpdateError.message);
      setCheckingInId(null);
      return;
    }

    const { error: historyError } = await supabase
      .from("asset_checkout_history")
      .update({
        checkin_date: checkinDate,
        status: "Returned",
      })
      .eq("asset_id", asset.id)
      .eq("status", "Checked Out")
      .is("checkin_date", null);

    if (historyError) {
      console.error(
        "Asset checkout history update error:",
        historyError
      );
      alert(
        `The asset was checked in, but its history could not be updated:\n\n${historyError.message}`
      );
    }

    setCheckingInId(null);
    await loadAssets();
  }

  const tabs = [
    {
      label: "Available" as const,
      count: counts.available,
      icon: PackageCheck,
      description: "Ready to check out",
    },
    {
      label: "Checked Out" as const,
      count: counts.checkedOut,
      icon: ArrowLeftRight,
      description:
        counts.overdue > 0
          ? `${counts.overdue} overdue`
          : "Currently assigned",
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-12 w-72 animate-pulse rounded-xl bg-slate-200" />

        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1].map((item) => (
            <div
              key={item}
              className="h-24 animate-pulse rounded-2xl bg-white shadow-sm"
            />
          ))}
        </div>

        <div className="h-96 animate-pulse rounded-2xl bg-white shadow-sm" />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
            Equipment Movement
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950 md:text-5xl">
            Check In / Out
          </h1>

          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-500">
            Find individual assets, record who is using them,
            document the purpose or event, and process returns.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={loadAssets}
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </header>

      {errorMessage && (
        <section className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-800 shadow-sm">
          <p className="font-semibold">
            Assets could not be loaded.
          </p>

          <p className="mt-1 text-sm">
            {errorMessage}
          </p>

          <Button
            className="mt-4"
            variant="outline"
            onClick={loadAssets}
          >
            Try Again
          </Button>
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = view === tab.label;

          return (
            <button
              key={tab.label}
              type="button"
              onClick={() => {
                setView(tab.label);
                setSearch("");
              }}
              className={`flex items-center gap-4 rounded-2xl border p-5 text-left shadow-sm transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 ${
                active
                  ? "border-blue-300 bg-blue-50"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <span
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                  active
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                <Icon className="h-5 w-5" />
              </span>

              <span>
                <span className="block text-lg font-bold text-slate-950">
                  {tab.label} ({tab.count})
                </span>

                <span
                  className={`mt-1 block text-sm ${
                    active
                      ? "text-blue-700"
                      : "text-slate-500"
                  }`}
                >
                  {tab.description}
                </span>
              </span>
            </button>
          );
        })}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Search assets
        </label>

        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search equipment, asset tag, serial number, borrower, location, or event..."
            className="w-full rounded-xl border border-slate-300 bg-white py-3.5 pl-12 pr-4 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 p-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
              {view}
            </p>

            <h2 className="mt-2 text-2xl font-bold text-slate-950">
              Individual assets
            </h2>

            <p className="mt-2 text-slate-500">
              Showing {filteredAssets.length} assets
            </p>
          </div>

          {view === "Checked Out" && counts.overdue > 0 && (
            <span className="rounded-full bg-rose-100 px-4 py-2 text-sm font-bold text-rose-700">
              {counts.overdue} overdue
            </span>
          )}
        </div>

        {filteredAssets.length === 0 ? (
          <div className="p-8 md:p-12">
            <EmptyState
              icon={view === "Available" ? "📦" : "✅"}
              title={
                search.trim()
                  ? "No matching assets"
                  : view === "Available"
                    ? "No assets are available"
                    : "Nothing is checked out"
              }
              description={
                search.trim()
                  ? "Try a different search."
                  : view === "Available"
                    ? "Available individual assets will appear here."
                    : "Checked-out individual assets will appear here."
              }
              secondaryAction={
                search.trim()
                  ? {
                      label: "Clear Search",
                      variant: "outline",
                      onClick: () => setSearch(""),
                    }
                  : undefined
              }
            />
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredAssets.map((asset) => {
              const equipment = getEquipment(asset);
              const overdue = isOverdue(asset);

              return (
                <article
                  key={asset.id}
                  className="p-6 transition hover:bg-slate-50"
                >
                  <div className="flex flex-wrap items-start justify-between gap-5">
                    <div className="flex min-w-0 items-start gap-4">
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                          view === "Available"
                            ? "bg-emerald-100 text-emerald-700"
                            : overdue
                              ? "bg-rose-100 text-rose-700"
                              : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {view === "Available" ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : (
                          <Clock3 className="h-5 w-5" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <h3 className="text-lg font-bold text-slate-950">
                          {assetName(asset)}
                        </h3>

                        <p className="mt-1 text-sm font-medium text-slate-600">
                          {equipment?.name || "Equipment not assigned"}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
                          <span>
                            Tag: {asset.asset_tag || "—"}
                          </span>

                          <span>
                            Serial: {asset.serial_number || "—"}
                          </span>

                          <span>
                            Location: {asset.location || "—"}
                          </span>
                        </div>

                        {view === "Checked Out" && (
                          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            <CheckoutDetail
                              label="Borrower"
                              value={
                                asset.checked_out_by ||
                                "Not recorded"
                              }
                              icon={UserRound}
                            />

                            <CheckoutDetail
                              label="Ministry"
                              value={
                                asset.ministry ||
                                "Not recorded"
                              }
                            />

                            <CheckoutDetail
                              label="Purpose / Event"
                              value={
                                asset.checkout_purpose_event ||
                                "Not recorded"
                              }
                            />

                            <CheckoutDetail
                              label="Due"
                              value={formatDate(asset.due_date)}
                              icon={CalendarClock}
                              danger={overdue}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Link href={`/assets/${asset.id}`}>
                        <Button variant="outline">
                          <Eye className="h-4 w-4" />
                          View Asset
                        </Button>
                      </Link>

                      {view === "Available" ? (
                        <Button
                          onClick={() => openCheckout(asset)}
                        >
                          Check Out
                        </Button>
                      ) : (
                        <Button
                          onClick={() => checkInAsset(asset)}
                          disabled={checkingInId === asset.id}
                        >
                          {checkingInId === asset.id
                            ? "Checking In..."
                            : "Check In"}
                        </Button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {selectedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="border-b border-slate-200 bg-slate-50 p-6 md:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Check Out Asset
                  </p>

                  <h2 className="mt-2 text-3xl font-bold text-slate-950">
                    {assetName(selectedAsset)}
                  </h2>

                  <p className="mt-2 text-slate-500">
                    {selectedAsset.asset_tag || "No asset tag"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeCheckout}
                  disabled={checkingOut}
                  aria-label="Close checkout dialog"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="space-y-6 p-6 md:p-8">
              <div>
                <label className="mb-2 block font-semibold text-slate-800">
                  Person or Group
                </label>

                <input
                  type="text"
                  value={checkedOutBy}
                  onChange={(event) =>
                    setCheckedOutBy(event.target.value)
                  }
                  placeholder="Who is receiving the equipment?"
                  className="w-full rounded-xl border border-slate-300 p-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block font-semibold text-slate-800">
                  Ministry
                </label>

                <input
                  type="text"
                  value={ministry}
                  onChange={(event) =>
                    setMinistry(event.target.value)
                  }
                  placeholder="Worship, Students, Production..."
                  className="w-full rounded-xl border border-slate-300 p-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block font-semibold text-slate-800">
                  Purpose / Event
                </label>

                <input
                  type="text"
                  value={purposeEvent}
                  onChange={(event) =>
                    setPurposeEvent(event.target.value)
                  }
                  placeholder="Sunday service, retreat, rehearsal, loan..."
                  className="w-full rounded-xl border border-slate-300 p-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block font-semibold text-slate-800">
                  Due Date
                </label>

                <input
                  type="date"
                  value={dueDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(event) =>
                    setDueDate(event.target.value)
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div className="flex flex-wrap justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={closeCheckout}
                  disabled={checkingOut}
                >
                  Cancel
                </Button>

                <Button
                  onClick={checkOutAsset}
                  disabled={
                    checkingOut ||
                    !checkedOutBy.trim() ||
                    !purposeEvent.trim() ||
                    !dueDate
                  }
                >
                  <ArrowLeftRight className="h-4 w-4" />
                  {checkingOut
                    ? "Checking Out..."
                    : "Complete Checkout"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

type CheckoutDetailProps = {
  label: string;
  value: string;
  icon?: typeof UserRound;
  danger?: boolean;
};

function CheckoutDetail({
  label,
  value,
  icon: Icon,
  danger = false,
}: CheckoutDetailProps) {
  return (
    <div
      className={`rounded-xl border p-3 ${
        danger
          ? "border-rose-200 bg-rose-50"
          : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-center gap-2">
        {Icon && (
          <Icon
            className={`h-4 w-4 ${
              danger ? "text-rose-600" : "text-slate-400"
            }`}
          />
        )}

        <p
          className={`text-xs font-semibold uppercase tracking-wide ${
            danger ? "text-rose-700" : "text-slate-500"
          }`}
        >
          {label}
        </p>
      </div>

      <p
        className={`mt-1 font-semibold ${
          danger ? "text-rose-900" : "text-slate-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
}