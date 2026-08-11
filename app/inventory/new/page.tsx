"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

type Location = {
  id: string;
  name: string;
  campus: string;
};

type Category = {
  id: string;
  name: string;
};

const ADD_LOCATION = "__add_new_location__";
const ADD_CATEGORY = "__add_new_category__";

export default function NewEquipmentPage() {
  const router = useRouter();

  const [saving, setSaving] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const [locations, setLocations] = useState<Location[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [campuses, setCampuses] = useState<string[]>([]);

  const [showNewLocation, setShowNewLocation] = useState(false);
  const [showNewCategory, setShowNewCategory] = useState(false);

  const [newLocationName, setNewLocationName] = useState("");
  const [newLocationCampus, setNewLocationCampus] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");

  const [creatingLocation, setCreatingLocation] = useState(false);
  const [creatingCategory, setCreatingCategory] = useState(false);

  const [form, setForm] = useState({
    name: "",
    category: "",
    quantity: 1,
    location: "",
    status: "Available",
    notes: "",
    purchase_date: "",
    expected_life_years: "",
    replacement_warning_months: 12,
    estimated_replacement_cost: "",
  });

  useEffect(() => {
    loadOptions();
  }, []);

  async function loadOptions() {
    setLoadingOptions(true);

    const [locationsResult, categoriesResult] = await Promise.all([
      supabase
        .from("locations")
        .select("id, name, campus")
        .order("name", { ascending: true }),

      supabase
        .from("equipment_categories")
        .select("id, name")
        .order("name", { ascending: true }),
    ]);

    if (locationsResult.error) {
      alert(
        `Could not load locations: ${locationsResult.error.message}`
      );
    } else {
      const loadedLocations = locationsResult.data ?? [];

      setLocations(loadedLocations);

      const uniqueCampuses = Array.from(
        new Set(
          loadedLocations
            .map((location) => location.campus?.trim())
            .filter(
              (campus): campus is string =>
                Boolean(campus)
            )
        )
      ).sort((a, b) => a.localeCompare(b));

      setCampuses(uniqueCampuses);
    }

    if (categoriesResult.error) {
      alert(
        `Could not load categories: ${categoriesResult.error.message}`
      );
    } else {
      setCategories(categoriesResult.data ?? []);
    }

    setLoadingOptions(false);
  }

  function resetNewLocationForm() {
    setNewLocationName("");
    setNewLocationCampus("");
    setShowNewLocation(false);
  }

  function resetNewCategoryForm() {
    setNewCategoryName("");
    setShowNewCategory(false);
  }

  async function handleCreateLocation() {
    const trimmedName = newLocationName.trim();
    const trimmedCampus = newLocationCampus.trim();

    if (!trimmedName) {
      alert("Enter a location name.");
      return;
    }

    if (!trimmedCampus) {
      alert("Select a campus.");
      return;
    }

    const existingLocation = locations.find(
      (location) =>
        location.name.toLowerCase() ===
          trimmedName.toLowerCase() &&
        location.campus.toLowerCase() ===
          trimmedCampus.toLowerCase()
    );

    if (existingLocation) {
      setForm((current) => ({
        ...current,
        location: existingLocation.name,
      }));

      resetNewLocationForm();
      return;
    }

    setCreatingLocation(true);

    const { data, error } = await supabase
      .from("locations")
      .insert({
        name: trimmedName,
        campus: trimmedCampus,
      })
      .select("id, name, campus")
      .single();

    setCreatingLocation(false);

    if (error) {
      alert(`Could not create location: ${error.message}`);
      return;
    }

    setLocations((current) =>
      [...current, data].sort((a, b) =>
        a.name.localeCompare(b.name)
      )
    );

    if (
      !campuses.some(
        (campus) =>
          campus.toLowerCase() ===
          data.campus.toLowerCase()
      )
    ) {
      setCampuses((current) =>
        [...current, data.campus].sort((a, b) =>
          a.localeCompare(b)
        )
      );
    }

    setForm((current) => ({
      ...current,
      location: data.name,
    }));

    resetNewLocationForm();
  }

  async function handleCreateCategory() {
    const trimmedName = newCategoryName.trim();

    if (!trimmedName) {
      alert("Enter a category name.");
      return;
    }

    const existingCategory = categories.find(
      (category) =>
        category.name.toLowerCase() ===
        trimmedName.toLowerCase()
    );

    if (existingCategory) {
      setForm((current) => ({
        ...current,
        category: existingCategory.name,
      }));

      resetNewCategoryForm();
      return;
    }

    setCreatingCategory(true);

    const { data, error } = await supabase
      .from("equipment_categories")
      .insert({
        name: trimmedName,
      })
      .select("id, name")
      .single();

    setCreatingCategory(false);

    if (error) {
      alert(`Could not create category: ${error.message}`);
      return;
    }

    setCategories((current) =>
      [...current, data].sort((a, b) =>
        a.name.localeCompare(b.name)
      )
    );

    setForm((current) => ({
      ...current,
      category: data.name,
    }));

    resetNewCategoryForm();
  }

  const replacementTargetPreview = useMemo(() => {
    if (
      !form.purchase_date ||
      !form.expected_life_years
    ) {
      return null;
    }

    const years = Number(form.expected_life_years);

    if (!Number.isFinite(years) || years <= 0) {
      return null;
    }

    const [year, month, day] = form.purchase_date
      .split("-")
      .map(Number);

    if (!year || !month || !day) {
      return null;
    }

    const targetDate = new Date(
      year + years,
      month - 1,
      day
    );

    return targetDate;
  }, [form.purchase_date, form.expected_life_years]);

  const planningAlertPreview = useMemo(() => {
    if (!replacementTargetPreview) {
      return null;
    }

    const warningMonths = Number(
      form.replacement_warning_months
    );

    if (
      !Number.isFinite(warningMonths) ||
      warningMonths < 0
    ) {
      return null;
    }

    const alertDate = new Date(
      replacementTargetPreview
    );

    alertDate.setMonth(
      alertDate.getMonth() - warningMonths
    );

    return alertDate;
  }, [
    replacementTargetPreview,
    form.replacement_warning_months,
  ]);

  function formatDate(date: Date | null) {
    if (!date) {
      return "Not calculated";
    }

    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(date);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.category) {
      alert("Please select a category.");
      return;
    }

    if (!form.location) {
      alert("Please select a location.");
      return;
    }

    if (
      form.expected_life_years &&
      !form.purchase_date
    ) {
      alert(
        "Enter a purchase date when using lifecycle planning."
      );
      return;
    }

    if (
      form.purchase_date &&
      !form.expected_life_years
    ) {
      alert(
        "Enter the expected life of the equipment when using lifecycle planning."
      );
      return;
    }

    setSaving(true);

    const equipmentRecord = {
      name: form.name,
      category: form.category,
      quantity: form.quantity,
      location: form.location,
      status: form.status,
      notes: form.notes,

      purchase_date:
        form.purchase_date || null,

      expected_life_years:
        form.expected_life_years
          ? Number(form.expected_life_years)
          : null,

      replacement_warning_months:
        Number(form.replacement_warning_months),

      estimated_replacement_cost:
        form.estimated_replacement_cost
          ? Number(form.estimated_replacement_cost)
          : null,
    };

    const { error } = await supabase
      .from("equipment")
      .insert(equipmentRecord);

    setSaving(false);

    if (error) {
      alert(error.message);
      return;
    }

    router.push("/inventory");
    router.refresh();
  }

  return (
    <div className="max-w-4xl p-8">
      <Link
        href="/inventory"
        className="text-blue-600 hover:underline"
      >
        ← Back to Inventory
      </Link>

      <h1 className="mb-8 mt-4 text-4xl font-bold">
        Add Equipment
      </h1>

      <form
        onSubmit={handleSubmit}
        className="space-y-8 rounded-2xl border bg-white p-8"
      >
        <section className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-950">
              Equipment Details
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Basic information used to identify and track
              this equipment.
            </p>
          </div>

          <div>
            <label className="mb-2 block">
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

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block">
                Category
              </label>

              <select
                required
                disabled={loadingOptions}
                className="w-full rounded-lg border p-3"
                value={form.category}
                onChange={(e) => {
                  const value = e.target.value;

                  if (value === ADD_CATEGORY) {
                    setShowNewCategory(true);
                    return;
                  }

                  setForm({
                    ...form,
                    category: value,
                  });
                }}
              >
                <option value="">
                  {loadingOptions
                    ? "Loading categories..."
                    : "Select a category"}
                </option>

                {categories.map((category) => (
                  <option
                    key={category.id}
                    value={category.name}
                  >
                    {category.name}
                  </option>
                ))}

                <option value={ADD_CATEGORY}>
                  + Add New Category
                </option>
              </select>

              {showNewCategory && (
                <div className="mt-3 rounded-lg border bg-gray-50 p-4">
                  <label className="mb-2 block text-sm font-medium">
                    New Category Name
                  </label>

                  <input
                    autoFocus
                    className="w-full rounded-lg border bg-white p-3"
                    placeholder="Example: Production - Wireless"
                    value={newCategoryName}
                    onChange={(e) =>
                      setNewCategoryName(
                        e.target.value
                      )
                    }
                  />

                  <div className="mt-3 flex gap-2">
                    <Button
                      type="button"
                      onClick={handleCreateCategory}
                      disabled={creatingCategory}
                    >
                      {creatingCategory
                        ? "Creating..."
                        : "Add Category"}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetNewCategoryForm}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="mb-2 block">
                Quantity
              </label>

              <input
                type="number"
                min={1}
                required
                className="w-full rounded-lg border p-3"
                value={form.quantity}
                onChange={(e) =>
                  setForm({
                    ...form,
                    quantity: Number(
                      e.target.value
                    ),
                  })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block">
                Location
              </label>

              <select
                required
                disabled={loadingOptions}
                className="w-full rounded-lg border p-3"
                value={form.location}
                onChange={(e) => {
                  const value = e.target.value;

                  if (value === ADD_LOCATION) {
                    setShowNewLocation(true);
                    return;
                  }

                  setForm({
                    ...form,
                    location: value,
                  });
                }}
              >
                <option value="">
                  {loadingOptions
                    ? "Loading locations..."
                    : "Select a location"}
                </option>

                {locations.map((location) => (
                  <option
                    key={location.id}
                    value={location.name}
                  >
                    {location.name}
                    {location.campus
                      ? ` — ${location.campus}`
                      : ""}
                  </option>
                ))}

                <option value={ADD_LOCATION}>
                  + Add New Location
                </option>
              </select>

              {showNewLocation && (
                <div className="mt-3 rounded-lg border bg-gray-50 p-4">
                  <label className="mb-2 block text-sm font-medium">
                    New Location Name
                  </label>

                  <input
                    autoFocus
                    className="w-full rounded-lg border bg-white p-3"
                    placeholder="Example: IT Director's Office"
                    value={newLocationName}
                    onChange={(e) =>
                      setNewLocationName(
                        e.target.value
                      )
                    }
                  />

                  <label className="mb-2 mt-4 block text-sm font-medium">
                    Campus
                  </label>

                  <select
                    className="w-full rounded-lg border bg-white p-3"
                    value={newLocationCampus}
                    onChange={(e) =>
                      setNewLocationCampus(
                        e.target.value
                      )
                    }
                  >
                    <option value="">
                      Select a campus
                    </option>

                    {campuses.map((campus) => (
                      <option
                        key={campus}
                        value={campus}
                      >
                        {campus}
                      </option>
                    ))}
                  </select>

                  <div className="mt-3 flex gap-2">
                    <Button
                      type="button"
                      onClick={handleCreateLocation}
                      disabled={creatingLocation}
                    >
                      {creatingLocation
                        ? "Creating..."
                        : "Add Location"}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetNewLocationForm}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="mb-2 block">
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
        </section>

        <section className="border-t border-slate-200 pt-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-950">
              Lifecycle Planning
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              Optional planning information for forecasting
              maintenance and future replacement costs.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block">
                Purchase Date
              </label>

              <input
                type="date"
                className="w-full rounded-lg border p-3"
                value={form.purchase_date}
                onChange={(e) =>
                  setForm({
                    ...form,
                    purchase_date:
                      e.target.value,
                  })
                }
              />
            </div>

            <div>
              <label className="mb-2 block">
                Expected Life
              </label>

              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={1}
                  max={50}
                  step={1}
                  placeholder="5"
                  className="w-full rounded-lg border p-3"
                  value={form.expected_life_years}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      expected_life_years:
                        e.target.value,
                    })
                  }
                />

                <span className="shrink-0 text-sm font-medium text-slate-500">
                  years
                </span>
              </div>
            </div>

            <div>
              <label className="mb-2 block">
                Planning Warning
              </label>

              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={0}
                  max={120}
                  step={1}
                  className="w-full rounded-lg border p-3"
                  value={
                    form.replacement_warning_months
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      replacement_warning_months:
                        Number(e.target.value),
                    })
                  }
                />

                <span className="shrink-0 text-sm font-medium text-slate-500">
                  months before
                </span>
              </div>
            </div>

            <div>
              <label className="mb-2 block">
                Estimated Replacement Cost
              </label>

              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                  $
                </span>

                <input
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="35000.00"
                  className="w-full rounded-lg border py-3 pl-8 pr-3"
                  value={
                    form.estimated_replacement_cost
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      estimated_replacement_cost:
                        e.target.value,
                    })
                  }
                />
              </div>
            </div>
          </div>

          {replacementTargetPreview && (
            <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-5">
              <p className="text-sm font-bold text-blue-950">
                Replacement Forecast
              </p>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                    Planning Alert Begins
                  </p>

                  <p className="mt-1 font-bold text-slate-950">
                    {formatDate(
                      planningAlertPreview
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                    Target Replacement
                  </p>

                  <p className="mt-1 font-bold text-slate-950">
                    {formatDate(
                      replacementTargetPreview
                    )}
                  </p>
                </div>
              </div>

              <p className="mt-4 text-sm leading-6 text-blue-900">
                Tech Steward will use these dates for
                lifecycle and capital-planning alerts. This
                does not automatically mark the equipment as
                broken or place it into maintenance.
              </p>
            </div>
          )}
        </section>

        <section className="border-t border-slate-200 pt-8">
          <label className="mb-2 block">
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
        </section>

        <div className="flex gap-4 border-t border-slate-200 pt-6">
          <Button
            type="submit"
            disabled={saving || loadingOptions}
          >
            {saving
              ? "Saving..."
              : "Save Equipment"}
          </Button>

          <Link href="/inventory">
            <Button
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}