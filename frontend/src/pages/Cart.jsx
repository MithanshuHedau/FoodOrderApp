import React, { useEffect, useState } from "react";
import { userApi } from "../api";
import { useNavigate } from "react-router-dom";
import { useToast } from "../components/ToastProvider.jsx";
import Loader from "../components/Loader.jsx";

const Cart = () => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const toast = useToast();

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await userApi.getCart();
      setCart(data.cart);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to fetch cart");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateQty = async (menuItemId, quantity) => {
    try {
      await userApi.updateCartItem(menuItemId, quantity);
      await load();
      toast.info("Quantity updated");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Update failed");
    }
  };
  const removeItem = async (menuItemId) => {
    try {
      await userApi.removeCartItem(menuItemId);
      await load();
      toast.success("Item removed");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Remove failed");
    }
  };
  // No direct ordering from Cart; proceed to checkout to select items and place order

  if (loading)
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <Loader text="Loading cart..." />
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
  if (!cart) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h2 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-100 mb-4">
        Your Cart
      </h2>
      {cart.items?.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-400">Cart is empty.</p>
      ) : (
        <>
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm divide-y divide-gray-200 dark:divide-gray-800">
            {(cart.items || []).map((ci) => (
              <div
                key={ci.menuItem?._id}
                className="flex items-center justify-between gap-3 p-4"
              >
                <div className="flex items-center gap-3 flex-1">
                  <strong className="text-gray-900 dark:text-gray-100">
                    {ci.menuItem?.name}
                  </strong>
                  <span className="inline-flex items-center rounded-full border border-gray-300 dark:border-gray-700 px-2 py-1 text-xs text-gray-700 dark:text-gray-300">
                    ₹{ci.menuItem?.price}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                    onClick={() =>
                      updateQty(ci.menuItem._id, Math.max(1, ci.quantity - 1))
                    }
                  >
                    -
                  </button>
                  <span className="inline-flex items-center justify-center h-8 min-w-8 px-2 rounded-md border border-gray-200 dark:border-gray-800 text-sm text-gray-900 dark:text-gray-100">
                    {ci.quantity}
                  </span>
                  <button
                    className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                    onClick={() => updateQty(ci.menuItem._id, ci.quantity + 1)}
                  >
                    +
                  </button>
                  <button
                    className="inline-flex items-center justify-center rounded-lg border border-rose-600 text-rose-700 dark:text-rose-400 px-3 py-2 text-sm font-medium hover:bg-rose-50 dark:hover:bg-rose-900/30"
                    onClick={() => removeItem(ci.menuItem._id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <strong className="text-gray-900 dark:text-gray-100">
              Total: ₹{cart.totalPrice}
            </strong>
          </div>

          <div className="mt-6 flex items-center justify-end">
            <button
              className="inline-flex items-center justify-center rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-sm font-medium shadow-sm"
              onClick={() => navigate("/checkout")}
            >
              Proceed to Checkout
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Cart;
