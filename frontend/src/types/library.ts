// ── Book ──────────────────────────────────────────────────────────────────────

export interface Book {
  id: string;
  school_id: string;
  title: string;
  author: string | null;
  isbn: string | null;
  publisher: string | null;
  category: string | null;
  total_copies: number;
  available_copies: number;
  created_at: string;
}

export interface BookCreate {
  title: string;
  author?: string | null;
  isbn?: string | null;
  publisher?: string | null;
  category?: string | null;
  total_copies?: number;
}

export interface BookUpdate {
  title?: string;
  author?: string | null;
  isbn?: string | null;
  publisher?: string | null;
  category?: string | null;
  total_copies?: number;
}

// ── BookIssue ─────────────────────────────────────────────────────────────────

export type IssueStatus = "issued" | "returned" | "overdue";

export interface BookIssue {
  id: string;
  school_id: string;
  book_id: string;
  user_id: string;
  issue_date: string;
  due_date: string;
  return_date: string | null;
  fine_amount: number;
  status: IssueStatus;
  created_at: string;
}

export interface BookIssueCreate {
  book_id: string;
  user_id: string;
  issue_date: string;
  due_date: string;
}

export interface BookReturnUpdate {
  return_date: string;
  fine_per_day?: number;
}

// ── Dashboard stats ───────────────────────────────────────────────────────────

export interface LibraryStats {
  total_books: number;
  issued: number;
  overdue: number;
  outstanding_fines: number;
}
