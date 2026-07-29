"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

export default function NewEquipmentPage() {
  const router = useRouter();

  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    category: "",
    quantity: 1,
    location: "",
    status: "Available",
    notes: "",
  });

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    setSaving(true);

    const { error } = await supabase
      .from("equipment")
      .insert(form);

    setSaving(false);

    if (error) {
      alert(error.message);
      return;
    }

    router.push("/inventory");
    router.refresh();
  }

  return (
    <div className="p-8 max-w-4xl">

      <Link
        href="/inventory"
        className="text-blue-600 hover:underline"
      >
        ← Back to Inventory
      </Link>

      <h1 className="mt-4 mb-8 text-4xl font-bold">
        Add Equipment
      </h1>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-2xl border bg-white p-8"
      >

        <div>

          <label className="block mb-2">
            Equipment Name
          </label>

          <input
            required
            className="w-full rounded-lg border p-3"
            value={form.name}
            onChange={(e) =>
              setForm({
                ...form,
                name: e.target.value,
              })
            }
          />

        </div>

        <div className="grid grid-cols-2 gap-6">

          <div>

            <label className="block mb-2">
              Category
            </label>

            <input
              className="w-full rounded-lg border p-3"
              value={form.category}
              onChange={(e) =>
                setForm({
                  ...form,
                  category: e.target.value,
                })
              }
            />

          </div>

          <div>

            <label className="block mb-2">
              Quantity
            </label>

            <input
              type="number"
              min={1}
              className="w-full rounded-lg border p-3"
              value={form.quantity}
              onChange={(e) =>
                setForm({
                  ...form,
                  quantity: Number(e.target.value),
                })
              }
            />

          </div>

        </div>

        <div className="grid grid-cols-2 gap-6">

          <div>

            <label className="block mb-2">
              Location
            </label>

            <input
              className="w-full rounded-lg border p-3"
              value={form.location}
              onChange={(e) =>
                setForm({
                  ...form,
                  location: e.target.value,
                })
              }
            />

          </div>

          <div>

            <label className="block mb-2">
              Status
            </label>

            <select
              className="w-full rounded-lg border p-3"
              value={form.status}
              onChange={(e) =>
                setForm({
                  ...form,
                  status: e.target.value,
                })
              }
            >
              <option>Available</option>
              <option>Checked Out</option>
              <option>Maintenance</option>
            </select>

          </div>

        </div>

        <div>

          <label className="block mb-2">
            Notes
          </label>

          <textarea
            rows={5}
            className="w-full rounded-lg border p-3"
            value={form.notes}
            onChange={(e) =>
              setForm({
                ...form,
                notes: e.target.value,
              })
            }
          />

        </div>

        <div className="flex gap-4">

          <Button
            type="submit"
            disabled={saving}
          >
            {saving
              ? "Saving..."
              : "Save Equipment"}
          </Button>

          <Link href="/inventory">
            <Button variant="outline">
              Cancel
            </Button>
          </Link>

        </div>

      </form>

    </div>
  );
}