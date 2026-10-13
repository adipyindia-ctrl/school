"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/PageHeader";
import { FormSection, FieldWrapper } from "@/components/forms/FormSection";
import api from "@/lib/api";
import type { AcademicSession, Class, Section } from "@/types/academic";
import type { ApiResponse } from "@/types/common";

const schema = z.object({
  first_name: z.string().min(1, "Required"),
  last_name: z.string().min(1, "Required"),
  middle_name: z.string().optional(),
  session_id: z.string().min(1, "Required"),
  class_id: z.string().min(1, "Required"),
  section_id: z.string().min(1, "Required"),
  admission_number: z.string().optional(),
  admission_date: z.string().optional(),
  date_of_birth: z.string().optional(),
  gender: z.string().optional(),
  blood_group: z.string().optional(),
  roll_number: z.string().optional(),
  category: z.string().optional(),
  religion: z.string().optional(),
  nationality: z.string().optional(),
  transport_required: z.boolean(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function NewStudentPage() {
  const router = useRouter();

  const { data: sessions } = useQuery({
    queryKey: ["sessions"],
    queryFn: async () => (await api.get<ApiResponse<AcademicSession[]>>("/academics/sessions")).data.data,
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
    defaultValues: { transport_required: false, nationality: "Indian" },
  });

  const selectedClass = watch("class_id");
  const filteredSections = (sections ?? []).filter(
    (s) => !selectedClass || s.class_id === selectedClass
  );

  const createMutation = useMutation({
    mutationFn: async (d: FormData) => {
      await api.post("/students", d);
    },
    onSuccess: () => router.push("/dashboard/students"),
  });

  const onSubmit: SubmitHandler<FormData> = (d) => createMutation.mutate(d);

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Add Student"
        actions={
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />Back
          </Button>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Personal Information */}
        <Card>
          <CardHeader><CardTitle className="text-base">Personal Information</CardTitle></CardHeader>
          <CardContent>
            <FormSection title="">
              <FieldWrapper label="First Name" error={errors.first_name?.message} required>
                <Input {...register("first_name")} placeholder="Aarav" />
              </FieldWrapper>
              <FieldWrapper label="Middle Name">
                <Input {...register("middle_name")} placeholder="(optional)" />
              </FieldWrapper>
              <FieldWrapper label="Last Name" error={errors.last_name?.message} required>
                <Input {...register("last_name")} placeholder="Sharma" />
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

        {/* Academic Information */}
        <Card>
          <CardHeader><CardTitle className="text-base">Academic Information</CardTitle></CardHeader>
          <CardContent>
            <FormSection title="">
              <FieldWrapper label="Academic Session" error={errors.session_id?.message} required>
                <select {...register("session_id")} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                  <option value="">Select session</option>
                  {(sessions ?? []).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </FieldWrapper>
              <FieldWrapper label="Class" error={errors.class_id?.message} required>
                <select {...register("class_id")} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                  <option value="">Select class</option>
                  {(classes ?? []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </FieldWrapper>
              <FieldWrapper label="Section" error={errors.section_id?.message} required>
                <select {...register("section_id")} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                  <option value="">Select section</option>
                  {filteredSections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </FieldWrapper>
              <FieldWrapper label="Roll Number">
                <Input {...register("roll_number")} placeholder="01" />
              </FieldWrapper>
              <FieldWrapper label="Admission Number">
                <Input {...register("admission_number")} placeholder="Auto-generated if blank" />
              </FieldWrapper>
              <FieldWrapper label="Admission Date">
                <Input type="date" {...register("admission_date")} />
              </FieldWrapper>
            </FormSection>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader><CardTitle className="text-base">Contact & Address</CardTitle></CardHeader>
          <CardContent>
            <FormSection title="">
              <FieldWrapper label="Address" className="col-span-2">
                <Input {...register("address")} placeholder="House No, Street" />
              </FieldWrapper>
              <FieldWrapper label="City">
                <Input {...register("city")} placeholder="Bengaluru" />
              </FieldWrapper>
              <FieldWrapper label="State">
                <Input {...register("state")} placeholder="Karnataka" />
              </FieldWrapper>
              <FieldWrapper label="PIN Code">
                <Input {...register("pincode")} placeholder="560001" />
              </FieldWrapper>
              <FieldWrapper label="Transport Required">
                <div className="flex items-center gap-2 h-9">
                  <input type="checkbox" {...register("transport_required")} id="transport" className="h-4 w-4" />
                  <label htmlFor="transport" className="text-sm">Student requires school transport</label>
                </div>
              </FieldWrapper>
            </FormSection>
          </CardContent>
        </Card>

        {createMutation.isError && (
          <p className="text-sm text-destructive">
            {(createMutation.error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to create student"}
          </p>
        )}

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : "Add Student"}
          </Button>
        </div>
      </form>
    </div>
  );
}
