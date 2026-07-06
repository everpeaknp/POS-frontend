import { KhataSpinner } from "@/components/shared/KhataSpinner";
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';
import { constructionApi, Site } from '@/lib/api/construction';
import { inventoryApi, Product, Stock } from '@/lib/api/inventory';
import FormField from '@/components/shared/FormField';
import { formatNPR } from '@/lib/utils';

const consumptionSchema = z.object({
  site: z.string().min(1, 'Site is required'),
  daily_log: z.string().optional(),
  product: z.string().min(1, 'Product is required'),
  quantity: z.string()
    .min(1, 'Quantity is required')
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: 'Must be a positive number',
    }),
  unit_cost: z.string()
    .min(1, 'Unit cost is required')
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
      message: 'Must be a valid number',
    }),
  notes: z.string().optional(),
});

type ConsumptionFormData = z.infer<typeof consumptionSchema>;

interface MaterialConsumptionFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function MaterialConsumptionForm({
  onSuccess,
  onCancel,
}: MaterialConsumptionFormProps) {
  const [sites, setSites] = useState<Site[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [availableStock, setAvailableStock] = useState<Stock | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingStock, setCheckingStock] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ConsumptionFormData>({
    resolver: zodResolver(consumptionSchema),
  });

  const selectedSite = watch('site');
  const selectedProduct = watch('product');
  const quantity = watch('quantity');
  const unitCost = watch('unit_cost');

  // Calculate total cost
  const totalCost = quantity && unitCost 
    ? Number(quantity) * Number(unitCost) 
    : 0;

  // Fetch sites on mount
  useEffect(() => {
    const fetchSites = async () => {
      try {
        setLoading(true);
        const sitesData = await constructionApi.sites.list();
        setSites(Array.isArray(sitesData) ? sitesData.filter((s: Site) => s.warehouse) : []);
      } catch (error) {
        console.error('Failed to load sites:', error);
        toast.error('Failed to load sites');
      } finally {
        setLoading(false);
      }
    };
    fetchSites();
  }, []);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const productsData = await inventoryApi.products.list();
        setProducts(Array.isArray(productsData) ? productsData : []);
      } catch (error) {
        console.error('Failed to load products:', error);
        toast.error('Failed to load products');
      }
    };
    fetchProducts();
  }, []);

  // Check stock availability when site and product are selected
  useEffect(() => {
    if (!selectedSite || !selectedProduct) {
      setAvailableStock(null);
      return;
    }

    const checkStock = async () => {
      try {
        setCheckingStock(true);
        
        // Get the site's warehouse
        const site = sites.find(s => s.id === selectedSite);
        if (!site) return;

        // Fetch stock for this product at this warehouse
        const stocksData = await inventoryApi.stocks.list({
          product: selectedProduct,
          warehouse: site.warehouse,
        });
        
        const stocksArray = Array.isArray(stocksData) ? stocksData : [];
        if (stocksArray.length > 0) {
          setAvailableStock(stocksArray[0]);
          
          // Auto-fill unit cost with product's cost price
          const product = products.find(p => p.id === selectedProduct);
          if (product && !unitCost) {
            setValue('unit_cost', product.cost_price.toString());
          }
        } else {
          setAvailableStock(null);
          toast.error('No stock available for this product at the selected site');
        }
      } catch (error) {
        console.error('Failed to check stock:', error);
        setAvailableStock(null);
      } finally {
        setCheckingStock(false);
      }
    };

    checkStock();
  }, [selectedSite, selectedProduct, sites, products, setValue, unitCost]);

  const onSubmit = async (data: ConsumptionFormData) => {
    try {
      // Validate stock availability
      if (!availableStock) {
        toast.error('No stock available for this product at the selected site');
        return;
      }

      const requestedQty = Number(data.quantity);
      if (requestedQty > availableStock.quantity) {
        toast.error(
          `Insufficient stock. Available: ${availableStock.quantity} ${availableStock.unit}, Requested: ${requestedQty}`
        );
        return;
      }

      const payload = {
        site: data.site,
        product: data.product,
        quantity: requestedQty,
        unit_cost: Number(data.unit_cost),
        notes: data.notes || '',
        // daily_log will be created automatically or linked if provided
      };

      await constructionApi.materialConsumption.create(payload);
      
      toast.success('Material consumption logged successfully');
      reset();
      setAvailableStock(null);
      onSuccess?.();
    } catch (error: any) {
      console.error('Failed to log consumption:', error);
      
      if (error.response?.status === 400) {
        const errorData = error.response.data;
        
        // Handle specific validation errors
        Object.keys(errorData).forEach(field => {
          const fieldErrors = errorData[field];
          const errorMsg = Array.isArray(fieldErrors) ? fieldErrors[0] : fieldErrors;
          toast.error(`${field}: ${errorMsg}`);
        });
      } else {
        const message = error.response?.data?.detail || 'Failed to log material consumption';
        toast.error(message);
      }
    }
  };

  const selectedProductData = products.find(p => p.id === selectedProduct);
  const selectedSiteData = sites.find(s => s.id === selectedSite);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-6">Log Material Consumption</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Site Selection */}
        <FormField
          label="Construction Site"
          name="site"
          error={errors.site}
          required
        >
          <select
            {...register('site')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Site</option>
            {sites.map(site => (
              <option key={site.id} value={site.id}>
                {site.name} - {site.location}
              </option>
            ))}
          </select>
        </FormField>

        {selectedSiteData && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-sm text-blue-800">
              <span className="font-medium">Warehouse:</span> {selectedSiteData.warehouse_name}
            </p>
          </div>
        )}

        {/* Product Selection */}
        <FormField
          label="Product/Material"
          name="product"
          error={errors.product}
          required
        >
          <select
            {...register('product')}
            disabled={!selectedSite}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          >
            <option value="">Select Product</option>
            {products.map(product => (
              <option key={product.id} value={product.id}>
                {product.name} ({product.sku}) - {product.unit_name}
              </option>
            ))}
          </select>
        </FormField>

        {/* Stock Availability */}
        {checkingStock && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <KhataSpinner variant="onPrimary" />
            Checking stock availability...
          </div>
        )}

        {availableStock && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-green-800">Stock Available</p>
                <p className="text-sm text-green-700 mt-1">
                  {availableStock.quantity} {availableStock.unit} available at {selectedSiteData?.warehouse_name}
                </p>
              </div>
            </div>
          </div>
        )}

        {selectedProduct && !checkingStock && !availableStock && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-red-800">No Stock Available</p>
                <p className="text-sm text-red-700 mt-1">
                  This product has no stock at the selected site's warehouse
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Quantity and Unit Cost */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            label={`Quantity ${selectedProductData ? `(${selectedProductData.unit_name})` : ''}`}
            name="quantity"
            error={errors.quantity}
            required
          >
            <input
              type="number"
              step="0.01"
              {...register('quantity')}
              disabled={!availableStock}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              placeholder="0.00"
            />
          </FormField>

          <FormField
            label="Unit Cost (NPR)"
            name="unit_cost"
            error={errors.unit_cost}
            required
            hint="Cost per unit at time of consumption"
          >
            <input
              type="number"
              step="0.01"
              {...register('unit_cost')}
              disabled={!availableStock}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              placeholder="0.00"
            />
          </FormField>
        </div>

        {/* Total Cost Display */}
        {totalCost > 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Total Cost:</span>
              <span className="text-lg font-bold text-gray-900">{formatNPR(totalCost)}</span>
            </div>
          </div>
        )}

        {/* Notes */}
        <FormField
          label="Notes"
          name="notes"
          error={errors.notes}
        >
          <textarea
            {...register('notes')}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Optional notes about this consumption"
          />
        </FormField>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t">
          <button
            type="submit"
            disabled={isSubmitting || !availableStock}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isSubmitting && (
              <KhataSpinner variant="onPrimary" />
            )}
            {isSubmitting ? 'Logging...' : 'Log Consumption'}
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

          <button
            type="button"
            onClick={() => {
              reset();
              setAvailableStock(null);
            }}
            disabled={isSubmitting}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
          >
            Reset
          </button>
        </div>
      </form>

      {/* Info Box */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">Important Notes:</h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Material consumption automatically deducts stock from the site's warehouse</li>
          <li>A stock movement record is created for audit trail</li>
          <li>The cost is added to the site's material expenses</li>
          <li>Accounting journal entry is created: Debit Construction Expense, Credit Inventory Asset</li>
        </ul>
      </div>
    </div>
  );
}
