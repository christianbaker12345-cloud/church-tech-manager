"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import TransfersTable, {
  type TransferRecord,
} from "@/components/assets/TransfersTable";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

type UserRole = "Admin" | "Staff" | "Volunteer";

type StatusFilter =
  | "All"
  | "Active"
  | "Overdue"
  | "Due Today"
  | "Returned";

export default function TransfersPage() {
  const router = useRouter();

  const [transfers, setTransfers] = useState<TransferRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [returningTransferId, setReturningTransferId] =
    useState<string | null>(null);

  const [role, setRole] =
    useState<UserRole>("Volunteer");

  const [accessChecking, setAccessChecking] =
    useState(true);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("All");

  const [departmentFilter, setDepartmentFilter] =
    useState("All");

  useEffect(() => {
    initializePage();
  }, []);

  async function initializePage() {
    setAccessChecking(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      router.replace("/inventory");
      return;
    }

    const { data: profile, error: profileError } =
      await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

    if (profileError) {
      console.error(
        "Unable to verify transfer access:",
        profileError
      );

      router.replace("/inventory");
      return;
    }

    const nextRole: UserRole =
      profile?.role === "Admin"
        ? "Admin"
        : profile?.role === "Staff"
          ? "Staff"
          : "Volunteer";

    if (nextRole === "Volunteer") {
      router.replace("/inventory");
      return;
    }

    setRole(nextRole);

    await loadTransfers();

    setAccessChecking(false);
  }

  const canManageTransfers =
    role === "Admin" || role === "Staff";

  async function loadTransfers() {
    setLoading(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("equipment_transfers")
      .select(`
        id,
        asset_id,
        checked_out_by,
        department,
        purpose,
        checked_out_date,
        due_date,
        returned_date,
        notes,
        created_at,
        assets (
          id,
          asset_tag,
          display_name,
          status
        )
      `)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(
        "Transfers load error:",
        error
      );

      setErrorMessage(error.message);
      setTransfers([]);
      setLoading(false);
      return;
    }

    setTransfers(
      (data ?? []) as TransferRecord[]
    );

    setLoading(false);
  }

  function getStatus(
    transfer: TransferRecord
  ) {
    if (transfer.returned_date) {
      return "Returned";
    }

    const today = new Date()
      .toISOString()
      .split("T")[0];

    if (transfer.due_date < today) {
      return "Overdue";
    }

    if (transfer.due_date === today) {
      return "Due Today";
    }

    return "Active";
  }

  const departments = useMemo(() => {
    const values = transfers
      .map(
        (transfer) =>
          transfer.department
      )
      .filter(
        (
          department
        ): department is string =>
          Boolean(
            department &&
              department.trim()
          )
      );

    return Array.from(
      new Set(values)
    ).sort();
  }, [transfers]);

  const filteredTransfers = useMemo(() => {
    const normalizedSearch =
      search
        .trim()
        .toLowerCase();

    return transfers.filter(
      (transfer) => {
        const equipment =
          Array.isArray(
            transfer.assets
          )
            ? transfer.assets[0]
            : transfer.assets;

        const equipmentName =
          equipment?.display_name ||
          equipment?.asset_tag ||
          "";

        const matchesSearch =
          normalizedSearch.length === 0 ||
          equipmentName
            .toLowerCase()
            .includes(
              normalizedSearch
            ) ||
          transfer.checked_out_by
            .toLowerCase()
            .includes(
              normalizedSearch
            ) ||
          transfer.department
            ?.toLowerCase()
            .includes(
              normalizedSearch
            ) ||
          transfer.purpose
            ?.toLowerCase()
            .includes(
              normalizedSearch
            );

        const transferStatus =
          getStatus(transfer);

        const matchesStatus =
          statusFilter === "All" ||
          transferStatus ===
            statusFilter;

        const matchesDepartment =
          departmentFilter ===
            "All" ||
          transfer.department ===
            departmentFilter;

        return (
          matchesSearch &&
          matchesStatus &&
          matchesDepartment
        );
      }
    );
  }, [
    transfers,
    search,
    statusFilter,
    departmentFilter,
  ]);

  const today = new Date()
    .toISOString()
    .split("T")[0];

  const activeCount =
    transfers.filter(
      (transfer) =>
        !transfer.returned_date
    ).length;

  const overdueCount =
    transfers.filter(
      (transfer) =>
        !transfer.returned_date &&
        transfer.due_date < today
    ).length;

  const dueTodayCount =
    transfers.filter(
      (transfer) =>
        !transfer.returned_date &&
        transfer.due_date === today
    ).length;

  const returnedCount =
    transfers.filter(
      (transfer) =>
        transfer.returned_date !==
        null
    ).length;

  async function returnEquipment(
    transfer: TransferRecord
  ) {
    if (!canManageTransfers) {
      alert(
        "You do not have permission to return transferred equipment."
      );
      return;
    }

    const equipment =
      Array.isArray(
        transfer.assets
      )
        ? transfer.assets[0]
        : transfer.assets;

    const equipmentName =
      equipment?.display_name ||
      equipment?.asset_tag ||
      "this equipment";

    const confirmed =
      window.confirm(
        `Return ${equipmentName}?`
      );

    if (!confirmed) return;

    setReturningTransferId(
      transfer.id
    );

    setErrorMessage("");

    const returnDate = new Date()
      .toISOString()
      .split("T")[0];

    const {
      error: transferError,
    } = await supabase
      .from(
        "equipment_transfers"
      )
      .update({
        returned_date: returnDate,
        updated_at:
          new Date().toISOString(),
      })
      .eq(
        "id",
        transfer.id
      );

    if (transferError) {
      console.error(
        "Transfer return error:",
        transferError
      );

      setErrorMessage(
        transferError.message
      );

      setReturningTransferId(
        null
      );

      return;
    }

    const {
      error: equipmentError,
    } = await supabase
      .from("assets")
      .update({
        status: "Available",
        checked_out_by: null,
        ministry: null,
        checkout_date: null,
        due_date: null,
      })
      .eq(
        "id",
        transfer.asset_id
      );

    if (equipmentError) {
      console.error(
        "Equipment status return error:",
        equipmentError
      );

      setErrorMessage(
        `The transfer was marked returned, but the equipment status could not be updated: ${equipmentError.message}`
      );

      setReturningTransferId(
        null
      );

      await loadTransfers();

      return;
    }

    setReturningTransferId(
      null
    );

    await loadTransfers();
  }

  const statCards = [
    {
      label: "Active Transfers",
      value: activeCount,
      valueClassName:
        "text-yellow-600",
    },
    {
      label: "Overdue",
      value: overdueCount,
      valueClassName:
        "text-red-600",
    },
    {
      label: "Due Today",
      value: dueTodayCount,
      valueClassName:
        "text-orange-600",
    },
    {
      label: "Returned",
      value: returnedCount,
      valueClassName:
        "text-green-600",
    },
  ];

  if (accessChecking) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold">
          Checking access...
        </h1>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-gray-500">
            Equipment Operations
          </p>

          <h1 className="mt-2 text-4xl font-bold">
            Transfers
          </h1>

          <p className="mt-2 text-gray-500">
            Track equipment temporarily moved to another person,
            department, room, or event.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={loadTransfers}
          disabled={loading}
        >
          {loading
            ? "Refreshing..."
            : "Refresh"}
        </Button>
      </div>

      {errorMessage && (
        <div className="mt-6 rounded-xl border border-red-300 bg-red-50 p-4 text-red-700">
          <p className="font-semibold">
            Transfer information could not be updated.
          </p>

          <p className="mt-1 text-sm">
            {errorMessage}
          </p>
        </div>
      )}

      <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map(
          (card) => (
            <div
              key={card.label}
              className="rounded-2xl bg-white p-6 shadow"
            >
              <p className="text-gray-500">
                {card.label}
              </p>

              <p
                className={`mt-3 text-4xl font-bold ${card.valueClassName}`}
              >
                {loading
                  ? "—"
                  : card.value}
              </p>
            </div>
          )
        )}
      </div>

      <div className="mt-8 grid gap-4 rounded-2xl bg-white p-6 shadow md:grid-cols-3">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Search
          </label>

          <input
            type="text"
            value={search}
            onChange={(
              event
            ) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Search equipment, person, department..."
            className="w-full rounded-lg border p-3"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Status
          </label>

          <select
            value={
              statusFilter
            }
            onChange={(
              event
            ) =>
              setStatusFilter(
                event.target
                  .value as StatusFilter
              )
            }
            className="w-full rounded-lg border bg-white p-3"
          >
            <option value="All">
              All Statuses
            </option>

            <option value="Active">
              Active
            </option>

            <option value="Overdue">
              Overdue
            </option>

            <option value="Due Today">
              Due Today
            </option>

            <option value="Returned">
              Returned
            </option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Department
          </label>

          <select
            value={
              departmentFilter
            }
            onChange={(
              event
            ) =>
              setDepartmentFilter(
                event.target.value
              )
            }
            className="w-full rounded-lg border bg-white p-3"
          >
            <option value="All">
              All Departments
            </option>

            {departments.map(
              (
                department
              ) => (
                <option
                  key={
                    department
                  }
                  value={
                    department
                  }
                >
                  {department}
                </option>
              )
            )}
          </select>
        </div>
      </div>

      <div className="mt-8 rounded-2xl bg-white p-8 shadow">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">
              Transfer History
            </h2>

            <p className="mt-1 text-gray-500">
              Showing{" "}
              {
                filteredTransfers.length
              }{" "}
              of{" "}
              {
                transfers.length
              }{" "}
              records
            </p>
          </div>
        </div>

        {loading ? (
          <p className="text-gray-500">
            Loading transfers...
          </p>
        ) : (
          <TransfersTable
            transfers={
              filteredTransfers
            }
            returningTransferId={
              returningTransferId
            }
            onReturn={
              returnEquipment
            }
            canManage={
              canManageTransfers
            }
          />
        )}
      </div>
    </div>
  );
}