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
  User,
} from "lucide-react";

interface User {
  id: string;
  email: string;
  name: string;
  role: "VIEWER" | "USER" | "ADMIN" | "SUPERADMIN";
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

  const [newUser, setNewUser] = useState<NewUser>({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    role: "VIEWER",
  });

  const roles = ["VIEWER", "USER", "ADMIN", "SUPERADMIN"];
  const roleColors = {
    VIEWER: "bg-gray-500/20 text-gray-300 border-gray-500/30",
    USER: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    ADMIN: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    SUPERADMIN: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  };

  // const API_BASE = "http://localhost:3001/api";
  const API_URL = process.env.NEXT_PUBLIC_API_URL; //http://localhost:3001

  // Fetch users
  useEffect(() => {
    fetchUsers();
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
      setError("Failed to fetch users");
      // Mock data for demo
      const mockUsers: User[] = [
        {
          id: "1",
          email: "budi.s@example.com",
          name: "Budi Santoso",
          role: "ADMIN",
          lastLoginAt: "2025-01-15T08:30:00Z",
          lastLoginIp: "192.168.1.100",
          createdAt: "2025-01-01T00:00:00Z",
        },
        {
          id: "2",
          email: "citra.l@example.com",
          name: "Citra Lestari",
          role: "USER",
          lastLoginAt: "2025-01-14T15:20:00Z",
          lastLoginIp: "192.168.1.101",
          createdAt: "2025-01-02T00:00:00Z",
        },
        {
          id: "3",
          email: "eko.p@example.com",
          name: "Eko Prasetyo",
          role: "VIEWER",
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
        }),
      });

      if (!res.ok) throw new Error("Failed to create user");

