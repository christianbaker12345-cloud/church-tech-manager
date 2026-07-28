"use client";

import { useState } from "react";

export default function InventoryPage() {
  const [search, setSearch] = useState("");

  const equipment = [
    {
      id: "A-1001",
      name: "Shure SM58",
      category: "Microphone",
      status: "Available",
      location: "Rack A",
    },
    {
      id: "A-1002",
      name: "Sony FX3",
      category: "Camera",
      status: "Checked Out",
      location: "Production",
    },
    {
      id: "A-1003",
      name: "Allen & Heath SQ5",
      category: "Mixer",
      status: "In Repair",
      location: "Tech Shop",
    },
  ];

  const filteredEquipment = equipment.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase()) ||
      item.location.toLowerCase().includes(search.toLowerCase()) ||
      item.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Inventory</h1>

        <button className="rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700">
          + Add Equipment
        </button>
      </div>

      <div className="mb-6 rounded-xl bg-white p-6 shadow">
        <input
          type="text"
          placeholder="Search equipment..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border px-4 py-2"
        />
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr className="text-left">
              <th className="p-4">Asset Tag</th>
              <th className="p-4">Name</th>
              <th className="p-4">Category</th>
              <th className="p-4">Status</th>
              <th className="p-4">Location</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredEquipment.map((item) => (
              <tr key={item.id} className="border-t">
                <td className="p-4">{item.id}</td>
                <td className="p-4">{item.name}</td>
                <td className="p-4">{item.category}</td>

                <td className="p-4">
                  <span
                    className={`rounded-full px-3 py-1 text-sm font-medium ${
                      item.status === "Available"
                        ? "bg-green-100 text-green-700"
                        : item.status === "Checked Out"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {item.status}
                  </span>
                </td>

                <td className="p-4">{item.location}</td>

                <td className="p-4">
                  <button className="text-blue-600 hover:underline">
                    View
                  </button>
                </td>
              </tr>
            ))}

            {filteredEquipment.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="p-8 text-center text-gray-500"
                >
                  No equipment found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}