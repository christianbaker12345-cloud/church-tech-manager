"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

export default function EditEquipmentPage() {
  const params = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState("Available");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    loadEquipment();
  }, []);

  async function loadEquipment() {
    const { data, error } = await supabase
      .from("equipment")
      .select("*")
      .eq("id", params.id)
      .single();

    if (error) {
      console.error(error);
      alert("Equipment not found.");
      router.push("/inventory");
      return;
    }

    setName(data.name ?? "");
    setCategory(data.category ?? "");
    setQuantity(data.quantity ?? 1);
    setLocation(data.location ?? "");
    setStatus(data.status ?? "Available");
    setNotes(data.notes ?? "");

    setLoading(false);
  }

  async function saveEquipment() {
    setSaving(true);

    const { error } = await supabase
      .from("equipment")
      .update({
        name,
        category,
        quantity,
        location,
        status,
        notes,
      })
      .eq("id", params.id);

    setSaving(false);

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    router.push(`/inventory/${params.id}`);
  }

  if (loading) {
    return (
      <div className="p-8 text-2xl font-bold">
        Loading...
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl">

      <Link
        href={`/inventory/${params.id}`}
        className="text-blue-600 hover:underline"
      >
        ← Back
      </Link>

      <h1 className="text-4xl font-bold mt-6 mb-8">
        Edit Equipment
      </h1>

      <div className="space-y-6 rounded-2xl border bg-white p-8">

        <div>
          <label className="block mb-2 font-semibold">
            Equipment Name
          </label>

          <input
            className="w-full rounded-lg border p-3"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-6">

          <div>
            <label className="block mb-2 font-semibold">
              Category
            </label>

            <input
              className="w-full rounded-lg border p-3"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>

          <div>
            <label className="block mb-2 font-semibold">
              Quantity
            </label>

            <input
              type="number"
              className="w-full rounded-lg border p-3"
              value={quantity}
              onChange={(e) =>
                setQuantity(Number(e.target.value))
              }
            />
          </div>

          <div>
            <label className="block mb-2 font-semibold">
              Location
            </label>

            <input
              className="w-full rounded-lg border p-3"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div>
            <label className="block mb-2 font-semibold">
              Status
            </label>

            <select
              className="w-full rounded-lg border p-3"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option>Available</option>
              <option>Checked Out</option>
              <option>Maintenance</option>
            </select>
          </div>

        </div>

        <div>
          <label className="block mb-2 font-semibold">
            Notes
          </label>

          <textarea
            rows={6}
            className="w-full rounded-lg border p-3"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="flex gap-4">

          <Button
            onClick={saveEquipment}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>

          <Button
            variant="outline"
            onClick={() =>
              router.push(`/inventory/${params.id}`)
            }
          >
            Cancel
          </Button>

        </div>

      </div>

    </div>
  );
}