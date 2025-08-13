import React, { useEffect, useMemo, useState } from "react";
import api, { authApi, getAuthUser, setAuthUser } from "../api";
import { useToast } from "../components/ToastProvider.jsx";

const Profile = () => {
  const [user, setUser] = useState(getAuthUser());
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const [passwords, setPasswords] = useState({
    oldPassword: "",
    newPassword: "",
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setUser(getAuthUser());
  }, []);

  const photoUrl = useMemo(() => {
    if (!user?.photo) return null;
    if (/^https?:\/\//i.test(user.photo)) return user.photo;
    const base = api?.defaults?.baseURL || "";
    const path = user.photo.startsWith("/") ? user.photo : `/${user.photo}`;
    return `${base}${path}`;
  }, [user]);

  const onChangePassword = async (e) => {
    e.preventDefault();
    if (!user?._id) return;
    setSaving(true);
    setMessage("");
    try {
      await authApi.updatePassword(user._id, passwords);
      setMessage("Password updated");
      toast.success("Password updated");
      setPasswords({ oldPassword: "", newPassword: "" });
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to update password";
      setMessage(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const onUploadPhoto = async (e) => {
    e.preventDefault();
    if (!photoFile || !user?._id) return;
    setSaving(true);
    setMessage("");
    try {
      const { data } = await authApi.updatePhoto(user._id, photoFile);
      const updated = { ...user, photo: data?.photo || data?.user?.photo };
      setAuthUser(updated);
      setUser(updated);
      setMessage("Photo updated");
      toast.success("Photo updated");
      setPhotoFile(null);
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to update photo";
      setMessage(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <h2 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-100 mb-2">
          Profile
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Please login to view your profile.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm">
        <div className="p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
              My Profile
            </h2>
          </div>

          <div className="flex items-center gap-4 md:gap-6 mb-6">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={user.name}
                className="h-20 w-20 rounded-full object-cover ring-2 ring-white shadow"
              />
            ) : (
              <div className="h-20 w-20 rounded-full grid place-items-center bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-2xl font-semibold shadow">
                {user.name?.[0]?.toUpperCase() || "U"}
              </div>
            )}
            <div>
              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {user.name}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {user.email}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {user.address}
              </div>
            </div>
          </div>

          {message && (
            <div
              className={`mb-6 rounded-lg border px-4 py-2 text-sm ${
                /updated/i.test(message)
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : "bg-rose-50 border-rose-200 text-rose-700"
              }`}
            >
              {message}
            </div>
          )}

          <form
            onSubmit={onChangePassword}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-8"
          >
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Old password
              </label>
              <input
                type="password"
                className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={passwords.oldPassword}
                onChange={(e) =>
                  setPasswords((p) => ({ ...p, oldPassword: e.target.value }))
                }
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                New password
              </label>
              <input
                type="password"
                className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={passwords.newPassword}
                onChange={(e) =>
                  setPasswords((p) => ({ ...p, newPassword: e.target.value }))
                }
                required
              />
            </div>
            <div className="col-span-full flex justify-end">
              <button
                className="inline-flex items-center justify-center rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-sm font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={saving}
              >
                Update Password
              </button>
            </div>
          </form>

          <form
            onSubmit={onUploadPhoto}
            className="flex flex-col sm:flex-row items-start sm:items-center gap-3"
          >
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-700 dark:text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
            />
            <button
              className="inline-flex items-center justify-center rounded-lg border border-emerald-600 text-emerald-700 dark:text-emerald-400 px-4 py-2 text-sm font-medium hover:bg-emerald-50 dark:hover:bg-emerald-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={saving || !photoFile}
            >
              Update kar !
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
