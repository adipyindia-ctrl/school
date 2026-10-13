"use client";

import { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Printer, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/PageHeader";
import { FieldWrapper } from "@/components/forms/FormSection";
import { getCertificateData } from "@/lib/api/certificates";
import type { CertificateData, CertificateType } from "@/types/certificate";

const CERT_TYPES: { value: CertificateType; label: string; description: string }[] = [
  { value: "bonafide", label: "Bonafide Certificate", description: "Confirms student is currently enrolled" },
  { value: "transfer", label: "Transfer Certificate", description: "Issued when student leaves the school" },
  { value: "character", label: "Character Certificate", description: "Certifies student conduct and character" },
];

const formSchema = z.object({
  student_id: z.string().uuid("Must be a valid student UUID"),
  issue_date: z.string().min(1, "Required"),
  reason: z.string().optional(),
});
type FormValues = z.infer<typeof formSchema>;

// ── Certificate Preview ───────────────────────────────────────────────────────

function CertificatePreview({ data }: { data: CertificateData }) {
  const titles: Record<CertificateType, string> = {
    bonafide: "BONAFIDE CERTIFICATE",
    transfer: "TRANSFER CERTIFICATE",
    character: "CHARACTER CERTIFICATE",
  };

  const bodyText = (): string => {
    const name = data.student_name;
    const cls = `Class ${data.class_name} – ${data.section_name}`;
    const session = data.session_name;
    const dob = data.date_of_birth;
    const adm = data.admission_number;
    const parent = `${data.parent_relation}: ${data.parent_name}`;

    if (data.cert_type === "bonafide") {
      return `This is to certify that ${name} (Admission No. ${adm}), Date of Birth: ${dob}, is a bonafide student of this institution, studying in ${cls} during the academic session ${session}. ${parent}. The student is a resident of ${data.address}.`;
    }
    if (data.cert_type === "transfer") {
      return `This is to certify that ${name} (Admission No. ${adm}), Date of Birth: ${dob}, was a bonafide student of this institution from ${data.admission_date}. The student has studied up to ${cls} during the academic session ${session}. ${parent}. The student is hereby granted this Transfer Certificate${data.reason ? ` for the purpose of: ${data.reason}` : ""}.`;
    }
    // character
    return `This is to certify that ${name} (Admission No. ${adm}), Date of Birth: ${dob}, has been a student of this institution in ${cls} during the academic session ${session}. During the period of study, the student has demonstrated good moral character, sincerity, and discipline. ${parent}. We wish the student success in future endeavours${data.reason ? `. ${data.reason}` : ""}.`;
  };

  return (
    <div
      id="certificate-print"
      className="bg-white p-10 border-4 border-double min-h-[600px] font-serif"
      style={{ borderColor: data.primary_color }}
    >
      {/* Header */}
      <div className="text-center mb-6">
        {data.logo_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={data.logo_url} alt="School Logo" className="h-16 w-16 mx-auto mb-2 object-contain" />
        )}
        <h1 className="text-2xl font-bold uppercase tracking-wide" style={{ color: data.primary_color }}>
          {data.school_name}
        </h1>
        {data.school_address && <p className="text-sm text-gray-600">{data.school_address}</p>}
        <p className="text-xs text-gray-500 mt-0.5">
          {[data.school_phone, data.school_email].filter(Boolean).join(" | ")}
        </p>
        <div className="border-t-2 mt-3 mb-4" style={{ borderColor: data.primary_color }} />
        <h2 className="text-xl font-bold tracking-widest uppercase">{titles[data.cert_type]}</h2>
      </div>

      {/* Body */}
      <p className="text-base leading-relaxed text-gray-800 text-justify mb-6">
        {bodyText()}
      </p>

      {/* Details Table */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm mb-8 border rounded p-4 bg-gray-50">
        {[
          ["Full Name", data.student_name],
          ["Admission No.", data.admission_number],
          ["Date of Birth", data.date_of_birth],
          ["Gender", data.gender],
          ["Nationality", data.nationality],
          ["Religion", data.religion],
          ["Category", data.category],
          ["Class & Section", `${data.class_name} – ${data.section_name}`],
          ["Academic Session", data.session_name],
          [`${data.parent_relation}`, data.parent_name],
        ].map(([label, value]) => (
          <div key={label} className="flex gap-1">
            <span className="font-semibold text-gray-600 shrink-0">{label}:</span>
            <span className="text-gray-800">{value}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex justify-between items-end mt-10">
        <div className="text-sm">
          <p className="text-gray-600">Date of Issue: <span className="font-medium">{data.issue_date}</span></p>
          {data.school_code && <p className="text-gray-500 text-xs">School Code: {data.school_code}</p>}
        </div>
        <div className="text-center text-sm">
          <div className="border-t border-gray-400 w-40 mb-1" />
          <p className="font-semibold">Principal / Authorized Signatory</p>
          <p className="text-xs text-gray-500">{data.school_name}</p>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CertificatesPage() {
  const printRef = useRef<HTMLDivElement>(null);
  const [selectedType, setSelectedType] = useState<CertificateType>("bonafide");
  const [certData, setCertData] = useState<CertificateData | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { issue_date: new Date().toISOString().split("T")[0] },
  });

  const generateMutation = useMutation({
    mutationFn: (values: FormValues) =>
      getCertificateData(values.student_id, selectedType, values.issue_date, values.reason),
    onSuccess: (data) => setCertData(data),
  });

  const onGenerate: SubmitHandler<FormValues> = (values) => {
    generateMutation.mutate(values);
  };

  const handlePrint = () => {
    if (!printRef.current) return;
    const printContents = printRef.current.innerHTML;
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Certificate</title>
          <style>
            body { margin: 0; font-family: Georgia, serif; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>${printContents}</body>
      </html>
    `);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  return (
    <div>
      <PageHeader
        title="Certificate Generator"
        description="Generate Bonafide, Transfer, and Character certificates for students"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left panel — configuration */}
        <div className="lg:col-span-1 space-y-5">
          {/* Certificate Type Selector */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Certificate Type</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {CERT_TYPES.map(({ value, label, description }) => (
                <button
                  key={value}
                  onClick={() => { setSelectedType(value); setCertData(null); }}
                  className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
                    selectedType === value
                      ? "border-primary bg-primary/5"
                      : "border-transparent bg-muted/40 hover:bg-muted/70"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-xs text-muted-foreground">{description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Generate Form */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Student Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onGenerate)} className="space-y-3">
                <FieldWrapper label="Student ID (UUID)" error={form.formState.errors.student_id?.message} required>
                  <Input
                    {...form.register("student_id")}
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    className="font-mono text-xs"
                  />
                </FieldWrapper>
                <FieldWrapper label="Issue Date" error={form.formState.errors.issue_date?.message} required>
                  <Input type="date" {...form.register("issue_date")} />
                </FieldWrapper>
                {(selectedType === "transfer" || selectedType === "character") && (
                  <FieldWrapper label="Reason / Purpose (optional)">
                    <Input {...form.register("reason")} placeholder="Further studies, job application..." />
                  </FieldWrapper>
                )}
                {generateMutation.isError && (
                  <p className="text-sm text-destructive">
                    {(generateMutation.error as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Student not found or access denied"}
                  </p>
                )}
                <Button type="submit" className="w-full" disabled={generateMutation.isPending}>
                  {generateMutation.isPending
                    ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating...</>
                    : "Generate Certificate"
                  }
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Print button */}
          {certData && (
            <Button variant="outline" className="w-full" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />Print / Save as PDF
            </Button>
          )}
        </div>

        {/* Right panel — preview */}
        <div className="lg:col-span-2">
          {certData ? (
            <div>
              <div className="flex items-center justify-between mb-3">
                <Badge variant="secondary" className="capitalize">{certData.cert_type} Certificate</Badge>
                <span className="text-xs text-muted-foreground">Preview — use Print to save as PDF</span>
              </div>
              <div ref={printRef} className="shadow-sm rounded-lg overflow-hidden border">
                <CertificatePreview data={certData} />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-80 rounded-xl border-2 border-dashed text-muted-foreground">
              <FileText className="h-12 w-12 mb-3 opacity-30" />
              <p className="font-medium">No certificate generated yet</p>
              <p className="text-sm">Select a type, enter a student ID, and click Generate.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
