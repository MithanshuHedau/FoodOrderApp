import React, { useState } from "react";
import { authApi, setToken, setAuthUser } from "../api";
import { useNavigate, Link } from "react-router-dom";

const Register = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    role: "user",
  });
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!photo) return setError("Photo is required");
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    fd.append("photo", photo);
    setLoading(true);
    try {
      const { data } = await authApi.signup(fd);
      setToken(data.token);
      setAuthUser(data.user);
      navigate("/");
    } catch (err) {
      setError(err?.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 md:p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
              Register
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Create your account to start ordering delicious food.
            </p>
          </div>
          <form
            onSubmit={onSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6"
          >
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Name
              </label>
              <input
                className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                name="name"
                value={form.name}
                onChange={onChange}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Email
              </label>
              <input
                className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                name="email"
                type="email"
                value={form.email}
                onChange={onChange}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <input
                className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                name="password"
                type="password"
                value={form.password}
                onChange={onChange}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Phone
              </label>
              <input
                className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                name="phone"
                value={form.phone}
                onChange={onChange}
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Address
              </label>
              <input
                className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                name="address"
                value={form.address}
                onChange={onChange}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Role
              </label>
              <select
                className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                name="role"
                value={form.role}
                onChange={onChange}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Photo
              </label>
              <input
                className="mt-1 block w-full text-sm text-gray-700 dark:text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                type="file"
                accept="image/*"
                onChange={(e) => setPhoto(e.target.files?.[0] || null)}
                required
              />
            </div>
            {error && (
              <p className="md:col-span-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
                {error}
              </p>
            )}
            <div className="md:col-span-2 flex items-center justify-between pt-2">
              <button
                className="inline-flex items-center justify-center rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-sm font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
                type="submit"
              >
                {loading ? "Registering..." : "Register"}
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Have an account?{" "}
                <Link
                  className="text-emerald-700 dark:text-emerald-400 hover:underline"
                  to="/login"
                >
                  Login
                </Link>
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
