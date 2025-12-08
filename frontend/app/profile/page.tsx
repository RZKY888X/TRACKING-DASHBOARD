"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { ProtectedPage } from "@/components/ProtectedPage";
import {
  User,
  Mail,
  Shield,
  Calendar,
  MapPin,
  Briefcase,
  Camera,
  Save,
  X,
  Eye,
  EyeOff,
  Check,
  Lock,
} from "lucide-react";

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: "VIEWER" | "USER" | "ADMIN" | "SUPERADMIN";
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt?: string | null; // ★ penting: kamu pakai updatedAt di PART 2
  profileImage: string | null;
  jobRole: string | null;
}

interface ProfileFormData {
  name: string;
  email: string;
  jobRole: string;
  profileImage: string;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Edit mode states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Form data
  const [profileForm, setProfileForm] = useState<ProfileFormData>({
    name: "",
    email: "",
    jobRole: "",
    profileImage: "",
  });

  const [passwordForm, setPasswordForm] = useState<PasswordFormData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Password visibility
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const roleColors = {
    VIEWER: "bg-gray-500/20 text-gray-300 border-gray-500/30",
    USER: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    ADMIN: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    SUPERADMIN: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  };

  // Fetch profile
  useEffect(() => {
    fetchProfile();
  }, [session?.accessToken]);

