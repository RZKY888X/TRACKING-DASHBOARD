// app/users/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { ProtectedPage } from "@/components/ProtectedPage";
import {
  UserPlus,
  Search,
  Eye,
  EyeOff,
  X,
  Check,
  Shield,
  Users,
} from "lucide-react";

interface User {
  id: string;
  email: string;
  name: string;
  role: "VIEWER" | "USER" | "ADMIN" | "SUPERADMIN";
  jobRole?: string | null;
  lastLoginAt: string | null;
  lastLoginIp: string | null;
  createdAt: string;
}

interface NewUser {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  role: "VIEWER" | "USER" | "ADMIN" | "SUPERADMIN";
  jobRole?: string;
}

interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  entity: string | null;
  entityId: string | null;
  description: string;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: any;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export default function UsersPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("All Roles");
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [activityPage, setActivityPage] = useState(1);
  const [totalActivityPages, setTotalActivityPages] = useState(1);

  const [newUser, setNewUser] = useState<NewUser>({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    role: "VIEWER",
    jobRole: "",
  });

  const roles = ["VIEWER", "USER", "ADMIN", "SUPERADMIN"];
  const roleColors = {
    VIEWER: "bg-gray-500/20 text-gray-300 border-gray-500/30",
    USER: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    ADMIN: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    SUPERADMIN: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  };

  // static job roles (kamu bisa ganti jadi fetch dari backend kalau perlu)
  const jobRoles = [
    "Driver",
    "Dispatcher",
    "Mechanic",
    "Office Admin",
    "Supervisor",
    "Other",
  ];

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // Fetch users
  useEffect(() => {
    fetchUsers();
    fetchActivities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.accessToken]);

  // Filter users
  useEffect(() => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (roleFilter !== "All Roles") {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    setFilteredUsers(filtered);
  }, [searchTerm, roleFilter, users]);

  const fetchUsers = async () => {
    if (!session?.accessToken) return;

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/auth/users`, {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      });

      if (!res.ok) throw new Error("Failed to fetch users");

      const data = await res.json();
      setUsers(data);
      setFilteredUsers(data);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      const mockUsers: User[] = [
        {
          id: "1",
          email: "budi.s@example.com",
          name: "Budi Santoso",
          role: "ADMIN",
          jobRole: "Supervisor",
          lastLoginAt: "2025-01-15T08:30:00Z",
          lastLoginIp: "192.168.1.100",
          createdAt: "2025-01-01T00:00:00Z",
        },
        {
          id: "2",
          email: "citra.l@example.com",
          name: "Citra Lestari",
          role: "USER",
          jobRole: "Dispatcher",
          lastLoginAt: "2025-01-14T15:20:00Z",
          lastLoginIp: "192.168.1.101",
          createdAt: "2025-01-02T00:00:00Z",
        },
        {
          id: "3",
          email: "eko.p@example.com",
          name: "Eko Prasetyo",
          role: "VIEWER",
          jobRole: "Other",
          lastLoginAt: null,
          lastLoginIp: null,
          createdAt: "2025-01-03T00:00:00Z",
        },
      ];
      setUsers(mockUsers);
      setFilteredUsers(mockUsers);
    } finally {
      setLoading(false);
    }
  };

  const fetchActivities = async () => {
    if (!session?.accessToken) return;

    try {
      setLoadingActivities(true);
      const res = await fetch(
        `${API_URL}/api/activity?page=${activityPage}&limit=10`,
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        }
      );

      if (!res.ok) throw new Error("Failed to fetch activities");

      const data = await res.json();
      setActivities(data.activities);
      setTotalActivityPages(data.pagination.totalPages);
    } catch (err) {
      console.error("Failed to fetch activities:", err);
      const mockActivities: ActivityLog[] = [
        {
          id: "1",
          userId: "1",
          action: "USER_LOGIN",
          entity: "USER",
          entityId: "1",
          description: "User logged in successfully",
          ipAddress: "192.168.1.100",
          userAgent: "Mozilla/5.0",
          metadata: {},
          createdAt: new Date().toISOString(),
          user: {
            id: "1",
            name: "Budi Santoso",
            email: "budi.s@example.com",
            role: "ADMIN",
          },
        },
        {
          id: "2",
          userId: "2",
          action: "USER_CREATED",
          entity: "USER",
          entityId: "3",
          description: "Created new user account",
          ipAddress: "192.168.1.101",
          userAgent: "Mozilla/5.0",
          metadata: {},
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          user: {
            id: "2",
            name: "Citra Lestari",
            email: "citra.l@example.com",
            role: "USER",
          },
        },
      ];
      setActivities(mockActivities);
    } finally {
      setLoadingActivities(false);
    }
  };

  useEffect(() => {
    if (session?.accessToken) {
      fetchActivities();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activityPage, session?.accessToken]);

  const handleAddUser = async () => {
    setError("");
    setSuccess("");

    if (!newUser.email || !newUser.password || !newUser.name) {
      setError("Email, password, and name are required");
      return;
    }

    if (newUser.password !== newUser.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newUser.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: newUser.email,
          password: newUser.password,
          name: newUser.name,
          role: newUser.role,
          jobRole: newUser.jobRole || null,
        }),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => null);
        console.error("Create user failed:", res.status, errText);
        throw new Error("Failed to create user");
      }

      setSuccess("User created successfully!");
      setTimeout(() => {
        setShowAddModal(false);
        setNewUser({
          email: "",
          password: "",
          confirmPassword: "",
          name: "",
          role: "VIEWER",
          jobRole: "",
        });
        fetchUsers();
        fetchActivities();
      }, 1000);
    } catch (err) {
      console.error(err);
      setError("Failed to create user");
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;

    try {
      const res = await fetch(`${API_URL}/api/auth/users/${selectedUser.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: selectedUser.name,
          email: selectedUser.email,
          role: selectedUser.role,
          jobRole: (selectedUser as any).jobRole ?? null,
        }),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => null);
        console.error("Update user failed:", res.status, errText);
        throw new Error("Failed to update user");
      }

      setSuccess("User updated successfully!");
      setTimeout(() => {
        setShowEditModal(false);
        setSelectedUser(null);
        fetchUsers();
        fetchActivities();
      }, 1000);
    } catch (err) {
      console.error(err);
      setError("Failed to update user");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      const res = await fetch(`${API_URL}/api/auth/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      });

      if (!res.ok) throw new Error("Failed to delete user");

      setSuccess("User deleted successfully!");
      fetchUsers();
      fetchActivities();
    } catch (err) {
      console.error(err);
      setError("Failed to delete user");
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "SUPERADMIN":
        return <Shield className="w-4 h-4" />;
      case "ADMIN":
        return <Shield className="w-4 h-4" />;
      case "USER":
        return <Users className="w-4 h-4" />;
      default:
        return <Eye className="w-4 h-4" />;
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes("LOGIN")) return "text-green-400";
    if (action.includes("LOGOUT")) return "text-gray-400";
    if (action.includes("CREATE")) return "text-blue-400";
    if (action.includes("UPDATE") || action.includes("EDIT"))
      return "text-yellow-400";
    if (action.includes("DELETE")) return "text-red-400";
    return "text-cyan-400";
  };

  const getActionIcon = (action: string) => {
    if (action.includes("LOGIN")) return "→";
    if (action.includes("LOGOUT")) return "←";
    if (action.includes("CREATE")) return "+";
    if (action.includes("UPDATE") || action.includes("EDIT")) return "✎";
    if (action.includes("DELETE")) return "✕";
    return "•";
  };

  return (
    <ProtectedPage requiredRole="ADMIN">
      <main className="min-h-screen bg-[#0a0e1a] text-gray-200 p-4">
        <div className="w-full space-y-4">
          {/* Header */}
          <div className="bg-[#0f1729] border border-cyan-400/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-2xl font-bold text-cyan-400 tracking-wide drop-shadow-[0_0_8px_#00FFFF80]">
                User Management
              </h1>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-all shadow-[0_0_10px_#00FFFF40] hover:shadow-[0_0_15px_#00FFFF60] text-sm font-medium"
              >
                <UserPlus className="w-4 h-4" />
                Add New User
              </button>
            </div>
            <p className="text-gray-400 text-sm">
              Manage user accounts and access permissions.
            </p>
          </div>

          {/* Alerts */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-start gap-2">
              <X className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-red-300 text-sm font-medium">{error}</p>
              </div>
              <button
                onClick={() => setError("")}
                className="text-red-400 hover:text-red-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {success && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 flex items-start gap-2">
              <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-green-300 text-sm font-medium">{success}</p>
              </div>
              <button
                onClick={() => setSuccess("")}
                className="text-green-400 hover:text-green-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Filters */}
          <div className="bg-[#0f1729] border border-cyan-400/30 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search by name or email"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-[#1a2235] border border-cyan-400/20 rounded-lg text-gray-200 text-sm placeholder-gray-500 focus:outline-none focus:border-cyan-400/50"
                />
              </div>

              {/* Role Filter */}
              <div className="flex gap-2 flex-wrap">
                {["All Roles", ...roles].map((role) => (
                  <button
                    key={role}
                    onClick={() => setRoleFilter(role)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      roleFilter === role
                        ? "bg-cyan-500 text-white shadow-[0_0_8px_#00FFFF40]"
                        : "bg-[#1a2235] text-gray-400 border border-cyan-400/20 hover:border-cyan-400/40"
                    }`}
                  >
                    {role.replace("All Roles", "All")}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Users Table and Activity Logs */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Users Table - Left Side (2/3 width) */}
            <div className="lg:col-span-2 bg-[#0f1729] border border-cyan-400/30 rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-cyan-400/20 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-cyan-400">
                  User Table
                </h2>
                {!loading && (
                  <span className="text-xs text-gray-500">
                    {filteredUsers.length} users
                  </span>
                )}
              </div>

              {loading ? (
                <div className="p-12 text-center text-cyan-400 text-sm">
                  Loading...
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#1a2235]">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          User Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Last Login
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cyan-400/10">
                      {filteredUsers.map((user) => (
                        <tr
                          key={user.id}
                          className="hover:bg-cyan-400/5 transition-colors"
                        >
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="font-medium text-gray-200 text-sm">
                              {user.name}
                              {user.jobRole && (
                                <div className="text-xs text-gray-500">
                                  {user.jobRole}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-gray-400 text-sm">
                              {user.email}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div
                              className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium border ${
                                roleColors[user.role]
                              }`}
                            >
                              {getRoleIcon(user.role)}
                              {user.role}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            {user.lastLoginAt ? (
                              <span className="text-green-400 text-xs font-medium">
                                Active
                              </span>
                            ) : (
                              <span className="text-gray-500 text-xs font-medium">
                                Inactive
                              </span>
                            )}
                          </td>

                          {/* Last Login */}
                          <td className="px-4 py-3 whitespace-nowrap text-gray-400 text-xs">
                            {formatDate(user.lastLoginAt)}
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  // make sure selectedUser carries jobRole too
                                  setSelectedUser(user);
                                  setShowEditModal(true);
                                }}
                                className="px-2 py-1 bg-yellow-500/20 text-yellow-300 text-xs rounded border border-yellow-500/30 hover:bg-yellow-500/30"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                className="px-2 py-1 bg-red-500/20 text-red-300 text-xs rounded border border-red-500/30 hover:bg-red-500/30"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Activity Log - Right Side */}
            <div className="bg-[#0f1729] border border-cyan-400/30 rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-cyan-400/20 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-cyan-400">
                  Activity Logs
                </h2>
              </div>

              {loadingActivities ? (
                <div className="p-6 text-center text-cyan-400 text-sm">
                  Loading logs...
                </div>
              ) : (
                <div className="max-h-[460px] overflow-y-auto custom-scroll">
                  {activities.length === 0 ? (
                    <p className="p-4 text-gray-500 text-sm">
                      No activity records found.
                    </p>
                  ) : (
                    <ul className="divide-y divide-cyan-400/10">
                      {activities.map((log) => (
                        <li key={log.id} className="p-4 hover:bg-cyan-400/5">
                          <div className="flex items-center gap-3">
                            <span
                              className={`text-lg font-bold ${getActionColor(
                                log.action
                              )}`}
                            >
                              {getActionIcon(log.action)}
                            </span>
                            <div className="flex-1">
                              <p className="text-sm text-gray-300">
                                <span className="font-semibold text-cyan-400">
                                  {log.user.name}
                                </span>{" "}
                                {log.description}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {formatDate(log.createdAt)}
                              </p>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* Pagination */}
              <div className="p-3 flex justify-between items-center border-t border-cyan-400/20 text-xs">
                <button
                  disabled={activityPage === 1}
                  onClick={() => setActivityPage(activityPage - 1)}
                  className="px-3 py-1 bg-[#1a2235] rounded disabled:opacity-30"
                >
                  Prev
                </button>

                <span className="text-gray-400">
                  Page {activityPage} / {totalActivityPages}
                </span>

                <button
                  disabled={activityPage === totalActivityPages}
                  onClick={() => setActivityPage(activityPage + 1)}
                  className="px-3 py-1 bg-[#1a2235] rounded disabled:opacity-30"
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          {/* ADD USER MODAL */}
          {showAddModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-[#0f1729] border border-cyan-400/40 rounded-lg w-full max-w-md p-6">
                <h2 className="text-xl font-semibold text-cyan-400 mb-4">
                  Add New User
                </h2>

                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={newUser.name}
                    onChange={(e) =>
                      setNewUser({ ...newUser, name: e.target.value })
                    }
                    className="w-full p-2 bg-[#1a2235] rounded border border-cyan-400/20 text-sm"
                  />

                  <input
                    type="email"
                    placeholder="Email"
                    value={newUser.email}
                    onChange={(e) =>
                      setNewUser({ ...newUser, email: e.target.value })
                    }
                    className="w-full p-2 bg-[#1a2235] rounded border border-cyan-400/20 text-sm"
                  />

                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      value={newUser.password}
                      onChange={(e) =>
                        setNewUser({
                          ...newUser,
                          password: e.target.value,
                        })
                      }
                      className="w-full p-2 bg-[#1a2235] rounded border border-cyan-400/20 text-sm"
                    />

                    <button
                      className="absolute right-2 top-2 text-gray-400"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff /> : <Eye />}
                    </button>
                  </div>

                  <input
                    type="password"
                    placeholder="Confirm password"
                    value={newUser.confirmPassword}
                    onChange={(e) =>
                      setNewUser({
                        ...newUser,
                        confirmPassword: e.target.value,
                      })
                    }
                    className="w-full p-2 bg-[#1a2235] rounded border border-cyan-400/20 text-sm"
                  />

                  <select
                    value={newUser.role}
                    onChange={(e) =>
                      setNewUser({
                        ...newUser,
                        role: e.target.value as any,
                      })
                    }
                    className="w-full p-2 bg-[#1a2235] rounded border border-cyan-400/20 text-sm"
                  >
                    {roles.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>

                  {/* NEW: jobRole dropdown with description */}
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">
                      Job Role — pilih peran pekerjaan pengguna (opsional)
                    </label>
                    <select
                      value={newUser.jobRole}
                      onChange={(e) =>
                        setNewUser({ ...newUser, jobRole: e.target.value })
                      }
                      className="w-full p-2 bg-[#1a2235] rounded border border-cyan-400/20 text-sm"
                    >
                      <option value="">-- Select job role (optional) --</option>
                      {jobRoles.map((jr) => (
                        <option key={jr} value={jr}>
                          {jr}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 bg-red-500/20 border border-red-500/30 rounded text-red-300 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddUser}
                    className="px-4 py-2 bg-cyan-500 text-white rounded text-sm"
                  >
                    Add User
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* EDIT USER MODAL */}
          {showEditModal && selectedUser && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-[#0f1729] border border-cyan-400/40 rounded-lg w-full max-w-md p-6">
                <h2 className="text-xl font-semibold text-cyan-400 mb-4">
                  Edit User
                </h2>

                <div className="space-y-3">
                  <input
                    type="text"
                    value={selectedUser.name}
                    onChange={(e) =>
                      setSelectedUser({
                        ...selectedUser,
                        name: e.target.value,
                      })
                    }
                    className="w-full p-2 bg-[#1a2235] rounded border border-cyan-400/20 text-sm"
                  />

                  <input
                    type="email"
                    value={selectedUser.email}
                    onChange={(e) =>
                      setSelectedUser({
                        ...selectedUser,
                        email: e.target.value,
                      })
                    }
                    className="w-full p-2 bg-[#1a2235] rounded border border-cyan-400/20 text-sm"
                  />

                  <select
                    value={selectedUser.role}
                    onChange={(e) =>
                      setSelectedUser({
                        ...selectedUser,
                        role: e.target.value as any,
                      })
                    }
                    className="w-full p-2 bg-[#1a2235] rounded border border-cyan-400/20 text-sm"
                  >
                    {roles.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>

                  {/* NEW: jobRole dropdown with description */}
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">
                      Job Role — pilih peran pekerjaan pengguna (opsional)
                    </label>
                    <select
                      value={(selectedUser as any).jobRole || ""}
                      onChange={(e) =>
                        setSelectedUser({
                          ...(selectedUser as User),
                          jobRole: e.target.value,
                        } as User)
                      }
                      className="w-full p-2 bg-[#1a2235] rounded border border-cyan-400/20 text-sm"
                    >
                      <option value="">-- Select job role (optional) --</option>
                      {jobRoles.map((jr) => (
                        <option key={jr} value={jr}>
                          {jr}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedUser(null);
                    }}
                    className="px-4 py-2 bg-red-500/20 border border-red-500/30 rounded text-red-300 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEditUser}
                    className="px-4 py-2 bg-yellow-500 text-white rounded text-sm"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </ProtectedPage>
  );
}