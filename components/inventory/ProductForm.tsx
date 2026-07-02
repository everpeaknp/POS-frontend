'use client';

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';
import { Plus, Loader2 } from 'lucide-react';
import FormField from '@/components/shared/FormField';
import { inventoryApi } from '@/lib/api/inventory';
import { mapDjangoErrorsToForm, getErrorMessage, isValidationError } from '@/lib/utils/form-errors';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

const inputClass = 'h-9 text-sm border-gray-200 focus-visible:ring-[#22C55E]';

const productSchema = z
  .object({
    name: z.string().trim().min(1, 'Product name is required').max(255, 'Name must be 255 characters or less'),
    sku: z
      .string()
      .trim()
      .min(1, 'SKU is required')
      .max(100, 'SKU must be 100 characters or less')
      .regex(/^[A-Za-z0-9._-]+$/, 'SKU can only contain letters, numbers, dots, dashes, and underscores'),
    category: z
      .string()
      .nullable()
      .refine((val) => !!val, 'Category is required'),
    unit: z
      .string()
      .nullable()
      .refine((val) => !!val, 'Unit of measure is required'),
    cost_price: z
      .string()
      .min(1, 'Cost price is required')
      .refine((val) => !Number.isNaN(Number(val)) && Number(val) >= 0, {
        message: 'Enter a valid amount (0 or greater)',
      }),
    selling_price: z
      .string()
      .min(1, 'Selling price is required')
      .refine((val) => !Number.isNaN(Number(val)) && Number(val) >= 0, {
        message: 'Enter a valid amount (0 or greater)',
      }),
    reorder_level: z
      .string()
      .optional()
      .refine((val) => !val || val === '' || (!Number.isNaN(Number(val)) && Number(val) >= 0), {
        message: 'Reorder level must be 0 or greater',
      }),
    description: z.string().max(2000, 'Description is too long').optional().or(z.literal('')),
    status: z.enum(['active', 'inactive', 'discontinued']),
    total_stock: z.number().optional(),
  })
  .superRefine((data, ctx) => {
    const cost = Number(data.cost_price);
    const selling = Number(data.selling_price);
    if (!Number.isNaN(cost) && !Number.isNaN(selling) && selling < cost) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Selling price cannot be less than cost price',
        path: ['selling_price'],
      });
    }
  });

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  productId?: string;
  initialData?: Partial<ProductFormData>;
  onSuccess?: () => void;
  onCancel?: () => void;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2">{title}</h3>
      {children}
    </div>
  );
}

