import React, { useEffect, useMemo, useState } from "react";
import { adminApi, getAuthUser, getToken } from "../api";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "../components/ToastProvider.jsx";

const ManageMenuItems = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState("");
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    categoryId: "",
    available: true,
  });
  const [image, setImage] = useState(null);
  const user = getAuthUser();
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    if (user?.role !== "admin") navigate("/");
  }, [user, navigate]);

  const loadMeta = async () => {
    const token = getToken();
    if (!user || user.role !== "admin" || !token) {
      return;
    }
    try {
      const [r, c] = await Promise.all([
        adminApi.listRestaurants(),
        adminApi.listCategories(),
      ]);
      setRestaurants(r.data.restaurants || []);
      setCategories(c.data.categories || []);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load metadata");
    }
  };
  const location = useLocation();
  useEffect(() => {
    loadMeta();
  }, []);

  const loadItems = async (rid) => {
    if (!rid) return setItems([]);
    try {
      const { data } = await adminApi.listMenuItems(rid);
      setItems(data.items || []);
    } catch (err) {
      setItems([]);
      toast.error(err?.response?.data?.message || "Failed to load items");
    }
  };

  useEffect(() => {
    loadItems(selectedRestaurant);
  }, [selectedRestaurant]);

  // When metadata and location are ready, auto-select and open edit if provided
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const rid = params.get("restaurantId");
    const iid = params.get("editItemId");
    if (rid && restaurants.length && !selectedRestaurant) {
      // if provided restaurant exists, select it
      if (restaurants.some((r) => r._id === rid)) {
        setSelectedRestaurant(rid);
      }
    }
    // open edit once items are loaded and id matches
    if (iid && items.length && !editing) {
      const target = items.find((x) => x._id === iid);
      if (target) startEdit(target);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search, restaurants, items]);

  const selectedRes = restaurants.find((r) => r._id === selectedRestaurant);

  const create = async (e) => {
    e.preventDefault();
    if (!selectedRestaurant) return alert("Select a restaurant");
    try {
      await adminApi.createMenuItem(selectedRestaurant, { ...form, image });
      setForm({
        name: "",
        description: "",
        price: "",
        categoryId: "",
        available: true,
      });
      setImage(null);
      await loadItems(selectedRestaurant);
      toast.success("Menu item created");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Create failed");
    }
  };
  const remove = async (id) => {
    try {
      await adminApi.deleteMenuItem(selectedRestaurant, id);
      await loadItems(selectedRestaurant);
      toast.success("Menu item deleted");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Delete failed");
    }
  };

  // Edit support
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    price: "",
    categoryId: "",
    available: true,
  });
  const [editImage, setEditImage] = useState(null);
  const startEdit = (mi) => {
    setEditing(mi._id);
    setEditForm({
      name: mi.name || "",
      description: mi.description || "",
      price: mi.price ?? "",
      categoryId: mi.category?._id || "",
      available: mi.available !== undefined ? mi.available : true,
    });
    setEditImage(null);
  };
  const cancelEdit = () => {
    setEditing(null);
    setEditForm({
      name: "",
      description: "",
      price: "",
      categoryId: "",
      available: true,
    });
    setEditImage(null);
  };
  const saveEdit = async (id) => {
    try {
      await adminApi.updateMenuItem(selectedRestaurant, id, {
        ...editForm,
        image: editImage,
      });
      toast.success("Menu item updated");
      setEditing(null);
      await loadItems(selectedRestaurant);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Update failed");
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 md:max-w-4xl sm:px-4">
      <div className="flex items-center gap-3 py-4 border-b border-slate-700 mb-4">
        <div>
          <h2 className="text-2xl font-semibold">Manage Menu Items</h2>
          <div className="text-slate-400">
            Select a restaurant and manage its menu
          </div>
        </div>
      </div>

      <div className="mb-4 rounded-xl border border-slate-700 bg-slate-900/60 overflow-hidden">
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          <div className="flex flex-col gap-2">
            <label className="text-sm text-slate-400">Restaurant</label>
            <select
              className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 outline-none focus:border-sky-500"
              value={selectedRestaurant}
              onChange={(e) => setSelectedRestaurant(e.target.value)}
            >
              <option value="">Select...</option>
              {restaurants.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            {selectedRes?.image ? (
              <img
                className="w-full h-40 object-cover rounded-lg border border-slate-700"
                src={selectedRes.image}
                alt={selectedRes.name}
              />
            ) : (
              <div className="w-full h-40 rounded-lg border border-dashed border-slate-700 bg-slate-900 flex items-center justify-center text-slate-500">
                No preview
              </div>
            )}
          </div>
        </div>
      </div>

      <form
        onSubmit={create}
        className="mb-4 rounded-xl border border-slate-700 bg-slate-900/60 p-4"
      >
        <div className="grid gap-3 md:grid-cols-2">
          <input
            className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 outline-none focus:border-sky-500"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <input
            className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 outline-none focus:border-sky-500"
            placeholder="Price"
            type="number"
            step="0.01"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            required
          />
          <input
            className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 outline-none focus:border-sky-500 md:col-span-2"
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required
          />
          <select
            className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 outline-none focus:border-sky-500"
            value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            required
          >
            <option value="">Category...</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-slate-200">
            <input
              type="checkbox"
              className="accent-sky-500"
              checked={form.available}
              onChange={(e) =>
                setForm({ ...form, available: e.target.checked })
              }
            />
            Available
          </label>
          <input
            className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 outline-none"
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files?.[0] || null)}
            required
          />
        </div>
        <div className="mt-3">
          <button
            className="inline-flex items-center justify-center rounded-lg bg-sky-500 hover:bg-sky-600 text-white px-3 py-2 transition"
            type="submit"
          >
            Create
          </button>
        </div>
      </form>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((mi) => (
          <article
            key={mi._id}
            className="rounded-xl border border-slate-700 bg-slate-900/60 overflow-hidden flex flex-col"
          >
            {mi.image ? (
              <img
                className="w-full h-40 object-cover"
                src={mi.image}
                alt={mi.name}
              />
            ) : (
              <div className="w-full h-40 bg-slate-800" />
            )}
            <div className="p-4 flex flex-col gap-2 grow">
              {editing === mi._id ? (
                <>
                  <div className="grid gap-3">
                    <input
                      className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 outline-none focus:border-sky-500"
                      placeholder="Name"
                      value={editForm.name}
                      onChange={(e) =>
                        setEditForm({ ...editForm, name: e.target.value })
                      }
                    />
                    <input
                      className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 outline-none focus:border-sky-500"
                      type="number"
                      step="0.01"
                      placeholder="Price"
                      value={editForm.price}
                      onChange={(e) =>
                        setEditForm({ ...editForm, price: e.target.value })
                      }
                    />
                    <textarea
                      className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 outline-none focus:border-sky-500"
                      rows={2}
                      placeholder="Description"
                      value={editForm.description}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          description: e.target.value,
                        })
                      }
                    />
                    <select
                      className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 outline-none focus:border-sky-500"
                      value={editForm.categoryId}
                      onChange={(e) =>
                        setEditForm({ ...editForm, categoryId: e.target.value })
                      }
                    >
                      <option value="">Category...</option>
                      {categories.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <label className="flex items-center gap-2 text-slate-200">
                      <input
                        type="checkbox"
                        className="accent-sky-500"
                        checked={editForm.available}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            available: e.target.checked,
                          })
                        }
                      />
                      Available
                    </label>
                    <input
                      className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 outline-none"
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setEditImage(e.target.files?.[0] || null)
                      }
                    />
                  </div>
                  <div className="mt-2 flex gap-2">
                    <button
                      className="inline-flex items-center justify-center rounded-lg bg-sky-500 hover:bg-sky-600 text-white px-3 py-2 transition"
                      onClick={() => saveEdit(mi._id)}
                    >
                      Save
                    </button>
                    <button
                      className="inline-flex items-center justify-center rounded-lg bg-transparent border border-slate-700 text-slate-100 hover:border-slate-500 px-3 py-2 transition"
                      onClick={cancelEdit}
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <strong className="text-lg">{mi.name}</strong>
                  <p className="text-slate-400">{mi.description}</p>
                  <div className="mt-1 flex gap-2 flex-wrap">
                    <span className="inline-block px-2 py-0.5 rounded-full border border-slate-700 bg-slate-800 text-slate-100 text-xs">
                      ₹{mi.price}
                    </span>
                    <span className="inline-block px-2 py-0.5 rounded-full border border-slate-700 bg-slate-800 text-slate-100 text-xs">
                      {mi.category?.name}
                    </span>
                  </div>
                  <div className="mt-auto flex gap-2">
                    <button
                      className="inline-flex items-center justify-center rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-2 transition"
                      onClick={() => startEdit(mi)}
                    >
                      Edit
                    </button>
                    <button
                      className="inline-flex items-center justify-center rounded-lg bg-rose-500 hover:bg-rose-600 text-white px-3 py-2 transition"
                      onClick={() => remove(mi._id)}
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          </article>
        ))}
        {items.length === 0 && (
          <div className="sm:col-span-2 lg:col-span-3 rounded-xl border border-slate-700 bg-slate-900/60 p-4 text-slate-400">
            {selectedRestaurant
              ? "No items for this restaurant yet."
              : "Select a restaurant to view its items."}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageMenuItems;
