import React, { useEffect, useMemo, useState } from "react";
import { userApi } from "../api";
import { Link } from "react-router-dom";
import { FiSearch } from "react-icons/fi";

const Home = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const { data } = await userApi.getPublicRestaurants();
        setRestaurants(data.restaurants || []);
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load restaurants");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return restaurants || [];
    return (restaurants || []).filter((r) =>
      `${r.name} ${r.description || ""}`.toLowerCase().includes(q)
    );
  }, [restaurants, query]);

  if (loading)
    return (
      <div className="max-w-5xl mx-auto px-6 md:max-w-4xl sm:px-4">
        <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  if (error)
    return (
      <div className="max-w-5xl mx-auto px-6 md:max-w-4xl sm:px-4">
        <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
          <p className="text-rose-500">{error}</p>
        </div>
      </div>
    );

  return (
    <div className="max-w-5xl mx-auto px-6 md:max-w-4xl sm:px-4">
      {/* Hero */}
      <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-6 mb-6 bg-gradient-to-br from-sky-900/20 to-transparent">
        <h1 className="text-3xl font-semibold">Discover great restaurants</h1>
        <p className="text-slate-400 mt-1">Order your favorites with a click</p>
        <div className="relative mt-4 max-w-xl">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 outline-none focus:border-sky-500 pl-10"
            placeholder="Search by name or cuisine"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
          <p className="text-slate-400">No restaurants match your search.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 items-stretch">
          {filtered.map((r) => (
            <Link
              key={r._id}
              to={`/restaurants/${r._id}`}
              className="block h-full no-underline text-inherit"
            >
              <article className="bg-slate-900/60 border border-slate-700 rounded-xl overflow-hidden h-full flex flex-col">
                {r.image ? (
                  <img
                    className="w-full h-44 object-cover block"
                    src={r.image}
                    alt={r.name}
                  />
                ) : (
                  <div className="w-full h-44 bg-slate-800" />
                )}
                <div className="p-4 flex flex-col gap-2 grow">
                  <h4 className="text-lg font-semibold">{r.name}</h4>
                  <p className="text-slate-400 overflow-hidden max-h-12">
                    {r.description}
                  </p>
                  <span className="mt-auto inline-block px-2 py-0.5 rounded-full border border-slate-700 bg-slate-800 text-slate-100 text-xs">
                    {r.address}
                  </span>
                </div>
              </article>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;