export default function ProductForm({
  productId,
  initialData,
  onSuccess,
  onCancel,
}: ProductFormProps) {
  const [categories, setCategories] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '', parent: '' });

  const [showUnitDialog, setShowUnitDialog] = useState(false);
  const [creatingUnit, setCreatingUnit] = useState(false);
  const [unitForm, setUnitForm] = useState({
    name: '',
    abbreviation: '',
    type: 'count' as 'count' | 'weight' | 'length' | 'volume' | 'area',
  });

  const isEdit = !!productId;

  const emptyDefaults: ProductFormData = {
    name: '',
    sku: '',
    category: null,
    unit: null,
    cost_price: '',
    selling_price: '',
    reorder_level: '0',
    description: '',
    status: 'active',
  };

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    mode: 'onBlur',
    defaultValues: {
      ...emptyDefaults,
      ...initialData,
      category: initialData?.category ? String(initialData.category) : null,
      unit: initialData?.unit ? String(initialData.unit) : null,
      status: initialData?.status ?? 'active',
    },
  });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
    setError,
    setValue,
  } = form;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [categoriesRes, unitsRes] = await Promise.all([
          inventoryApi.categories.list().catch(() => null),
          inventoryApi.units.list().catch(() => null),
        ]);

        const categoriesData = categoriesRes
          ? Array.isArray(categoriesRes.data)
            ? categoriesRes.data
            : (categoriesRes.data as any).results || []
          : [];

        const unitsData = unitsRes
          ? Array.isArray(unitsRes.data)
            ? unitsRes.data
            : (unitsRes.data as any).results || []
          : [];

        setCategories(categoriesData);
        setUnits(unitsData);
      } catch {
        toast.error('Failed to load categories and units');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const hasMissingData = categories.length === 0 || units.length === 0;

  const handleCreateCategory = async () => {
    if (!categoryForm.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    setCreatingCategory(true);
    try {
      const submitData: any = {
        name: categoryForm.name.trim(),
        description: categoryForm.description,
      };
      if (categoryForm.parent) {
        submitData.parent = parseInt(categoryForm.parent);
      }

      const newCategory = await inventoryApi.categories.create(submitData);
      toast.success('Category created successfully');
      setCategories((prev) => [...prev, newCategory.data]);
      setValue('category', String(newCategory.data.id), { shouldValidate: true });
      setShowCategoryDialog(false);
      setCategoryForm({ name: '', description: '', parent: '' });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create category');
    } finally {
      setCreatingCategory(false);
    }
  };

  const handleCreateUnit = async () => {
    if (!unitForm.name.trim() || !unitForm.abbreviation.trim()) {
      toast.error('Unit name and abbreviation are required');
      return;
    }

    setCreatingUnit(true);
    try {
      const newUnit = await inventoryApi.units.create({
        ...unitForm,
        name: unitForm.name.trim(),
        abbreviation: unitForm.abbreviation.trim(),
      });
      toast.success('Unit created successfully');
      setUnits((prev) => [...prev, newUnit.data]);
      setValue('unit', String(newUnit.data.id), { shouldValidate: true });
      setShowUnitDialog(false);
      setUnitForm({ name: '', abbreviation: '', type: 'count' });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create unit');
    } finally {
      setCreatingUnit(false);
    }
  };

  const onSubmit = async (data: ProductFormData) => {
    if (hasMissingData) {
      toast.error('Create at least one category and unit before adding products');
      return;
    }

    try {
      const payload: any = {
        name: data.name.trim(),
        sku: data.sku.trim(),
        category: Number(data.category),
        unit: Number(data.unit),
        cost_price: Number(data.cost_price),
        selling_price: Number(data.selling_price),
        reorder_level: data.reorder_level ? Number(data.reorder_level) : 0,
        description: data.description?.trim() || '',
        status: data.status,
      };

      if (isEdit && productId) {
        await inventoryApi.products.update(Number(productId), payload);
        toast.success('Product updated successfully');
      } else {
        await inventoryApi.products.create(payload);
        toast.success('Product created successfully');
        reset(emptyDefaults);
      }
      onSuccess?.();
    } catch (error: any) {
      if (isValidationError(error)) {
        mapDjangoErrorsToForm(error.response.data, setError, toast.error);
        const errorData = error.response.data;
        if (errorData.sku) {
          const skuError = Array.isArray(errorData.sku) ? errorData.sku[0] : errorData.sku;
          if (String(skuError).includes('already exists') || String(skuError).includes('unique')) {
            setError('sku', { message: 'This SKU is already in use' });
          }
        }
      } else {
        toast.error(getErrorMessage(error));
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#22C55E]" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8" noValidate>
      {hasMissingData && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <strong>Setup required:</strong>
          {categories.length === 0 && (
            <span>
              {' '}
              Add a{' '}
              <a href="/dashboard/inventory/categories" className="font-medium underline hover:text-amber-950">
                category
              </a>
            </span>
          )}
          {units.length === 0 && (
            <span>
              {' '}
              Add a{' '}
              <a href="/dashboard/inventory/uom" className="font-medium underline hover:text-amber-950">
                unit of measure
              </a>
            </span>
          )}
          {' '}before creating products.
        </div>
      )}

      <Section title="Product Details">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <FormField label="Product Name" name="name" error={errors.name} required>
            <Input
              {...register('name')}
              id="name"
              className={cn(inputClass, errors.name && 'border-red-500')}
              placeholder="Enter product name"
            />
          </FormField>

          <FormField label="SKU" name="sku" error={errors.sku} required hint="Unique code, e.g. PROD-001">
            <Input
              {...register('sku')}
              id="sku"
              className={cn(inputClass, errors.sku && 'border-red-500')}
              placeholder="PROD-001"
            />
          </FormField>

          <FormField label="Category" name="category" error={errors.category} required>
            <div className="flex gap-2">
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value ?? null}
                    onValueChange={(value) => field.onChange(value)}
                  >
                    <SelectTrigger className={cn('flex-1', inputClass, errors.category && 'border-red-500')}>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={String(cat.id)}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-9 w-9 shrink-0 border-gray-200 hover:border-[#22C55E] hover:text-[#22C55E]"
                onClick={() => setShowCategoryDialog(true)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </FormField>

          <FormField label="Unit of Measure" name="unit" error={errors.unit} required>
            <div className="flex gap-2">
              <Controller
                name="unit"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value ?? null}
                    onValueChange={(value) => field.onChange(value)}
                  >
                    <SelectTrigger className={cn('flex-1', inputClass, errors.unit && 'border-red-500')}>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map((unit) => (
                        <SelectItem key={unit.id} value={String(unit.id)}>
                          {unit.name} ({unit.abbreviation})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-9 w-9 shrink-0 border-gray-200 hover:border-[#22C55E] hover:text-[#22C55E]"
                onClick={() => setShowUnitDialog(true)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </FormField>
        </div>
      </Section>

      <Section title="Pricing & Inventory">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <FormField label="Cost Price (NPR)" name="cost_price" error={errors.cost_price} required>
            <Input
              {...register('cost_price')}
              id="cost_price"
              type="number"
              min="0"
              step="0.01"
              className={cn(inputClass, errors.cost_price && 'border-red-500')}
              placeholder="0.00"
            />
          </FormField>

          <FormField label="Selling Price (NPR)" name="selling_price" error={errors.selling_price} required>
            <Input
              {...register('selling_price')}
              id="selling_price"
              type="number"
              min="0"
              step="0.01"
              className={cn(inputClass, errors.selling_price && 'border-red-500')}
              placeholder="0.00"
            />
          </FormField>

          <FormField label="Reorder Level" name="reorder_level" error={errors.reorder_level} hint="Low stock alert threshold">
            <Input
              {...register('reorder_level')}
              id="reorder_level"
              type="number"
              min="0"
              step="0.01"
              className={cn(inputClass, errors.reorder_level && 'border-red-500')}
              placeholder="0"
            />
          </FormField>

          <FormField label="Status" name="status" error={errors.status} required>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(value) => field.onChange(value ?? 'active')}
                >
                  <SelectTrigger className={cn(inputClass, errors.status && 'border-red-500')}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="discontinued">Discontinued</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>

          {isEdit && (
            <FormField label="Total Stock" name="total_stock" hint="Current stock across all warehouses">
              <div className="flex h-9 items-center gap-3 rounded-md border border-gray-200 bg-gray-50 px-3">
                <span className="text-sm font-semibold text-gray-900">
                  {(initialData as any)?.total_stock ?? 0}
                </span>
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-xs font-medium',
                    (initialData as any)?.total_stock > 0
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  )}
                >
                  {(initialData as any)?.total_stock > 0 ? 'In Stock' : 'Out of Stock'}
                </span>
              </div>
            </FormField>
          )}
        </div>
      </Section>

      <Section title="Description">
        <FormField label="Description" name="description" error={errors.description}>
          <textarea
            {...register('description')}
            id="description"
            rows={4}
            className={cn(
              'w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E] focus:border-transparent',
              errors.description && 'border-red-500'
            )}
            placeholder="Optional product description"
          />
        </FormField>
      </Section>

      <div className="flex flex-wrap items-center gap-3 border-t border-gray-100 pt-4">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting} className="text-gray-500">
            Cancel
          </Button>
        )}
        {!isEdit && (
          <Button type="button" variant="outline" onClick={() => reset(emptyDefaults)} disabled={isSubmitting} className="border-gray-200">
            Reset
          </Button>
        )}
        <Button
          type="submit"
          disabled={isSubmitting || hasMissingData}
          className="bg-[#22C55E] hover:bg-[#16A34A] text-white px-6"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : isEdit ? (
            'Update Product'
          ) : (
            'Create Product'
          )}
        </Button>
      </div>

      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Add New Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">
                Category Name <span className="text-red-500">*</span>
              </Label>
              <Input
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                placeholder="e.g. Building Materials"
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">Parent Category</Label>
              <select
                value={categoryForm.parent}
                onChange={(e) => setCategoryForm({ ...categoryForm, parent: e.target.value })}
                className={cn(inputClass, 'rounded-md border bg-white px-3')}
              >
                <option value="">None (Root Category)</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.parent_name ? `${cat.parent_name} > ${cat.name}` : cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">Description</Label>
              <Input
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                placeholder="Optional"
                className={inputClass}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t pt-2">
            <Button type="button" variant="outline" onClick={() => setShowCategoryDialog(false)} disabled={creatingCategory}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCreateCategory}
              disabled={creatingCategory}
              className="bg-[#22C55E] hover:bg-[#16A34A] text-white"
            >
              {creatingCategory ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Category'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showUnitDialog} onOpenChange={setShowUnitDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Add New Unit of Measure</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                value={unitForm.name}
                onChange={(e) => setUnitForm({ ...unitForm, name: e.target.value })}
                placeholder="e.g. Kilogram"
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">
                Abbreviation <span className="text-red-500">*</span>
              </Label>
              <Input
                value={unitForm.abbreviation}
                onChange={(e) => setUnitForm({ ...unitForm, abbreviation: e.target.value })}
                placeholder="e.g. Kg"
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">Type</Label>
              <Select value={unitForm.type} onValueChange={(v) => setUnitForm({ ...unitForm, type: v as any })}>
                <SelectTrigger className={inputClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="count">Count</SelectItem>
                  <SelectItem value="weight">Weight</SelectItem>
                  <SelectItem value="length">Length</SelectItem>
                  <SelectItem value="volume">Volume</SelectItem>
                  <SelectItem value="area">Area</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t pt-2">
            <Button type="button" variant="outline" onClick={() => setShowUnitDialog(false)} disabled={creatingUnit}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCreateUnit}
              disabled={creatingUnit}
              className="bg-[#22C55E] hover:bg-[#16A34A] text-white"
            >
              {creatingUnit ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Unit'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </form>
  );
}
