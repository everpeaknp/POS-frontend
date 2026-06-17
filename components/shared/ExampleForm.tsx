'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';
import FormField from './FormField';

// Define Zod schema
const productSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(255, 'Name too long'),
  sku: z.string().min(1, 'SKU is required').max(50, 'SKU too long'),
  category: z.string().min(1, 'Category is required'),
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
  description: z.string().optional(),
  status: z.enum(['active', 'inactive']).default('active'),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ExampleFormProps {
  onSubmit: (data: ProductFormData) => Promise<void>;
  initialData?: Partial<ProductFormData>;
  isEdit?: boolean;
}

export default function ExampleForm({
  onSubmit,
  initialData,
  isEdit = false,
}: ExampleFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: initialData || {
      status: 'active',
    },
  });

  const onSubmitHandler = async (data: ProductFormData) => {
    try {
      await onSubmit(data);
      toast.success(isEdit ? 'Product updated successfully!' : 'Product created successfully!');
      if (!isEdit) {
        reset();
      }
    } catch (error: any) {
      const message = error.response?.data?.detail 
        || error.response?.data?.message
        || 'Operation failed. Please try again.';
      toast.error(message);
      
      // Handle field-specific errors from backend
      if (error.response?.data) {
        Object.keys(error.response.data).forEach((field) => {
          if (field !== 'detail' && field !== 'message') {
            toast.error(`${field}: ${error.response.data[field]}`);
          }
        });
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmitHandler)} className="space-y-6">
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
        <select
          {...register('category')}
          id="category"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select category</option>
          <option value="1">Electronics</option>
          <option value="2">Hardware</option>
          <option value="3">Tools</option>
        </select>
      </FormField>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          label="Cost Price"
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
          label="Selling Price"
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
      </div>

      <FormField
        label="Description"
        name="description"
        error={errors.description}
      >
        <textarea
          {...register('description')}
          id="description"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Optional product description"
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
        </select>
      </FormField>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
        </button>
        
        <button
          type="button"
          onClick={() => reset()}
          disabled={isSubmitting}
          className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
        >
          Reset
        </button>
      </div>
    </form>
  );
}
