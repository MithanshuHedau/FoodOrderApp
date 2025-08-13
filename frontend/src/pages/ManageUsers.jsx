import React, { useEffect, useState } from "react";
import { adminApi, getAuthUser, getToken } from "../api";
import { useNavigate } from "react-router-dom";
import { useToast } from "../components/ToastProvider.jsx";

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [fileMap, setFileMap] = useState({}); // id -> File
  const navigate = useNavigate();
  const me = getAuthUser();
  const toast = useToast();

  useEffect(() => {
    if (me?.role !== "admin") navigate("/");
  }, [me, navigate]);

  const load = async () => {
    const token = getToken();
    if (!me || me.role !== "admin" || !token) {
      setError("Login as admin required");
      return;
    }
    try {
      const { data } = await adminApi.listUsers();
      setUsers(data.users || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load users");
    }
  };
  useEffect(() => {
    load();
  }, []);

  const update = async (u) => {
    try {
      const photo = fileMap[u._id];
      const payload = { name: u.name, email: u.email, role: u.role };
      if (photo) payload.photo = photo;
      await adminApi.updateUser(u._id, payload);
      await load();
      toast.success("User updated");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Update failed");
    }
  };
  const remove = async (id) => {
    try {
      await adminApi.deleteUser(id);
      await load();
      toast.success("User deleted");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Delete failed");
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 md:max-w-4xl sm:px-4">
      <div className="flex items-center gap-3 py-4 border-b border-slate-700 mb-4">
        <div>
          <h2 className="text-2xl font-semibold">Manage Users</h2>
          <div className="text-slate-400">Update roles, names, and photos</div>
        </div>
      </div>
      {error && <p className="text-rose-500 mb-3">{error}</p>}

      {/* Mobile: cards */}
      <div className="md:hidden space-y-3">
        {users.map((u) => (
          <div
            key={u._id}
            className="rounded-xl border border-slate-700 bg-slate-900/60 p-4"
          >
            <div className="flex items-center gap-3 mb-3">
              {u.photo ? (
                <img
                  src={u.photo}
                  alt=""
                  className="w-12 h-12 rounded-full object-cover border border-slate-700"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700" />
              )}
              <div className="ml-auto">
                <button
                  className={`inline-flex items-center justify-center rounded-lg bg-rose-500 hover:bg-rose-600 text-white px-3 py-2 transition ${
                    me?._id === u._id ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  onClick={() => remove(u._id)}
                  disabled={me?._id === u._id}
                  type="button"
                >
                  Delete
                </button>
              </div>
            </div>
            <div className="grid gap-3">
              <input
                className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 outline-none focus:border-sky-500"
                value={u.name}
                onChange={(e) =>
                  setUsers(
                    users.map((x) =>
                      x._id === u._id ? { ...x, name: e.target.value } : x
                    )
                  )
                }
                placeholder="Name"
              />
              <input
                className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 outline-none focus:border-sky-500"
                value={u.email}
                onChange={(e) =>
                  setUsers(
                    users.map((x) =>
                      x._id === u._id ? { ...x, email: e.target.value } : x
                    )
                  )
                }
                placeholder="Email"
              />
              <select
                className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 outline-none focus:border-sky-500"
                value={u.role}
                onChange={(e) =>
                  setUsers(
                    users.map((x) =>
                      x._id === u._id ? { ...x, role: e.target.value } : x
                    )
                  )
                }
              >
                <option value="user">user</option>
                <option value="admin">admin</option>
              </select>
              <input
                className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 outline-none"
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setFileMap({ ...fileMap, [u._id]: e.target.files?.[0] })
                }
              />
              <div className="flex justify-end">
                <button
                  className="inline-flex items-center justify-center rounded-lg bg-sky-500 hover:bg-sky-600 text-white px-3 py-2 transition"
                  onClick={() => update(u)}
                  type="button"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        ))}
        {users.length === 0 && (
          <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4 text-slate-400">
            No users found.
          </div>
        )}
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block rounded-xl border border-slate-700 bg-slate-900/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-slate-900/60">
                <th className="text-left px-3 py-2 border-b border-slate-700">
                  Name
                </th>
                <th className="text-left px-3 py-2 border-b border-slate-700">
                  Email
                </th>
                <th className="text-left px-3 py-2 border-b border-slate-700">
                  Role
                </th>
                <th className="text-left px-3 py-2 border-b border-slate-700">
                  Photo
                </th>
                <th className="text-left px-3 py-2 border-b border-slate-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} className="align-top">
                  <td className="px-3 py-2 border-b border-slate-800">
                    <input
                      className="w-full px-2 py-1 rounded-md border border-slate-700 bg-slate-900 text-slate-100 outline-none focus:border-sky-500"
                      value={u.name}
                      onChange={(e) =>
                        setUsers(
                          users.map((x) =>
                            x._id === u._id ? { ...x, name: e.target.value } : x
                          )
                        )
                      }
                    />
                  </td>
                  <td className="px-3 py-2 border-b border-slate-800">
                    <input
                      className="w-full px-2 py-1 rounded-md border border-slate-700 bg-slate-900 text-slate-100 outline-none focus:border-sky-500"
                      value={u.email}
                      onChange={(e) =>
                        setUsers(
                          users.map((x) =>
                            x._id === u._id
                              ? { ...x, email: e.target.value }
                              : x
                          )
                        )
                      }
                    />
                  </td>
                  <td className="px-3 py-2 border-b border-slate-800">
                    <select
                      className="w-full px-2 py-1 rounded-md border border-slate-700 bg-slate-900 text-slate-100 outline-none focus:border-sky-500"
                      value={u.role}
                      onChange={(e) =>
                        setUsers(
                          users.map((x) =>
                            x._id === u._id ? { ...x, role: e.target.value } : x
                          )
                        )
                      }
                    >
                      <option value="user">user</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td className="px-3 py-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      {u.photo && (
                        <img
                          src={u.photo}
                          alt=""
                          className="w-10 h-10 rounded-full object-cover border border-slate-700"
                        />
                      )}
                      <input
                        className="w-full px-2 py-1 rounded-md border border-slate-700 bg-slate-900 text-slate-100 outline-none"
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          setFileMap({
                            ...fileMap,
                            [u._id]: e.target.files?.[0],
                          })
                        }
                      />
                    </div>
                  </td>
                  <td className="px-3 py-2 border-b border-slate-800">
                    <div className="flex gap-2">
                      <button
                        className="inline-flex items-center justify-center rounded-lg bg-sky-500 hover:bg-sky-600 text-white px-3 py-2 transition"
                        onClick={() => update(u)}
                        type="button"
                      >
                        Save
                      </button>
                      <button
                        className={`inline-flex items-center justify-center rounded-lg bg-rose-500 hover:bg-rose-600 text-white px-3 py-2 transition ${
                          me?._id === u._id
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                        onClick={() => remove(u._id)}
                        disabled={me?._id === u._id}
                        type="button"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td className="px-3 py-3 text-slate-400" colSpan={5}>
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManageUsers;
