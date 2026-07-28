"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";

const equipment = [
  {
    id: "A-1001",
    name: "Shure SM58",
    category: "Microphone",
    status: "Available",
    location: "Rack A",
    serial: "SM58-43827",
    purchased: "Jan 2024",
    value: "$99",
    notes: "Primary handheld vocal microphone.",
  },
  {
    id: "A-1002",
    name: "Sony FX3",
    category: "Camera",
    status: "Checked Out",
    location: "Production",
    serial: "FX3-91284",
    purchased: "March 2024",
    value: "$3,900",
    notes: "Main livestream camera.",
  },
  {
    id: "A-1003",
    name: "Allen & Heath SQ5",
    category: "Mixer",
    status: "In Repair",
    location: "Tech Shop",
    serial: "SQ5-88312",
    purchased: "August 2023",
    value: "$4,500",
    notes: "Waiting on replacement power supply.",
  },
];

export default function EquipmentDetails() {
  const params = useParams();

  const item = equipment.find((e) => e.id === params.id);

  if (!item) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold">Equipment Not Found</h1>

        <Link
          href="/inventory"
          className="mt-6 inline-block text-blue-600 hover:underline"
        >
          ← Back to Inventory
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8">
      <Link
        href="/inventory"
        className="text-blue-600 hover:underline"
      >
        ← Back to Inventory
      </Link>

      <div className="mt-6 rounded-2xl bg-white p-8 shadow">

        <div className="flex items-center justify-between">

          <div>
            <h1 className="text-4xl font-bold">
              {item.name}
            </h1>

            <p className="mt-2 text-gray-500">
              Asset Tag: {item.id}
            </p>
          </div>

          <span
            className={`rounded-full px-4 py-2 font-semibold ${
              item.status === "Available"
                ? "bg-green-100 text-green-700"
                : item.status === "Checked Out"
                ? "bg-yellow-100 text-yellow-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {item.status}
          </span>

        </div>

        <div className="mt-10 grid grid-cols-2 gap-6">

          <div className="rounded-xl border p-5">
            <p className="text-sm text-gray-500">Category</p>
            <p className="mt-1 text-xl font-semibold">
              {item.category}
            </p>
          </div>

          <div className="rounded-xl border p-5">
            <p className="text-sm text-gray-500">Location</p>
            <p className="mt-1 text-xl font-semibold">
              {item.location}
            </p>
          </div>

          <div className="rounded-xl border p-5">
            <p className="text-sm text-gray-500">Serial Number</p>
            <p className="mt-1 text-xl font-semibold">
              {item.serial}
            </p>
          </div>

          <div className="rounded-xl border p-5">
            <p className="text-sm text-gray-500">Purchase Date</p>
            <p className="mt-1 text-xl font-semibold">
              {item.purchased}
            </p>
          </div>

          <div className="rounded-xl border p-5">
            <p className="text-sm text-gray-500">Replacement Value</p>
            <p className="mt-1 text-xl font-semibold">
              {item.value}
            </p>
          </div>

        </div>

        <div className="mt-8 rounded-xl border p-5">
          <h2 className="mb-2 text-xl font-bold">
            Notes
          </h2>

          <p className="text-gray-700">
            {item.notes}
          </p>
        </div>

        <div className="mt-8 flex gap-4">
          <Button>Edit Equipment</Button>

          <Button variant="outline">
            Print QR Code
          </Button>
        </div>

      </div>
    </div>
  );
}