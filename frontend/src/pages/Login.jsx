import React, { useState } from "react";
import { authApi, setToken, setAuthUser } from "../api";
import { useNavigate, Link } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await authApi.login({ email, password });
      setToken(data.token);
      setAuthUser(data.user);
      navigate("/");
    } catch (err) {
      setError(err?.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 md:p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
              Login
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Welcome back! Please enter your details to continue.
            </p>
          </div>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Email
              </label>
              <input
                className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <input
                className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                required
              />
            </div>
            {error && (
              <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
                {error}
              </p>
            )}
            <div className="flex items-center justify-between pt-2">
              <button
                className="inline-flex items-center justify-center rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-sm font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
                type="submit"
              >
                {loading ? "Logging in..." : "Login"}
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                No account?{" "}
                <Link
                  className="text-emerald-700 dark:text-emerald-400 hover:underline"
                  to="/register"
                >
                  Register
                </Link>
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
