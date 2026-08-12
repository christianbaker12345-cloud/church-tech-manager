"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeftRight,
  CalendarClock,
  Eye,
  Package,
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
  equipment: EquipmentSummary | EquipmentSummary[] | null;
};

type CheckoutView = "Available" | "Checked Out";

type EquipmentGroup = {
  equipmentId: string;
  name: string;
  category: string | null;
  location: string | null;
  assets: Asset[];
  overdueCount: number;
};

export default function CheckInOutPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [view, setView] = useState<CheckoutView>("Available");
  const [search, setSearch] = useState("");

  const [selectedGroup, setSelectedGroup] =
    useState<EquipmentGroup | null>(null);

  const [selectedAsset, setSelectedAsset] =
    useState<Asset | null>(null);

  const [checkInConfirmAsset, setCheckInConfirmAsset] =
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

  useEffect(() => {
    const modalOpen =
      selectedGroup !== null ||
      selectedAsset !== null ||
      checkInConfirmAsset !== null;

    if (!modalOpen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [
    selectedGroup,
    selectedAsset,
    checkInConfirmAsset,
  ]);

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
      console.error(
        "Check In / Out asset load error:",
        error
      );

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
    if (!asset.due_date) {
      return false;
    }

    if (
      normalizeStatus(asset.status) !==
      "checked out"
    ) {
      return false;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const due = new Date(
      `${asset.due_date}T00:00:00`
    );

    return due.getTime() < today.getTime();
  }

  const counts = useMemo(() => {
    return {
      available: assets.filter(
        (asset) =>
          normalizeStatus(asset.status) ===
          "available"
      ).length,

      checkedOut: assets.filter(
        (asset) =>
          normalizeStatus(asset.status) ===
          "checked out"
      ).length,

      overdue: assets.filter(isOverdue).length,
    };
  }, [assets]);

  const equipmentGroups = useMemo(() => {
    const groups =
      new Map<string, EquipmentGroup>();

    for (const asset of assets) {
      const status =
        normalizeStatus(asset.status);

      const matchesView =
        view === "Available"
          ? status === "available"
          : status === "checked out";

      if (!matchesView) {
        continue;
      }

      const equipment =
        getEquipment(asset);

      const existing =
        groups.get(asset.equipment_id);

      if (existing) {
        existing.assets.push(asset);

        if (isOverdue(asset)) {
          existing.overdueCount += 1;
        }

        if (
          !existing.location &&
          asset.location
        ) {
          existing.location =
            asset.location;
        }

        continue;
      }

      groups.set(asset.equipment_id, {
        equipmentId: asset.equipment_id,
        name:
          equipment?.name ||
          asset.display_name ||
          asset.asset_tag ||
          "Unnamed Equipment",
        category:
          equipment?.category ?? null,
        location:
          asset.location ?? null,
        assets: [asset],
        overdueCount:
          isOverdue(asset) ? 1 : 0,
      });
    }

    return Array.from(
      groups.values()
    ).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [assets, view]);

  const filteredGroups = useMemo(() => {
    const needle =
      search.trim().toLowerCase();

    if (!needle) {
      return equipmentGroups;
    }

    return equipmentGroups.filter(
      (group) => {
        const groupMatch = [
          group.name,
          group.category,
          group.location,
        ].some((value) =>
          value
            ?.toLowerCase()
            .includes(needle)
        );

        if (groupMatch) {
          return true;
        }

        return group.assets.some(
          (asset) =>
            [
              asset.display_name,
              asset.asset_tag,
              asset.serial_number,
              asset.location,
              asset.checked_out_by,
              asset.ministry,
              asset.checkout_purpose_event,
            ].some((value) =>
              value
                ?.toLowerCase()
                .includes(needle)
            )
        );
      }
    );
  }, [equipmentGroups, search]);

  function openCheckout(asset: Asset) {
    setSelectedAsset(asset);
    setCheckedOutBy("");
    setMinistry("");
    setPurposeEvent("");
    setDueDate("");
  }

  function closeCheckout() {
    if (checkingOut) {
      return;
    }

    setSelectedAsset(null);
    setCheckedOutBy("");
    setMinistry("");
    setPurposeEvent("");
    setDueDate("");
  }

  async function checkOutAsset() {
    if (!selectedAsset) {
      return;
    }

    if (!checkedOutBy.trim()) {
      alert(
        "Enter the person or group checking this out."
      );
      return;
    }

    if (!purposeEvent.trim()) {
      alert(
        "Enter the purpose or event."
      );
      return;
    }

    if (!dueDate) {
      alert("Choose a due date.");
      return;
    }

    setCheckingOut(true);

    const checkoutDate =
      new Date()
        .toISOString()
        .split("T")[0];

    const {
      error: assetUpdateError,
    } = await supabase
      .from("assets")
      .update({
        status: "Checked Out",
        checked_out_by:
          checkedOutBy.trim(),
        ministry:
          ministry.trim() || null,
        checkout_date:
          checkoutDate,
        due_date: dueDate,
        checkout_purpose_event:
          purposeEvent.trim(),
      })
      .eq(
        "id",
        selectedAsset.id
      );

    if (assetUpdateError) {
      console.error(
        "Asset checkout update error:",
        assetUpdateError
      );

      alert(assetUpdateError.message);
      setCheckingOut(false);
      return;
    }

    const {
      error: historyError,
    } = await supabase
      .from(
        "asset_checkout_history"
      )
      .insert({
        asset_id:
          selectedAsset.id,
        asset_tag:
          selectedAsset.asset_tag,
        display_name:
          selectedAsset.display_name,
        checked_out_by:
          checkedOutBy.trim(),
        ministry:
          ministry.trim() || null,
        purpose_event:
          purposeEvent.trim(),
        checkout_date:
          checkoutDate,
        due_date:
          dueDate,
        status:
          "Checked Out",
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
    setSelectedGroup(null);
    setView("Checked Out");

    await loadAssets();
  }

  async function checkInAsset(asset: Asset) {
    setCheckingInId(asset.id);

    const checkinDate =
      new Date()
        .toISOString()
        .split("T")[0];

    const {
      error: assetUpdateError,
    } = await supabase
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

    const {
      error: historyError,
    } = await supabase
      .from(
        "asset_checkout_history"
      )
      .update({
        checkin_date:
          checkinDate,
        status:
          "Returned",
      })
      .eq(
        "asset_id",
        asset.id
      )
      .eq(
        "status",
        "Checked Out"
      )
      .is(
        "checkin_date",
        null
      );

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
    setCheckInConfirmAsset(null);
    setSelectedGroup(null);

    await loadAssets();
  }

  const availableGroupCount =
    new Set(
      assets
        .filter(
          (asset) =>
            normalizeStatus(
              asset.status
            ) === "available"
        )
        .map(
          (asset) =>
            asset.equipment_id
        )
    ).size;

  const checkedOutGroupCount =
    new Set(
      assets
        .filter(
          (asset) =>
            normalizeStatus(
              asset.status
            ) === "checked out"
        )
        .map(
          (asset) =>
            asset.equipment_id
        )
    ).size;

  const tabs = [
    {
      label:
        "Available" as const,
      count:
        availableGroupCount,
      icon:
        PackageCheck,
      description:
        `${counts.available} individual assets ready to check out`,
    },
    {
      label:
        "Checked Out" as const,
      count:
        checkedOutGroupCount,
      icon:
        ArrowLeftRight,
      description:
        counts.overdue > 0
          ? `${counts.checkedOut} assets · ${counts.overdue} overdue`
          : `${counts.checkedOut} individual assets currently assigned`,
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-12 w-72 animate-pulse rounded-xl bg-slate-200" />

        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1].map(
            (item) => (
              <div
                key={item}
                className="h-24 animate-pulse rounded-2xl bg-white shadow-sm"
              />
            )
          )}
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
            Choose an equipment type first, then select the individual
            asset you want to check out or return.
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
        {tabs.map(
          (tab) => {
            const Icon =
              tab.icon;

            const active =
              view === tab.label;

            return (
              <button
                key={tab.label}
                type="button"
                onClick={() => {
                  setView(tab.label);
                  setSearch("");
                  setSelectedGroup(null);
                  setSelectedAsset(null);
                  setCheckInConfirmAsset(null);
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
          }
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Search equipment
        </label>

        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Search equipment name, category, location, asset tag, borrower, or event..."
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
              Equipment
            </h2>

            <p className="mt-2 text-slate-500">
              Showing {filteredGroups.length} equipment groups
            </p>
          </div>

          {view === "Checked Out" &&
            counts.overdue > 0 && (
              <span className="rounded-full bg-rose-100 px-4 py-2 text-sm font-bold text-rose-700">
                {counts.overdue} overdue
              </span>
            )}
        </div>

        {filteredGroups.length === 0 ? (
          <div className="p-8 md:p-12">
            <EmptyState
              icon={
                view === "Available"
                  ? "📦"
                  : "✅"
              }
              title={
                search.trim()
                  ? "No matching equipment"
                  : view === "Available"
                    ? "No equipment is available"
                    : "Nothing is checked out"
              }
              description={
                search.trim()
                  ? "Try a different search."
                  : view === "Available"
                    ? "Equipment with available individual assets will appear here."
                    : "Equipment with checked-out individual assets will appear here."
              }
              secondaryAction={
                search.trim()
                  ? {
                      label:
                        "Clear Search",
                      variant:
                        "outline",
                      onClick: () =>
                        setSearch(""),
                    }
                  : undefined
              }
            />
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredGroups.map(
              (group) => (
                <article
                  key={
                    group.equipmentId
                  }
                  className="p-6 transition hover:bg-slate-50"
                >
                  <div className="flex flex-wrap items-center justify-between gap-5">
                    <div className="flex min-w-0 items-center gap-4">
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                          view ===
                          "Available"
                            ? "bg-emerald-100 text-emerald-700"
                            : group.overdueCount >
                                0
                              ? "bg-rose-100 text-rose-700"
                              : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        <Package className="h-5 w-5" />
                      </div>

                      <div className="min-w-0">
                        <h3 className="text-lg font-bold text-slate-950">
                          {group.name}
                        </h3>

                        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
                          <span>
                            {group.assets.length}{" "}
                            {view ===
                            "Available"
                              ? "available"
                              : "checked out"}
                          </span>

                          <span>
                            Category:{" "}
                            {group.category ||
                              "—"}
                          </span>

                          <span>
                            Location:{" "}
                            {group.location ||
                              "—"}
                          </span>

                          {view ===
                            "Checked Out" &&
                            group.overdueCount >
                              0 && (
                              <span className="font-semibold text-rose-600">
                                {
                                  group.overdueCount
                                }{" "}
                                overdue
                              </span>
                            )}
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      onClick={() =>
                        setSelectedGroup(
                          group
                        )
                      }
                    >
                      {view ===
                      "Available"
                        ? "Choose Asset"
                        : "View Checked Out"}
                    </Button>
                  </div>
                </article>
              )
            )}
          </div>
        )}
      </section>

      {selectedGroup && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-slate-50 p-6 md:p-8">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                  {view ===
                  "Available"
                    ? "Choose Individual Asset"
                    : "Checked Out Assets"}
                </p>

                <h2 className="mt-2 text-3xl font-bold text-slate-950">
                  {selectedGroup.name}
                </h2>

                <p className="mt-2 text-slate-500">
                  {
                    selectedGroup
                      .assets.length
                  }{" "}
                  {view ===
                  "Available"
                    ? "available"
                    : "checked out"}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedGroup(
                    null
                  )
                }
                aria-label="Close asset list"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[65vh] divide-y divide-slate-100 overflow-y-auto overscroll-contain">
              {selectedGroup.assets.map(
                (asset) => {
                  const overdue =
                    isOverdue(asset);

                  return (
                    <article
                      key={
                        asset.id
                      }
                      className="p-6"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-5">
                        <div className="min-w-0">
                          <h3 className="text-lg font-bold text-slate-950">
                            {assetName(
                              asset
                            )}
                          </h3>

                          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
                            <span>
                              Tag:{" "}
                              {asset.asset_tag ||
                                "—"}
                            </span>

                            <span>
                              Serial:{" "}
                              {asset.serial_number ||
                                "—"}
                            </span>

                            <span>
                              Location:{" "}
                              {asset.location ||
                                "—"}
                            </span>
                          </div>

                          {view ===
                            "Checked Out" && (
                            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                              <CheckoutDetail
                                label="Borrower"
                                value={
                                  asset.checked_out_by ||
                                  "Not recorded"
                                }
                                icon={
                                  UserRound
                                }
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
                                value={formatDate(
                                  asset.due_date
                                )}
                                icon={
                                  CalendarClock
                                }
                                danger={
                                  overdue
                                }
                              />
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-3">
                          <Link
                            href={`/assets/${asset.id}`}
                          >
                            <Button variant="outline">
                              <Eye className="h-4 w-4" />
                              View Asset
                            </Button>
                          </Link>

                          {view ===
                          "Available" ? (
                            <Button
                              onClick={() =>
                                openCheckout(
                                  asset
                                )
                              }
                            >
                              Check Out
                            </Button>
                          ) : (
                            <Button
                              onClick={() =>
                                setCheckInConfirmAsset(
                                  asset
                                )
                              }
                              disabled={
                                checkingInId ===
                                asset.id
                              }
                            >
                              {checkingInId ===
                              asset.id
                                ? "Checking In..."
                                : "Check In"}
                            </Button>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                }
              )}
            </div>
          </div>
        </div>
      )}

      {checkInConfirmAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="border-b border-slate-200 bg-slate-50 p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Return Equipment
                  </p>

                  <h2 className="mt-2 text-2xl font-bold text-slate-950">
                    Check In Equipment?
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setCheckInConfirmAsset(
                      null
                    )
                  }
                  disabled={
                    checkingInId ===
                    checkInConfirmAsset.id
                  }
                  aria-label="Close check-in confirmation"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-lg font-bold text-slate-950">
                  {assetName(
                    checkInConfirmAsset
                  )}
                </p>

                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
                  <span>
                    Tag:{" "}
                    {checkInConfirmAsset.asset_tag ||
                      "—"}
                  </span>

                  <span>
                    Location:{" "}
                    {checkInConfirmAsset.location ||
                      "—"}
                  </span>
                </div>
              </div>

              <p className="mt-5 leading-7 text-slate-600">
                This asset will be returned and marked as{" "}
                <span className="font-semibold text-emerald-700">
                  Available
                </span>
                .
              </p>

              <div className="mt-7 flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() =>
                    setCheckInConfirmAsset(
                      null
                    )
                  }
                  disabled={
                    checkingInId ===
                    checkInConfirmAsset.id
                  }
                >
                  Cancel
                </Button>

                <Button
                  onClick={() =>
                    checkInAsset(
                      checkInConfirmAsset
                    )
                  }
                  disabled={
                    checkingInId ===
                    checkInConfirmAsset.id
                  }
                >
                  {checkingInId ===
                  checkInConfirmAsset.id
                    ? "Checking In..."
                    : "Check In"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                    {assetName(
                      selectedAsset
                    )}
                  </h2>

                  <p className="mt-2 text-slate-500">
                    {selectedAsset.asset_tag ||
                      "No asset tag"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    closeCheckout
                  }
                  disabled={
                    checkingOut
                  }
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
                  value={
                    checkedOutBy
                  }
                  onChange={(
                    event
                  ) =>
                    setCheckedOutBy(
                      event.target
                        .value
                    )
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
                  onChange={(
                    event
                  ) =>
                    setMinistry(
                      event.target
                        .value
                    )
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
                  value={
                    purposeEvent
                  }
                  onChange={(
                    event
                  ) =>
                    setPurposeEvent(
                      event.target
                        .value
                    )
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
                  min={
                    new Date()
                      .toISOString()
                      .split("T")[0]
                  }
                  onChange={(
                    event
                  ) =>
                    setDueDate(
                      event.target
                        .value
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div className="flex flex-wrap justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={
                    closeCheckout
                  }
                  disabled={
                    checkingOut
                  }
                >
                  Cancel
                </Button>

                <Button
                  onClick={
                    checkOutAsset
                  }
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
              danger
                ? "text-rose-600"
                : "text-slate-400"
            }`}
          />
        )}

        <p
          className={`text-xs font-semibold uppercase tracking-wide ${
            danger
              ? "text-rose-700"
              : "text-slate-500"
          }`}
        >
          {label}
        </p>
      </div>

      <p
        className={`mt-1 font-semibold ${
          danger
            ? "text-rose-900"
            : "text-slate-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
}