  const fetchProfile = async () => {
    if (!session?.accessToken) return;

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });

      if (!res.ok) throw new Error("Failed to fetch profile");

      const data = await res.json();
      setProfile(data);

      setProfileForm({
        name: data.name || "",
        email: data.email || "",
        jobRole: data.jobRole || "",
        profileImage: data.profileImage || "",
      });
    } catch (err) {
      setError("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    setError("");
    setSuccess("");

    if (!profileForm.name || !profileForm.email) {
      setError("Name and email are required");
      return;
    }

    try {
      setSaving(true);
      const res = await fetch(`${API_URL}/api/auth/profile`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: profileForm.name,
          email: profileForm.email,
          jobRole: profileForm.jobRole || null,
          profileImage: profileForm.profileImage || null,
        }),
      });

      if (!res.ok) throw new Error("Failed to update profile");

      const updatedUser = await res.json();
      setProfile(updatedUser.user || updatedUser);

      setSuccess("Profile updated successfully!");
      setIsEditingProfile(false);

      if (session) {
        await update({
          ...session,
          user: {
            ...session.user,
            name: profileForm.name,
            email: profileForm.email,
          },
        });
      }

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setError("");
    setSuccess("");

    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      setError("Current password and new password are required");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setError("New password must be at least 8 characters");
      return;
    }

    try {
      setSaving(true);
      const res = await fetch(`${API_URL}/api/auth/change-password`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to change password");
      }

      setSuccess("Password changed successfully!");
      setIsChangingPassword(false);

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  // ================= RENDER UI ======================

  return (
    <ProtectedPage>
      <main className="min-h-screen bg-[#0b1220] text-gray-200 p-6">
        <div className="max-w-4xl mx-auto">
          {/* HEADER */}
          <h1 className="text-xl font-semibold text-cyan-400 mb-6">
            My Profile
          </h1>

          {error && (
            <p className="mb-4 text-red-400 bg-red-400/10 border border-red-400/20 px-3 py-2 rounded text-sm">
              {error}
            </p>
          )}
          {success && (
            <p className="mb-4 text-green-400 bg-green-400/10 border border-green-400/20 px-3 py-2 rounded text-sm">
              {success}
            </p>
          )}

          {/* PROFILE CARD */}
          <div className="bg-[#0f1729] border border-cyan-400/30 rounded-lg p-6 mb-6">
            <div className="flex items-center gap-4">
              {profile?.profileImage ? (
                <img
                  src={profile.profileImage}
                  className="w-20 h-20 rounded-full object-cover border border-cyan-400/40"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-2xl font-bold text-cyan-300">
                  {getInitials(profile?.name || "")}
                </div>
              )}

              <div>
                <p className="text-lg font-semibold">{profile?.name}</p>
                <p className="text-sm text-gray-400">{profile?.email}</p>
                <span
                  className={`inline-block mt-2 px-2 py-1 rounded text-xs border ${profile ? roleColors[profile.role] : ""
                    }`}
                >
                  {profile?.role}
                </span>
              </div>
            </div>

            <div className="mt-6">
              {!isEditingProfile ? (
                <button
                  onClick={() => setIsEditingProfile(true)}
                  className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded border border-cyan-400/30 text-sm"
                >
                  Edit Profile
                </button>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setIsEditingProfile(false);
                      setProfileForm({
                        name: profile?.name || "",
                        email: profile?.email || "",
                        jobRole: profile?.jobRole || "",
                        profileImage: profile?.profileImage || "",
                      });
                    }}
                    className="px-4 py-2 bg-gray-700 text-gray-300 rounded text-sm border border-gray-500"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateProfile}
                    disabled={saving}
                    className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded text-sm shadow disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              )}
            </div>

            {isEditingProfile && (
              <div className="mt-6 space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    Full Name
                  </label>
                  <input
                    value={profileForm.name}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, name: e.target.value })
                    }
                    className="w-full bg-[#1a2235] border border-cyan-400/20 px-3 py-2 rounded text-sm"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    Email
                  </label>
                  <input
                    value={profileForm.email}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, email: e.target.value })
                    }
                    className="w-full bg-[#1a2235] border border-cyan-400/20 px-3 py-2 rounded text-sm"
                  />
                </div>

                {/* Job Role */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    Job Role
                  </label>
                  <input
                    value={profileForm.jobRole}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        jobRole: e.target.value,
                      })
                    }
                    className="w-full bg-[#1a2235] border border-cyan-400/20 px-3 py-2 rounded text-sm"
                  />
                </div>
              </div>
            )}
          </div>

          {/* SECURITY CARD */}
          <div className="bg-[#0f1729] border border-cyan-400/30 rounded-lg">
            <div className="px-4 py-3 border-b border-cyan-400/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-cyan-400" />
                <h2 className="text-sm font-semibold text-cyan-400">
                  Security
                </h2>
              </div>

              {!isChangingPassword ? (
                <button
                  onClick={() => setIsChangingPassword(true)}
                  className="px-3 py-1.5 bg-cyan-500/20 text-cyan-400 border border-cyan-400/30 rounded text-xs"
                >
                  Change Password
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setIsChangingPassword(false);
                      setPasswordForm({
                        currentPassword: "",
                        newPassword: "",
                        confirmPassword: "",
                      });
                      setError("");
                    }}
                    className="px-3 py-1.5 bg-[#1a2235] text-gray-300 border border-cyan-400/20 rounded text-xs"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handleChangePassword}
                    disabled={saving}
                    className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded text-xs"
                  >
                    {saving ? "Saving..." : "Update Password"}
                  </button>
                </div>
              )}
            </div>

            <div className="p-6">
              {!isChangingPassword ? (
                <div className="text-center py-8">
                  <Lock className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">
                    Keep your account secure by updating your password
                    regularly.
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Last changed:{" "}
                    {formatDate(
                      profile?.updatedAt || profile?.createdAt || null
                    )}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* CURRENT PASSWORD */}
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? "text" : "password"}
                        value={passwordForm.currentPassword}
                        onChange={(e) =>
                          setPasswordForm({
                            ...passwordForm,
                            currentPassword: e.target.value,
                          })
                        }
                        className="w-full bg-[#1a2235] border border-cyan-400/20 px-3 py-2 pr-10 rounded text-sm"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowCurrentPassword(!showCurrentPassword)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* NEW PASSWORD */}
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={passwordForm.newPassword}
                        onChange={(e) =>
                          setPasswordForm({
                            ...passwordForm,
                            newPassword: e.target.value,
                          })
                        }
                        className="w-full bg-[#1a2235] border border-cyan-400/20 px-3 py-2 pr-10 rounded text-sm"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowNewPassword(!showNewPassword)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                      >
                        {showNewPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    {passwordForm.newPassword &&
                      passwordForm.newPassword.length < 8 && (
                        <p className="text-red-400 text-xs mt-1">
                          Password must be at least 8 characters
                        </p>
                      )}
                  </div>

                  {/* CONFIRM PASSWORD */}
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={passwordForm.confirmPassword}
                        onChange={(e) =>
                          setPasswordForm({
                            ...passwordForm,
                            confirmPassword: e.target.value,
                          })
                        }
                        className="w-full bg-[#1a2235] border border-cyan-400/20 px-3 py-2 pr-10 rounded text-sm"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    {passwordForm.newPassword !==
                      passwordForm.confirmPassword &&
                      passwordForm.confirmPassword && (
                        <p className="text-red-400 text-xs mt-1">
                          Passwords do not match
                        </p>
                      )}
                  </div>

                  {/* REQUIREMENT INDICATOR */}
                  <div className="bg-[#1a2235] border border-cyan-400/10 rounded p-3">
                    <p className="text-xs text-gray-400 mb-1">
                      Password Requirements:
                    </p>
                    <ul className="text-xs text-gray-500 space-y-1">
                      <li className="flex items-center gap-2">
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${
                            passwordForm.newPassword.length >= 8
                              ? "bg-green-400"
                              : "bg-gray-600"
                          }`}
                        />
                        Minimum 8 characters
                      </li>

                      <li className="flex items-center gap-2">
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${
                            passwordForm.newPassword ===
                              passwordForm.confirmPassword &&
                            passwordForm.confirmPassword
                              ? "bg-green-400"
                              : "bg-gray-600"
                          }`}
                        />
                        Passwords match
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ACCOUNT INFO */}
          <div className="bg-[#0f1729] border border-cyan-400/30 rounded-lg p-6 mt-6">
            <h3 className="text-sm text-cyan-400 mb-4 font-semibold">
              Account Information
            </h3>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500 text-xs mb-1">Account ID</p>
                <p className="text-gray-300 font-mono text-xs">{profile?.id}</p>
              </div>

              <div>
                <p className="text-gray-500 text-xs mb-1">Member Since</p>
                <p className="text-gray-300">
                  {formatDate(profile?.createdAt || null)}
                </p>
              </div>

              <div>
                <p className="text-gray-500 text-xs mb-1">Last Updated</p>
                <p className="text-gray-300">
                  {formatDate(profile?.updatedAt || profile?.createdAt || null)}
                </p>
              </div>

              <div>
                <p className="text-gray-500 text-xs mb-1">Access Level</p>
                <p className="text-gray-300">{profile?.role}</p>
              </div>
            </div>
          </div>

          {/* FOOTER */}
          <p className="text-center text-xs text-gray-600 py-4 mt-6">
            © {new Date().getFullYear()} Fleet Management Dashboard
          </p>
        </div>
      </main>
    </ProtectedPage>
  );
}
