"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  PlusCircle,
  Loader2,
  Search,
  BookOpen,
  RotateCcw,
  AlertTriangle,
  BookMarked,
  Library,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, type Column } from "@/components/data-display/DataTable";
import { FieldWrapper } from "@/components/forms/FormSection";
import {
  getLibraryStats,
  listBooks,
  createBook,
  updateBook,
  listIssues,
  issueBook,
  returnBook,
} from "@/lib/api/library";
import type { Book, BookIssue, LibraryStats } from "@/types/library";

// ── Schemas ───────────────────────────────────────────────────────────────────

const bookSchema = z.object({
  title: z.string().min(1, "Required"),
  author: z.string().optional(),
  isbn: z.string().optional(),
  publisher: z.string().optional(),
  category: z.string().optional(),
  total_copies: z.coerce.number().min(1),
});
type BookForm = z.infer<typeof bookSchema>;

const issueSchema = z.object({
  book_id: z.string().uuid("Must be a valid UUID"),
  user_id: z.string().uuid("Must be a valid UUID"),
  issue_date: z.string().min(1, "Required"),
  due_date: z.string().min(1, "Required"),
});
type IssueForm = z.infer<typeof issueSchema>;

const returnSchema = z.object({
  return_date: z.string().min(1, "Required"),
  fine_per_day: z.coerce.number().min(0),
});
type ReturnForm = z.infer<typeof returnSchema>;

// ── Stats Bar ─────────────────────────────────────────────────────────────────

