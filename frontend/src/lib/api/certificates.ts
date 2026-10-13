import api from "@/lib/api";
import type { ApiResponse } from "@/types/common";
import type { CertificateData, CertificateType } from "@/types/certificate";

export async function getCertificateData(
  studentId: string,
  certType: CertificateType,
  issueDate?: string,
  reason?: string
): Promise<CertificateData> {
  const q = new URLSearchParams({ cert_type: certType });
  if (issueDate) q.set("issue_date", issueDate);
  if (reason) q.set("reason", reason);
  const res = await api.get<ApiResponse<CertificateData>>(
    `/certificates/student/${studentId}?${q}`
  );
  return res.data.data;
}
