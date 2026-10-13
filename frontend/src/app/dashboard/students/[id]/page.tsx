"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ArrowLeft, Pencil, GraduationCap, MapPin, Calendar, Droplets } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/data-display/StatusBadge";
import { LoadingSkeleton } from "@/components/data-display/LoadingSkeleton";
import { ErrorState } from "@/components/data-display/ErrorState";
import { PageHeader } from "@/components/layout/PageHeader";
import api from "@/lib/api";
import type { Student } from "@/types/academic";

export default function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const { data: student, isLoading, isError, refetch } = useQuery({
    queryKey: ["student", id],
    queryFn: async () => {
      const res = await api.get<{ data: Student }>(`/students/${id}`);
      return res.data.data;
    },
  });

  if (isLoading) return <LoadingSkeleton rows={6} />;
  if (isError) return <ErrorState onRetry={refetch} />;
  if (!student) return null;

  const fullName = [student.first_name, student.middle_name, student.last_name].filter(Boolean).join(" ");

  return (
    <div>
      <PageHeader
        title={fullName}
        description={`Admission No: ${student.admission_number}`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />Back
            </Button>
            <Button onClick={() => router.push(`/dashboard/students/${id}/edit`)}>
              <Pencil className="mr-2 h-4 w-4" />Edit
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Profile card */}
        <Card>
          <CardContent className="pt-6 flex flex-col items-center text-center gap-3">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                {student.first_name[0]}{student.last_name[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-lg">{fullName}</p>
              <p className="text-sm text-muted-foreground">{student.admission_number}</p>
            </div>
            <StatusBadge status={student.status} />
            <div className="w-full pt-2 space-y-2 text-sm text-left">
              {student.gender && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gender</span>
                  <span className="capitalize font-medium">{student.gender}</span>
                </div>
              )}
              {student.date_of_birth && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date of Birth</span>
                  <span className="font-medium">{student.date_of_birth}</span>
                </div>
              )}
              {student.blood_group && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Blood Group</span>
                  <span className="font-medium text-red-600">{student.blood_group}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Transport</span>
                <span className="font-medium">{student.transport_required ? "Yes" : "No"}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Academic + Address */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><GraduationCap className="h-4 w-4" />Academic Details</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              {[
                ["Admission Date", student.admission_date ?? "—"],
                ["Roll Number", student.roll_number ?? "—"],
                ["Category", (student as Student & { category?: string }).category ?? "—"],
                ["Religion", (student as Student & { religion?: string }).religion ?? "—"],
                ["Nationality", (student as Student & { nationality?: string }).nationality ?? "—"],
                ["Previous School", (student as Student & { previous_school?: string }).previous_school ?? "—"],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="font-medium">{value}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {(student.address || student.city) && (
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><MapPin className="h-4 w-4" />Address</CardTitle></CardHeader>
              <CardContent className="text-sm">
                <p>{[
                  (student as Student & { address?: string }).address,
                  student.city,
                  student.state,
                  (student as Student & { pincode?: string }).pincode,
                ].filter(Boolean).join(", ")}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
