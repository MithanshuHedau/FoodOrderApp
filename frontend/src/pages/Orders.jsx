import React, { useEffect, useState } from "react";
import { userApi } from "../api";
import { useToast } from "../components/ToastProvider.jsx";
import Loader from "../components/Loader.jsx";

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const toast = useToast();

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await userApi.getOrders();
      setOrders(data.orders || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const cancel = async (id) => {
    try {
      await userApi.cancelOrder(id);
      await load();
      toast.success("Order cancelled");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Cancel failed");
    }
  };

  if (loading)
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <Loader text="Loading orders..." />
      </div>
    );
  if (error)
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
          {error}
        </p>
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h2 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-100 mb-4">
        Your Orders
      </h2>
      {orders.length === 0 && (
        <p className="text-gray-600 dark:text-gray-400">No orders yet.</p>
      )}
      {(orders || []).map((o) => {
        const statusTone =
          o.orderStatus === "delivered"
            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
            : o.orderStatus === "cancelled"
            ? "bg-rose-50 text-rose-700 border-rose-200"
            : o.orderStatus === "out"
            ? "bg-blue-50 text-blue-700 border-blue-200"
            : o.orderStatus === "preparing"
            ? "bg-amber-50 text-amber-700 border-amber-200"
            : "bg-gray-100 text-gray-700 border-gray-200";
        const payTone =
          (o.paymentStatus || "").toLowerCase() === "paid"
            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
            : "bg-amber-50 text-amber-700 border-amber-200";
        return (
          <article
            key={o._id}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden mb-4"
          >
            <div className="p-4 md:p-6">
              <div className="flex items-center justify-between gap-4">
                <strong className="text-gray-900 dark:text-gray-100">
                  #{o._id.slice(-6)}
                </strong>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 border rounded-full px-2 py-1 text-xs font-medium ${statusTone}`}
                  >
                    Status: {o.orderStatus}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 border rounded-full px-2 py-1 text-xs font-medium ${payTone}`}
                  >
                    Payment: {o.paymentStatus}
                  </span>
                </div>
              </div>

              <div className="mt-4 divide-y divide-gray-200 dark:divide-gray-800">
                {(o.items || []).map((it) => (
                  <div key={it._id} className="flex items-center gap-3 py-3">
                    {it.menuItem?.image && (
                      <img
                        src={it.menuItem.image}
                        alt={it.menuItem?.name}
                        className="h-12 w-16 rounded-md object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <div className="text-gray-900 dark:text-gray-100">
                        {it.menuItem?.name}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Qty: {it.quantity} × ₹{it.price}
                      </div>
                    </div>
                    <strong className="text-gray-900 dark:text-gray-100">
                      ₹{(it.quantity * it.price).toFixed(2)}
                    </strong>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between">
                <strong className="text-gray-900 dark:text-gray-100">
                  Total: ₹{o.totalAmount}
                </strong>
                {!["delivered", "cancelled"].includes(o.orderStatus) && (
                  <button
                    className="inline-flex items-center justify-center rounded-lg border border-rose-600 text-rose-700 dark:text-rose-400 px-3 py-2 text-sm font-medium hover:bg-rose-50 dark:hover:bg-rose-900/30"
                    onClick={() => cancel(o._id)}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
};

export default Orders;
