"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Info, X } from "lucide-react";
import api from "@/lib/api";
import type { ApiResponse } from "@/types/common";
import { useAuthStore } from "@/store/authStore";

interface SubscriptionStatus {
  subscription: {
    status: string;
    end_date: string | null;
    days_remaining: number | null;
    is_expired: boolean;
    plan_name: string | null;
  } | null;
  students: { current: number; max: number; percentage: number } | null;
  teachers: { current: number; max: number; percentage: number } | null;
}

export function SubscriptionBanner() {
  const { user } = useAuthStore();
  const [dismissed, setDismissed] = useState<string[]>([]);

  const { data } = useQuery({
    queryKey: ["subscription-status"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<SubscriptionStatus>>("/settings/subscription-status");
      return res.data.data;
    },
    // Only fetch for school users, not super admins
    enabled: !!user && user.user_type !== "super_admin",
    staleTime: 5 * 60 * 1000,
  });

  if (!data?.subscription) return null;

  const { subscription, students, teachers } = data;

  type BannerItem = { id: string; level: "error" | "warning" | "info"; message: string };
  const banners: BannerItem[] = [];

  if (subscription.is_expired) {
    banners.push({
      id: "expired",
      level: "error",
      message: "Your subscription has expired. Contact your administrator to renew.",
    });
  } else if (subscription.days_remaining !== null && subscription.days_remaining <= 7) {
    banners.push({
      id: "expiring",
      level: "warning",
      message: `Your subscription expires in ${subscription.days_remaining} day${subscription.days_remaining === 1 ? "" : "s"}.`,
    });
  }

  if (students && students.max > 0 && students.percentage >= 90) {
    banners.push({
      id: "students-limit",
      level: "info",
      message: `You are at ${students.percentage}% of your student limit (${students.current}/${students.max}).`,
    });
  }

  if (teachers && teachers.max > 0 && teachers.percentage >= 90) {
    banners.push({
      id: "teachers-limit",
      level: "info",
      message: `You are at ${teachers.percentage}% of your teacher limit (${teachers.current}/${teachers.max}).`,
    });
  }

  const visible = banners.filter((b) => !dismissed.includes(b.id));
  if (visible.length === 0) return null;

  const colorMap = {
    error: "bg-red-50 border-red-200 text-red-800",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
    info: "bg-blue-50 border-blue-200 text-blue-800",
  };

  const iconMap = {
    error: <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />,
    warning: <AlertTriangle className="h-4 w-4 shrink-0 text-yellow-500" />,
    info: <Info className="h-4 w-4 shrink-0 text-blue-500" />,
  };

  return (
    <div className="flex flex-col gap-1">
      {visible.map((banner) => (
        <div
          key={banner.id}
          className={`flex items-center gap-3 px-4 py-2.5 text-sm border-b ${colorMap[banner.level]}`}
        >
          {iconMap[banner.level]}
          <span className="flex-1">{banner.message}</span>
          <button
            onClick={() => setDismissed((d) => [...d, banner.id])}
            className="ml-auto opacity-60 hover:opacity-100 transition-opacity"
            aria-label="Dismiss"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
