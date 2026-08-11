"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Archive,
  Boxes,
  Building2,
  Car,
  DoorOpen,
  MapPin,
  Package,
  Plus,
  RefreshCw,
  Search,
  Truck,
  Warehouse,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import EmptyState from "@/components/ui/EmptyState";
import { supabase } from "@/lib/supabase";

type Location = {
  id: string;
  name: string;
  campus: string;
  parent_id: string | null;
  description: string | null;
  location_type: string | null;
  created_at: string | null;
};

type EquipmentAtLocation = {
  id: string;
  name: string;
  category: string | null;
  status: string | null;
  quantity: number | null;
  location: string | null;
};

type LocationType =
  | "Campus"
  | "Building"
  | "Room"
  | "Closet"
  | "Rack"
  | "Shelf"
  | "Trailer"
  | "Road Case"
  | "Cabinet"
  | "Drawer"
  | "Vehicle"
  | "Other";

const locationTypes: LocationType[] = [
  "Campus",
  "Building",
  "Room",
  "Closet",
  "Rack",
  "Shelf",
  "Trailer",
  "Road Case",
  "Cabinet",
  "Drawer",
  "Vehicle",
  "Other",
];

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [search, setSearch] = useState("");
  const [campusFilter, setCampusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [campus, setCampus] = useState("");
  const [locationType, setLocationType] =
    useState<LocationType>("Room");
  const [parentId, setParentId] = useState("");
  const [description, setDescription] = useState("");

  const [selectedLocation, setSelectedLocation] =
    useState<Location | null>(null);

  const [editingLocation, setEditingLocation] =
    useState<Location | null>(null);

  const [updating, setUpdating] = useState(false);

  const [editName, setEditName] = useState("");
  const [editCampus, setEditCampus] = useState("");
  const [editLocationType, setEditLocationType] =
    useState<LocationType>("Room");
  const [editParentId, setEditParentId] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const [locationEquipment, setLocationEquipment] = useState<
    EquipmentAtLocation[]
  >([]);

  const [equipmentLoading, setEquipmentLoading] =
    useState(false);

  const [equipmentError, setEquipmentError] = useState("");

  const [equipmentSearch, setEquipmentSearch] =
    useState("");

  useEffect(() => {
    loadLocations();
  }, []);

  async function loadLocations() {
    setLoading(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("locations")
      .select("*")
      .order("campus", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      console.error("Locations load error:", error);
      setErrorMessage(error.message);
      setLocations([]);
      setLoading(false);
      return;
    }

    setLocations((data ?? []) as Location[]);
    setLoading(false);
  }

  async function loadEquipmentForLocation(
    location: Location
  ) {
    setEquipmentLoading(true);
    setEquipmentError("");
    setLocationEquipment([]);
    setEquipmentSearch("");

    const { data, error } = await supabase
      .from("equipment")
      .select(
        "id, name, category, status, quantity, location"
      )
      .eq("location", location.name)
      .order("name", { ascending: true });

    if (error) {
      console.error(
        "Location equipment load error:",
        error
      );

      setEquipmentError(error.message);
      setLocationEquipment([]);
      setEquipmentLoading(false);
      return;
    }

    setLocationEquipment(
      (data ?? []) as EquipmentAtLocation[]
    );

    setEquipmentLoading(false);
  }

  async function createLocation() {
    if (!name.trim()) {
      alert("Enter a location name.");
      return;
    }

    if (!campus.trim()) {
      alert("Enter a campus.");
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from("locations")
      .insert({
        name: name.trim(),
        campus: campus.trim(),
        parent_id: parentId || null,
        description: description.trim() || null,
        location_type: locationType,
      });

    setSaving(false);

    if (error) {
      console.error(
        "Location create error:",
        error
      );

      alert(error.message);
      return;
    }

    setName("");
    setCampus("");
    setLocationType("Room");
    setParentId("");
    setDescription("");
    setShowForm(false);

    await loadLocations();
  }

  async function openLocation(location: Location) {
    setSelectedLocation(location);
    await loadEquipmentForLocation(location);
  }

  function closeLocation() {
    setSelectedLocation(null);
    setLocationEquipment([]);
    setEquipmentSearch("");
    setEquipmentError("");
  }

  function beginEditingLocation(location: Location) {
    setEditingLocation(location);
    setEditName(location.name);
    setEditCampus(location.campus);
    setEditLocationType(
      (location.location_type as LocationType) ||
        "Room"
    );
    setEditParentId(location.parent_id || "");
    setEditDescription(
      location.description || ""
    );
    setSelectedLocation(null);
  }

  async function updateLocation() {
    if (!editingLocation) return;

    if (!editName.trim()) {
      alert("Enter a location name.");
      return;
    }

    if (!editCampus.trim()) {
      alert("Enter a campus.");
      return;
    }

    if (editParentId === editingLocation.id) {
      alert(
        "A location cannot be its own parent."
      );
      return;
    }

    setUpdating(true);

    const oldLocationName = editingLocation.name;
    const newLocationName = editName.trim();

    const { error } = await supabase
      .from("locations")
      .update({
        name: newLocationName,
        campus: editCampus.trim(),
        location_type: editLocationType,
        parent_id: editParentId || null,
        description:
          editDescription.trim() || null,
      })
      .eq("id", editingLocation.id);

    if (error) {
      setUpdating(false);

      console.error(
        "Location update error:",
        error
      );

      alert(error.message);
      return;
    }

    /*
      Equipment currently stores location as text.

      If an Admin renames a location, this keeps
      existing equipment attached to the new name.
    */

    if (oldLocationName !== newLocationName) {
      const { error: equipmentUpdateError } =
        await supabase
          .from("equipment")
          .update({
            location: newLocationName,
          })
          .eq("location", oldLocationName);

      if (equipmentUpdateError) {
        console.error(
          "Equipment location rename update error:",
          equipmentUpdateError
        );

        alert(
          "The location was renamed, but some equipment may still reference the old location name."
        );
      }
    }

    setUpdating(false);
    setEditingLocation(null);

    await loadLocations();
  }

  const campuses = useMemo(() => {
    const values = locations
      .map((location) => location.campus)
      .filter(Boolean);

    return Array.from(
      new Set(values)
    ).sort();
  }, [locations]);

  const filteredLocations = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

    return locations.filter((location) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        location.name
          .toLowerCase()
          .includes(normalizedSearch) ||
        location.campus
          .toLowerCase()
          .includes(normalizedSearch) ||
        location.location_type
          ?.toLowerCase()
          .includes(normalizedSearch) ||
        location.description
          ?.toLowerCase()
          .includes(normalizedSearch);

      const matchesCampus =
        campusFilter === "All" ||
        location.campus === campusFilter;

      const matchesType =
        typeFilter === "All" ||
        location.location_type === typeFilter;

      return matchesSearch && matchesCampus && matchesType;
    });
  }, [
    locations,
    search,
    campusFilter,
    typeFilter,
  ]);

  const filteredLocationEquipment =
    useMemo(() => {
      const normalizedSearch =
        equipmentSearch.trim().toLowerCase();

      if (!normalizedSearch) {
        return locationEquipment;
      }

      return locationEquipment.filter(
        (item) =>
          item.name
            .toLowerCase()
            .includes(normalizedSearch) ||
          item.category
            ?.toLowerCase()
            .includes(normalizedSearch) ||
          item.status
            ?.toLowerCase()
            .includes(normalizedSearch)
      );
    }, [
      locationEquipment,
      equipmentSearch,
    ]);

  const totalEquipmentQuantity =
    useMemo(() => {
      return locationEquipment.reduce(
        (total, item) =>
          total + (item.quantity ?? 0),
        0
      );
    }, [locationEquipment]);

  function getParentName(location: Location) {
    if (!location.parent_id) {
      return "Top-level location";
    }

    return (
      locations.find(
        (parent) =>
          parent.id === location.parent_id
      )?.name || "Unknown parent"
    );
  }

  function locationIcon(type: string | null) {
    switch (type) {
      case "Campus":
        return Building2;

      case "Building":
        return Warehouse;

      case "Room":
        return DoorOpen;

      case "Closet":
        return Archive;

      case "Rack":
      case "Shelf":
      case "Cabinet":
      case "Drawer":
        return Boxes;

      case "Trailer":
        return Truck;

      case "Road Case":
        return Package;

      case "Vehicle":
        return Car;

      default:
        return MapPin;
    }
  }

  function clearFilters() {
    setSearch("");
    setCampusFilter("All");
    setTypeFilter("All");
  }

  const hasActiveFilters =
    search.trim().length > 0 ||
    campusFilter !== "All" ||
    typeFilter !== "All";

  function statusClass(status: string | null) {
    const normalized =
      status?.trim().toLowerCase();

    if (normalized === "available") {
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    }

    if (
      normalized === "maintenance" ||
      normalized === "in repair"
    ) {
      return "bg-rose-50 text-rose-700 ring-rose-200";
    }

    if (normalized === "checked out") {
      return "bg-amber-50 text-amber-700 ring-amber-200";
    }

    return "bg-slate-100 text-slate-600 ring-slate-200";
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 animate-pulse rounded-lg bg-slate-200" />

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map(
            (item) => (
              <div
                key={item}
                className="h-52 animate-pulse rounded-2xl bg-white shadow-sm"
              />
            )
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
            Location Management
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950 md:text-5xl">
            Locations
          </h1>

          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-500">
            Build a clear map of where equipment
            belongs across campuses, rooms, racks,
            trailers, and storage areas.
          </p>
        </div>

        <Button
          onClick={() => setShowForm(true)}
        >
          <Plus className="h-4 w-4" />
          Add Location
        </Button>
      </header>

      {errorMessage && (
        <section className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-800 shadow-sm">
          <p className="font-semibold">
            Locations could not be loaded.
          </p>

          <p className="mt-1 text-sm">
            {errorMessage}
          </p>

          <Button
            className="mt-4"
            variant="outline"
            onClick={loadLocations}
          >
            Try Again
          </Button>
        </section>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
              Find Locations
            </p>

            <h2 className="mt-2 text-2xl font-bold text-slate-950">
              Search and filters
            </h2>
          </div>

          <div className="flex flex-wrap gap-3">
            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={clearFilters}
              >
                Clear Filters
              </Button>
            )}

            <Button
              variant="outline"
              onClick={loadLocations}
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Search
            </label>

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search locations, campuses, types, or notes..."
                className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Campus
            </label>

            <select
              value={campusFilter}
              onChange={(event) =>
                setCampusFilter(
                  event.target.value
                )
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            >
              <option value="All">
                All Campuses
              </option>

              {campuses.map((campusName) => (
                <option
                  key={campusName}
                  value={campusName}
                >
                  {campusName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Type
            </label>

            <select
              value={typeFilter}
              onChange={(event) =>
                setTypeFilter(
                  event.target.value
                )
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            >
              <option value="All">
                All Types
              </option>

              {locationTypes.map((type) => (
                <option
                  key={type}
                  value={type}
                >
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {filteredLocations.length === 0 ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm md:p-12">
          <EmptyState
            icon="📍"
            title="No locations found"
            description="Create your first location or adjust your search and filters."
            secondaryAction={
              hasActiveFilters
                ? {
                    label: "Clear Filters",
                    variant: "outline",
                    onClick: clearFilters,
                  }
                : undefined
            }
            primaryAction={{
              label: "Add Location",
              onClick: () =>
                setShowForm(true),
            }}
          />
        </section>
      ) : (
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredLocations.map(
            (location) => {
              const Icon = locationIcon(
                location.location_type
              );

              return (
                <article
                  key={location.id}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                      <Icon className="h-5 w-5" />
                    </div>

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      {location.location_type ||
                        "Other"}
                    </span>
                  </div>

                  <h2 className="mt-5 text-2xl font-bold text-slate-950">
                    {location.name}
                  </h2>

                  <p className="mt-2 font-medium text-slate-600">
                    {location.campus}
                  </p>

                  <p className="mt-2 text-sm text-slate-500">
                    Parent:{" "}
                    {getParentName(location)}
                  </p>

                  {location.description ? (
                    <p className="mt-4 line-clamp-3 leading-6 text-slate-600">
                      {location.description}
                    </p>
                  ) : (
                    <p className="mt-4 text-sm text-slate-400">
                      No description added.
                    </p>
                  )}

                  <Button
                    className="mt-6 w-full"
                    variant="outline"
                    onClick={() =>
                      openLocation(location)
                    }
                  >
                    View Location
                  </Button>
                </article>
              );
            }
          )}
        </section>
      )}

      {/* VIEW LOCATION MODAL */}

      {selectedLocation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="border-b border-slate-200 bg-slate-50 p-6 md:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Location Details
                  </p>

                  <h2 className="mt-2 text-3xl font-bold text-slate-950">
                    {selectedLocation.name}
                  </h2>

                  <p className="mt-2 text-slate-600">
                    {selectedLocation.campus}
                    {" · "}
                    {selectedLocation.location_type ||
                      "Other"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeLocation}
                  aria-label="Close location details"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="space-y-8 p-6 md:p-8">
              <div className="grid gap-4 md:grid-cols-3">
                <LocationDetail
                  label="Campus"
                  value={
                    selectedLocation.campus
                  }
                />

                <LocationDetail
                  label="Type"
                  value={
                    selectedLocation.location_type ||
                    "Other"
                  }
                />

                <LocationDetail
                  label="Parent Location"
                  value={getParentName(
                    selectedLocation
                  )}
                />
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-medium text-slate-500">
                  Description
                </p>

                <p className="mt-2 whitespace-pre-wrap leading-7 text-slate-800">
                  {selectedLocation.description ||
                    "No description added."}
                </p>
              </div>

              {/* EQUIPMENT SECTION */}

              <section className="border-t border-slate-200 pt-8">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Inventory
                    </p>

                    <h3 className="mt-2 text-2xl font-bold text-slate-950">
                      Equipment at{" "}
                      {selectedLocation.name}
                    </h3>

                    {!equipmentLoading &&
                      !equipmentError && (
                        <p className="mt-2 text-sm text-slate-500">
                          {
                            locationEquipment.length
                          }{" "}
                          equipment record
                          {locationEquipment.length ===
                          1
                            ? ""
                            : "s"}{" "}
                          ·{" "}
                          {totalEquipmentQuantity}{" "}
                          total item
                          {totalEquipmentQuantity ===
                          1
                            ? ""
                            : "s"}
                        </p>
                      )}
                  </div>

                  <Button
                    variant="outline"
                    onClick={() =>
                      loadEquipmentForLocation(
                        selectedLocation
                      )
                    }
                    disabled={equipmentLoading}
                  >
                    <RefreshCw className="h-4 w-4" />

                    {equipmentLoading
                      ? "Loading..."
                      : "Refresh"}
                  </Button>
                </div>

                {locationEquipment.length >
                  0 && (
                  <div className="relative mt-6">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                    <input
                      type="text"
                      value={equipmentSearch}
                      onChange={(event) =>
                        setEquipmentSearch(
                          event.target.value
                        )
                      }
                      placeholder={`Search equipment at ${selectedLocation.name}...`}
                      className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                )}

                {equipmentLoading ? (
                  <div className="mt-6 space-y-3">
                    {[0, 1, 2].map(
                      (item) => (
                        <div
                          key={item}
                          className="h-24 animate-pulse rounded-2xl bg-slate-100"
                        />
                      )
                    )}
                  </div>
                ) : equipmentError ? (
                  <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-800">
                    <p className="font-semibold">
                      Equipment could not be
                      loaded.
                    </p>

                    <p className="mt-1 text-sm">
                      {equipmentError}
                    </p>
                  </div>
                ) : locationEquipment.length ===
                  0 ? (
                  <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white text-xl shadow-sm">
                      📦
                    </div>

                    <h4 className="mt-4 font-bold text-slate-950">
                      No equipment assigned
                    </h4>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      No equipment currently
                      uses{" "}
                      <strong>
                        {selectedLocation.name}
                      </strong>{" "}
                      as its location.
                    </p>
                  </div>
                ) : filteredLocationEquipment.length ===
                  0 ? (
                  <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                    <p className="font-semibold text-slate-800">
                      No equipment matches your
                      search.
                    </p>
                  </div>
                ) : (
                  <div className="mt-6 space-y-3">
                    {filteredLocationEquipment.map(
                      (item) => (
                        <div
                          key={item.id}
                          className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-blue-200 hover:shadow-sm sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="font-bold text-slate-950">
                                {item.name}
                              </h4>

                              <span
                                className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusClass(
                                  item.status
                                )}`}
                              >
                                {item.status ||
                                  "Unknown"}
                              </span>
                            </div>

                            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-500">
                              <span>
                                {item.category ||
                                  "No category"}
                              </span>

                              <span>
                                Quantity:{" "}
                                {item.quantity ?? 0}
                              </span>
                            </div>
                          </div>

                          <Link
                            href={`/inventory/${item.id}`}
                            onClick={closeLocation}
                            className="inline-flex shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                          >
                            View Equipment →
                          </Link>
                        </div>
                      )
                    )}
                  </div>
                )}
              </section>

              <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-6">
                <Button
                  variant="outline"
                  onClick={closeLocation}
                >
                  Close
                </Button>

                <Button
                  onClick={() =>
                    beginEditingLocation(
                      selectedLocation
                    )
                  }
                >
                  Edit Location
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT LOCATION MODAL */}

      {editingLocation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="border-b border-slate-200 bg-slate-50 p-6 md:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-bold text-slate-950">
                    Edit Location
                  </h2>

                  <p className="mt-2 leading-7 text-slate-600">
                    Update the location name,
                    campus, type, parent, or
                    description.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setEditingLocation(null)
                  }
                  disabled={updating}
                  aria-label="Close edit location dialog"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="space-y-6 p-6 md:p-8">
              <div>
                <label className="mb-2 block font-semibold text-slate-800">
                  Location Name
                </label>

                <input
                  type="text"
                  value={editName}
                  onChange={(event) =>
                    setEditName(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 p-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block font-semibold text-slate-800">
                    Campus
                  </label>

                  <select
                    value={editCampus}
                    onChange={(event) =>
                      setEditCampus(
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white p-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  >
                    <option value="">
                      Select campus
                    </option>

                    {campuses.map(
                      (campusName) => (
                        <option
                          key={campusName}
                          value={campusName}
                        >
                          {campusName}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block font-semibold text-slate-800">
                    Location Type
                  </label>

                  <select
                    value={editLocationType}
                    onChange={(event) =>
                      setEditLocationType(
                        event.target
                          .value as LocationType
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white p-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  >
                    {locationTypes.map(
                      (type) => (
                        <option
                          key={type}
                          value={type}
                        >
                          {type}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block font-semibold text-slate-800">
                  Parent Location
                </label>

                <select
                  value={editParentId}
                  onChange={(event) =>
                    setEditParentId(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                >
                  <option value="">
                    No parent location
                  </option>

                  {locations
                    .filter(
                      (location) =>
                        location.id !==
                        editingLocation.id
                    )
                    .map((location) => (
                      <option
                        key={location.id}
                        value={location.id}
                      >
                        {location.campus} —{" "}
                        {location.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block font-semibold text-slate-800">
                  Description
                </label>

                <textarea
                  rows={5}
                  value={editDescription}
                  onChange={(event) =>
                    setEditDescription(
                      event.target.value
                    )
                  }
                  className="w-full resize-y rounded-xl border border-slate-300 p-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div className="flex flex-wrap justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() =>
                    setEditingLocation(null)
                  }
                  disabled={updating}
                >
                  Cancel
                </Button>

                <Button
                  onClick={updateLocation}
                  disabled={updating}
                >
                  {updating
                    ? "Saving..."
                    : "Save Changes"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD LOCATION MODAL */}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="border-b border-slate-200 bg-slate-50 p-6 md:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-bold text-slate-950">
                    Add Location
                  </h2>

                  <p className="mt-2 leading-7 text-slate-600">
                    Add a campus, room, rack,
                    trailer, case, or storage
                    area.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setShowForm(false)
                  }
                  aria-label="Close add location dialog"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="space-y-6 p-6 md:p-8">
              <div>
                <label className="mb-2 block font-semibold text-slate-800">
                  Location Name
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  placeholder="Production Storage"
                  className="w-full rounded-xl border border-slate-300 p-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block font-semibold text-slate-800">
                    Campus
                  </label>

                  <select
                    value={campus}
                    onChange={(event) =>
                      setCampus(
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white p-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  >
                    <option value="">
                      Select campus
                    </option>

                    {campuses.map(
                      (campusName) => (
                        <option
                          key={campusName}
                          value={campusName}
                        >
                          {campusName}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block font-semibold text-slate-800">
                    Location Type
                  </label>

                  <select
                    value={locationType}
                    onChange={(event) =>
                      setLocationType(
                        event.target
                          .value as LocationType
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white p-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  >
                    {locationTypes.map(
                      (type) => (
                        <option
                          key={type}
                          value={type}
                        >
                          {type}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block font-semibold text-slate-800">
                  Parent Location
                </label>

                <select
                  value={parentId}
                  onChange={(event) =>
                    setParentId(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                >
                  <option value="">
                    No parent location
                  </option>

                  {locations.map(
                    (location) => (
                      <option
                        key={location.id}
                        value={location.id}
                      >
                        {location.campus} —{" "}
                        {location.name}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className="mb-2 block font-semibold text-slate-800">
                  Description
                </label>

                <textarea
                  rows={5}
                  value={description}
                  onChange={(event) =>
                    setDescription(
                      event.target.value
                    )
                  }
                  placeholder="Primary storage area for production equipment."
                  className="w-full resize-y rounded-xl border border-slate-300 p-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div className="flex flex-wrap justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() =>
                    setShowForm(false)
                  }
                  disabled={saving}
                >
                  Cancel
                </Button>

                <Button
                  onClick={createLocation}
                  disabled={saving}
                >
                  <Plus className="h-4 w-4" />

                  {saving
                    ? "Creating..."
                    : "Create Location"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

type LocationDetailProps = {
  label: string;
  value: string;
};

function LocationDetail({
  label,
  value,
}: LocationDetailProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-sm font-medium text-slate-500">
        {label}
      </p>

      <p className="mt-1 font-semibold text-slate-950">
        {value}
      </p>
    </div>
  );
}