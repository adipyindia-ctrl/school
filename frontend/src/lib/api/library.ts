import api from "@/lib/api";
import type { ApiResponse, PaginatedResponse } from "@/types/common";
import type {
  Book,
  BookCreate,
  BookUpdate,
  BookIssue,
  BookIssueCreate,
  BookReturnUpdate,
  LibraryStats,
} from "@/types/library";

const BASE = "/library";

// ── Stats ─────────────────────────────────────────────────────────────────────

export async function getLibraryStats() {
  const res = await api.get<ApiResponse<LibraryStats>>(`${BASE}/stats`);
  return res.data.data;
}

// ── Books ─────────────────────────────────────────────────────────────────────

export async function listBooks(params?: {
  search?: string;
  category?: string;
  availableOnly?: boolean;
  page?: number;
  pageSize?: number;
}) {
  const { search, category, availableOnly, page = 1, pageSize = 25 } = params ?? {};
  const q = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
  if (search) q.set("search", search);
  if (category) q.set("category", category);
  if (availableOnly) q.set("available_only", "true");
  const res = await api.get<PaginatedResponse<Book>>(`${BASE}/books?${q}`);
  return res.data;
}

export async function createBook(payload: BookCreate) {
  const res = await api.post<ApiResponse<Book>>(`${BASE}/books`, payload);
  return res.data.data;
}

export async function updateBook(id: string, payload: BookUpdate) {
  const res = await api.patch<ApiResponse<Book>>(`${BASE}/books/${id}`, payload);
  return res.data.data;
}

// ── Issues ────────────────────────────────────────────────────────────────────

export async function listIssues(params?: {
  status?: string;
  page?: number;
  pageSize?: number;
}) {
  const { status, page = 1, pageSize = 25 } = params ?? {};
  const q = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
  if (status) q.set("status", status);
  const res = await api.get<PaginatedResponse<BookIssue>>(`${BASE}/issues?${q}`);
  return res.data;
}

export async function issueBook(payload: BookIssueCreate) {
  const res = await api.post<ApiResponse<BookIssue>>(`${BASE}/issues`, payload);
  return res.data.data;
}

export async function returnBook(issueId: string, payload: BookReturnUpdate) {
  const res = await api.patch<ApiResponse<BookIssue>>(
    `${BASE}/issues/${issueId}/return`,
    payload
  );
  return res.data.data;
}
