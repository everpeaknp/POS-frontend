'use client';

import { useEffect, useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import FormField from '@/components/shared/FormField';
import { DateInput } from '@/components/shared/DateInput';
import { purchaseRequestsAPI } from '@/lib/api/purchase';
import apiClient from '@/lib/api/client';
import { Trash2, Plus } from 'lucide-react';

// Zod schema for line items
const lineItemSchema = z.object({
  product: z.string().min(1, 'Product is required'),
  description: z.string().optional().or(z.literal('')),
  quantity: z.string()
    .min(1, 'Quantity is required')
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: 'Must be a positive number',
    }),
  estimated_unit_price: z.string()
    .min(1, 'Estimated price is required')
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
      message: 'Must be a positive number',
    }),
});

// Zod schema for purchase request
const requestSchema = z.object({
  request_number: z.string().min(1, 'Request number is required').max(50, 'Too long'),
  date: z.string().min(1, 'Date is required'),
  requested_by: z.string().min(1, 'Requester is required'),
  department: z.string().min(1, 'Department is required').max(100, 'Too long'),
  required_by: z.string().min(1, 'Required by date is required'),
  priority: z.enum(['Low', 'Medium', 'High']),
  status: z.enum(['Draft', 'Pending Approval', 'Approved', 'Rejected', 'Converted to PO']),
  notes: z.string().optional().or(z.literal('')),
  lines: z.array(lineItemSchema).min(1, 'At least one item is required'),
});

type RequestFormData = z.infer<typeof requestSchema>;

interface Product {
  id: string;
  name: string;
  sku: string;
  cost_price: string;
  selling_price: string;
}

interface User {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
}

