"use client";

import { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Printer, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/PageHeader";
import { FieldWrapper } from "@/components/forms/FormSection";
import { getCertificateData } from "@/lib/api/certificates";
import type { CertificateData } from "@/types/certificate";

const formSchema = z.object({
  student_id: z.string().uuid("Must be a valid student UUID"),
});
type FormValues = z.infer<typeof formSchema>;

// ── QR Code (Google Charts API — no install needed) ───────────────────────────

function QRCode({ data, size = 120 }: { data: string; size?: number }) {
  const encoded = encodeURIComponent(data);
  const src = `https://chart.googleapis.com/chart?chs=${size}x${size}&cht=qr&chl=${encoded}&choe=UTF-8`;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="QR Code" width={size} height={size} className="object-contain" />;
}

// ── ID Card ───────────────────────────────────────────────────────────────────

function IDCard({ data }: { data: CertificateData }) {
  const qrContent = [
    `Name: ${data.student_name}`,
    `Adm No: ${data.admission_number}`,
    `Class: ${data.class_name}-${data.section_name}`,
    `School: ${data.school_name}`,
  ].join(" | ");

  return (
    <div
      className="relative w-[340px] rounded-2xl overflow-hidden shadow-lg border"
      style={{ background: `linear-gradient(135deg, ${data.primary_color}15 0%, white 100%)` }}
    >
      {/* Header bar */}
      <div
        className="px-4 py-3 flex items-center gap-3"
        style={{ backgroundColor: data.primary_color }}
      >
        {data.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={data.logo_url} alt="Logo" className="h-9 w-9 rounded-full bg-white object-contain p-0.5" />
        ) : (
          <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center">
            <CreditCard className="h-5 w-5 text-white" />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-white font-bold text-sm leading-tight truncate">{data.school_name}</p>
          <p className="text-white/70 text-xs">Student Identity Card</p>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-4 flex gap-4">
        {/* Photo placeholder */}
        <div className="shrink-0">
          <div
            className="w-20 h-24 rounded-lg border-2 bg-gray-100 flex items-center justify-center overflow-hidden"
            style={{ borderColor: data.primary_color }}
          >
            <span className="text-4xl text-gray-300 select-none">
              {data.student_name.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>

        {/* Student info */}
        <div className="flex-1 min-w-0 text-sm space-y-1">
          <p className="font-bold text-base leading-tight truncate">{data.student_name}</p>
          <div className="space-y-0.5 text-xs text-gray-600">
            <p><span className="font-medium text-gray-800">Adm No:</span> {data.admission_number}</p>
            <p><span className="font-medium text-gray-800">Class:</span> {data.class_name} – {data.section_name}</p>
            <p><span className="font-medium text-gray-800">Session:</span> {data.session_name}</p>
            <p><span className="font-medium text-gray-800">DOB:</span> {data.date_of_birth}</p>
            <p><span className="font-medium text-gray-800">{data.parent_relation}:</span> {data.parent_name}</p>
            {data.parent_phone !== "—" && (
              <p><span className="font-medium text-gray-800">Contact:</span> {data.parent_phone}</p>
            )}
          </div>
        </div>
      </div>

      {/* QR + Footer */}
      <div
        className="px-4 py-3 flex items-center justify-between gap-3 border-t"
        style={{ borderColor: `${data.primary_color}30` }}
      >
        <div className="text-xs text-gray-500 space-y-0.5">
          {data.school_phone !== "" && <p>📞 {data.school_phone}</p>}
          {data.school_address && (
            <p className="max-w-[160px] leading-tight">{data.school_address}</p>
          )}
        </div>
        <QRCode data={qrContent} size={72} />
      </div>

      {/* Bottom accent */}
      <div className="h-1.5" style={{ backgroundColor: data.primary_color }} />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function IDCardsPage() {
  const printRef = useRef<HTMLDivElement>(null);
  const [cardData, setCardData] = useState<CertificateData | null>(null);

  const form = useForm<FormValues>({ resolver: zodResolver(formSchema) });

  const generateMutation = useMutation({
    // reuse certificate endpoint with "bonafide" type — same student data
    mutationFn: (values: FormValues) =>
      getCertificateData(values.student_id, "bonafide"),
    onSuccess: (data) => setCardData(data),
  });

  const onGenerate: SubmitHandler<FormValues> = (v) => generateMutation.mutate(v);

  const handlePrint = () => {
    if (!printRef.current) return;
    const win = window.open("", "_blank", "width=500,height=400");
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Student ID Card</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { display: flex; justify-content: center; align-items: flex-start; padding: 20px; background: white; font-family: system-ui, sans-serif; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>${printRef.current.innerHTML}</body>
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
        title="Student ID Card Generator"
        description="Generate printable student ID cards with QR code"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Config panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Generate ID Card</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onGenerate)} className="space-y-4">
                <FieldWrapper
                  label="Student ID (UUID)"
                  error={form.formState.errors.student_id?.message}
                  required
                >
                  <Input
                    {...form.register("student_id")}
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    className="font-mono text-xs"
                  />
                </FieldWrapper>

                {generateMutation.isError && (
                  <p className="text-sm text-destructive">
                    {(generateMutation.error as { response?: { data?: { detail?: string } } })
                      ?.response?.data?.detail ?? "Student not found"}
                  </p>
                )}

                <Button type="submit" className="w-full" disabled={generateMutation.isPending}>
                  {generateMutation.isPending ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating...</>
                  ) : (
                    "Generate ID Card"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {cardData && (
            <Button variant="outline" className="w-full" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />Print / Save as PDF
            </Button>
          )}

          <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">About the QR Code</p>
            <p>The QR code encodes the student&apos;s name, admission number, class, and school name for quick identification scanning.</p>
          </div>
        </div>

        {/* Preview panel */}
        <div className="lg:col-span-2 flex flex-col items-center justify-start pt-2">
          {cardData ? (
            <div className="space-y-4 flex flex-col items-center">
              <p className="text-sm text-muted-foreground">Preview — actual card is 85.6 × 54mm (credit card size)</p>
              <div ref={printRef}>
                <IDCard data={cardData} />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-72 w-full rounded-xl border-2 border-dashed text-muted-foreground">
              <CreditCard className="h-12 w-12 mb-3 opacity-30" />
              <p className="font-medium">No ID card generated yet</p>
              <p className="text-sm">Enter a student ID and click Generate.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
