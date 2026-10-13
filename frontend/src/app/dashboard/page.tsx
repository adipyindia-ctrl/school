"use client";

import { useQuery } from "@tanstack/react-query";
import {
  GraduationCap,
  UserCheck,
  Users,
  CalendarCheck,
  DollarSign,
  TrendingUp,
  Bell,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSkeleton } from "@/components/data-display/LoadingSkeleton";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";

interface DashboardStats {
  total_students: number;
  total_teachers: number;
  total_staff: number;
  today_attendance_pct: number;
  pending_fees: number;
  fees_collected: number;
  upcoming_events: number;
  recent_notices: number;
}

function StatCard({
  title,
  value,
  icon: Icon,
  color = "text-blue-600",
  bg = "bg-blue-50",
  format = "number",
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  color?: string;
  bg?: string;
  format?: "number" | "percent" | "currency";
}) {
  const displayValue =
    format === "percent"
      ? `${value.toFixed(1)}%`
      : format === "currency"
      ? `₹${value.toLocaleString()}`
      : value.toLocaleString();

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{displayValue}</p>
          </div>
          <div className={`h-11 w-11 rounded-xl ${bg} flex items-center justify-center`}>
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const res = await api.get<{ data: DashboardStats }>("/dashboard/stats");
      return res.data.data;
    },
    // Refresh every 2 minutes so attendance / fees stay current
    refetchInterval: 2 * 60 * 1000,
  });

  const s: DashboardStats = stats ?? {
    total_students: 0,
    total_teachers: 0,
    total_staff: 0,
    today_attendance_pct: 0,
    pending_fees: 0,
    fees_collected: 0,
    upcoming_events: 0,
    recent_notices: 0,
  };

  if (isLoading) {
    return (
      <div>
        <PageHeader title={`Welcome, ${user?.first_name ?? "Admin"}`} description="Loading dashboard..." />
        <LoadingSkeleton rows={2} cols={4} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={`Welcome, ${user?.first_name ?? "Admin"}`}
        description="Here's what's happening at your school today."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Students" value={s.total_students} icon={GraduationCap} color="text-indigo-600" bg="bg-indigo-50" />
        <StatCard title="Total Teachers" value={s.total_teachers} icon={UserCheck} color="text-green-600" bg="bg-green-50" />
        <StatCard title="Today's Attendance" value={s.today_attendance_pct} icon={CalendarCheck} color="text-blue-600" bg="bg-blue-50" format="percent" />
        <StatCard title="Pending Fees" value={s.pending_fees} icon={AlertCircle} color="text-red-600" bg="bg-red-50" format="currency" />
        <StatCard title="Fees Collected" value={s.fees_collected} icon={DollarSign} color="text-emerald-600" bg="bg-emerald-50" format="currency" />
        <StatCard title="Total Staff" value={s.total_staff} icon={Users} color="text-purple-600" bg="bg-purple-50" />
        <StatCard title="Upcoming Events" value={s.upcoming_events} icon={TrendingUp} color="text-orange-600" bg="bg-orange-50" />
        <StatCard title="Notices" value={s.recent_notices} icon={Bell} color="text-teal-600" bg="bg-teal-50" />
      </div>

      {/* Placeholder charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Attendance Trend</CardTitle></CardHeader>
          <CardContent className="h-48 flex items-center justify-center text-sm text-muted-foreground">
            Attendance chart will appear here once data is available.
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Fee Collection</CardTitle></CardHeader>
          <CardContent className="h-48 flex items-center justify-center text-sm text-muted-foreground">
            Fee chart will appear here once data is available.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