interface RequestFormProps {
  requestId?: string;
  initialData?: Partial<RequestFormData>;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function RequestForm({
  requestId,
  initialData,
  onSuccess,
  onCancel,
}: RequestFormProps) {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const isEdit = !!requestId;

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<RequestFormData>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      status: 'Draft',
      priority: 'Medium',
      notes: '',
      lines: [{ product: '', description: '', quantity: '', estimated_unit_price: '' }],
      ...initialData,
    },
  });

  // useFieldArray for dynamic line items
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'lines',
  });

  // Watch line items to calculate totals
  const watchLines = watch('lines');

  // Calculate estimated amount
  const calculateEstimatedAmount = () => {
    return watchLines.reduce((total, line) => {
      const qty = Number(line.quantity) || 0;
      const price = Number(line.estimated_unit_price) || 0;
      return total + (qty * price);
    }, 0);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch products and users
        const [productsRes, usersRes] = await Promise.all([
          apiClient.get('/inventory/products/'),
          apiClient.get('/users/'),
        ]);
        
        setProducts(productsRes.data.results || productsRes.data || []);
        setUsers(usersRes.data.results || usersRes.data || []);
      } catch (error: any) {
        console.error('Failed to load form data:', error);
        toast.error('Failed to load form data. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const onSubmit = async (data: RequestFormData) => {
    try {
      // Calculate estimated amount
      const estimatedAmount = calculateEstimatedAmount();

      // Transform data to match backend serializer
      const payload: any = {
        request_number: data.request_number,
        date: data.date,
        requested_by: data.requested_by,
        department: data.department,
        required_by: data.required_by,
        estimated_amount: estimatedAmount,
        priority: data.priority,
        status: data.status,
        notes: data.notes || '',
        lines: data.lines.map(line => ({
          product: line.product,
          description: line.description || '',
          quantity: Number(line.quantity),
          estimated_unit_price: Number(line.estimated_unit_price),
        })),
      };

      if (isEdit && requestId) {
        await purchaseRequestsAPI.update(requestId, payload);
        toast.success('Purchase request updated successfully!');
      } else {
        await purchaseRequestsAPI.create(payload);
        toast.success('Purchase request created successfully!');
        reset();
      }

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      } else {
        // Redirect to requests list page
        router.push('/dashboard/purchase/requests');
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
            const fieldErrors = error.response.data[field];
            const errorMsg = Array.isArray(fieldErrors) ? fieldErrors[0] : fieldErrors;
            toast.error(`${field}: ${errorMsg}`);
          }
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading form data...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Request Header */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Request Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            label="Request Number"
            name="request_number"
            error={errors.request_number}
            required
          >
            <input
              {...register('request_number')}
              type="text"
              id="request_number"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="PR-001"
            />
          </FormField>

          <FormField
            label="Date"
            name="date"
            error={errors.date}
            required
          >
            <Controller
              name="date"
              control={control}
              render={({ field }) => (
                <DateInput value={field.value || ''} onChange={field.onChange} />
              )}
            />
          </FormField>

          <FormField
            label="Required By"
            name="required_by"
            error={errors.required_by}
            required
          >
            <Controller
              name="required_by"
              control={control}
              render={({ field }) => (
                <DateInput value={field.value || ''} onChange={field.onChange} />
              )}
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <FormField
            label="Requested By"
            name="requested_by"
            error={errors.requested_by}
            required
          >
            <select
              {...register('requested_by')}
              id="requested_by"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select user</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.first_name} {user.last_name} ({user.username})
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            label="Department"
            name="department"
            error={errors.department}
            required
          >
            <input
              {...register('department')}
              type="text"
              id="department"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Operations"
            />
          </FormField>

          <FormField
            label="Priority"
            name="priority"
            error={errors.priority}
            required
          >
            <select
              {...register('priority')}
              id="priority"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </FormField>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
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
              <option value="Draft">Draft</option>
              <option value="Pending Approval">Pending Approval</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Converted to PO">Converted to PO</option>
            </select>
          </FormField>

          <FormField
            label="Notes"
            name="notes"
            error={errors.notes}
          >
            <input
              {...register('notes')}
              type="text"
              id="notes"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Optional notes"
            />
          </FormField>
        </div>
      </div>

      {/* Line Items */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Items</h3>
          <button
            type="button"
            onClick={() => append({ product: '', description: '', quantity: '', estimated_unit_price: '' })}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        </div>

        {errors.lines && !Array.isArray(errors.lines) && (
          <p className="text-sm text-red-600 mb-4">{errors.lines.message}</p>
        )}

        <div className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-medium text-gray-700">Item {index + 1}</h4>
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="text-red-600 hover:text-red-800 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="Product"
                  name={`lines.${index}.product`}
                  error={errors.lines?.[index]?.product}
                  required
                >
                  <select
                    {...register(`lines.${index}.product`)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select product</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} ({product.sku})
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField
                  label="Description"
                  name={`lines.${index}.description`}
                  error={errors.lines?.[index]?.description}
                >
                  <input
                    {...register(`lines.${index}.description`)}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Optional description"
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <FormField
                  label="Quantity"
                  name={`lines.${index}.quantity`}
                  error={errors.lines?.[index]?.quantity}
                  required
                >
                  <input
                    {...register(`lines.${index}.quantity`)}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </FormField>

                <FormField
                  label="Estimated Unit Price (NPR)"
                  name={`lines.${index}.estimated_unit_price`}
                  error={errors.lines?.[index]?.estimated_unit_price}
                  required
                >
                  <input
                    {...register(`lines.${index}.estimated_unit_price`)}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </FormField>

                <div className="flex flex-col justify-end">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estimated Amount
                  </label>
                  <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700">
                    NPR {(
                      (Number(watchLines[index]?.quantity) || 0) * 
                      (Number(watchLines[index]?.estimated_unit_price) || 0)
                    ).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex justify-end">
            <div className="w-full md:w-1/3">
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Total Estimated Amount:</span>
                <span className="text-blue-600">
                  NPR {calculateEstimatedAmount().toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex gap-3 pt-4 border-t">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {isSubmitting && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          )}
          {isSubmitting ? 'Saving...' : isEdit ? 'Update Request' : 'Create Request'}
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
    </form>
  );
}
