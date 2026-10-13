"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Image as ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/data-display/EmptyState";
import { LoadingSkeleton } from "@/components/data-display/LoadingSkeleton";
import { ConfirmDialog } from "@/components/modals/ConfirmDialog";
import {
  getGalleryItems,
  createGalleryItem,
  updateGalleryItem,
  deleteGalleryItem,
  type GalleryItem,
} from "@/lib/api/website";

// ── Form state ────────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  title: "",
  image_url: "",
  category: "",
  display_order: 0,
};

type GalleryForm = typeof EMPTY_FORM;

// ── Gallery Card ──────────────────────────────────────────────────────────────

function GalleryCard({
  item,
  onEdit,
  onDelete,
}: {
  item: GalleryItem;
  onEdit: (item: GalleryItem) => void;
  onDelete: (item: GalleryItem) => void;
}) {
  const [imgError, setImgError] = useState(false);

  return (
    <Card className="group overflow-hidden">
      {/* Thumbnail */}
      <div className="relative aspect-video bg-muted overflow-hidden">
        {!imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image_url}
            alt={item.title}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <ImageIcon className="h-10 w-10 opacity-30" />
          </div>
        )}
        {/* Action buttons overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
          <Button
            size="sm"
            variant="secondary"
            className="h-8 w-8 p-0"
            onClick={() => onEdit(item)}
            aria-label={`Edit ${item.title}`}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            variant="destructive"
            className="h-8 w-8 p-0"
            onClick={() => onDelete(item)}
            aria-label={`Delete ${item.title}`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      {/* Info */}
      <CardContent className="p-3">
        <p className="font-medium text-sm truncate" title={item.title}>
          {item.title}
        </p>
        <div className="flex items-center justify-between mt-1.5 gap-2">
          {item.category ? (
            <Badge variant="secondary" className="text-xs truncate max-w-[120px]">
              {item.category}
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground">Uncategorised</span>
          )}
          <span className="text-xs text-muted-foreground shrink-0">
            #{item.display_order}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function GalleryManagementPage() {
  const qc = useQueryClient();

  // ── Data ──────────────────────────────────────────────────────────────────
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["gallery-items"],
    queryFn: () => getGalleryItems(),
  });

  // Unique categories extracted from items
  const categories = useMemo<string[]>(() => {
    const cats = items
      .map((i) => i.category)
      .filter((c): c is string => Boolean(c));
    return Array.from(new Set(cats)).sort();
  }, [items]);

  // ── Mutations ─────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: createGalleryItem,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gallery-items"] });
      closeDialog();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateGalleryItem>[1] }) =>
      updateGalleryItem(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gallery-items"] });
      closeDialog();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteGalleryItem,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gallery-items"] });
      setDeleteTarget(null);
    },
  });

  // ── UI state ──────────────────────────────────────────────────────────────
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);
  const [form, setForm] = useState<GalleryForm>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<GalleryItem | null>(null);

  const filteredItems = useMemo(() => {
    if (activeCategory === "all") return items;
    if (activeCategory === "__none__") return items.filter((i) => !i.category);
    return items.filter((i) => i.category === activeCategory);
  }, [items, activeCategory]);

  // ── Dialog helpers ────────────────────────────────────────────────────────
  const openNew = () => {
    setForm(EMPTY_FORM);
    setEditingItem(null);
    setDialogOpen(true);
  };

  const openEdit = (item: GalleryItem) => {
    setForm({
      title: item.title,
      image_url: item.image_url,
      category: item.category ?? "",
      display_order: item.display_order,
    });
    setEditingItem(item);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingItem(null);
    setForm(EMPTY_FORM);
  };

  const handleSubmit = () => {
    const payload = {
      title: form.title.trim(),
      image_url: form.image_url.trim(),
      category: form.category.trim() || null,
      display_order: form.display_order,
    };
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const isFormValid = form.title.trim().length > 0 && form.image_url.trim().length > 0;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-6">
      <PageHeader
        title="Gallery Management"
        description="Manage photos displayed on your school website."
        actions={
          <Button onClick={openNew}>
            <Plus className="mr-2 h-4 w-4" />
            Add Image
          </Button>
        }
      />

      {/* Category filter */}
      {!isLoading && items.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <Button
            size="sm"
            variant={activeCategory === "all" ? "default" : "outline"}
            onClick={() => setActiveCategory("all")}
          >
            All ({items.length})
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat}
              size="sm"
              variant={activeCategory === cat ? "default" : "outline"}
              onClick={() => setActiveCategory(cat)}
            >
              {cat} ({items.filter((i) => i.category === cat).length})
            </Button>
          ))}
          {items.some((i) => !i.category) && (
            <Button
              size="sm"
              variant={activeCategory === "__none__" ? "default" : "outline"}
              onClick={() => setActiveCategory("__none__")}
            >
              Uncategorised ({items.filter((i) => !i.category).length})
            </Button>
          )}
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <LoadingSkeleton type="card" rows={8} />
      ) : filteredItems.length === 0 ? (
        <EmptyState
          title="No gallery images"
          description={
            activeCategory === "all"
              ? "Add your first image to get started."
              : `No images in the "${activeCategory === "__none__" ? "Uncategorised" : activeCategory}" category.`
          }
          action={activeCategory === "all" ? { label: "Add Image", onClick: openNew } : undefined}
          icon={<ImageIcon className="h-12 w-12 opacity-40" />}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredItems
            .slice()
            .sort((a, b) => a.display_order - b.display_order || a.title.localeCompare(b.title))
            .map((item) => (
              <GalleryCard
                key={item.id}
                item={item}
                onEdit={openEdit}
                onDelete={setDeleteTarget}
              />
            ))}
        </div>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Image" : "Add Image"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="gallery-title">Title *</Label>
              <Input
                id="gallery-title"
                placeholder="e.g. Annual Sports Day 2024"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>

            {/* Image URL */}
            <div className="space-y-1.5">
              <Label htmlFor="gallery-url">Image URL *</Label>
              <Input
                id="gallery-url"
                placeholder="https://example.com/photo.jpg"
                value={form.image_url}
                onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
              />
            </div>

            {/* Preview */}
            {form.image_url && (
              <div className="rounded-md overflow-hidden bg-muted aspect-video">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={form.image_url}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            )}

            {/* Category */}
            <div className="space-y-1.5">
              <Label htmlFor="gallery-category">
                Category{" "}
                <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Input
                id="gallery-category"
                placeholder="e.g. Events, Infrastructure, Sports"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                list="category-suggestions"
              />
              {categories.length > 0 && (
                <datalist id="category-suggestions">
                  {categories.map((cat) => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              )}
            </div>

            {/* Display Order */}
            <div className="space-y-1.5">
              <Label htmlFor="gallery-order">Display Order</Label>
              <Input
                id="gallery-order"
                type="number"
                min={0}
                placeholder="0"
                value={form.display_order}
                onChange={(e) =>
                  setForm((f) => ({ ...f, display_order: parseInt(e.target.value, 10) || 0 }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Lower numbers appear first. Use 0 for default ordering.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={isPending}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!isFormValid || isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : editingItem ? (
                "Save Changes"
              ) : (
                "Add Image"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Delete Gallery Image"
        description={`Remove "${deleteTarget?.title ?? ""}" from the gallery? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
        }}
      />
    </div>
  );
}
