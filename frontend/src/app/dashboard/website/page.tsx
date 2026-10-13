"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  GripVertical,
  Eye,
  EyeOff,
  Globe,
  Settings2,
  ChevronUp,
  ChevronDown,
  ExternalLink,
  Loader2,
  Menu,
  Plus,
  Trash2,
  FileText,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/layout/PageHeader";
import { FieldWrapper } from "@/components/forms/FormSection";
import { useTenantStore } from "@/store/tenantStore";
import {
  getWebsiteSettings,
  updateWebsiteSettings,
  listSections,
  updateSection,
  reorderSections,
  type WebsiteSection,
  listMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  reorderMenuItems,
  type NavigationMenuItem,
  listCmsPages,
  createCmsPage,
  updateCmsPage,
  deleteCmsPage,
  type CmsPage,
} from "@/lib/api/website";

const SECTION_LABELS: Record<string, { label: string; icon: string; description: string }> = {
  hero:         { label: "Hero Banner",    icon: "🏠", description: "Main headline and call-to-action" },
  about:        { label: "About Us",       icon: "📖", description: "School history and mission" },
  stats:        { label: "Key Stats",      icon: "📊", description: "Student count, teachers, achievements" },
  academics:    { label: "Academics",      icon: "🎓", description: "Programs and curriculum highlights" },
  gallery:      { label: "Photo Gallery",  icon: "🖼️",  description: "School photos and events" },
  testimonials: { label: "Testimonials",   icon: "💬", description: "Parent and student reviews" },
  events:       { label: "Events",         icon: "📅", description: "Upcoming school events" },
  contact:      { label: "Contact",        icon: "📞", description: "Address, phone, email, map" },
  cta:          { label: "Call to Action", icon: "✏️",  description: "Admission apply button section" },
};

const TEMPLATE_OPTIONS = [
  { id: 1, label: "Modern",  desc: "Bold gradients, rounded cards" },
  { id: 2, label: "Classic", desc: "Traditional serif, formal layout" },
  { id: 3, label: "Premium", desc: "Dark/luxury, high contrast" },
  { id: 4, label: "Minimal", desc: "Clean whitespace, typography-first" },
  { id: 5, label: "Kids",    desc: "Colorful, playful, emoji-rich" },
];

// ── Section Manager ───────────────────────────────────────────────────────────

