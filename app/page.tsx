"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

type Equipment = {
  status: string;
};

export default function DashboardPage() {
  const [total, setTotal] = useState(0);
  const [available, setAvailable] = useState(0);
  const [checkedOut, setCheckedOut] = useState(0);
  const [maintenance, setMaintenance] = useState(0);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    const { data, error } = await supabase
      .from("equipment")
      .select("status");

    if (error) {
      console.error(error);
      return;
    }

    const equipment = data ?? [];

    setTotal(equipment.length);
    setAvailable(
      equipment.filter((e) => e.status === "Available").length
    );
    setCheckedOut(
      equipment.filter((e) => e.status === "Checked Out").length
    );
    setMaintenance(
      equipment.filter((e) => e.status === "Maintenance").length
    );
  }

  return (
    <div>

      <div className="mb-8 flex items-center justify-between">

        <div>
          <h1 className="text-4xl font-bold">
            Dashboard
          </h1>

          <p className="mt-2 text-gray-500">
            Welcome to Church Tech Manager
          </p>
        </div>

        <Link href="/inventory/new">
          <Button>Add Equipment</Button>
        </Link>

      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">

        <div className="rounded-2xl bg-white p-6 shadow">
          <p className="text-gray-500">Total Equipment</p>
          <h2 className="mt-3 text-4xl font-bold">{total}</h2>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow">
          <p className="text-gray-500">Available</p>
          <h2 className="mt-3 text-4xl font-bold text-green-600">
            {available}
          </h2>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow">
          <p className="text-gray-500">Checked Out</p>
          <h2 className="mt-3 text-4xl font-bold text-yellow-600">
            {checkedOut}
          </h2>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow">
          <p className="text-gray-500">Maintenance</p>
          <h2 className="mt-3 text-4xl font-bold text-red-600">
            {maintenance}
          </h2>
        </div>

      </div>

      <div className="mt-10 rounded-2xl bg-white p-8 shadow">

        <h2 className="mb-4 text-2xl font-bold">
          Quick Actions
        </h2>

        <div className="flex flex-wrap gap-4">

          <Link href="/inventory">
            <Button>View Inventory</Button>
          </Link>

          <Link href="/inventory/new">
            <Button variant="outline">
              Add Equipment
            </Button>
          </Link>

        </div>

      </div>

    </div>
  );
}