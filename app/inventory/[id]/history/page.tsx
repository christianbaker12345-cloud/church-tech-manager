"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type History = {
  id: string;
  equipment_name: string;
  checked_out_by: string;
  ministry: string;
  checkout_date: string;
  due_date: string;
  checkin_date: string | null;
  status: string;
};

export default function HistoryPage() {
  const params = useParams();

  const [history, setHistory] = useState<History[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    const { data, error } = await supabase
      .from("checkout_history")
      .select("*")
      .eq("equipment_id", params.id)
      .order("checkout_date", { ascending: false });

    if (error) {
      console.error(error);
      alert(error.message);
      setLoading(false);
      return;
    }

    setHistory(data ?? []);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="p-8 text-2xl font-bold">
        Loading...
      </div>
    );
  }

  return (
    <div className="p-8">

      <Link
        href={`/inventory/${params.id}`}
        className="text-blue-600 hover:underline"
      >
        ← Back to Equipment
      </Link>

      <h1 className="mt-6 mb-8 text-4xl font-bold">
        Equipment History
      </h1>

      <div className="overflow-hidden rounded-2xl border bg-white shadow">

        <table className="w-full">

          <thead className="bg-gray-100">

            <tr>

              <th className="p-4 text-left">
                Status
              </th>

              <th className="p-4 text-left">
                Person
              </th>

              <th className="p-4 text-left">
                Ministry
              </th>

              <th className="p-4 text-left">
                Checked Out
              </th>

              <th className="p-4 text-left">
                Due
              </th>

              <th className="p-4 text-left">
                Returned
              </th>

            </tr>

          </thead>

          <tbody>

            {history.map((row) => (

              <tr
                key={row.id}
                className="border-t"
              >

                <td className="p-4">

                  <span
                    className={`rounded-full px-3 py-1 text-sm font-medium ${
                      row.status === "Returned"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {row.status}
                  </span>

                </td>

                <td className="p-4">
                  {row.checked_out_by}
                </td>

                <td className="p-4">
                  {row.ministry}
                </td>

                <td className="p-4">
                  {row.checkout_date}
                </td>

                <td className="p-4">
                  {row.due_date}
                </td>

                <td className="p-4">
                  {row.checkin_date ?? "—"}
                </td>

              </tr>

            ))}

          </tbody>

        </table>

        {history.length === 0 && (

          <div className="p-10 text-center text-gray-500">
            No checkout history yet.
          </div>

        )}

      </div>

    </div>
  );
}