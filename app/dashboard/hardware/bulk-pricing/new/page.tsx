'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { inventoryApi, Product } from '@/lib/api/inventory';
import toast from 'react-hot-toast';

export default function NewHardwareBulkPricingPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    product: '',
    min_quantity: '',
    max_quantity: '',
    unit_price: '',
    discount_percentage: '',
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const data = await inventoryApi.products.list();
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      toast.error('Failed to load products');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.product || !formData.min_quantity || !formData.unit_price) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        product: parseInt(formData.product),
        min_quantity: parseInt(formData.min_quantity),
        max_quantity: formData.max_quantity ? parseInt(formData.max_quantity) : null,
        unit_price: parseFloat(formData.unit_price),
        discount_percentage: formData.discount_percentage ? parseFloat(formData.discount_percentage) : 0,
      };

      await inventoryApi.bulkPricing.create(payload);
      toast.success('Bulk pricing rule created successfully');
      router.push('/dashboard/hardware/bulk-pricing');
    } catch (error: any) {
      console.error('Failed to create bulk pricing:', error);
      toast.error(error.response?.data?.detail || 'Failed to create pricing rule');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create Bulk Pricing Rule</h1>
        <p className="mt-1 text-sm text-gray-600">
          Set up volume-based pricing for hardware products
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        {/* Product Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Product <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.product}
            onChange={(e) => setFormData({ ...formData, product: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#22C55E] focus:border-transparent"
            required
          >
            <option value="">Select a product</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} ({product.sku})
              </option>
            ))}
          </select>
        </div>

        {/* Quantity Range */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Min Quantity <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.min_quantity}
              onChange={(e) => setFormData({ ...formData, min_quantity: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#22C55E] focus:border-transparent"
              min="1"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Quantity
            </label>
            <input
              type="number"
              value={formData.max_quantity}
              onChange={(e) => setFormData({ ...formData, max_quantity: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#22C55E] focus:border-transparent"
              placeholder="Leave empty for unlimited"
            />
          </div>
        </div>

        {/* Pricing */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Unit Price (NPR) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.unit_price}
              onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#22C55E] focus:border-transparent"
              min="0"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Discount %
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.discount_percentage}
              onChange={(e) => setFormData({ ...formData, discount_percentage: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#22C55E] focus:border-transparent"
              min="0"
              max="100"
              placeholder="0"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2 bg-[#22C55E] text-white rounded-lg hover:bg-[#16A34A] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Creating...' : 'Create Pricing Rule'}
          </button>
        </div>
      </form>
    </div>
  );
}
