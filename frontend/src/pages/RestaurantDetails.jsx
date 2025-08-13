import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { userApi } from "../api";
import { useToast } from "../components/ToastProvider.jsx";
import Loader from "../components/Loader.jsx";
import { getAuthUser } from "../api";

const RestaurantDetails = () => {
  const { id } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const toast = useToast();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [{ data: r }, { data: m }, { data: rv }] = await Promise.all([
          userApi.getPublicRestaurant(id),
          userApi.getPublicRestaurantMenu(id),
          userApi.getPublicRestaurantReviews(id),
        ]);
        setRestaurant(r.restaurant);
        setMenu(m.menuItems || []);
        setReviews(rv.reviews || []);
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load restaurant");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const add = async (menuItemId) => {
    try {
      await userApi.addToCart({ menuItemId, quantity: 1 });
      toast.success("Added to cart");
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Add to cart failed (login required?)"
      );
    }
  };

  const submitReview = async () => {
    try {
      await userApi.createOrUpdateReview({ restaurantId: id, rating, comment });
      toast.success("Review submitted");
      setComment("");
      setRating(5);
      // reload reviews after submit
      try {
        const { data } = await userApi.getPublicRestaurantReviews(id);
        setReviews(data.reviews || []);
      } catch {}
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Review failed (login required?)"
      );
    }
  };

  if (loading)
    return (
      <div className="max-w-5xl mx-auto px-6 md:max-w-4xl sm:px-4">
        <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
          <Loader text="Loading restaurant..." />
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
  if (!restaurant)
    return (
      <div className="max-w-5xl mx-auto px-6 md:max-w-4xl sm:px-4">
        <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
          <p className="text-slate-400">Not found</p>
        </div>
      </div>
    );

  return (
    <div className="max-w-5xl mx-auto px-6 md:max-w-4xl sm:px-4">
      {/* Header card */}
      <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4 mb-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <h2 className="text-2xl font-semibold">{restaurant.name}</h2>
            <p className="text-slate-400 mt-1">{restaurant.description}</p>
          </div>
          {restaurant.image && (
            <img
              className="w-52 h-36 object-cover rounded-lg border border-slate-700"
              src={restaurant.image}
              alt={restaurant.name}
            />
          )}
        </div>
      </div>

      {/* Review form */}
      <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4 mb-6">
        <h4 className="text-lg font-semibold mb-3">Leave a review</h4>
        <div className="grid gap-3 md:grid-cols-[auto,1fr,auto] items-center">
          <div className="flex items-center gap-2 text-slate-200">
            <label className="text-sm text-slate-400">Rating</label>
            <select
              className="px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 outline-none focus:border-sky-500"
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <input
            className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 outline-none focus:border-sky-500"
            placeholder="Comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <button
            className="inline-flex items-center justify-center rounded-lg bg-sky-500 hover:bg-sky-600 text-white px-3 py-2 transition"
            onClick={submitReview}
            type="button"
          >
            Submit
          </button>
        </div>
      </div>

      {/* Menu */}
      <h3 className="text-xl font-semibold mb-3">Menu</h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 items-stretch">
        {menu.map((mi) => (
          <article
            key={mi._id}
            className="bg-slate-900/60 border border-slate-700 rounded-xl overflow-hidden h-full flex flex-col"
          >
            {mi.image ? (
              <img
                className="w-full h-44 object-cover block"
                src={mi.image}
                alt={mi.name}
              />
            ) : (
              <div className="w-full h-44 bg-slate-800" />
            )}
            <div className="p-4 flex flex-col gap-2 grow">
              <h4 className="text-lg font-semibold">{mi.name}</h4>
              <p className="text-slate-400 overflow-hidden max-h-12">
                {mi.description}
              </p>
              <div className="mt-auto flex items-center justify-between gap-2 flex-wrap">
                <strong>₹{mi.price}</strong>
                <div className="ml-auto flex gap-2">
                  {getAuthUser()?.role === "admin" && (
                    <Link
                      to={`/admin/menu?restaurantId=${restaurant._id}&editItemId=${mi._id}`}
                      className="inline-flex items-center justify-center rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-2 transition no-underline"
                    >
                      Edit
                    </Link>
                  )}
                  <button
                    className="inline-flex items-center justify-center rounded-lg bg-sky-500 hover:bg-sky-600 text-white px-3 py-2 transition"
                    onClick={() => add(mi._id)}
                    type="button"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Reviews */}
      <div className="mt-6">
        <h3 className="text-xl font-semibold mb-3">Reviews</h3>
        {reviews.length === 0 && (
          <p className="text-slate-400">
            No reviews yet. Be the first to review.
          </p>
        )}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.map((rv) => (
            <div
              key={rv._id}
              className="rounded-xl border border-slate-700 bg-slate-900/60 overflow-hidden"
            >
              <div className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  {rv.user?.photo ? (
                    <img
                      src={rv.user.photo}
                      alt={rv.user?.name}
                      className="w-10 h-10 rounded-full object-cover border border-slate-700"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                      {rv.user?.name?.[0]?.toUpperCase() || "U"}
                    </div>
                  )}
                  <div>
                    <div className="font-medium">{rv.user?.name}</div>
                    <div className="text-slate-400 text-sm">
                      {new Date(rv.createdAt).toLocaleString?.()}
                    </div>
                  </div>
                </div>
                <div>
                  <strong>Rating:</strong> {rv.rating}/5
                </div>
                <p className="mt-2">{rv.comment}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RestaurantDetails;