function SectionManager() {
  const qc = useQueryClient();

  const { data: sections = [], isLoading } = useQuery({
    queryKey: ["website-sections"],
    queryFn: listSections,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ key, enabled }: { key: string; enabled: boolean }) =>
      updateSection(key, { is_enabled: enabled }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["website-sections"] }),
  });

  const reorderMutation = useMutation({
    mutationFn: (order: { section_key: string; display_order: number }[]) =>
      reorderSections(order),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["website-sections"] }),
  });

  const headingMutation = useMutation({
    mutationFn: ({ key, heading }: { key: string; heading: string }) =>
      updateSection(key, { heading }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["website-sections"] }),
  });

  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editHeading, setEditHeading] = useState("");

  const sorted = [...sections].sort((a, b) => a.display_order - b.display_order);

  const move = (index: number, direction: "up" | "down") => {
    const newOrder = [...sorted];
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newOrder.length) return;
    [newOrder[index], newOrder[swapIndex]] = [newOrder[swapIndex], newOrder[index]];
    const order = newOrder.map((s, i) => ({ section_key: s.section_key, display_order: i + 1 }));
    reorderMutation.mutate(order);
  };

  if (isLoading) {
    return <div className="space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />)}</div>;
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground mb-4">
        Enable or disable sections, edit headings, and reorder them using the arrows.
        Changes are saved immediately.
      </p>
      {sorted.map((section, index) => {
        const meta = SECTION_LABELS[section.section_key] ?? { label: section.section_key, icon: "📄", description: "" };
        return (
          <Card key={section.id} className={`transition-opacity ${!section.is_enabled ? "opacity-50" : ""}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                {/* Drag handle visual */}
                <GripVertical className="h-5 w-5 text-muted-foreground shrink-0 cursor-grab" />

                {/* Section info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base">{meta.icon}</span>
                    {editingKey === section.section_key ? (
                      <div className="flex items-center gap-2">
                        <Input
                          className="h-7 text-sm w-40"
                          value={editHeading}
                          onChange={(e) => setEditHeading(e.target.value)}
                          autoFocus
                        />
                        <Button size="sm" className="h-7 px-2 text-xs"
                          disabled={headingMutation.isPending}
                          onClick={() => {
                            headingMutation.mutate({ key: section.section_key, heading: editHeading });
                            setEditingKey(null);
                          }}>
                          {headingMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs"
                          onClick={() => setEditingKey(null)}>Cancel</Button>
                      </div>
                    ) : (
                      <button
                        className="font-medium text-sm hover:underline text-left"
                        onClick={() => { setEditingKey(section.section_key); setEditHeading(section.heading ?? meta.label); }}
                      >
                        {section.heading || meta.label}
                      </button>
                    )}
                    <Badge variant={section.is_enabled ? "default" : "secondary"} className="text-xs">
                      {section.is_enabled ? "Visible" : "Hidden"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{meta.description}</p>
                </div>

                {/* Order controls */}
                <div className="flex flex-col gap-0.5 shrink-0">
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0"
                    disabled={index === 0 || reorderMutation.isPending}
                    onClick={() => move(index, "up")}>
                    <ChevronUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0"
                    disabled={index === sorted.length - 1 || reorderMutation.isPending}
                    onClick={() => move(index, "down")}>
                    <ChevronDown className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {/* Toggle visibility */}
                <Button
                  size="sm"
                  variant={section.is_enabled ? "outline" : "secondary"}
                  className="shrink-0 h-8 text-xs"
                  disabled={toggleMutation.isPending}
                  onClick={() => toggleMutation.mutate({ key: section.section_key, enabled: !section.is_enabled })}
                >
                  {section.is_enabled
                    ? <><EyeOff className="mr-1 h-3.5 w-3.5" />Hide</>
                    : <><Eye className="mr-1 h-3.5 w-3.5" />Show</>
                  }
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ── Website Settings Tab ──────────────────────────────────────────────────────

function WebsiteSettingsTab() {
  const qc = useQueryClient();
  const { tenant } = useTenantStore();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["website-settings"],
    queryFn: getWebsiteSettings,
  });

  const updateMutation = useMutation({
    mutationFn: updateWebsiteSettings,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["website-settings"] }),
  });

  const [seoTitle, setSeoTitle] = useState("");
  const [seoDesc, setSeoDesc] = useState("");

  if (isLoading) return <div className="h-32 bg-muted animate-pulse rounded-lg" />;

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Template picker */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Layout Template</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {TEMPLATE_OPTIONS.map((t) => (
              <button
                key={t.id}
                onClick={() => updateMutation.mutate({ layout_template: t.id })}
                disabled={updateMutation.isPending}
                className={`p-3 rounded-lg border-2 text-left transition-colors ${
                  settings?.layout_template === t.id
                    ? "border-primary bg-primary/5"
                    : "border-muted hover:border-muted-foreground/30"
                }`}
              >
                <p className="font-semibold text-sm">{t.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t.desc}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Publish toggle */}
      <Card>
        <CardContent className="p-4 flex items-center justify-between gap-4">
          <div>
            <p className="font-medium text-sm">Website Status</p>
            <p className="text-xs text-muted-foreground">
              {settings?.is_published
                ? "Your website is live and visible to the public."
                : "Your website is currently unpublished (draft mode)."}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={settings?.is_published ? "default" : "secondary"}>
              {settings?.is_published ? "Published" : "Draft"}
            </Badge>
            <Button
              variant={settings?.is_published ? "destructive" : "default"}
              size="sm"
              disabled={updateMutation.isPending}
              onClick={() => updateMutation.mutate({ is_published: !settings?.is_published })}
            >
              {updateMutation.isPending
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : settings?.is_published ? "Unpublish" : "Publish"
              }
            </Button>
            {settings?.is_published && tenant?.slug && (
              <a
                href={`/${tenant.slug}`}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-primary flex items-center gap-1 hover:underline"
              >
                View Site <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        </CardContent>
      </Card>

      {/* SEO */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">SEO Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <FieldWrapper label="SEO Title">
            <Input
              placeholder={settings?.seo_title ?? "Your school name - tagline"}
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
            />
          </FieldWrapper>
          <FieldWrapper label="SEO Description">
            <Input
              placeholder={settings?.seo_description ?? "Brief description for search engines"}
              value={seoDesc}
              onChange={(e) => setSeoDesc(e.target.value)}
            />
          </FieldWrapper>
          <Button
            size="sm"
            disabled={updateMutation.isPending || (!seoTitle && !seoDesc)}
            onClick={() => updateMutation.mutate({
              seo_title: seoTitle || undefined,
              seo_description: seoDesc || undefined,
            })}
          >
            {updateMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save SEO Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Navigation Menu Builder ───────────────────────────────────────────────────

function NavigationMenuBuilder() {
  const qc = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["website-navigation"],
    queryFn: listMenuItems,
  });

  const createMutation = useMutation({
    mutationFn: createMenuItem,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["website-navigation"] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof updateMenuItem>[1] }) =>
      updateMenuItem(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["website-navigation"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMenuItem,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["website-navigation"] }),
  });

  const reorderMutation = useMutation({
    mutationFn: reorderMenuItems,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["website-navigation"] }),
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newParentId, setNewParentId] = useState<string>("");
  const [newOrder, setNewOrder] = useState<number>(0);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");

  // Top-level items (no parent)
  const topLevel = [...items]
    .filter((i) => !i.parent_id)
    .sort((a, b) => a.display_order - b.display_order);

  const childrenOf = (parentId: string) =>
    [...items]
      .filter((i) => i.parent_id === parentId)
      .sort((a, b) => a.display_order - b.display_order);

  const moveSiblings = (siblingsGroup: NavigationMenuItem[], index: number, direction: "up" | "down") => {
    const newOrder = [...siblingsGroup];
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newOrder.length) return;
    [newOrder[index], newOrder[swapIndex]] = [newOrder[swapIndex], newOrder[index]];
    const order = newOrder.map((s, i) => ({ id: s.id, display_order: i + 1 }));
    reorderMutation.mutate(order);
  };

  const handleAddItem = () => {
    if (!newLabel.trim()) return;
    const autoOrder = newOrder || (topLevel.length + 1);
    createMutation.mutate(
      {
        label: newLabel.trim(),
        url: newUrl.trim() || undefined,
        parent_id: newParentId || undefined,
        display_order: autoOrder,
      },
      {
        onSuccess: () => {
          setDialogOpen(false);
          setNewLabel("");
          setNewUrl("");
          setNewParentId("");
          setNewOrder(0);
        },
      },
    );
  };

  const handleDelete = (id: string, label: string) => {
    if (!window.confirm(`Delete "${label}"? Any child items will become top-level.`)) return;
    deleteMutation.mutate(id);
  };

  const renderItem = (
    item: NavigationMenuItem,
    siblings: NavigationMenuItem[],
    index: number,
    isChild = false,
  ) => {
    const children = childrenOf(item.id);
    return (
      <div key={item.id} className={isChild ? "ml-8" : ""}>
        <Card className={`transition-opacity ${!item.is_active ? "opacity-50" : ""}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <GripVertical className="h-5 w-5 text-muted-foreground shrink-0 cursor-grab" />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {editingId === item.id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        className="h-7 text-sm w-40"
                        value={editLabel}
                        onChange={(e) => setEditLabel(e.target.value)}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            updateMutation.mutate({ id: item.id, payload: { label: editLabel } });
                            setEditingId(null);
                          }
                          if (e.key === "Escape") setEditingId(null);
                        }}
                      />
                      <Button
                        size="sm"
                        className="h-7 px-2 text-xs"
                        disabled={updateMutation.isPending}
                        onClick={() => {
                          updateMutation.mutate({ id: item.id, payload: { label: editLabel } });
                          setEditingId(null);
                        }}
                      >
                        {updateMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <button
                      className="font-medium text-sm hover:underline text-left"
                      onClick={() => {
                        setEditingId(item.id);
                        setEditLabel(item.label);
                      }}
                    >
                      {item.label}
                    </button>
                  )}
                  {item.url && (
                    <span className="text-xs text-muted-foreground font-mono">{item.url}</span>
                  )}
                  <Badge variant={item.is_active ? "default" : "secondary"} className="text-xs">
                    {item.is_active ? "Visible" : "Hidden"}
                  </Badge>
                </div>
              </div>

              {/* Order controls */}
              <div className="flex flex-col gap-0.5 shrink-0">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  disabled={index === 0 || reorderMutation.isPending}
                  onClick={() => moveSiblings(siblings, index, "up")}
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  disabled={index === siblings.length - 1 || reorderMutation.isPending}
                  onClick={() => moveSiblings(siblings, index, "down")}
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Toggle visibility */}
              <Button
                size="sm"
                variant={item.is_active ? "outline" : "secondary"}
                className="shrink-0 h-8 text-xs"
                disabled={updateMutation.isPending}
                onClick={() =>
                  updateMutation.mutate({ id: item.id, payload: { is_active: !item.is_active } })
                }
              >
                {item.is_active ? (
                  <><EyeOff className="mr-1 h-3.5 w-3.5" />Hide</>
                ) : (
                  <><Eye className="mr-1 h-3.5 w-3.5" />Show</>
                )}
              </Button>

              {/* Delete */}
              <Button
                size="sm"
                variant="ghost"
                className="shrink-0 h-8 w-8 p-0 text-destructive hover:text-destructive"
                disabled={deleteMutation.isPending}
                onClick={() => handleDelete(item.id, item.label)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Render children below */}
        {children.length > 0 && (
          <div className="mt-2 space-y-2 ml-8">
            {children.map((child, ci) =>
              renderItem(child, children, ci, true),
            )}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Manage your website navigation links. Click a label to edit it inline.
        </p>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />Add Menu Item
        </Button>
      </div>

      <div className="space-y-2">
        {topLevel.map((item, index) => renderItem(item, topLevel, index, false))}
        {topLevel.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            No menu items yet. Click &quot;Add Menu Item&quot; to get started.
          </p>
        )}
      </div>

      {/* Add item dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Menu Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="nav-label">Label *</Label>
              <Input
                id="nav-label"
                placeholder="e.g. Admissions"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nav-url">URL</Label>
              <Input
                id="nav-url"
                placeholder="/admissions or #about"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nav-parent">Parent Item (optional — creates dropdown child)</Label>
              <Select value={newParentId} onValueChange={(v) => setNewParentId(v ?? "")}>
                <SelectTrigger id="nav-parent">
                  <SelectValue placeholder="Top-level item" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Top-level item</SelectItem>
                  {topLevel.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nav-order">Display Order</Label>
              <Input
                id="nav-order"
                type="number"
                placeholder={String(topLevel.length + 1)}
                value={newOrder || ""}
                onChange={(e) => setNewOrder(Number(e.target.value))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddItem}
              disabled={!newLabel.trim() || createMutation.isPending}
            >
              {createMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Add Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── CMS Pages Manager ─────────────────────────────────────────────────────────

const EMPTY_PAGE_FORM = {
  title: "",
  slug: "",
  content: "",
  seo_title: "",
  seo_description: "",
  status: "draft" as "draft" | "published",
};

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function CmsPagesManager() {
  const qc = useQueryClient();

  const { data: pages = [], isLoading } = useQuery({
    queryKey: ["website-pages"],
    queryFn: () => listCmsPages(),
  });

  const createMutation = useMutation({
    mutationFn: createCmsPage,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["website-pages"] });
      setDialogOpen(false);
      setForm(EMPTY_PAGE_FORM);
      setEditingId(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof updateCmsPage>[1] }) =>
      updateCmsPage(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["website-pages"] });
      setDialogOpen(false);
      setForm(EMPTY_PAGE_FORM);
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCmsPage,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["website-pages"] }),
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_PAGE_FORM);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  const openNew = () => {
    setForm(EMPTY_PAGE_FORM);
    setEditingId(null);
    setSlugManuallyEdited(false);
    setDialogOpen(true);
  };

  const openEdit = (page: CmsPage) => {
    setForm({
      title: page.title,
      slug: page.slug,
      content: page.content ?? "",
      seo_title: page.seo_title ?? "",
      seo_description: page.seo_description ?? "",
      status: page.status,
    });
    setEditingId(page.id);
    setSlugManuallyEdited(true);
    setDialogOpen(true);
  };

  const handleTitleChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      title: value,
      slug: slugManuallyEdited ? prev.slug : slugify(value),
    }));
  };

  const handleSlugChange = (value: string) => {
    setSlugManuallyEdited(true);
    setForm((prev) => ({ ...prev, slug: value }));
  };

  const handleSubmit = () => {
    const payload = {
      title: form.title,
      slug: form.slug,
      content: form.content || undefined,
      seo_title: form.seo_title || undefined,
      seo_description: form.seo_description || undefined,
      status: form.status,
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (page: CmsPage) => {
    if (!window.confirm(`Delete page "${page.title}"? This action cannot be undone.`)) return;
    deleteMutation.mutate(page.id);
  };

  const handleToggleStatus = (page: CmsPage) => {
    updateMutation.mutate({
      id: page.id,
      payload: { status: page.status === "published" ? "draft" : "published" },
    });
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Create and manage custom pages for your school website.
        </p>
        <Button size="sm" onClick={openNew}>
          <Plus className="mr-1.5 h-4 w-4" />New Page
        </Button>
      </div>

      {pages.length === 0 ? (
        <Card>
          <CardContent className="py-12 flex flex-col items-center justify-center gap-3 text-center">
            <FileText className="h-10 w-10 text-muted-foreground/40" />
            <div>
              <p className="font-medium text-sm">No pages yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Create your first page to add custom content to your website.
              </p>
            </div>
            <Button size="sm" onClick={openNew}>
              <Plus className="mr-1.5 h-4 w-4" />Create First Page
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {pages.map((page) => (
            <Card key={page.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm truncate">{page.title}</span>
                      <Badge
                        variant={page.status === "published" ? "default" : "secondary"}
                        className="text-xs shrink-0"
                      >
                        {page.status === "published" ? "Published" : "Draft"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="text-xs text-muted-foreground font-mono">/{page.slug}</span>
                      {page.seo_title && (
                        <span className="text-xs text-muted-foreground truncate">
                          SEO: {page.seo_title}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Publish/Unpublish toggle */}
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs"
                      disabled={updateMutation.isPending}
                      onClick={() => handleToggleStatus(page)}
                    >
                      {page.status === "published" ? (
                        <><EyeOff className="mr-1 h-3.5 w-3.5" />Unpublish</>
                      ) : (
                        <><Eye className="mr-1 h-3.5 w-3.5" />Publish</>
                      )}
                    </Button>

                    {/* Edit */}
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 w-8 p-0"
                      onClick={() => openEdit(page)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>

                    {/* Delete */}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      disabled={deleteMutation.isPending}
                      onClick={() => handleDelete(page)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditingId(null); setForm(EMPTY_PAGE_FORM); setSlugManuallyEdited(false); } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Page" : "New Page"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto pr-1">
            <div className="space-y-1.5">
              <Label htmlFor="page-title">Title *</Label>
              <Input
                id="page-title"
                placeholder="e.g. About Us"
                value={form.title}
                onChange={(e) => handleTitleChange(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="page-slug">Slug *</Label>
              <Input
                id="page-slug"
                placeholder="about-us"
                value={form.slug}
                onChange={(e) => handleSlugChange(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Lowercase letters, numbers, and hyphens only.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="page-status">Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm((prev) => ({ ...prev, status: v as "draft" | "published" }))}
              >
                <SelectTrigger id="page-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="page-seo-title">SEO Title</Label>
              <Input
                id="page-seo-title"
                placeholder="Title for search engines"
                value={form.seo_title}
                onChange={(e) => setForm((prev) => ({ ...prev, seo_title: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="page-seo-desc">SEO Description</Label>
              <textarea
                id="page-seo-desc"
                rows={2}
                placeholder="Brief description for search engines (150–160 chars)"
                value={form.seo_description}
                onChange={(e) => setForm((prev) => ({ ...prev, seo_description: e.target.value }))}
                className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="page-content">Content (HTML)</Label>
              <textarea
                id="page-content"
                rows={6}
                placeholder="<p>Your page content here...</p>"
                value={form.content}
                onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
                className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!form.title.trim() || !form.slug.trim() || isPending}
            >
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {editingId ? "Save Changes" : "Create Page"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Page Root ─────────────────────────────────────────────────────────────────

export default function WebsitePage() {
  return (
    <div>
      <PageHeader
        title="School Website"
        description="Manage your public website layout, sections, and settings"
      />

      <Tabs defaultValue="sections">
        <TabsList className="mb-5">
          <TabsTrigger value="sections">
            <Globe className="mr-2 h-4 w-4" />Section Manager
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings2 className="mr-2 h-4 w-4" />Website Settings
          </TabsTrigger>
          <TabsTrigger value="navigation">
            <Menu className="mr-2 h-4 w-4" />Navigation
          </TabsTrigger>
          <TabsTrigger value="pages">
            <FileText className="mr-2 h-4 w-4" />Pages
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sections">
          <SectionManager />
        </TabsContent>

        <TabsContent value="settings">
          <WebsiteSettingsTab />
        </TabsContent>

        <TabsContent value="navigation">
          <NavigationMenuBuilder />
        </TabsContent>

        <TabsContent value="pages">
          <CmsPagesManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
