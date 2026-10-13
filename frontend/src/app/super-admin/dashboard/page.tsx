"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  Users,
  GraduationCap,
  UserCheck,
  AlertTriangle,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSkeleton } from "@/components/data-display/LoadingSkeleton";
import { ErrorState } from "@/components/data-display/ErrorState";
import { PageHeader } from "@/components/layout/PageHeader";
import api from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

interface SchoolUsage {
  school_id: string;
  school_name: string;
  plan_name: string | null;
  subscription_status: string | null;
  end_date: string | null;
  student_count: number;
  max_students: number;
  teacher_count: number;
  max_teachers: number;
  student_usage_pct: number;
  teacher_usage_pct: number;
}

interface PlanBreakdown {
  plan_name: string;
  count: number;
}

interface PlatformStats {
  total_schools: number;
  active_schools: number;
  trial_schools: number;
  suspended_schools: number;
  total_users: number;
  total_teachers: number;
  total_students: number;
  plan_breakdown: PlanBreakdown[];
  schools_usage: SchoolUsage[];
}

// ── Helper components ─────────────────────────────────────────────────────────

function UsageBar({
  current,
  max,
  pct,
}: {
  current: number;
  max: number;
  pct: number;
}) {
  const clamped = Math.min(pct, 100);
  const color =
    pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-amber-500" : "bg-emerald-500";
  return (
    <div>
      <div className="flex justify-between text-xs text-muted-foreground mb-1">
        <span>
          {current.toLocaleString()} / {max.toLocaleString()}
        </span>
        <span>{Math.round(pct)}%</span>
      </div>
      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

function SubscriptionBadge({ status }: { status: string | null }) {
  const map: Record<string, { label: string; className: string }> = {
    active: { label: "Active", className: "bg-green-100 text-green-700" },
    trial: { label: "Trial", className: "bg-blue-100 text-blue-700" },
    expired: { label: "Expired", className: "bg-red-100 text-red-700" },
    cancelled: {
      label: "Cancelled",
      className: "bg-slate-100 text-slate-600",
    },
  };
  const s = status
    ? map[status] ?? { label: status, className: "bg-slate-100 text-slate-600" }
    : { label: "—", className: "bg-slate-100 text-slate-500" };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${s.className}`}
    >
      {s.label}
    </span>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  color = "text-blue-600",
  bg = "bg-blue-50",
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  color?: string;
  bg?: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-1">{value.toLocaleString()}</p>
          </div>
          <div
            className={`h-12 w-12 rounded-xl ${bg} flex items-center justify-center`}
          >
            <Icon className={`h-6 w-6 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SuperAdminDashboard() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["platform-stats"],
    queryFn: async () => {
      const res = await api.get<{ data: PlatformStats }>("/platform/dashboard");
      return res.data.data;
    },
  });

  return (
    <div>
      <PageHeader
        title="Platform Dashboard"
        description="Overview of all schools and platform activity"
      />

      {isLoading && <LoadingSkeleton type="card" rows={6} />}
      {isError && <ErrorState onRetry={refetch} />}

      {data && (
        <>
          {/* ── Summary stat cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Schools"
              value={data.total_schools}
              icon={Building2}
              color="text-blue-600"
              bg="bg-blue-50"
            />
            <StatCard
              title="Active Schools"
              value={data.active_schools}
              icon={UserCheck}
              color="text-green-600"
              bg="bg-green-50"
            />
            <StatCard
              title="Trial Schools"
              value={data.trial_schools}
              icon={TrendingUp}
              color="text-orange-600"
              bg="bg-orange-50"
            />
            <StatCard
              title="Suspended"
              value={data.suspended_schools}
              icon={AlertTriangle}
              color="text-red-600"
              bg="bg-red-50"
            />
            <StatCard
              title="Total Users"
              value={data.total_users}
              icon={Users}
              color="text-purple-600"
              bg="bg-purple-50"
            />
            <StatCard
              title="Total Teachers"
              value={data.total_teachers}
              icon={UserCheck}
              color="text-teal-600"
              bg="bg-teal-50"
            />
            <StatCard
              title="Total Students"
              value={data.total_students}
              icon={GraduationCap}
              color="text-indigo-600"
              bg="bg-indigo-50"
            />
          </div>

          {/* ── Plan distribution ── */}
          {data.plan_breakdown.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                Schools by Plan
              </h3>
              <div className="flex flex-wrap gap-3">
                {data.plan_breakdown.map((p) => (
                  <div
                    key={p.plan_name}
                    className="bg-white border rounded-lg px-4 py-2 flex items-center gap-2 shadow-sm"
                  >
                    <span className="font-semibold text-slate-800">
                      {p.plan_name}
                    </span>
                    <span className="bg-blue-100 text-blue-700 text-xs font-bold rounded-full px-2 py-0.5">
                      {p.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Per-school usage tracking widget ── */}
          {data.schools_usage.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-slate-500" />
                  School Usage vs. Plan Limits
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-slate-50 text-left text-xs text-muted-foreground uppercase tracking-wide">
                        <th className="px-4 py-3 font-medium">School</th>
                        <th className="px-4 py-3 font-medium">Plan</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 font-medium">Expires</th>
                        <th className="px-4 py-3 font-medium w-44">
                          Students
                        </th>
                        <th className="px-4 py-3 font-medium w-44">
                          Teachers
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.schools_usage.map((s, i) => (
                        <tr
                          key={s.school_id}
                          className={
                            i % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                          }
                        >
                          <td className="px-4 py-3 font-medium text-slate-800">
                            {s.school_name}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {s.plan_name ?? "—"}
                          </td>
                          <td className="px-4 py-3">
                            <SubscriptionBadge
                              status={s.subscription_status}
                            />
                          </td>
                          <td className="px-4 py-3 text-slate-500 text-xs">
                            {s.end_date
                              ? new Date(s.end_date).toLocaleDateString(
                                  "en-IN",
                                  {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  }
                                )
                              : "—"}
                          </td>
                          <td className="px-4 py-3">
                            <UsageBar
                              current={s.student_count}
                              max={s.max_students}
                              pct={s.student_usage_pct}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <UsageBar
                              current={s.teacher_count}
                              max={s.max_teachers}
                              pct={s.teacher_usage_pct}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
