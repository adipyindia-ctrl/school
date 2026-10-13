"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { LoadingSkeleton } from "./LoadingSkeleton";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  // Pagination
  total?: number;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  /**
   * When true, the table body scrolls vertically within the available height
   * while the column header stays pinned. The DataTable fills its parent's
   * height, so the parent must be a bounded flex/height container.
   */
  fillHeight?: boolean;
}

export function DataTable<T extends { id: string | number }>({
  columns,
  data,
  isLoading,
  isError,
  onRetry,
  emptyTitle,
  emptyDescription,
  total = 0,
  page = 1,
  pageSize = 25,
  onPageChange,
  fillHeight = false,
}: DataTableProps<T>) {
  if (isLoading) return <LoadingSkeleton rows={6} cols={columns.length} />;
  if (isError) return <ErrorState onRetry={onRetry} />;
  if (!data.length) return <EmptyState title={emptyTitle} description={emptyDescription} />;

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div
      className={
        fillHeight
          ? "flex flex-col flex-1 min-h-0 space-y-4"
          : "space-y-4"
      }
    >
      <div
        className={
          fillHeight
            ? "rounded-md border flex-1 min-h-0 overflow-auto"
            : "rounded-md border overflow-x-auto"
        }
      >
        <Table>
          <TableHeader
            className={
              fillHeight
                ? "sticky top-0 z-10 [&_tr]:border-b bg-muted"
                : undefined
            }
          >
            <TableRow className="bg-muted/50">
              {columns.map((col) => (
                <TableHead key={col.key} className={col.className}>
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row.id} className="hover:bg-muted/30">
                {columns.map((col) => (
                  <TableCell key={col.key} className={col.className}>
                    {col.render
                      ? col.render(row)
                      : String((row as Record<string, unknown>)[col.key] ?? "")}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-between px-1 shrink-0">
          <p className="text-sm text-muted-foreground">
            Showing {Math.min((page - 1) * pageSize + 1, total)}–{Math.min(page * pageSize, total)} of {total}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm px-2">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
