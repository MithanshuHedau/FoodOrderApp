import React, { useEffect, useMemo, useRef, useState } from "react";
import { adminApi, getAuthUser } from "../api";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "../components/ToastProvider.jsx";
import Loader from "../components/Loader.jsx";
import {
  FiList,
  FiPackage,
  FiClock,
  FiTruck,
  FiCheckCircle,
  FiXCircle,
  FiRefreshCcw,
  FiSearch,
} from "react-icons/fi";

const AdminDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [query, setQuery] = useState("");
  // Detail modal state
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [detailOrder, setDetailOrder] = useState(null);
  // Filters modal (mobile) state
  const [filtersOpen, setFiltersOpen] = useState(false);
  const modalSearchRef = useRef(null);
  // Stats modal state
  const [statsOpen, setStatsOpen] = useState(false);
  const [statsKey, setStatsKey] = useState("all");
  const [statsLabel, setStatsLabel] = useState("All");
  useEffect(() => {
    if (filtersOpen) {
      // Defer focus until modal renders
      setTimeout(() => modalSearchRef.current?.focus?.(), 0);
    }
  }, [filtersOpen]);
  const user = getAuthUser();
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    if (user?.role !== "admin") navigate("/");
  }, [user, navigate]);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await adminApi.listOrders({ limit: 50 });
      setOrders(data.orders || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (orders || []).filter((o) => {
      const statusOk = statusFilter === "all" || o.orderStatus === statusFilter;
      const hay = `${o._id} ${o.user?.name || ""} ${
        o.user?.email || ""
      }`.toLowerCase();
      const qOk = !q || hay.includes(q);
      return statusOk && qOk;
    });
  }, [orders, statusFilter, query]);

  const openOrderDetail = async (orderId) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailError("");
    try {
      const { data } = await adminApi.getOrder(orderId);
      setDetailOrder(data.order);
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to load order";
      setDetailError(msg);
    } finally {
      setDetailLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await adminApi.updateOrderStatus(id, status);
      await load();
      toast.success(`Order ${status}`);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Update failed");
    }
  };

  const stats = useMemo(() => {
    const total = orders.length;
    const by = (s) => orders.filter((o) => o.orderStatus === s).length;
    const placed = by("placed");
    const preparing = by("preparing");
    const out = by("out for delivery");
    const delivered = by("delivered");
    const cancelled = by("cancelled");
    return { total, placed, preparing, out, delivered, cancelled };
  }, [orders]);

  const openStats = (key, label) => {
    setFiltersOpen(false);
    setDetailOpen(false);
    setStatsKey(key);
    setStatsLabel(label);
    setStatsOpen(true);
  };

  const statOrders = useMemo(() => {
    if (statsKey === "all") return orders;
    return orders.filter((o) => o.orderStatus === statsKey);
  }, [orders, statsKey]);

  return (
    <div className="max-w-5xl mx-auto px-6 md:max-w-4xl sm:px-4">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 py-4 border-b border-slate-700 mb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="w-10 h-10 rounded-lg bg-sky-500/20 border border-sky-700/30 flex items-center justify-center text-sky-400 hover:bg-sky-500/30 transition"
            title="Open filters"
            aria-label="Open filters"
            onClick={() => setFiltersOpen(true)}
          >
            <FiList />
          </button>
          <div>
            <h2 className="text-2xl font-semibold">Admin Dashboard</h2>
            <div className="text-slate-400">
              Track orders and manage entities
            </div>
          </div>
        </div>
        <div className="ml-auto flex flex-wrap gap-2">
          <Link
            className="inline-flex items-center justify-center rounded-lg bg-transparent border border-slate-700 text-slate-100 hover:border-slate-500 px-3 py-2 transition no-underline"
            to="/admin/restaurants"
          >
            Restaurants
          </Link>
          <Link
            className="inline-flex items-center justify-center rounded-lg bg-transparent border border-slate-700 text-slate-100 hover:border-slate-500 px-3 py-2 transition no-underline"
            to="/admin/categories"
          >
            Categories
          </Link>
          <Link
            className="inline-flex items-center justify-center rounded-lg bg-transparent border border-slate-700 text-slate-100 hover:border-slate-500 px-3 py-2 transition no-underline"
            to="/admin/menu"
          >
            Menu
          </Link>
          <Link
            className="inline-flex items-center justify-center rounded-lg bg-transparent border border-slate-700 text-slate-100 hover:border-slate-500 px-3 py-2 transition no-underline"
            to="/admin/users"
          >
            Users
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mb-6">
        {[
          {
            label: "Total",
            value: stats.total,
            icon: <FiPackage />,
            ring: "ring-slate-600",
            grad: "from-slate-500/10 to-transparent",
            keyx: "all",
          },
          {
            label: "Placed",
            value: stats.placed,
            icon: <FiClock />,
            ring: "ring-sky-700/40",
            grad: "from-sky-500/10 to-transparent",
            keyx: "placed",
          },
          {
            label: "Preparing",
            value: stats.preparing,
            icon: <FiClock />,
            ring: "ring-amber-700/40",
            grad: "from-amber-500/10 to-transparent",
            keyx: "preparing",
          },
          {
            label: "Out",
            value: stats.out,
            icon: <FiTruck />,
            ring: "ring-blue-700/40",
            grad: "from-blue-500/10 to-transparent",
            keyx: "out for delivery",
          },
          {
            label: "Delivered",
            value: stats.delivered,
            icon: <FiCheckCircle />,
            ring: "ring-emerald-700/40",
            grad: "from-emerald-500/10 to-transparent",
            keyx: "delivered",
          },
          {
            label: "Cancelled",
            value: stats.cancelled,
            icon: <FiXCircle />,
            ring: "ring-rose-700/40",
            grad: "from-rose-500/10 to-transparent",
            keyx: "cancelled",
          },
        ].map((s, i) => (
          <button
            type="button"
            key={i}
            onClick={() => openStats(s.keyx, s.label)}
            className={`text-left rounded-xl border border-slate-700 bg-slate-900/60 p-4 ring-1 ${s.ring} bg-gradient-to-r ${s.grad} hover:border-slate-500 transition cursor-pointer`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-800/70 flex items-center justify-center text-slate-300">
                {s.icon}
              </div>
              <div className="ml-auto text-2xl font-semibold">{s.value}</div>
            </div>
            <div className="mt-2 text-slate-300">{s.label}</div>
          </button>
        ))}
      </div>

      {/* Filters moved to modal; inline filters hidden */}

      {error && <p className="text-rose-500 mb-3">{error}</p>}
      {loading ? (
        <Loader text="Loading orders..." />
      ) : filtered.length === 0 ? (
        <p className="text-slate-400">No orders match the current filters.</p>
      ) : (
        filtered.map((o) => (
          <article
            key={o._id}
            className="bg-slate-900/60 border border-slate-700 rounded-xl overflow-hidden mb-3"
          >
            <div className="p-4">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  className="text-white hover:text-sky-400 bg-transparent border-0 p-0 cursor-pointer text-lg"
                  title="View order details"
                  onClick={() => openOrderDetail(o._id)}
                >
                  <strong>#{o._id.slice(-6)}</strong>
                </button>
                <span className="inline-block px-2 py-0.5 rounded-full border border-slate-700 bg-slate-800 text-slate-100 text-xs">
                  {new Date(o.createdAt).toLocaleString?.() || ""}
                </span>
                <div className="ml-auto">
                  <button
                    className="inline-block px-2 py-0.5 rounded-full border border-slate-700 bg-slate-800 text-slate-100 text-xs cursor-pointer"
                    title="View this user's order"
                    onClick={() => openOrderDetail(o._id)}
                  >
                    {o.user?.name} · {o.user?.email}
                  </button>
                </div>
              </div>

              {/* Item thumbnails */}
              {(() => {
                const imgs = (o.items || [])
                  .map((it) => it?.menuItem?.image)
                  .filter(Boolean);
                const prev = imgs.slice(0, 4);
                const extra = imgs.length - prev.length;
                if (!prev.length) return null;
                return (
                  <div className="flex items-center gap-2 mt-3">
                    <div className="flex -space-x-2">
                      {prev.map((src, idx) => (
                        <img
                          key={idx}
                          src={src}
                          alt="item"
                          className="w-10 h-10 object-cover rounded-md border border-slate-700"
                        />
                      ))}
                    </div>
                    {extra > 0 && (
                      <span className="inline-block px-2 py-0.5 rounded-full border border-slate-700 bg-slate-800 text-slate-100 text-xs">
                        +{extra} more
                      </span>
                    )}
                  </div>
                );
              })()}

              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span className="inline-block px-2 py-0.5 rounded-full border border-slate-700 bg-slate-800 text-slate-100 text-xs">
                  Status: {o.orderStatus}
                </span>
                <span className="inline-block px-2 py-0.5 rounded-full border border-slate-700 bg-slate-800 text-slate-100 text-xs">
                  Payment: {o.paymentStatus}
                </span>
                <strong className="ml-auto">Total: ₹{o.totalAmount}</strong>
              </div>

              <div className="flex flex-wrap gap-2 mt-3">
                {o.orderStatus === "placed" && (
                  <button
                    className="inline-flex items-center justify-center rounded-lg bg-sky-500 hover:bg-sky-600 text-white px-3 py-2 transition"
                    onClick={() => updateStatus(o._id, "preparing")}
                  >
                    Mark Preparing
                  </button>
                )}
                {o.orderStatus === "preparing" && (
                  <button
                    className="inline-flex items-center justify-center rounded-lg bg-sky-500 hover:bg-sky-600 text-white px-3 py-2 transition"
                    onClick={() => updateStatus(o._id, "out for delivery")}
                  >
                    Out for delivery
                  </button>
                )}
                {o.orderStatus === "out for delivery" && (
                  <button
                    className="inline-flex items-center justify-center rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-2 transition"
                    onClick={() => updateStatus(o._id, "delivered")}
                  >
                    Delivered
                  </button>
                )}
                {!["delivered", "cancelled"].includes(o.orderStatus) && (
                  <button
                    className="inline-flex items-center justify-center rounded-lg bg-rose-500 hover:bg-rose-600 text-white px-3 py-2 transition"
                    onClick={() => updateStatus(o._id, "cancelled")}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </article>
        ))
      )}

      {detailOpen && (
        <div
          className="fixed inset-0 bg-black/55 flex items-center justify-center z-50 p-4"
          onClick={() => setDetailOpen(false)}
        >
          <div
            className="w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                <FiPackage />
              </div>
              <h3 className="text-xl font-semibold">Order Details</h3>
              <div className="ml-auto">
                <button
                  className="inline-flex items-center justify-center rounded-lg bg-transparent border border-slate-700 text-slate-100 hover:border-slate-500 px-3 py-2 transition"
                  onClick={() => setDetailOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>
            {detailLoading ? (
              <Loader text="Loading details..." />
            ) : detailError ? (
              <p className="text-rose-500">{detailError}</p>
            ) : detailOrder ? (
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <strong>Order ID:</strong>
                  <span className="inline-block px-2 py-0.5 rounded-full border border-slate-700 bg-slate-800 text-slate-100 text-xs">
                    #{detailOrder._id?.slice(-6)}
                  </span>
                  <span className="inline-block px-2 py-0.5 rounded-full border border-slate-700 bg-slate-800 text-slate-100 text-xs">
                    {new Date(detailOrder.createdAt).toLocaleString?.()}
                  </span>
                </div>
                <div className="bg-slate-900/60 border border-slate-700 rounded-xl overflow-hidden mb-3">
                  <div className="p-4">
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <div className="mb-2">
                          <strong>User</strong>
                        </div>
                        <div className="mb-2">
                          Name: {detailOrder.user?.name}
                        </div>
                        <div className="mb-2">
                          Email: {detailOrder.user?.email}
                        </div>
                        <div className="mb-2">
                          User ID: {detailOrder.user?._id}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 md:items-end">
                        <span className="inline-block px-2 py-0.5 rounded-full border border-slate-700 bg-slate-800 text-slate-100 text-xs">
                          Status: {detailOrder.orderStatus}
                        </span>
                        <span className="inline-block px-2 py-0.5 rounded-full border border-slate-700 bg-slate-800 text-slate-100 text-xs">
                          Payment: {detailOrder.paymentStatus}
                        </span>
                        <strong>Total: ₹{detailOrder.totalAmount}</strong>
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="text-slate-400">Deliver to</div>
                      <div>{detailOrder.deliveryAddress}</div>
                    </div>
                  </div>
                </div>
                <div className="mb-2">
                  <strong>Items</strong>
                </div>
                <div className="bg-slate-900/60 border border-slate-700 rounded-xl overflow-hidden">
                  <div className="p-4">
                    {(detailOrder.items || []).map((it, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 border-b border-slate-700 py-2"
                      >
                        {it.menuItem?.image && (
                          <img
                            src={it.menuItem.image}
                            alt={it.menuItem?.name}
                            style={{
                              width: 56,
                              height: 40,
                              objectFit: "cover",
                              borderRadius: 6,
                            }}
                          />
                        )}
                        <div className="flex-1">
                          <div>{it.menuItem?.name}</div>
                          <div className="text-slate-400">
                            Qty: {it.quantity} × ₹{it.price}
                          </div>
                        </div>
                        <strong>₹{(it.quantity * it.price).toFixed(2)}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Filters Modal (mobile) */}
      {filtersOpen && (
        <div
          className="fixed inset-0 bg-black/55 flex items-center justify-center z-40 p-4"
          onClick={() => setFiltersOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                <FiSearch />
              </div>
              <h3 className="text-lg font-semibold">Filters</h3>
              <div className="ml-auto">
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-lg bg-transparent border border-slate-700 text-slate-100 hover:border-slate-500 px-3 py-2 transition"
                  onClick={() => setFiltersOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>
            <div className="grid gap-3">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  ref={modalSearchRef}
                  className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 outline-none focus:border-sky-500 pl-10"
                  placeholder="Search by ID, user name, or email"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <select
                className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 outline-none focus:border-sky-500"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All statuses</option>
                <option value="placed">Placed</option>
                <option value="preparing">Preparing</option>
                <option value="out for delivery">Out for delivery</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-lg bg-sky-500 hover:bg-sky-600 text-white px-3 py-2 transition flex-1"
                  onClick={() => {
                    load();
                    setFiltersOpen(false);
                  }}
                >
                  <FiRefreshCcw className="mr-2" /> Apply & Refresh
                </button>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-lg bg-transparent border border-slate-700 text-slate-100 hover:border-slate-500 px-3 py-2 transition"
                  onClick={() => setFiltersOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Orders Modal */}
      {statsOpen && (
        <div
          className="fixed inset-0 bg-black/55 flex items-center justify-center z-50 p-4"
          onClick={() => setStatsOpen(false)}
        >
          <div
            className="w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                <FiList />
              </div>
              <h3 className="text-xl font-semibold">{statsLabel} Orders</h3>
              <span className="ml-2 text-slate-400">{statOrders.length}</span>
              <div className="ml-auto">
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-lg bg-transparent border border-slate-700 text-slate-100 hover:border-slate-500 px-3 py-2 transition"
                  onClick={() => setStatsOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>
            <div className="bg-slate-900/60 border border-slate-700 rounded-xl overflow-hidden">
              <div className="p-4">
                {statOrders.length === 0 ? (
                  <p className="text-slate-400">
                    No orders found for this filter.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-700">
                    {statOrders.map((o) => (
                      <button
                        key={o._id}
                        type="button"
                        className="w-full text-left py-3 flex items-center gap-3 hover:bg-slate-800/50 px-2 rounded-md transition"
                        onClick={() => {
                          setStatsOpen(false);
                          openOrderDetail(o._id);
                        }}
                      >
                        <span className="inline-block px-2 py-0.5 rounded-full border border-slate-700 bg-slate-800 text-slate-100 text-xs">
                          #{o._id.slice(-6)}
                        </span>
                        <span className="text-slate-300">
                          {o.user?.name || "Unknown"}
                        </span>
                        <span className="text-slate-500">
                          {o.user?.email || ""}
                        </span>
                        <span className="ml-auto inline-block px-2 py-0.5 rounded-full border border-slate-700 bg-slate-800 text-slate-100 text-xs">
                          {o.orderStatus}
                        </span>
                        <strong className="ml-3">₹{o.totalAmount}</strong>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