      setSuccess("User created successfully!");
      setTimeout(() => {
        setShowAddModal(false);
        setNewUser({
          email: "",
          password: "",
          confirmPassword: "",
          name: "",
          role: "VIEWER",
        });
        fetchUsers();
      }, 1500);
    } catch (err) {
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
        }),
      });

      if (!res.ok) throw new Error("Failed to update user");

      setSuccess("User updated successfully!");
      setTimeout(() => {
        setShowEditModal(false);
        setSelectedUser(null);
        fetchUsers();
      }, 1500);
    } catch (err) {
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
    } catch (err) {
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

          {/* Users Table */}
          <div className="bg-[#0f1729] border border-cyan-400/30 rounded-lg overflow-hidden">
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
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-2 h-2 rounded-full ${
                                user.lastLoginAt
                                  ? "bg-green-400"
                                  : "bg-gray-600"
                              }`}
                            />
                            <span className="text-sm text-gray-400">
                              {user.lastLoginAt ? "Active" : "Inactive"}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-400">
                            {formatDate(user.lastLoginAt)}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowEditModal(true);
                            }}
                            className="text-cyan-400 hover:text-cyan-300 text-sm transition-all mr-3"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-400 hover:text-red-300 text-sm transition-all"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            <div className="px-4 py-3 border-t border-cyan-400/20 flex items-center justify-between">
              <span className="text-xs text-gray-500">Page 1 of 1</span>
              <div className="flex gap-2">
                <button className="px-3 py-1 text-xs bg-[#1a2235] text-gray-500 rounded border border-cyan-400/20 cursor-not-allowed">
                  ← Previous
                </button>
                <button className="px-3 py-1 text-xs bg-[#1a2235] text-gray-500 rounded border border-cyan-400/20 cursor-not-allowed">
                  Next →
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-gray-600 py-2">
            © {new Date().getFullYear()} Fleet Management Dashboard
          </p>
        </div>
      </main>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#0f1729] border border-cyan-400/30 rounded-lg shadow-[0_0_20px_#00FFFF20] max-w-md w-full">
            <div className="px-6 py-4 border-b border-cyan-400/20 flex items-center justify-between">
              <h2 className="text-lg font-bold text-cyan-400">Add New User</h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewUser({
                    email: "",
                    password: "",
                    confirmPassword: "",
                    name: "",
                    role: "VIEWER",
                  });
                  setError("");
                }}
                className="text-gray-400 hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., John Doe"
                  value={newUser.name}
                  onChange={(e) =>
                    setNewUser({ ...newUser, name: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[#1a2235] border border-cyan-400/20 rounded text-gray-200 text-sm placeholder-gray-600 focus:outline-none focus:border-cyan-400/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="Enter valid email"
                  value={newUser.email}
                  onChange={(e) =>
                    setNewUser({ ...newUser, email: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[#1a2235] border border-cyan-400/20 rounded text-gray-200 text-sm placeholder-gray-600 focus:outline-none focus:border-cyan-400/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2">
                  Role
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) =>
                    setNewUser({
                      ...newUser,
                      role: e.target.value as any,
                    })
                  }
                  className="w-full px-3 py-2 bg-[#1a2235] border border-cyan-400/20 rounded text-gray-200 text-sm focus:outline-none focus:border-cyan-400/50"
                >
                  {roles.map((role) => (
                    <option key={role} value={role} className="bg-[#1a2235]">
                      {role}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter strong password"
                    value={newUser.password}
                    onChange={(e) =>
                      setNewUser({ ...newUser, password: e.target.value })
                    }
                    className="w-full px-3 py-2 pr-10 bg-[#1a2235] border border-cyan-400/20 rounded text-gray-200 text-sm placeholder-gray-600 focus:outline-none focus:border-cyan-400/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-400"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2">
                  Confirm Password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Re-enter password"
                  value={newUser.confirmPassword}
                  onChange={(e) =>
                    setNewUser({
                      ...newUser,
                      confirmPassword: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-[#1a2235] border border-cyan-400/20 rounded text-gray-200 text-sm placeholder-gray-600 focus:outline-none focus:border-cyan-400/50"
                />
                {newUser.password !== newUser.confirmPassword &&
                  newUser.confirmPassword && (
                    <p className="text-red-400 text-xs mt-1">
                      Passwords do not match
                    </p>
                  )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-cyan-400/20 flex gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewUser({
                    email: "",
                    password: "",
                    confirmPassword: "",
                    name: "",
                    role: "VIEWER",
                  });
                  setError("");
                }}
                className="flex-1 px-4 py-2 bg-[#1a2235] hover:bg-[#222d42] text-gray-300 rounded text-sm font-medium transition-all border border-cyan-400/20"
              >
                Cancel
              </button>
              <button
                onClick={handleAddUser}
                className="flex-1 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded text-sm font-medium transition-all shadow-[0_0_10px_#00FFFF40] hover:shadow-[0_0_15px_#00FFFF60]"
              >
                Save User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#0f1729] border border-cyan-400/30 rounded-lg shadow-[0_0_20px_#00FFFF20] max-w-md w-full">
            <div className="px-6 py-4 border-b border-cyan-400/20 flex items-center justify-between">
              <h2 className="text-lg font-bold text-cyan-400">Edit User</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedUser(null);
                  setError("");
                }}
                className="text-gray-400 hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={selectedUser.name}
                  onChange={(e) =>
                    setSelectedUser({ ...selectedUser, name: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[#1a2235] border border-cyan-400/20 rounded text-gray-200 text-sm focus:outline-none focus:border-cyan-400/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={selectedUser.email}
                  onChange={(e) =>
                    setSelectedUser({ ...selectedUser, email: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[#1a2235] border border-cyan-400/20 rounded text-gray-200 text-sm focus:outline-none focus:border-cyan-400/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2">
                  Role
                </label>
                <select
                  value={selectedUser.role}
                  onChange={(e) =>
                    setSelectedUser({
                      ...selectedUser,
                      role: e.target.value as any,
                    })
                  }
                  className="w-full px-3 py-2 bg-[#1a2235] border border-cyan-400/20 rounded text-gray-200 text-sm focus:outline-none focus:border-cyan-400/50"
                >
                  {roles.map((role) => (
                    <option key={role} value={role} className="bg-[#1a2235]">
                      {role}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-cyan-400/20 flex gap-3">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedUser(null);
                  setError("");
                }}
                className="flex-1 px-4 py-2 bg-[#1a2235] hover:bg-[#222d42] text-gray-300 rounded text-sm font-medium transition-all border border-cyan-400/20"
              >
                Cancel
              </button>
              <button
                onClick={handleEditUser}
                className="flex-1 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded text-sm font-medium transition-all shadow-[0_0_10px_#00FFFF40] hover:shadow-[0_0_15px_#00FFFF60]"
              >
                Update User
              </button>
            </div>
          </div>
        </div>
      )}
    </ProtectedPage>
  );
}