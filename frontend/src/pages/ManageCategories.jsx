import React, { useEffect, useState } from "react";
import { adminApi, getAuthUser, getToken } from "../api";
import { useNavigate } from "react-router-dom";
import { FiSearch } from "react-icons/fi";
import { useToast } from "../components/ToastProvider.jsx";

const ManageCategories = () => {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ name: "", description: "" });
  const [error, setError] = useState("");
  const user = getAuthUser();
  const navigate = useNavigate();
  const toast = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (user?.role !== "admin") navigate("/");
  }, [user, navigate]);

  const load = async () => {
    const token = getToken();
    if (!user || user.role !== "admin" || !token) {
      setError("Login as admin required");
      return;
    }
    try {
      const { data } = await adminApi.listCategories();
      setCategories(data.categories || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load categories");
    }
  };
  useEffect(() => {
    load();
  }, []);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categories || [];
    return (categories || []).filter((c) =>
      `${c.name} ${c.description || ""}`.toLowerCase().includes(q)
    );
  }, [categories, query]);

  const create = async (e) => {
    e.preventDefault();
    try {
      await adminApi.createCategory(form);
      setForm({ name: "", description: "" });
      await load();
      toast.success("Category created");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Create failed");
    }
  };
  const remove = async (id) => {
    try {
      await adminApi.deleteCategory(id);
      await load();
      toast.success("Category deleted");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Delete failed");
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 md:max-w-4xl sm:px-4">
      <div className="flex items-center gap-3 py-4 border-b border-slate-700 mb-4">
        <div>
          <h2 className="text-2xl font-semibold">Manage Categories</h2>
          <div className="text-slate-400">Create and delete categories</div>
        </div>
        <div className="ml-auto">
          <button
            className="inline-flex items-center justify-center rounded-lg bg-sky-500 hover:bg-sky-600 text-white px-3 py-2 transition"
            onClick={() => setShowCreate((v) => !v)}
            type="button"
          >
            {showCreate ? "Close" : "Create"}
          </button>
        </div>
      </div>
      {error && <p className="text-rose-500 mb-3">{error}</p>}
      <div className="mb-4">
        <div className="relative max-w-md">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 outline-none focus:border-sky-500 pl-10"
            placeholder="Search categories by name or description"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>
      {showCreate && (
        <form
          onSubmit={create}
          className="mb-4 rounded-xl border border-slate-700 bg-slate-900/60 p-4"
        >
          <div className="grid gap-3 md:grid-cols-[1fr,2fr,auto]">
            <input
              className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 outline-none focus:border-sky-500"
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
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
            <button
              className="inline-flex items-center justify-center rounded-lg bg-sky-500 hover:bg-sky-600 text-white px-3 py-2 transition"
              type="submit"
            >
              Create
            </button>
          </div>
        </form>
      )}
      <div className="rounded-xl border border-slate-700 bg-slate-900/60 overflow-hidden">
        <ul className="divide-y divide-slate-700">
          {filtered.map((c) => (
            <li
              key={c._id}
              className="flex items-center gap-3 justify-between p-3"
            >
              <div>
                <div className="font-medium">{c.name}</div>
                <div className="text-slate-400 text-sm">{c.description}</div>
              </div>
              <button
                className="inline-flex items-center justify-center rounded-lg bg-rose-500 hover:bg-rose-600 text-white px-3 py-2 transition"
                onClick={() => remove(c._id)}
              >
                Delete
              </button>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="p-3 text-slate-400">
              No categories match your search.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default ManageCategories;
