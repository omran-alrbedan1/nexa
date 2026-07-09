import { useState, useRef, type ChangeEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useToastStore } from '@/stores/toastStore';
import { categoriesApi, type Category } from '../api/categoriesApi';
import { ArrowLeft, FolderTree, Plus, Save, X, Pencil, Trash2, Image as ImageIcon } from 'lucide-react';

const BASE_URL = import.meta.env.DEV ? '' : import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || '';

function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

interface CategoryFormData {
  nameAr: string;
  nameEn: string;
  parentId: number | null;
  sortOrder: number;
  isActive: boolean;
  image: File | null;
}

const emptyForm: CategoryFormData = {
  nameAr: '',
  nameEn: '',
  parentId: null,
  sortOrder: 0,
  isActive: true,
  image: null,
};

export function CategoriesPage() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [form, setForm] = useState<CategoryFormData>(emptyForm);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; category: Category | null }>({ open: false, category: null });

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data: Parameters<typeof categoriesApi.create>[0]) => categoriesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      addToast('success', 'Category created successfully');
      closeModal();
    },
    onError: (err: any) => {
      addToast('error', err?.response?.data?.message || 'Failed to create category');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof categoriesApi.update>[1] }) => categoriesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      addToast('success', 'Category updated successfully');
      closeModal();
    },
    onError: (err: any) => {
      addToast('error', err?.response?.data?.message || 'Failed to update category');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => categoriesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      addToast('success', 'Category deleted successfully');
      setDeleteModal({ open: false, category: null });
    },
    onError: (err: any) => {
      addToast('error', err?.response?.data?.message || 'Failed to delete category');
    },
  });

  const categories = data?.categories ?? [];
  const topLevelCategories = categories.filter((c) => !c.parentId);

  const openCreateModal = () => {
    setEditingCategory(null);
    setForm(emptyForm);
    setImagePreview(null);
    setModalOpen(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setForm({
      nameAr: category.nameAr,
      nameEn: category.nameEn ?? '',
      parentId: category.parentId,
      sortOrder: category.sortOrder,
      isActive: category.isActive,
      image: null,
    });
    setImagePreview(category.image ? `${BASE_URL}/storage/${category.image}` : null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingCategory(null);
    setForm(emptyForm);
    setImagePreview(null);
  };

  const handleFieldChange = (field: keyof CategoryFormData, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setForm((prev) => ({ ...prev, image: file }));
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setForm((prev) => ({ ...prev, image: null }));
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const buildPayload = () => ({
    name_ar: form.nameAr,
    name_en: form.nameEn || undefined,
    parent_id: form.parentId,
    sort_order: form.sortOrder,
    is_active: form.isActive,
    image: form.image || undefined,
  });

  const handleSave = () => {
    if (!form.nameAr.trim()) {
      addToast('error', 'Arabic name is required');
      return;
    }

    const payload = buildPayload();

    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const getImageUrl = (category: Category): string | null => {
    if (!category.image) return null;
    if (category.image.startsWith('http')) return category.image;
    return `${BASE_URL}/storage/${category.image}`;
  };

  if (isError) {
    return (
      <div className="space-y-6 animate-fade-up">
        <div className="min-h-[200px] flex flex-col items-center justify-center bg-white rounded-xl border border-border-default/60 p-8">
          <div className="w-12 h-12 rounded-xl bg-brand-accent-light flex items-center justify-center mb-3">
            <FolderTree size={24} className="text-brand-accent" />
          </div>
          <p className="text-sm font-bold text-text-primary font-display mb-1">Failed to load categories</p>
          <p className="text-xs text-text-secondary font-body mb-4">{error instanceof Error ? error.message : 'An unexpected error occurred'}</p>
          <Button variant="primary" size="sm" onClick={() => refetch()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 bg-gradient-to-br from-purple-500/10 via-purple-50 to-transparent">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/60 backdrop-blur-sm flex items-center justify-center">
              <FolderTree size={22} className="text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary font-display">Categories</h1>
              <p className="text-sm text-text-secondary font-body">Manage product categories and sub-categories</p>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-6 right-6 h-0.5 bg-gradient-to-r from-purple-500 via-brand-primary to-purple-500 rounded-full opacity-30" />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={openCreateModal}>
          Add Category
        </Button>
      </div>

      {/* Category List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <Card padding="lg">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 rounded-full bg-purple-50 flex items-center justify-center mb-4">
            <FolderTree size={32} className="text-purple-400" />
            </div>
            <h3 className="text-lg font-bold text-text-primary font-display mb-1">No categories yet</h3>
            <p className="text-sm text-text-secondary font-body mb-4">Create your first category to organize products</p>
            <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={openCreateModal}>Add Category</Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {topLevelCategories.map((parentCat) => (
            <CategoryCard
              key={parentCat.id}
              category={parentCat}
              allCategories={categories}
              getImageUrl={getImageUrl}
              onEdit={openEditModal}
              onDelete={(cat) => setDeleteModal({ open: true, category: cat })}
            />
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal open={modalOpen} onClose={closeModal} size="xl" title={editingCategory ? 'Edit Category' : 'Add Category'}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-text-primary font-display mb-1">Basic Information</h3>
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">Name (Arabic) *</label>
              <input
                value={form.nameAr}
                onChange={(e) => handleFieldChange('nameAr', e.target.value)}
                className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary"
                placeholder="اسم التصنيف"
                dir="rtl"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">Name (English)</label>
              <input
                value={form.nameEn}
                onChange={(e) => handleFieldChange('nameEn', e.target.value)}
                className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary"
                placeholder="Category name"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">Parent Category</label>
              <select
                value={form.parentId ?? ''}
                onChange={(e) => handleFieldChange('parentId', e.target.value ? Number(e.target.value) : null)}
                className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary"
              >
                <option value="">None (Top-level)</option>
                {categories
                  .filter((c) => !editingCategory || c.id !== editingCategory.id)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nameAr}{c.nameEn ? ` (${c.nameEn})` : ''}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">Sort Order</label>
              <input
                type="number"
                min="0"
                value={form.sortOrder}
                onChange={(e) => handleFieldChange('sortOrder', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">Active</label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => handleFieldChange('isActive', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-primary/30 rounded-full peer-checked:bg-brand-primary transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5" />
              </label>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-text-primary font-display mb-1">Category Image</h3>
            <div
              className={cn(
                'relative border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer',
                imagePreview ? 'border-brand-primary bg-brand-primary-light/20' : 'border-border-default hover:border-brand-primary/50 bg-gray-50'
              )}
              onClick={() => fileInputRef.current?.click()}
            >
              {imagePreview ? (
                <div className="relative inline-block">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-h-40 max-w-full rounded-lg object-contain mx-auto"
                  />
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleRemoveImage(); }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full shadow-md border border-border-default flex items-center justify-center hover:bg-gray-50 transition-colors"
                  >
                    <X size={14} className="text-text-secondary" />
                  </button>
                </div>
              ) : (
                <div className="py-6">
                  <ImageIcon size={36} className="mx-auto mb-2 text-text-tertiary" />
                  <p className="text-sm font-bold text-text-secondary font-display mb-1">Upload Image</p>
                  <p className="text-xs text-text-tertiary font-body">Click to browse or drag & drop</p>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-border-default">
          <Button variant="secondary" size="sm" onClick={closeModal}>Cancel</Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Save size={14} />}
            onClick={handleSave}
            isLoading={createMutation.isPending || updateMutation.isPending}
          >
            {editingCategory ? 'Save Changes' : 'Create Category'}
          </Button>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, category: null })}
        size="sm"
        title={deleteModal.category ? `Delete "${deleteModal.category.nameAr}"` : 'Delete Category'}
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-red-50 border border-red-200">
            <Trash2 size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-text-secondary font-body">
              Are you sure you want to delete <strong>{deleteModal.category?.nameAr}</strong>?
              {deleteModal.category && deleteModal.category.productsCount > 0 && (
                <span className="block mt-1 text-red-600 font-bold">
                  This category has {deleteModal.category.productsCount} product(s) associated with it.
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center justify-end gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setDeleteModal({ open: false, category: null })}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              leftIcon={<Trash2 size={14} />}
              isLoading={deleteMutation.isPending}
              onClick={() => deleteModal.category && deleteMutation.mutate(deleteModal.category.id)}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// --------------- Category Card ---------------

interface CategoryCardProps {
  category: Category;
  allCategories: Category[];
  getImageUrl: (c: Category) => string | null;
  onEdit: (c: Category) => void;
  onDelete: (c: Category) => void;
}

function CategoryCard({ category, allCategories, getImageUrl, onEdit, onDelete }: CategoryCardProps) {
  const [expanded, setExpanded] = useState(false);
  const children = allCategories.filter((c) => c.parentId === category.id);
  const imageUrl = getImageUrl(category);
  const hasChildren = children.length > 0;

  return (
    <Card padding="lg" hover className="flex flex-col">
      {/* Image */}
      {imageUrl && (
        <div className="mb-3 rounded-lg overflow-hidden bg-gray-50">
          <img
            src={imageUrl}
            alt={category.nameAr}
            className="w-full h-36 object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        </div>
      )}

      {/* Info */}
      <div className="flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-text-primary font-display truncate">{category.nameAr}</h3>
            {category.nameEn && (
              <p className="text-xs text-text-secondary font-body truncate mt-0.5">{category.nameEn}</p>
            )}
          </div>
          <Badge variant={category.isActive ? 'green' : 'red'} size="sm">
            {category.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>

        {category.parent && (
          <p className="text-xs text-text-tertiary font-body mt-2">
            Parent: {category.parent.name_ar}
          </p>
        )}

        <p className="text-xs text-text-tertiary font-body mt-1.5">
          Sort order: {category.sortOrder} &middot; {category.productsCount} product(s)
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border-default">
        <Button variant="ghost" size="sm" leftIcon={<Pencil size={12} />} onClick={() => onEdit(category)}>
          Edit
        </Button>
        <Button variant="ghost" size="sm" leftIcon={<Trash2 size={12} />} onClick={() => onDelete(category)} className="text-red-500 hover:text-red-700">
          Delete
        </Button>
      </div>

      {/* Sub-categories */}
      {hasChildren && (
        <div className="mt-3 pt-3 border-t border-border-default">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 text-xs font-bold text-text-secondary hover:text-text-primary transition-colors"
          >
            <span className={cn('transition-transform', expanded && 'rotate-90')}>
              <ArrowLeft size={12} />
            </span>
            {children.length} sub-categor{children.length === 1 ? 'y' : 'ies'}
          </button>
          {expanded && (
            <div className="mt-2 space-y-1.5">
              {children.map((child) => (
                <div key={child.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-text-primary font-body truncate">{child.nameAr}</p>
                    <p className="text-[10px] text-text-tertiary">{child.productsCount} product(s)</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => onEdit(child)}
                      className="p-1 text-text-tertiary hover:text-text-primary transition-colors"
                      title="Edit"
                    >
                      <Pencil size={11} />
                    </button>
                    <button
                      onClick={() => onDelete(child)}
                      className="p-1 text-text-tertiary hover:text-red-600 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}