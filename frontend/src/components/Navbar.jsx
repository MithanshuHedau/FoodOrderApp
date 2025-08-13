import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api, { getAuthUser, logout } from "../api";
import { useToast } from "./ToastProvider.jsx";

const Navbar = () => {
  const user = getAuthUser();
  const navigate = useNavigate();
  const toast = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const onLogout = () => {
    logout();
    toast.success("Logged out");
    navigate("/login");
  };
  const photoUrl = useMemo(() => {
    if (!user?.photo) return null;
    if (/^https?:\/\//i.test(user.photo)) return user.photo;
    const base = api?.defaults?.baseURL || "";
    const path = user.photo.startsWith("/") ? user.photo : `/${user.photo}`;
    return `${base}${path}`;
  }, [user]);
  return (
    <header className="sticky top-0 z-20 backdrop-blur bg-slate-900/70 border-b border-slate-700">
      <div className="max-w-5xl mx-auto px-6 md:max-w-4xl sm:px-4 flex items-center gap-4 py-3 flex-wrap">
        <Link
          className="font-bold tracking-wide text-white no-underline"
          to="/"
        >
          FoodOrder
        </Link>
        <Link
          className="text-slate-100 no-underline px-2 py-1 rounded-md hover:bg-slate-800"
          to="/"
        >
          Home
        </Link>
        {user?.role !== "admin" && (
          <Link
            className="text-slate-100 no-underline px-2 py-1 rounded-md hover:bg-slate-800"
            to="/orders"
          >
            Orders
          </Link>
        )}
        {user?.role !== "admin" && (
          <Link
            className="text-slate-100 no-underline px-2 py-1 rounded-md hover:bg-slate-800"
            to="/checkout"
          >
            Checkout
          </Link>
        )}
        {user?.role !== "admin" && (
          <Link
            className="text-slate-100 no-underline px-2 py-1 rounded-md hover:bg-slate-800"
            to="/cart"
          >
            Cart
          </Link>
        )}
        {user?.role === "admin" && (
          <Link
            className="text-slate-100 no-underline px-2 py-1 rounded-md hover:bg-slate-800"
            to="/admin"
          >
            Admin
          </Link>
        )}
        <span className="ml-auto" />
        {user ? (
          <div className="relative" onMouseLeave={() => setMenuOpen(false)}>
            <button
              className="flex items-center gap-2 bg-transparent border border-slate-700 px-3 py-1.5 rounded-full text-slate-100"
              onClick={() => setMenuOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={user.name}
                  className="w-9 h-9 rounded-full object-cover"
                />
              ) : (
                <div className="w-9 h-9 rounded-full flex items-center justify-center bg-slate-800 border border-slate-700">
                  {user.name?.[0]?.toUpperCase() || "U"}
                </div>
              )}
              <span className="font-medium">{user.name}</span>
            </button>
            {menuOpen && (
              <div
                className="absolute right-0 top-12 bg-slate-900 border border-slate-700 rounded-xl min-w-[230px] shadow-xl p-2"
                role="menu"
              >
                <div className="flex items-center gap-2 p-2 border-b border-slate-700">
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt={user.name}
                      className="w-9 h-9 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full flex items-center justify-center bg-slate-800 border border-slate-700">
                      {user.name?.[0]?.toUpperCase() || "U"}
                    </div>
                  )}
                  <div>
                    <div className="font-semibold">{user.name}</div>
                    <div className="text-xs text-slate-400">{user.email}</div>
                  </div>
                </div>
                <Link
                  className="block w-full text-left bg-transparent border-0 text-slate-100 no-underline px-3 py-2 rounded-md hover:bg-slate-800"
                  to="/profile"
                  onClick={() => setMenuOpen(false)}
                >
                  Profile
                </Link>
                {user?.role !== "admin" && (
                  <Link
                    className="block w-full text-left bg-transparent border-0 text-slate-100 no-underline px-3 py-2 rounded-md hover:bg-slate-800"
                    to="/orders"
                    onClick={() => setMenuOpen(false)}
                  >
                    My Orders
                  </Link>
                )}
                <button
                  className="block w-full text-left bg-transparent border-0 text-slate-100 no-underline px-3 py-2 rounded-md hover:bg-slate-800"
                  onClick={onLogout}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <Link
              className="text-slate-100 no-underline px-2 py-1 rounded-md hover:bg-slate-800"
              to="/login"
            >
              Login
            </Link>
            <Link
              className="text-slate-100 no-underline px-2 py-1 rounded-md hover:bg-slate-800"
              to="/register"
            >
              Register
            </Link>
          </>
        )}
      </div>
    </header>
  );
};

export default Navbar;
