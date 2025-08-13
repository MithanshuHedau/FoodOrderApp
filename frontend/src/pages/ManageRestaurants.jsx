import React, { useEffect, useState } from "react";
import { adminApi, getAuthUser, getToken } from "../api";
import { useNavigate } from "react-router-dom";
import { useToast } from "../components/ToastProvider.jsx";
import Loader from "../components/Loader.jsx";

const ManageRestaurants = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: "",
    description: "",
    address: "",
    phone: "",
    openingHours: "",
  });
  const [image, setImage] = useState(null);
  const user = getAuthUser();
  const navigate = useNavigate();
  const toast = useToast();
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    if (user?.role !== "admin") navigate("/");
  }, [user, navigate]);

  const load = async () => {
    const token = getToken();
    if (!user || user.role !== "admin" || !token) {
      setError("Login as admin required");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data } = await adminApi.listRestaurants();
      setRestaurants(data.restaurants || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load restaurants");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);

  const create = async (e) => {
    e.preventDefault();
    try {
      await adminApi.createRestaurant({ ...form, image });
      setForm({
        name: "",
        description: "",
        address: "",
        phone: "",
        openingHours: "",
      });
      setImage(null);
      await load();
      toast.success("Restaurant created");
      setShowCreate(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Create failed");
    }
  };

  const cancelCreate = () => {
    setShowCreate(false);
    setForm({
      name: "",
      description: "",
      address: "",
      phone: "",
      openingHours: "",
    });
    setImage(null);
  };
  const remove = async (id) => {
    try {
      await adminApi.deleteRestaurant(id);
      await load();
      toast.success("Restaurant deleted");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Delete failed");
    }
  };

  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", description: "" });
  const [editImage, setEditImage] = useState(null);
  const startEdit = (r) => {
    setEditing(r._id);
    setEditForm({ name: r.name, description: r.description });
    setEditImage(null);
  };
  const cancelEdit = () => {
    setEditing(null);
    setEditForm({ name: "", description: "" });
    setEditImage(null);
  };
  const saveEdit = async (id) => {
    try {
      await adminApi.updateRestaurant(id, { ...editForm, image: editImage });
      toast.success("Restaurant updated");
      setEditing(null);
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Update failed");
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 md:max-w-4xl sm:px-4">
      <div className="flex items-center gap-3 py-4 border-b border-slate-700 mb-4">
        <div>
          <h2 className="text-2xl font-semibold">Manage Restaurants</h2>
          <div className="text-slate-400">
            Create, edit, and delete restaurants
          </div>
        </div>
        <div className="ml-auto">
          <button
            className="inline-flex items-center justify-center rounded-lg bg-sky-500 hover:bg-sky-600 text-white px-3 py-2 transition"
            onClick={() => setShowCreate((v) => !v)}
          >
            {showCreate ? "Close" : "Create"}
          </button>
        </div>
      </div>
      {error && <p className="text-rose-500 mb-3">{error}</p>}
      {showCreate && (
        <form
          onSubmit={create}
          className="mb-4 rounded-xl border border-slate-700 bg-slate-900/60 overflow-hidden"
        >
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 outline-none focus:border-sky-500"
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <input
              className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 outline-none focus:border-sky-500"
              placeholder="Phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              required
            />
            <input
              className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 outline-none focus:border-sky-500"
              placeholder="Address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              required
            />
            <input
              className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 outline-none focus:border-sky-500"
              placeholder="Opening Hours"
              value={form.openingHours}
              onChange={(e) =>
                setForm({ ...form, openingHours: e.target.value })
              }
              required
            />
            <input
              className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 outline-none focus:border-sky-500"
              placeholder="Description"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              required
            />
            <input
              className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 outline-none"
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files?.[0] || null)}
              required
            />
            <div className="md:col-span-2 flex justify-end gap-2">
              <button
                className="inline-flex items-center justify-center rounded-lg bg-sky-500 hover:bg-sky-600 text-white px-3 py-2 transition"
                type="submit"
              >
                Create
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-lg bg-transparent border border-slate-700 text-slate-100 hover:border-slate-500 px-3 py-2 transition"
                onClick={cancelCreate}
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {loading ? (
        <Loader text="Loading restaurants..." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {restaurants.map((r) => (
            <article
              key={r._id}
              className="rounded-xl border border-slate-700 bg-slate-900/60 overflow-hidden flex flex-col"
            >
              {r.image ? (
                <img
                  className="w-full h-40 object-cover"
                  src={r.image}
                  alt={r.name}
                />
              ) : (
                <div className="w-full h-40 bg-slate-800 flex items-center justify-center text-slate-400">
                  No image
                </div>
              )}
              <div className="p-4 flex flex-col gap-2 grow">
                {editing === r._id ? (
                  <>
                    <input
                      className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 outline-none focus:border-sky-500"
                      value={editForm.name}
                      onChange={(e) =>
                        setEditForm({ ...editForm, name: e.target.value })
                      }
                    />
                    <textarea
                      className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 outline-none focus:border-sky-500"
                      rows={3}
                      value={editForm.description}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          description: e.target.value,
                        })
                      }
                    />
                    <input
                      className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 outline-none"
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setEditImage(e.target.files?.[0] || null)
                      }
                    />
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-lg bg-sky-500 hover:bg-sky-600 text-white px-3 py-2 transition"
                        onClick={() => saveEdit(r._id)}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-lg bg-transparent border border-slate-700 text-slate-100 hover:border-slate-500 px-3 py-2 transition"
                        onClick={cancelEdit}
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <strong className="text-lg">{r.name}</strong>
                    <p className="text-slate-400">{r.description}</p>
                    <div className="mt-auto flex gap-2">
                      <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-2 transition"
                        onClick={() => startEdit(r)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-lg bg-rose-500 hover:bg-rose-600 text-white px-3 py-2 transition"
                        onClick={() => remove(r._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManageRestaurants;
