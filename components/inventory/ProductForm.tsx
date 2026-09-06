'use client';

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';
import { Plus, Upload, X, ChevronDownIcon, Scan } from "lucide-react";

import FormField from '@/components/shared/FormField';
import { inventoryApi } from '@/lib/api/inventory';
import { mapDjangoErrorsToForm, getErrorMessage, isValidationError } from '@/lib/utils/form-errors';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateInput } from '@/components/shared/DateInput';
import { cn } from '@/lib/utils';
import { BarcodeSkuScanner } from '@/components/barcode/BarcodeSkuScanner';

const inputClass = 'h-9 text-sm border-gray-200 focus-visible:ring-0 focus-visible:border-gray-300';

const productSchema = z
  .object({
    name: z.string().trim().min(1, 'Product name is required').max(255, 'Name must be 255 characters or less'),
    sku: z
      .string()
      .trim()
      .max(100, 'SKU must be 100 characters or less')
      .regex(/^[A-Za-z0-9._-]*$/, 'SKU can only contain letters, numbers, dots, dashes, and underscores')
      .optional()
      .or(z.literal('')),
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
      .optional()
      .or(z.literal(''))
      .refine((val) => !val || val === '' || (!Number.isNaN(Number(val)) && Number(val) >= 0), {
        message: 'Enter a valid amount (0 or greater)',
      }),
    selling_price: z
      .string()
      .min(1, 'Selling price is required')
      .refine((val) => !Number.isNaN(Number(val)) && Number(val) >= 0, {
        message: 'Enter a valid amount (0 or greater)',
      }),
    opening_stock: z
      .string()
      .optional()
      .refine((val) => !val || val === '' || (!Number.isNaN(Number(val)) && Number(val) >= 0), {
        message: 'Opening stock must be 0 or greater',
      }),
    warehouse: z
      .string()
      .nullable()
      .optional(),
    expiry_date: z.string().optional().or(z.literal('')),
    description: z.string().max(2000, 'Description is too long').optional().or(z.literal('')),
    status: z.enum(['active', 'inactive', 'discontinued']),
    total_stock: z.number().optional(),
    image: z.any().optional(),
  })
  .superRefine((data, ctx) => {
    const cost = data.cost_price ? Number(data.cost_price) : 0;
    const selling = Number(data.selling_price);
    if (data.cost_price && !Number.isNaN(cost) && !Number.isNaN(selling) && selling < cost) {
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
  /** Pre-fills the SKU field, e.g. when arriving from a "barcode not found" scan. */
  initialSku?: string;
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
  initialSku,
  onSuccess,
  onCancel,
}: ProductFormProps) {
  const [categories, setCategories] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
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

  const [imagePreview, setImagePreview] = useState<string | undefined>();
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  
  const [categorySearch, setCategorySearch] = useState('');
  const [unitSearch, setUnitSearch] = useState('');
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [unitOpen, setUnitOpen] = useState(false);

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const filteredUnits = units.filter((unit) =>
    unit.name.toLowerCase().includes(unitSearch.toLowerCase()) ||
    unit.abbreviation.toLowerCase().includes(unitSearch.toLowerCase())
  );

  const isEdit = !!productId;

  const emptyDefaults: ProductFormData = {
    name: '',
    sku: '',
    category: null,
    unit: null,
    cost_price: '',
    selling_price: '',
    opening_stock: '0',
    warehouse: null,
    expiry_date: '',
    description: '',
    status: 'active',
  };

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    mode: 'onBlur',
    defaultValues: isEdit && initialData ? {
      name: initialData.name || '',
      sku: initialData.sku || '',
      category: initialData.category ? String(initialData.category) : null,
      unit: initialData.unit ? String(initialData.unit) : null,
      cost_price: initialData.cost_price || '',
      selling_price: initialData.selling_price || '',
      opening_stock: initialData.opening_stock || '0',
      warehouse: initialData.warehouse ? String(initialData.warehouse) : null,
      expiry_date: initialData.expiry_date || '',
      description: initialData.description || '',
      status: initialData.status || 'active',
    } : {
      name: '',
      sku: initialSku || '',
      category: null,
      unit: null,
      cost_price: '',
      selling_price: '',
      opening_stock: '0',
      warehouse: null,
      expiry_date: '',
      description: '',
      status: 'active', // Default to active for new products
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

        const [categoriesRes, unitsRes, warehousesRes] = await Promise.all([
          inventoryApi.categories.list().catch(() => null),
          inventoryApi.units.list().catch(() => null),
          inventoryApi.warehouses.list().catch(() => null),
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

        const warehousesData = warehousesRes
          ? Array.isArray(warehousesRes.data)
            ? warehousesRes.data
            : (warehousesRes.data as any).results || []
          : [];

        setCategories(categoriesData);
        setUnits(unitsData);
        setWarehouses(warehousesData);

        // Set default warehouse for new products after data loads
        if (!isEdit && warehousesData.length > 0) {
          // Try to find warehouse named "Main" (case-insensitive)
          const mainWarehouse = warehousesData.find((w: any) => 
            w.name.toLowerCase().includes('main')
          );
          
          // Use Main warehouse if found, otherwise use first warehouse
          const defaultWarehouse = mainWarehouse || warehousesData[0];
          const warehouseId = String(defaultWarehouse.id);
          
          console.log('Setting default warehouse:', {
            warehouseName: defaultWarehouse.name,
            warehouseId,
            isEdit,
          });
          
          setValue('warehouse', warehouseId);
          
          // Verify it was set
          setTimeout(() => {
            const currentValue = form.getValues('warehouse');
            console.log('Warehouse value after setValue:', currentValue);
          }, 100);
        }

        // Verify status default
        console.log('Status value on load:', form.getValues('status'));

        // Load existing image if editing
        if (initialData?.image) {
          setImagePreview(initialData.image as string);
        }
      } catch {
        toast.error('Failed to load form data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [initialData]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-dropdown]')) {
        setCategoryOpen(false);
        setUnitOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

  const handleImageChange = (file: File | null) => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setValue('image', file);
    } else {
      setImagePreview(undefined);
      setValue('image', null);
    }
  };

  const removeImage = () => {
    setImagePreview(undefined);
    setValue('image', null);
  };

  const onSubmit = async (data: ProductFormData) => {
    if (hasMissingData) {
      toast.error('Create at least one category and unit before adding products');
      return;
    }

    try {
      // Debug logging
      console.log('Form data before submit:', data);
      console.log('Image field:', data.image);
      console.log('Image is File?:', data.image instanceof File);
      
      const formData = new FormData();
      
      formData.append('name', data.name.trim());
      if (data.sku?.trim()) {
        formData.append('sku', data.sku.trim());
      }
      formData.append('category', String(data.category));
      formData.append('unit', String(data.unit));
      formData.append('cost_price', data.cost_price ? String(data.cost_price) : '0');
      formData.append('selling_price', String(data.selling_price));
      formData.append('opening_stock', data.opening_stock ? String(data.opening_stock) : '0');
      if (data.expiry_date?.trim()) {
        formData.append('expiry_date', data.expiry_date.trim());
      }
      formData.append('description', data.description?.trim() || '');
      formData.append('status', data.status);

      // Handle image upload - ONLY append if it's a new File object
      if (data.image && data.image instanceof File) {
        console.log('Appending image to formData:', data.image.name, data.image.type, data.image.size);
        formData.append('image', data.image);
      } else {
        console.log('No image to append or not a File object');
      }

      // Debug: Log all formData entries
      console.log('FormData entries:');
      for (const [key, value] of formData.entries()) {
        console.log(`  ${key}:`, value instanceof File ? `File(${value.name})` : value);
      }

      if (isEdit && productId) {
        await inventoryApi.products.update(Number(productId), formData);
        toast.success('Product updated successfully');
      } else {
        await inventoryApi.products.create(formData);
        toast.success('Product created successfully');
        reset(emptyDefaults);
        setImagePreview(undefined);
      }
      onSuccess?.();
    } catch (error: any) {
      console.error('Submit error:', error);
      console.error('Error response:', error.response?.data);
      
      if (isValidationError(error)) {
        mapDjangoErrorsToForm(error.response.data, setError, toast.error);
        const errorData = error.response.data;
        if (errorData.sku) {
          const skuError = Array.isArray(errorData.sku) ? errorData.sku[0] : errorData.sku;
          if (String(skuError).includes('already exists') || String(skuError).includes('unique')) {
            setError('sku', { message: 'This SKU is already in use' });
          }
        }
        // Log image error for debugging
        if (errorData.image) {
          console.error('Image upload error:', errorData.image);
          toast.error(`Image error: ${JSON.stringify(errorData.image)}`);
        }
      } else {
        toast.error(getErrorMessage(error));
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">

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

          <FormField label="Category" name="category" error={errors.category} required>
            <div className="flex gap-2">
              <div className="flex-1 relative" data-dropdown>
                <Controller
                  name="category"
                  control={control}
                  render={({ field }) => {
                    const selectedCategory = categories.find(c => String(c.id) === field.value);
                    return (
                      <>
                        <button
                          type="button"
                          onClick={() => setCategoryOpen(!categoryOpen)}
                          className={cn(
                            'flex w-full items-center justify-between h-9 px-3 text-sm border rounded-md bg-white',
                            inputClass,
                            errors.category && 'border-red-500',
                            !field.value && 'text-gray-500'
                          )}
                        >
                          <span className="truncate">
                            {selectedCategory ? selectedCategory.name : 'Select category'}
                          </span>
                          <ChevronDownIcon className="h-4 w-4 opacity-50" />
                        </button>
                        {categoryOpen && (
                          <div className="absolute top-full left-0 right-0 mt-1 z-50 max-h-64 overflow-auto rounded-lg bg-white shadow-lg border border-gray-200">
                            <div className="px-2 py-1.5 border-b bg-white sticky top-0">
                              <Input
                                placeholder="Search categories..."
                                value={categorySearch}
                                onChange={(e) => setCategorySearch(e.target.value)}
                                className="h-8 text-sm"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                            <div className="p-1">
                              {filteredCategories.length === 0 ? (
                                <div className="py-6 text-center text-sm text-gray-500">No category found</div>
                              ) : (
                                filteredCategories.map((cat) => (
                                  <div
                                    key={cat.id}
                                    onClick={() => {
                                      field.onChange(String(cat.id));
                                      setCategoryOpen(false);
                                      setCategorySearch('');
                                    }}
                                    className={cn(
                                      "px-2 py-1.5 text-sm rounded cursor-pointer hover:bg-gray-100",
                                      field.value === String(cat.id) && "bg-gray-100 font-medium"
                                    )}
                                  >
                                    {cat.name}
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    );
                  }}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-9 w-9 shrink-0 border-gray-200 hover:border-[var(--color-accent-custom,#22C55E)] hover:text-[var(--color-accent-custom,#22C55E)]"
                onClick={() => setShowCategoryDialog(true)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </FormField>

          <FormField label="Unit of Measure" name="unit" error={errors.unit} required>
            <div className="flex gap-2">
              <div className="flex-1 relative" data-dropdown>
                <Controller
                  name="unit"
                  control={control}
                  render={({ field }) => {
                    const selectedUnit = units.find(u => String(u.id) === field.value);
                    return (
                      <>
                        <button
                          type="button"
                          onClick={() => setUnitOpen(!unitOpen)}
                          className={cn(
                            'flex w-full items-center justify-between h-9 px-3 text-sm border rounded-md bg-white',
                            inputClass,
                            errors.unit && 'border-red-500',
                            !field.value && 'text-gray-500'
                          )}
                        >
                          <span className="truncate">
                            {selectedUnit ? `${selectedUnit.name} (${selectedUnit.abbreviation})` : 'Select unit'}
                          </span>
                          <ChevronDownIcon className="h-4 w-4 opacity-50" />
                        </button>
                        {unitOpen && (
                          <div className="absolute top-full left-0 right-0 mt-1 z-50 max-h-64 overflow-auto rounded-lg bg-white shadow-lg border border-gray-200">
                            <div className="px-2 py-1.5 border-b bg-white sticky top-0">
                              <Input
                                placeholder="Search units..."
                                value={unitSearch}
                                onChange={(e) => setUnitSearch(e.target.value)}
                                className="h-8 text-sm"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                            <div className="p-1">
                              {filteredUnits.length === 0 ? (
                                <div className="py-6 text-center text-sm text-gray-500">No unit found</div>
                              ) : (
                                filteredUnits.map((unit) => (
                                  <div
                                    key={unit.id}
                                    onClick={() => {
                                      field.onChange(String(unit.id));
                                      setUnitOpen(false);
                                      setUnitSearch('');
                                    }}
                                    className={cn(
                                      "px-2 py-1.5 text-sm rounded cursor-pointer hover:bg-gray-100",
                                      field.value === String(unit.id) && "bg-gray-100 font-medium"
                                    )}
                                  >
                                    {unit.name} ({unit.abbreviation})
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    );
                  }}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-9 w-9 shrink-0 border-gray-200 hover:border-[var(--color-accent-custom,#22C55E)] hover:text-[var(--color-accent-custom,#22C55E)]"
                onClick={() => setShowUnitDialog(true)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
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

          <FormField label="Cost Price (NPR)" name="cost_price" error={errors.cost_price}>
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

          <FormField label="SKU" name="sku" error={errors.sku} hint="Unique code, e.g. PROD-001 (optional)">
            <div className="flex gap-2">
              <Input
                {...register('sku')}
                id="sku"
                className={cn(inputClass, errors.sku && 'border-red-500')}
                placeholder="PROD-001"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-9 w-9 shrink-0 border-gray-200 hover:border-[var(--color-accent-custom,#22C55E)] hover:text-[var(--color-accent-custom,#22C55E)]"
                onClick={() => setShowBarcodeScanner(true)}
                title="Scan Barcode"
              >
                <Scan className="h-4 w-4" />
              </Button>
            </div>
          </FormField>

          <FormField label="Opening Stock" name="opening_stock" error={errors.opening_stock} hint="Initial stock quantity">
            <Input
              {...register('opening_stock')}
              id="opening_stock"
              type="number"
              min="0"
              step="0.01"
              className={cn(inputClass, errors.opening_stock && 'border-red-500')}
              placeholder="0"
            />
          </FormField>

          <FormField label="Warehouse" name="warehouse" error={errors.warehouse} hint="Select warehouse for opening stock">
            <Controller
              name="warehouse"
              control={control}
              render={({ field }) => (
                <Select 
                  key={field.value || 'empty'} 
                  value={field.value || ''} 
                  onValueChange={field.onChange}
                >
                  <SelectTrigger className={cn(inputClass, errors.warehouse && 'border-red-500')}>
                    <SelectValue placeholder="Select warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((warehouse) => (
                      <SelectItem key={warehouse.id} value={String(warehouse.id)}>
                        {warehouse.name} - {warehouse.location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>

          <FormField label="Status" name="status" error={errors.status} required hint="Product availability status">
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select key={field.value} value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className={cn(inputClass, errors.status && 'border-red-500')}>
                    <SelectValue placeholder="Select status" />
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

          <FormField label="Expiry Date" name="expiry_date" error={errors.expiry_date} hint="Optional — enables expiry alerts for perishable stock">
            <Controller
              name="expiry_date"
              control={control}
              render={({ field }) => (
                <DateInput
                  value={field.value || ''}
                  onChange={(value) => field.onChange(value)}
                  className={cn(inputClass, errors.expiry_date && 'border-red-500')}
                />
              )}
            />
          </FormField>
        </div>
      </Section>

      <Section title="Additional Information">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-2">
            <FormField label="Description" name="description" error={errors.description}>
              <textarea
                {...register('description')}
                id="description"
                className={cn(
                  'w-full h-40 rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-gray-300 resize-none',
                  errors.description && 'border-red-500'
                )}
                placeholder="Optional product description"
              />
            </FormField>
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-gray-700">Product Image</Label>
            <div className="relative">
              {imagePreview ? (
                <div className="relative group">
                  <img
                    src={imagePreview}
                    alt="Product"
                    className="w-full h-40 object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="image"
                  className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[var(--color-accent-custom,#22C55E)] hover:bg-gray-50 transition-colors"
                >
                  <Upload className="h-10 w-10 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600 font-medium">Click to upload image</span>
                  <span className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</span>
                  <input
                    id="image"
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 5 * 1024 * 1024) {
                          toast.error('Image size must be less than 5MB');
                          return;
                        }
                        handleImageChange(file);
                      }
                    }}
                  />
                </label>
              )}
            </div>
          </div>
        </div>
      </Section>

      <div className="flex flex-wrap items-center gap-3 border-t border-gray-100 pt-4">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting} className="gap-1.5 text-gray-500 hover:text-gray-900">
            <ChevronDownIcon className="h-4 w-4 rotate-90" />
            Back
          </Button>
        )}
        <div className="flex-1"></div>
        {!isEdit && (
          <Button type="button" variant="outline" onClick={() => reset(emptyDefaults)} disabled={isSubmitting} className="border-gray-200">
            Reset
          </Button>
        )}
        <Button
          type="submit"
          disabled={isSubmitting || hasMissingData}
          className="bg-[var(--color-accent-custom,#22C55E)] hover:bg-[#16A34A] text-white px-6"
        >
          {isSubmitting ? "Saving..." : isEdit ? (
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
              className="bg-[var(--color-accent-custom,#22C55E)] hover:bg-[#16A34A] text-white"
            >
              {creatingCategory ? "Creating..." : (
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
              className="bg-[var(--color-accent-custom,#22C55E)] hover:bg-[#16A34A] text-white"
            >
              {creatingUnit ? "Creating..." : (
                'Create Unit'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Barcode Scanner - same scanner modal used in POS checkout */}
      <BarcodeSkuScanner
        open={showBarcodeScanner}
        onClose={() => setShowBarcodeScanner(false)}
        onBarcodeScanned={(barcode) => {
          setValue('sku', barcode, { shouldValidate: true });
          setShowBarcodeScanner(false);
          toast.success(`Barcode ${barcode} added to SKU field`);
        }}
      />
    </form>
  );
}
