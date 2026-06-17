'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
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

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(255, 'Name too long'),
  sku: z.string().min(1, 'SKU is required').max(50, 'SKU too long'),
  category: z.string().min(1, 'Category is required'),
  unit: z.string().min(1, 'Unit is required'),
  cost_price: z.string()
    .min(1, 'Cost price is required')
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
      message: 'Must be a valid positive number',
    }),
  selling_price: z.string()
    .min(1, 'Selling price is required')
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
      message: 'Must be a valid positive number',
    }),
  reorder_level: z.string()
    .optional()
    .refine((val) => !val || (!isNaN(Number(val)) && Number(val) >= 0), {
      message: 'Must be a valid positive number',
    }),
  description: z.string().optional().or(z.literal('')),
  status: z.enum(['active', 'inactive', 'discontinued']),
  total_stock: z.number().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  productId?: string;
  initialData?: Partial<ProductFormData>;
  onSuccess?: () => void;
  onCancel?: () => void;
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
  
  // Category dialog state
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
    parent: "",
  });
  
  // Unit dialog state
  const [showUnitDialog, setShowUnitDialog] = useState(false);
  const [creatingUnit, setCreatingUnit] = useState(false);
  const [unitForm, setUnitForm] = useState({
    name: "",
    abbreviation: "",
    type: "count" as "count" | "weight" | "length" | "volume" | "area",
  });

  const isEdit = !!productId;

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      status: 'active',
      reorder_level: '0',
      description: '',
      ...initialData,
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setError,
  } = form;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch categories
        let categoriesData = [];
        try {
          const categoriesRes = await inventoryApi.categories.list();
          categoriesData = Array.isArray(categoriesRes.data) 
            ? categoriesRes.data 
            : (categoriesRes.data as any).results || [];
        } catch (catError: any) {
          console.error('Categories error:', catError);
          if (catError.response?.status === 401) {
            toast.error('Authentication failed. Please login again.');
          } else if (catError.response?.status === 404) {
            toast.error('Categories API endpoint not found.');
          } else {
            toast.error('Failed to load categories. Check if backend is running.');
          }
        }
        
        // Fetch units
        let unitsData = [];
        try {
          const unitsRes = await inventoryApi.units.list();
          unitsData = Array.isArray(unitsRes.data) 
            ? unitsRes.data 
            : (unitsRes.data as any).results || [];
        } catch (unitError: any) {
          console.error('Units error:', unitError);
          if (unitError.response?.status === 401) {
            toast.error('Authentication failed. Please login again.');
          } else if (unitError.response?.status === 404) {
            toast.error('Units API endpoint not found.');
          } else {
            toast.error('Failed to load units. Check if backend is running.');
          }
        }
        
        setCategories(categoriesData);
        setUnits(unitsData);
        
        // Show warning if no data
        if (categoriesData.length === 0) {
          toast.error('No categories found. Please create categories first.', {
            duration: 5000,
          });
        }
        if (unitsData.length === 0) {
          toast.error('No units found. Please create units of measure first.', {
            duration: 5000,
          });
        }
      } catch (error: any) {
        console.error('Failed to load form data:', error);
        toast.error('Failed to load form data. Please check console for details.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCreateCategory = async () => {
    if (!categoryForm.name.trim()) {
      toast.error("Category name is required");
      return;
    }

    setCreatingCategory(true);
    try {
      const submitData: any = {
        name: categoryForm.name,
        description: categoryForm.description
      };
      
      if (categoryForm.parent) {
        submitData.parent = parseInt(categoryForm.parent);
      }

      const newCategory = await inventoryApi.categories.create(submitData);
      toast.success("Category created successfully");
      setCategories([...categories, newCategory.data]);
      form.setValue('category', String(newCategory.data.id));
      setShowCategoryDialog(false);
      setCategoryForm({ name: "", description: "", parent: "" });
    } catch (error: any) {
      console.error("Failed to create category:", error);
      toast.error(error.response?.data?.message || "Failed to create category");
    } finally {
      setCreatingCategory(false);
    }
  };

  const handleCreateUnit = async () => {
    if (!unitForm.name.trim() || !unitForm.abbreviation.trim()) {
      toast.error("Name and abbreviation are required");
      return;
    }

    setCreatingUnit(true);
    try {
      const newUnit = await inventoryApi.units.create(unitForm);
      toast.success("Unit created successfully");
      setUnits([...units, newUnit.data]);
      form.setValue('unit', String(newUnit.data.id));
      setShowUnitDialog(false);
      setUnitForm({ name: "", abbreviation: "", type: "count" });
    } catch (error: any) {
      console.error("Failed to create unit:", error);
      toast.error(error.response?.data?.message || "Failed to create unit");
    } finally {
      setCreatingUnit(false);
    }
  };

  const onSubmit = async (data: ProductFormData) => {
    try {
      // Transform data to match backend expectations
      const payload: any = {
        name: data.name,
        sku: data.sku,
        category: data.category ? Number(data.category) : null,
        unit: Number(data.unit),
        cost_price: Number(data.cost_price),
        selling_price: Number(data.selling_price),
        reorder_level: data.reorder_level ? Number(data.reorder_level) : 0,
        description: data.description || '',
        status: data.status,
      };

      console.log('='.repeat(60));
      console.log('PRODUCT FORM SUBMISSION');
      console.log('='.repeat(60));
      console.log('Form data:', data);
      console.log('Payload:', payload);
      console.log('Available categories:', categories.map(c => ({ id: c.id, name: c.name })));
      console.log('Available units:', units.map(u => ({ id: u.id, name: u.name })));
      console.log('Selected category ID:', payload.category);
      console.log('Selected unit ID:', payload.unit);
      
      // Validate category exists in available categories
      if (payload.category) {
        const categoryExists = categories.some(c => c.id === payload.category);
        console.log('Category exists in dropdown:', categoryExists);
        if (!categoryExists) {
          console.error('WARNING: Selected category not in available categories!');
          toast.error('Invalid category selected. Please refresh the page and try again.');
          return;
        }
      }
      
      // Validate unit exists in available units
      const unitExists = units.some(u => u.id === payload.unit);
      console.log('Unit exists in dropdown:', unitExists);
      if (!unitExists) {
        console.error('WARNING: Selected unit not in available units!');
        toast.error('Invalid unit selected. Please refresh the page and try again.');
        return;
      }
      console.log('='.repeat(60));

      if (isEdit && productId) {
        await inventoryApi.products.update(Number(productId), payload);
        toast.success('Product updated successfully!');
      } else {
        await inventoryApi.products.create(payload);
        toast.success('Product created successfully!');
        reset();
      }
      onSuccess?.();
    } catch (error: any) {
      console.error('Product submission error:', error);
      console.error('Error response:', error.response);
      
      // Use the new error utility for cleaner error handling
      if (isValidationError(error)) {
        // Map Django validation errors to form fields
        mapDjangoErrorsToForm(error.response.data, setError, toast.error);
        
        // Show specific messages for common issues
        const errorData = error.response.data;
        if (errorData.sku) {
          const skuError = Array.isArray(errorData.sku) ? errorData.sku[0] : errorData.sku;
          if (skuError.includes('already exists') || skuError.includes('unique')) {
            toast.error('This SKU already exists. Please use a different SKU.');
          }
        }
      } else {
        // Handle other errors (500, network, etc.)
        toast.error(getErrorMessage(error));
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show warning if no master data
  const hasMissingData = categories.length === 0 || units.length === 0;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {hasMissingData && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Missing Master Data:</strong>
                {categories.length === 0 && (
                  <span> You need to create <a href="/dashboard/inventory/categories" className="underline font-medium hover:text-yellow-800">categories</a> first.</span>
                )}
                {units.length === 0 && (
                  <span> You need to create <a href="/dashboard/inventory/uom" className="underline font-medium hover:text-yellow-800">units of measure</a> first.</span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <FormField
          label="Product Name"
          name="name"
          error={errors.name}
          required
        >
          <input
            {...register('name')}
            type="text"
            id="name"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter product name"
          />
        </FormField>

        <FormField
          label="SKU"
          name="sku"
          error={errors.sku}
          required
          hint="Unique product identifier"
        >
          <input
            {...register('sku')}
            type="text"
            id="sku"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., PROD-001"
          />
        </FormField>

        <FormField
          label="Category"
          name="category"
          error={errors.category}
          required
        >
          <div className="flex gap-2">
            <select
              {...register('category')}
              id="category"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setShowCategoryDialog(true)}
              className="inline-flex items-center justify-center h-10 w-10 rounded-md border border-gray-300 hover:border-[#22C55E] hover:text-[#22C55E] hover:bg-gray-50 transition-colors"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </FormField>

        <FormField
          label="Unit of Measure"
          name="unit"
          error={errors.unit}
          required
        >
          <div className="flex gap-2">
            <select
              {...register('unit')}
              id="unit"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select unit</option>
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name} ({unit.abbreviation})
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setShowUnitDialog(true)}
              className="inline-flex items-center justify-center h-10 w-10 rounded-md border border-gray-300 hover:border-[#22C55E] hover:text-[#22C55E] hover:bg-gray-50 transition-colors"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </FormField>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <FormField
          label="Cost Price (NPR)"
          name="cost_price"
          error={errors.cost_price}
          required
        >
          <input
            {...register('cost_price')}
            type="text"
            id="cost_price"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0.00"
          />
        </FormField>

        <FormField
          label="Selling Price (NPR)"
          name="selling_price"
          error={errors.selling_price}
          required
        >
          <input
            {...register('selling_price')}
            type="text"
            id="selling_price"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0.00"
          />
        </FormField>

        <FormField
          label="Reorder Level"
          name="reorder_level"
          error={errors.reorder_level}
          hint="Low stock alert threshold"
        >
          <input
            {...register('reorder_level')}
            type="text"
            id="reorder_level"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0"
          />
        </FormField>

        <FormField
          label="Status"
          name="status"
          error={errors.status}
          required
        >
          <select
            {...register('status')}
            id="status"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="discontinued">Discontinued</option>
          </select>
        </FormField>

        <FormField
          label="Total Stock"
          name="total_stock"
          hint={isEdit ? "Current stock across all warehouses" : "Stock will be available after product creation"}
        >
          <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 border border-gray-300 rounded-md">
            <span className="text-lg font-semibold text-gray-900">
              {isEdit ? ((initialData as any).total_stock || 0) : 0}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              isEdit && (initialData as any).total_stock > 0
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {isEdit && (initialData as any).total_stock > 0 ? 'In Stock' : 'Out of Stock'}
            </span>
          </div>
        </FormField>
      </div>

      <FormField
        label="Description"
        name="description"
        error={errors.description}
      >
        <textarea
          {...register('description')}
          id="description"
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Optional product description"
        />
      </FormField>

      <div className="flex gap-3 pt-4 border-t">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {isSubmitting && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          )}
          {isSubmitting ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
        </button>
        
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
        )}
        
        {!isEdit && (
          <button
            type="button"
            onClick={() => reset()}
            disabled={isSubmitting}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
          >
            Reset
          </button>
        )}
      </div>

      {/* Category Creation Dialog */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Add New Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">Category Name <span className="text-red-500">*</span></Label>
              <Input
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                placeholder="e.g. Building Materials"
                className="h-9 text-sm border-gray-200"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">Parent Category</Label>
              <select
                value={categoryForm.parent}
                onChange={(e) => setCategoryForm({ ...categoryForm, parent: e.target.value })}
                className="h-9 text-sm border border-gray-200 rounded-md px-3 bg-white focus:outline-none focus:border-[#22C55E]"
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
                className="h-9 text-sm border-gray-200"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowCategoryDialog(false);
                setCategoryForm({ name: "", description: "", parent: "" });
              }}
              disabled={creatingCategory}
            >
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
                "Create Category"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Unit Creation Dialog */}
      <Dialog open={showUnitDialog} onOpenChange={setShowUnitDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Add New Unit of Measure</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">Name <span className="text-red-500">*</span></Label>
              <Input
                value={unitForm.name}
                onChange={(e) => setUnitForm({ ...unitForm, name: e.target.value })}
                placeholder="e.g. Kilogram"
                className="h-9 text-sm border-gray-200"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">Abbreviation <span className="text-red-500">*</span></Label>
              <Input
                value={unitForm.abbreviation}
                onChange={(e) => setUnitForm({ ...unitForm, abbreviation: e.target.value })}
                placeholder="e.g. Kg"
                className="h-9 text-sm border-gray-200"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">Type</Label>
              <Select
                value={unitForm.type}
                onValueChange={(v) => setUnitForm({ ...unitForm, type: v as any })}
              >
                <SelectTrigger className="h-9 text-sm border-gray-200">
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
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowUnitDialog(false);
                setUnitForm({ name: "", abbreviation: "", type: "count" });
              }}
              disabled={creatingUnit}
            >
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
                "Create Unit"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </form>
  );
}
