"use client";

import { useState, useEffect } from "react";
import {
  Shield,
  Users,
  Loader2,
  CheckCircle,
  Crown,
  BadgeCheck,
} from "lucide-react";
import toast from "react-hot-toast";
import { useLanguage } from "@/i18n";
import PageTransition from "@/components/animations/PageTransition";

interface AdminUser {
  id: string;
  clerkId: string;
  username: string;
  email: string;
  avatarUrl: string | null;
  country: string | null;
  role: string;
  verified: boolean;
  points: number;
  createdAt: string;
  _count: {
    ideas: number;
    contributions: number;
    challengeEntries: number;
    challengePanels: number;
  };
}

const ROLES = [
  { value: "USER", label: "User", color: "text-gray-400" },
  { value: "EXPERT_VOLUNTEER", label: "Expert (Volunteer)", color: "text-blue-400" },
  { value: "EXPERT_INSTITUTION", label: "Expert (Institution)", color: "text-purple-400" },
  { value: "NGO_VERIFIED", label: "NGO (Verified)", color: "text-green-400" },
  { value: "RESEARCH_VERIFIED", label: "Research (Verified)", color: "text-cyan-400" },
  { value: "MUNICIPALITY_VERIFIED", label: "Municipality (Verified)", color: "text-yellow-400" },
  { value: "ADMIN", label: "Admin", color: "text-accent-400" },
];

export default function AdminPage() {
  const { t } = useLanguage();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (res.status === 403) {
        setError("Access denied. Admin role required.");
        setLoading(false);
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      setUsers(data.users || []);
    } catch {
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const updateRole = async (userId: string, role: string) => {
    setUpdating(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role }),
      });
      if (!res.ok) throw new Error("Failed to update role");
      const data = await res.json();
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, role: data.user.role } : u
        )
      );
      toast.success(`Role updated to ${role}`);
    } catch {
      toast.error("Failed to update role");
    } finally {
      setUpdating(null);
    }
  };

  const toggleVerified = async (userId: string, verified: boolean) => {
    setUpdating(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, verified }),
      });
      if (!res.ok) throw new Error("Failed to update");
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, verified } : u))
      );
      toast.success(verified ? "User verified" : "Verification removed");
    } catch {
      toast.error("Failed to update verification");
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Admin Panel</h1>
        <p className="text-gray-400">{error}</p>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Shield className="w-8 h-8 text-accent-400" />
          <div>
            <h1 className="text-2xl font-bold">Admin Panel</h1>
            <p className="text-gray-400 text-sm">
              Manage user roles and permissions
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {ROLES.map((role) => {
            const count = users.filter((u) => u.role === role.value).length;
            return (
              <div key={role.value} className="card text-center">
                <p className={`text-2xl font-bold ${role.color}`}>{count}</p>
                <p className="text-xs text-gray-400 mt-1">{role.label}</p>
              </div>
            );
          })}
        </div>

        {/* Users Table */}
        <div className="card overflow-hidden p-0">
          <div className="px-6 py-4 border-b border-white/5 flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-400" />
            <span className="font-semibold">
              {users.length} user{users.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-gray-400">
                  <th className="text-left px-6 py-3 font-medium">User</th>
                  <th className="text-left px-6 py-3 font-medium hidden sm:table-cell">
                    Email
                  </th>
                  <th className="text-left px-6 py-3 font-medium">Role</th>
                  <th className="text-center px-6 py-3 font-medium hidden md:table-cell">
                    Points
                  </th>
                  <th className="text-center px-6 py-3 font-medium">
                    Verified
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                  >
                    {/* User */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {user.avatarUrl ? (
                          <img
                            src={user.avatarUrl}
                            alt=""
                            className="w-8 h-8 rounded-full"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-xs font-bold text-white">
                            {user.username[0]?.toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-white flex items-center gap-1">
                            {user.username}
                            {user.role === "ADMIN" && (
                              <Crown className="w-3.5 h-3.5 text-accent-400" />
                            )}
                          </p>
                          <p className="text-xs text-gray-500 sm:hidden">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-6 py-4 text-gray-400 hidden sm:table-cell">
                      {user.email}
                    </td>

                    {/* Role selector */}
                    <td className="px-6 py-4">
                      <select
                        value={user.role}
                        onChange={(e) => updateRole(user.id, e.target.value)}
                        disabled={updating === user.id}
                        className="bg-gray-800/50 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-primary-500/50 min-w-[130px]"
                      >
                        {ROLES.map((role) => (
                          <option key={role.value} value={role.value}>
                            {role.label}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Points */}
                    <td className="px-6 py-4 text-center text-gray-400 hidden md:table-cell">
                      {user.points}
                    </td>

                    {/* Verified toggle */}
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() =>
                          toggleVerified(user.id, !user.verified)
                        }
                        disabled={updating === user.id}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                          user.verified
                            ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                            : "bg-gray-800/50 text-gray-500 hover:bg-gray-700/50"
                        }`}
                      >
                        {user.verified ? (
                          <>
                            <BadgeCheck className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Yes</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">No</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