function StatsBar({ stats }: { stats: LibraryStats }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {[
        { label: "Total Books", value: stats.total_books, icon: BookOpen, color: "text-blue-600" },
        { label: "Currently Issued", value: stats.issued, icon: BookMarked, color: "text-orange-500" },
        { label: "Overdue", value: stats.overdue, icon: AlertTriangle, color: "text-red-500" },
        { label: "Outstanding Fines", value: `₹${stats.outstanding_fines.toLocaleString()}`, icon: Library, color: "text-purple-500" },
      ].map(({ label, value, icon: Icon, color }) => (
        <Card key={label}>
          <CardContent className="p-4 flex items-center gap-3">
            <Icon className={`h-5 w-5 shrink-0 ${color}`} />
            <div>
              <p className="text-xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── Books Tab ─────────────────────────────────────────────────────────────────

function BooksTab() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editBook, setEditBook] = useState<Book | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["books", page, search, category],
    queryFn: () => listBooks({ search: search || undefined, category: category || undefined, page, pageSize: 25 }),
  });

  const form = useForm<BookForm>({
    resolver: zodResolver(bookSchema),
    defaultValues: { total_copies: 1 },
  });
  const editForm = useForm<BookForm>({
    resolver: zodResolver(bookSchema),
    defaultValues: { total_copies: 1 },
  });

  const createMutation = useMutation({
    mutationFn: createBook,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["books"] }); qc.invalidateQueries({ queryKey: ["library-stats"] }); setAddOpen(false); form.reset(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, d }: { id: string; d: BookForm }) => updateBook(id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["books"] }); setEditBook(null); },
  });

  const onAdd: SubmitHandler<BookForm> = (d) => createMutation.mutate(d);
  const onEdit: SubmitHandler<BookForm> = (d) => { if (editBook) updateMutation.mutate({ id: editBook.id, d }); };

  const openEdit = (b: Book) => {
    setEditBook(b);
    editForm.reset({
      title: b.title,
      author: b.author ?? undefined,
      isbn: b.isbn ?? undefined,
      publisher: b.publisher ?? undefined,
      category: b.category ?? undefined,
      total_copies: b.total_copies,
    });
  };

  const columns: Column<Book>[] = [
    {
      key: "title", header: "Title",
      render: (r) => (
        <div>
          <p className="font-medium text-sm">{r.title}</p>
          {r.author && <p className="text-xs text-muted-foreground">{r.author}</p>}
        </div>
      ),
    },
    { key: "isbn", header: "ISBN", render: (r) => r.isbn ?? "—" },
    { key: "category", header: "Category", render: (r) => r.category ?? "—" },
    { key: "total_copies", header: "Total", render: (r) => String(r.total_copies) },
    {
      key: "available_copies", header: "Available",
      render: (r) => (
        <Badge variant={r.available_copies > 0 ? "default" : "destructive"}>
          {r.available_copies} / {r.total_copies}
        </Badge>
      ),
    },
    {
      key: "actions", header: "Actions",
      render: (r) => (
        <Button size="sm" variant="outline" onClick={() => openEdit(r)}>Edit</Button>
      ),
    },
  ];

  const BookFields = ({ f }: { f: ReturnType<typeof useForm<BookForm>> }) => (
    <>
      <FieldWrapper label="Title" error={f.formState.errors.title?.message} required>
        <Input {...f.register("title")} placeholder="The Great Gatsby" />
      </FieldWrapper>
      <FieldWrapper label="Author">
        <Input {...f.register("author")} placeholder="F. Scott Fitzgerald" />
      </FieldWrapper>
      <FieldWrapper label="ISBN">
        <Input {...f.register("isbn")} placeholder="978-3-16-148410-0" />
      </FieldWrapper>
      <FieldWrapper label="Publisher">
        <Input {...f.register("publisher")} placeholder="Scribner" />
      </FieldWrapper>
      <FieldWrapper label="Category">
        <Input {...f.register("category")} placeholder="Fiction, Science, History..." />
      </FieldWrapper>
      <FieldWrapper label="Total Copies" error={(f.formState.errors as { total_copies?: { message?: string } }).total_copies?.message}>
        <Input type="number" {...f.register("total_copies")} min={1} />
      </FieldWrapper>
    </>
  );

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-4 justify-between">
        <div className="flex gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9 w-60" placeholder="Search title, author, ISBN…"
              value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <Input placeholder="Filter by category" className="w-44"
            value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} />
        </div>
        <Button onClick={() => setAddOpen(true)}><PlusCircle className="mr-2 h-4 w-4" />Add Book</Button>
      </div>

      <DataTable
        columns={columns} data={data?.data ?? []}
        isLoading={isLoading} isError={isError} onRetry={refetch}
        total={data?.total ?? 0} page={page} pageSize={25} onPageChange={setPage}
        emptyTitle="No books in catalog" emptyDescription="Add books to build your library catalog."
      />

      {/* Add Book Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Book</DialogTitle></DialogHeader>
          <form onSubmit={form.handleSubmit(onAdd)} className="space-y-3">
            <FieldWrapper label="Title" error={form.formState.errors.title?.message} required>
              <Input {...form.register("title")} placeholder="The Great Gatsby" />
            </FieldWrapper>
            <FieldWrapper label="Author">
              <Input {...form.register("author")} placeholder="F. Scott Fitzgerald" />
            </FieldWrapper>
            <FieldWrapper label="ISBN">
              <Input {...form.register("isbn")} placeholder="978-3-16-148410-0" />
            </FieldWrapper>
            <FieldWrapper label="Publisher">
              <Input {...form.register("publisher")} placeholder="Scribner" />
            </FieldWrapper>
            <FieldWrapper label="Category">
              <Input {...form.register("category")} placeholder="Fiction, Science, History..." />
            </FieldWrapper>
            <FieldWrapper label="Total Copies" error={form.formState.errors.total_copies?.message}>
              <Input type="number" {...form.register("total_copies")} min={1} />
            </FieldWrapper>
            {createMutation.isError && <p className="text-sm text-destructive">Failed to add book</p>}
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Add Book
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Book Dialog */}
      <Dialog open={!!editBook} onOpenChange={(o) => !o && setEditBook(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Edit Book</DialogTitle></DialogHeader>
          <form onSubmit={editForm.handleSubmit(onEdit)} className="space-y-3">
            <FieldWrapper label="Title" error={editForm.formState.errors.title?.message} required>
              <Input {...editForm.register("title")} placeholder="The Great Gatsby" />
            </FieldWrapper>
            <FieldWrapper label="Author">
              <Input {...editForm.register("author")} placeholder="F. Scott Fitzgerald" />
            </FieldWrapper>
            <FieldWrapper label="ISBN">
              <Input {...editForm.register("isbn")} placeholder="978-3-16-148410-0" />
            </FieldWrapper>
            <FieldWrapper label="Publisher">
              <Input {...editForm.register("publisher")} placeholder="Scribner" />
            </FieldWrapper>
            <FieldWrapper label="Category">
              <Input {...editForm.register("category")} placeholder="Fiction, Science, History..." />
            </FieldWrapper>
            <FieldWrapper label="Total Copies" error={editForm.formState.errors.total_copies?.message}>
              <Input type="number" {...editForm.register("total_copies")} min={1} />
            </FieldWrapper>
            {updateMutation.isError && <p className="text-sm text-destructive">Failed to update book</p>}
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setEditBook(null)}>Cancel</Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save Changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Issues Tab ────────────────────────────────────────────────────────────────

function IssuesTab() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [issueOpen, setIssueOpen] = useState(false);
  const [returnTarget, setReturnTarget] = useState<BookIssue | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["issues", page, statusFilter],
    queryFn: () => listIssues({ status: statusFilter || undefined, page, pageSize: 25 }),
  });

  const issueForm = useForm<IssueForm>({ resolver: zodResolver(issueSchema) });
  const returnForm = useForm<ReturnForm>({
    resolver: zodResolver(returnSchema),
    defaultValues: { fine_per_day: 5, return_date: new Date().toISOString().split("T")[0] },
  });

  const issueMutation = useMutation({
    mutationFn: issueBook,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["issues"] });
      qc.invalidateQueries({ queryKey: ["books"] });
      qc.invalidateQueries({ queryKey: ["library-stats"] });
      setIssueOpen(false);
      issueForm.reset();
    },
  });

  const returnMutation = useMutation({
    mutationFn: ({ id, d }: { id: string; d: ReturnForm }) =>
      returnBook(id, { return_date: d.return_date, fine_per_day: d.fine_per_day }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["issues"] });
      qc.invalidateQueries({ queryKey: ["books"] });
      qc.invalidateQueries({ queryKey: ["library-stats"] });
      setReturnTarget(null);
      returnForm.reset();
    },
  });

  const onIssue: SubmitHandler<IssueForm> = (d) => issueMutation.mutate(d);
  const onReturn: SubmitHandler<ReturnForm> = (d) => {
    if (returnTarget) returnMutation.mutate({ id: returnTarget.id, d });
  };

  const openReturn = (issue: BookIssue) => {
    setReturnTarget(issue);
    returnForm.reset({
      return_date: new Date().toISOString().split("T")[0],
      fine_per_day: 5,
    });
  };

  const statusBadge = (status: string, dueDate: string) => {
    const isActuallyOverdue = status === "issued" && new Date(dueDate) < new Date();
    const display = isActuallyOverdue ? "overdue" : status;
    const variant =
      display === "returned" ? "secondary" :
      display === "overdue" ? "destructive" : "default";
    return <Badge variant={variant} className="capitalize">{display}</Badge>;
  };

  const columns: Column<BookIssue>[] = [
    {
      key: "book_id", header: "Book ID",
      render: (r) => <span className="font-mono text-xs">{r.book_id.slice(0, 8)}…</span>,
    },
    {
      key: "user_id", header: "User ID",
      render: (r) => <span className="font-mono text-xs">{r.user_id.slice(0, 8)}…</span>,
    },
    { key: "issue_date", header: "Issued On", render: (r) => r.issue_date },
    { key: "due_date", header: "Due Date", render: (r) => r.due_date },
    { key: "return_date", header: "Returned On", render: (r) => r.return_date ?? "—" },
    {
      key: "fine_amount", header: "Fine",
      render: (r) => r.fine_amount > 0 ? <span className="text-red-600 font-medium">₹{r.fine_amount}</span> : "—",
    },
    { key: "status", header: "Status", render: (r) => statusBadge(r.status, r.due_date) },
    {
      key: "actions", header: "Actions",
      render: (r) => r.status !== "returned" ? (
        <Button size="sm" variant="outline" onClick={() => openReturn(r)}>
          <RotateCcw className="mr-1 h-3.5 w-3.5" />Return
        </Button>
      ) : null,
    },
  ];

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-4 justify-between">
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm">
          <option value="">All Status</option>
          <option value="issued">Issued</option>
          <option value="returned">Returned</option>
          <option value="overdue">Overdue</option>
        </select>
        <Button onClick={() => setIssueOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />Issue Book
        </Button>
      </div>

      <DataTable
        columns={columns} data={data?.data ?? []}
        isLoading={isLoading} isError={isError} onRetry={refetch}
        total={data?.total ?? 0} page={page} pageSize={25} onPageChange={setPage}
        emptyTitle="No issue records" emptyDescription="Issue a book to a student or teacher to get started."
      />

      {/* Issue Book Dialog */}
      <Dialog open={issueOpen} onOpenChange={setIssueOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Issue Book</DialogTitle></DialogHeader>
          <form onSubmit={issueForm.handleSubmit(onIssue)} className="space-y-3">
            <FieldWrapper label="Book ID (UUID)" error={issueForm.formState.errors.book_id?.message} required>
              <Input {...issueForm.register("book_id")} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
            </FieldWrapper>
            <FieldWrapper label="User ID (UUID)" error={issueForm.formState.errors.user_id?.message} required>
              <Input {...issueForm.register("user_id")} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
            </FieldWrapper>
            <div className="grid grid-cols-2 gap-3">
              <FieldWrapper label="Issue Date" error={issueForm.formState.errors.issue_date?.message} required>
                <Input type="date" {...issueForm.register("issue_date")} />
              </FieldWrapper>
              <FieldWrapper label="Due Date" error={issueForm.formState.errors.due_date?.message} required>
                <Input type="date" {...issueForm.register("due_date")} />
              </FieldWrapper>
            </div>
            {issueMutation.isError && (
              <p className="text-sm text-destructive">
                {(issueMutation.error as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Failed to issue book"}
              </p>
            )}
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setIssueOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={issueMutation.isPending}>
                {issueMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Issue Book
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Return Book Dialog */}
      <Dialog open={!!returnTarget} onOpenChange={(o) => !o && setReturnTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Return Book</DialogTitle></DialogHeader>
          {returnTarget && (
            <form onSubmit={returnForm.handleSubmit(onReturn)} className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Due date: <span className="font-medium text-foreground">{returnTarget.due_date}</span>
              </p>
              <FieldWrapper label="Return Date" error={returnForm.formState.errors.return_date?.message} required>
                <Input type="date" {...returnForm.register("return_date")} />
              </FieldWrapper>
              <FieldWrapper label="Fine per Overdue Day (₹)">
                <Input type="number" step="0.5" {...returnForm.register("fine_per_day")} min={0} />
              </FieldWrapper>
              {returnMutation.isError && <p className="text-sm text-destructive">Failed to process return</p>}
              <div className="flex justify-end gap-2 pt-1">
                <Button type="button" variant="outline" onClick={() => setReturnTarget(null)}>Cancel</Button>
                <Button type="submit" disabled={returnMutation.isPending}>
                  {returnMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Confirm Return
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Page Root ─────────────────────────────────────────────────────────────────

export default function LibraryPage() {
  const { data: stats } = useQuery({
    queryKey: ["library-stats"],
    queryFn: getLibraryStats,
  });

  return (
    <div>
      <PageHeader
        title="Library"
        description="Manage book catalog, issue/return cycle, and overdue fines"
      />

      {stats && <StatsBar stats={stats} />}

      <Tabs defaultValue="books">
        <TabsList className="mb-5">
          <TabsTrigger value="books">Books</TabsTrigger>
          <TabsTrigger value="issues">Issues & Returns</TabsTrigger>
        </TabsList>

        <TabsContent value="books">
          <BooksTab />
        </TabsContent>

        <TabsContent value="issues">
          <IssuesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
