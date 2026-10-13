"use client";

import { use } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/PageHeader";
import { LoadingSkeleton } from "@/components/data-display/LoadingSkeleton";
import { FormSection, FieldWrapper } from "@/components/forms/FormSection";
import api from "@/lib/api";
import type { Class, Section, Student } from "@/types/academic";
import type { ApiResponse } from "@/types/common";

const schema = z.object({
  first_name: z.string().min(1, "Required"),
  last_name: z.string().min(1, "Required"),
  middle_name: z.string().optional(),
  class_id: z.string().optional(),
  section_id: z.string().optional(),
  date_of_birth: z.string().optional(),
  gender: z.string().optional(),
  blood_group: z.string().optional(),
  roll_number: z.string().optional(),
  transport_required: z.boolean().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  status: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function EditStudentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const { data: student, isLoading } = useQuery({
    queryKey: ["student", id],
    queryFn: async () => (await api.get<{ data: Student }>(`/students/${id}`)).data.data,
  });

  const { data: classes } = useQuery({
    queryKey: ["classes"],
    queryFn: async () => (await api.get<ApiResponse<Class[]>>("/academics/classes")).data.data,
  });

  const { data: sections } = useQuery({
    queryKey: ["sections"],
    queryFn: async () => (await api.get<ApiResponse<Section[]>>("/academics/sections")).data.data,
  });

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    values: student
      ? {
          first_name: student.first_name,
          last_name: student.last_name,
          middle_name: student.middle_name ?? "",
          class_id: student.class_id,
          section_id: student.section_id,
          date_of_birth: student.date_of_birth ?? "",
          gender: student.gender ?? "",
          blood_group: student.blood_group ?? "",
          roll_number: student.roll_number ?? "",
          transport_required: student.transport_required,
          address: (student as Student & { address?: string }).address ?? "",
          city: student.city ?? "",
          state: student.state ?? "",
          pincode: (student as Student & { pincode?: string }).pincode ?? "",
          status: student.status,
        }
      : undefined,
  });

  const selectedClass = watch("class_id");
  const filteredSections = (sections ?? []).filter(
    (s) => !selectedClass || s.class_id === selectedClass
  );

  const updateMutation = useMutation({
    mutationFn: async (d: FormData) => {
      await api.patch(`/students/${id}`, d);
    },
    onSuccess: () => router.push(`/dashboard/students/${id}`),
  });

  const onSubmit: SubmitHandler<FormData> = (d) => updateMutation.mutate(d);

  if (isLoading) return <LoadingSkeleton rows={6} />;

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Edit Student"
        description={student ? `${student.first_name} ${student.last_name} · ${student.admission_number}` : ""}
        actions={
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />Back
          </Button>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Personal Information</CardTitle></CardHeader>
          <CardContent>
            <FormSection title="">
              <FieldWrapper label="First Name" error={errors.first_name?.message} required>
                <Input {...register("first_name")} />
              </FieldWrapper>
              <FieldWrapper label="Middle Name">
                <Input {...register("middle_name")} />
              </FieldWrapper>
              <FieldWrapper label="Last Name" error={errors.last_name?.message} required>
                <Input {...register("last_name")} />
              </FieldWrapper>
              <FieldWrapper label="Date of Birth">
                <Input type="date" {...register("date_of_birth")} />
              </FieldWrapper>
              <FieldWrapper label="Gender">
                <select {...register("gender")} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </FieldWrapper>
              <FieldWrapper label="Blood Group">
                <select {...register("blood_group")} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                  <option value="">Select</option>
                  {["A+","A-","B+","B-","O+","O-","AB+","AB-"].map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </FieldWrapper>
            </FormSection>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Academic Details</CardTitle></CardHeader>
          <CardContent>
            <FormSection title="">
              <FieldWrapper label="Class">
                <select {...register("class_id")} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                  <option value="">Select class</option>
                  {(classes ?? []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </FieldWrapper>
              <FieldWrapper label="Section">
                <select {...register("section_id")} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                  <option value="">Select section</option>
                  {filteredSections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </FieldWrapper>
              <FieldWrapper label="Roll Number">
                <Input {...register("roll_number")} />
              </FieldWrapper>
              <FieldWrapper label="Status">
                <select {...register("status")} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="transferred">Transferred</option>
                  <option value="graduated">Graduated</option>
                </select>
              </FieldWrapper>
            </FormSection>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Address</CardTitle></CardHeader>
          <CardContent>
            <FormSection title="">
              <FieldWrapper label="Address" className="col-span-2">
                <Input {...register("address")} />
              </FieldWrapper>
              <FieldWrapper label="City"><Input {...register("city")} /></FieldWrapper>
              <FieldWrapper label="State"><Input {...register("state")} /></FieldWrapper>
              <FieldWrapper label="PIN Code"><Input {...register("pincode")} /></FieldWrapper>
              <FieldWrapper label="Transport Required">
                <div className="flex items-center gap-2 h-9">
                  <input type="checkbox" {...register("transport_required")} id="transport_edit" className="h-4 w-4" />
                  <label htmlFor="transport_edit" className="text-sm">Requires school transport</label>
                </div>
              </FieldWrapper>
            </FormSection>
          </CardContent>
        </Card>

        {updateMutation.isError && (
          <p className="text-sm text-destructive">
            {(updateMutation.error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Update failed"}
          </p>
        )}

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
