import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { userApi, getAuthUser } from "../api";
import { useToast } from "../components/ToastProvider.jsx";

const Checkout = () => {
  const [address, setAddress] = useState("");
  const [method, setMethod] = useState("cod"); // "cod" | "online"
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [order, setOrder] = useState(null);
  const [payment, setPayment] = useState(null);
  const [summary, setSummary] = useState({
    subtotal: 0,
    delivery: 0,
    total: 0,
  });
  const [cart, setCart] = useState(null);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    // Optionally fetch cart summary
    (async () => {
      try {
        const { data } = await userApi.getCart();
        const cart = data?.cart;
        setCart(cart || null);
        const subtotal =
          cart?.items?.reduce(
            (a, it) =>
              a + (it?.menuItem?.price || it?.price || 0) * it.quantity,
            0
          ) || 0;
        const delivery = subtotal > 0 ? 20 : 0;
        setSummary({ subtotal, delivery, total: subtotal + delivery });
        if (cart?.deliveryAddress) setAddress(cart.deliveryAddress);
        else {
          const profileAddr = getAuthUser()?.address || "";
          if (profileAddr) setAddress(profileAddr);
        }

        // Default select all items when loading the cart for convenience
        if (cart?.items?.length) {
          const all = new Set(
            cart.items.map((ci) => ci.menuItem?._id).filter(Boolean)
          );
          setSelectedIds(all);
        }
      } catch {
        // ignore
      }
    })();
  }, []);

  // Recompute summary based on selected items
  useEffect(() => {
    const items = cart?.items || [];
    const subtotal = items
      .filter((ci) => selectedIds.has(ci.menuItem?._id))
      .reduce(
        (a, it) => a + (it?.menuItem?.price || it?.price || 0) * it.quantity,
        0
      );
    const delivery = subtotal > 0 ? 20 : 0;
    setSummary({ subtotal, delivery, total: subtotal + delivery });
  }, [cart, selectedIds]);

  const placeOrder = async () => {
    setLoading(true);
    setStatus("");
    try {
      // Ensure items selection
      const allItems = cart?.items || [];
      const selected = allItems.filter((ci) =>
        selectedIds.has(ci.menuItem?._id)
      );
      const unselected = allItems.filter(
        (ci) => !selectedIds.has(ci.menuItem?._id)
      );

      if (selected.length === 0) {
        setLoading(false);
        return setStatus("Please select at least one item to order.");
      }

      // Temporarily reshape the cart to only selected items: remove unselected, then restore later
      // Cache unselected to restore quantities
      for (const ui of unselected) {
        await userApi.removeCartItem(ui.menuItem._id);
      }
      // Re-add selected with their current quantities to ensure snapshot
      // (server already has them, but we ensure no drift)
      for (const si of selected) {
        await userApi.updateCartItem(si.menuItem._id, si.quantity);
      }

      const { data: od } = await userApi.createOrder({
        deliveryAddress: address,
      });
      setOrder(od?.order || od);
      const orderId = od?.order?._id || od?._id;
      if (method === "cod") {
        // Create a COD payment to mark order as paid in backend
        await userApi.createPayment({ orderId, paymentMethod: "cod" });
        setStatus("Order placed with Cash on Delivery.");
        toast.success("Order placed (COD)");
        navigate("/orders");
      } else {
        // create payment for online (use 'card' as generic online)
        const { data: pay } = await userApi.createPayment({
          orderId,
          paymentMethod: "card",
        });
        setPayment(pay?.payment || pay);
        setStatus("Payment created. Click Verify when completed.");
        toast.info("Payment created. Verify to complete.");
      }
      // Restore unselected items back into cart
      if (unselected.length > 0) {
        await userApi.addToCart({
          items: unselected.map((u) => ({
            menuItemId: u.menuItem._id,
            quantity: u.quantity,
          })),
        });
      }
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to place order";
      setStatus(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const verifyPayment = async () => {
    if (!payment) return;
    setLoading(true);
    setStatus("Verifying payment...");
    try {
      const payload = {
        paymentId: payment?._id || payment?.id || payment?.paymentId,
        status: "success", // demo: mark success; integrate gateway status here
        transactionId: payment?.transactionId || undefined,
      };
      const { data } = await userApi.verifyPayment(payload);
      setStatus(data?.message || "Payment verified");
      toast.success("Payment verified");
      navigate("/orders");
    } catch (err) {
      const msg = err?.response?.data?.message || "Verification failed";
      setStatus(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h2 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-100 mb-4">
        Checkout
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm">
          <div className="p-6 md:p-8">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Select items to order
              </h3>
              {!cart || cart.items?.length === 0 ? (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Your cart is empty.
                </p>
              ) : (
                <div className="rounded-lg border border-gray-200 dark:border-gray-800 divide-y divide-gray-200 dark:divide-gray-800">
                  {cart.items.map((ci) => {
                    const id = ci.menuItem?._id;
                    const checked = selectedIds.has(id);
                    return (
                      <label
                        key={id}
                        className="flex items-center justify-between gap-3 p-3 cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                            checked={checked}
                            onChange={(e) => {
                              setSelectedIds((prev) => {
                                const next = new Set(prev);
                                if (e.target.checked) next.add(id);
                                else next.delete(id);
                                return next;
                              });
                            }}
                          />
                          <span className="text-sm text-gray-900 dark:text-gray-100">
                            {ci.menuItem?.name}
                          </span>
                        </div>
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          Qty: {ci.quantity}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Delivery address
              </label>
              <textarea
                className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                rows={3}
                placeholder="Full address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            <div className="mb-4">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Payment method
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className={`rounded-full border px-4 py-2 text-sm font-medium ${
                    method === "cod"
                      ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                      : "border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                  onClick={() => setMethod("cod")}
                >
                  Cash on Delivery
                </button>
                <button
                  type="button"
                  className={`rounded-full border px-4 py-2 text-sm font-medium ${
                    method === "online"
                      ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                      : "border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                  onClick={() => setMethod("online")}
                >
                  Online Payment
                </button>
              </div>
            </div>

            {method === "online" && payment && (
              <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700 mb-4">
                <span>
                  Payment ID:{" "}
                  {payment?.id || payment?._id || payment?.paymentId}
                </span>
                <button
                  className="inline-flex items-center justify-center rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 text-sm font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={verifyPayment}
                  disabled={loading}
                >
                  Verify Payment
                </button>
              </div>
            )}

            <div className="flex justify-end">
              <button
                className="inline-flex items-center justify-center rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-sm font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={placeOrder}
                disabled={loading || !address || selectedIds.size === 0}
              >
                {loading
                  ? "Processing..."
                  : method === "cod"
                  ? "Place Order (COD)"
                  : payment
                  ? "Continue"
                  : "Create Payment & Continue"}
              </button>
            </div>
            {status && (
              <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {status}
              </div>
            )}
          </div>
        </div>

        <div className="md:col-span-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm">
          <div className="p-6 md:p-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Order Summary
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Subtotal
                </span>
                <span className="text-gray-900 dark:text-gray-100">
                  ₹ {summary.subtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Delivery
                </span>
                <span className="text-gray-900 dark:text-gray-100">
                  ₹ {summary.delivery.toFixed(2)}
                </span>
              </div>
              <div className="h-px bg-gray-200 dark:bg-gray-800 my-2" />
              <div className="flex items-center justify-between font-semibold">
                <span className="text-gray-900 dark:text-gray-100">Total</span>
                <span className="text-gray-900 dark:text-gray-100">
                  ₹ {summary.total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
