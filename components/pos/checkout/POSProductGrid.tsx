import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ChevronLeft, ChevronRight, RotateCcw, Filter, Scan, Package, PackagePlus } from "lucide-react";
import type { Product } from "@/lib/api/inventory";
import { useRef, useState } from "react";
import Image from "next/image";
import { useLanguage } from "@/lib/context/LanguageContext";

interface CartItem {
  product: Product;
  quantity: number;
}

interface POSProductGridProps {
  products: Product[];
  filteredProducts: Product[];
  cart: CartItem[];
  searchQuery: string;
  selectedCategory: string;
  showOnlyAvailable: boolean;
  selectedWarehouse: string;
  onSearchChange: (query: string) => void;
  onCategoryChange: (category: string) => void;
  onToggleAvailable: () => void;
  onAddToCart: (product: Product) => void;
  onShowBarcodeScanner: () => void;
  onQuickAddProduct: () => void;
  searchInputRef: React.RefObject<HTMLInputElement>;
}

export function POSProductGrid({
  products,
  filteredProducts,
  cart,
  searchQuery,
  selectedCategory,
  showOnlyAvailable,
  selectedWarehouse,
  onSearchChange,
  onCategoryChange,
  onToggleAvailable,
  onAddToCart,
  onShowBarcodeScanner,
  onQuickAddProduct,
  searchInputRef,
}: POSProductGridProps) {
  const { t } = useLanguage();
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const scrollCategories = (direction: 'left' | 'right') => {
    if (categoryScrollRef.current) {
      const scrollAmount = 300;
      const newScrollLeft = direction === 'left' 
        ? categoryScrollRef.current.scrollLeft - scrollAmount
        : categoryScrollRef.current.scrollLeft + scrollAmount;
      
      categoryScrollRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  const handleReset = () => {
    setIsRefreshing(true);
    onCategoryChange("all");
    onSearchChange("");
    
    // Reset animation after it completes
    setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
  };

  return (
    <>
      {/* Search Bar & Categories */}
      <div className="bg-white dark:bg-gray-900 border-b dark:border-gray-800 shadow-sm">
        <div className="p-4 max-w-7xl mx-auto">
          {/* Search Bar with All Buttons in One Line */}
          <div className="flex items-center gap-3 mb-4">
            {/* Product Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder={t('pos.search_products')}
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 h-12 text-base border-gray-300 dark:border-gray-700 focus:border-slate-500 focus:ring-green-500 shadow-sm dark:bg-gray-800 dark:text-white"
                autoFocus
              />
            </div>
            
            {/* Filter Icons */}
            <button
              onClick={handleReset}
              className="w-12 h-12 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-950 flex items-center justify-center transition-all flex-shrink-0"
              title={t('common.reset')}
            >
              <RotateCcw className={`h-4 w-4 text-gray-600 dark:text-gray-400 transition-transform duration-500 ${isRefreshing ? 'rotate-180' : ''}`} />
            </button>
            <button
              onClick={onToggleAvailable}
              className={`w-12 h-12 rounded-lg border-2 transition-all flex items-center justify-center flex-shrink-0 ${
                showOnlyAvailable 
                  ? 'border-slate-500 bg-slate-50 dark:bg-slate-950 text-slate-600' 
                  : 'border-gray-200 dark:border-gray-700 hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-950 text-gray-600 dark:text-gray-400'
              }`}
              title={showOnlyAvailable ? t('pos.show_available_only') : t('pos.show_all')}
            >
              <Filter className="h-4 w-4" />
            </button>
            <button
              onClick={() => scrollCategories('left')}
              className="w-12 h-12 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-950 flex items-center justify-center transition-all flex-shrink-0"
              title={t('common.scroll_left')}
            >
              <ChevronLeft className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </button>
            <button
              onClick={() => scrollCategories('right')}
              className="w-12 h-12 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-950 flex items-center justify-center transition-all flex-shrink-0"
              title={t('common.scroll_right')}
            >
              <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </button>
            
            <Button
              onClick={onQuickAddProduct}
              variant="outline"
              className="gap-2 h-12 flex-shrink-0 border-gray-300 dark:border-gray-700"
            >
              <PackagePlus className="h-4 w-4" />
              {t('pos.quick_add')}
            </Button>

            <Button
              onClick={onShowBarcodeScanner}
              disabled={!selectedWarehouse}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white gap-2 shadow-md hover:shadow-lg transition-all h-12 flex-shrink-0"
            >
              <Scan className="h-4 w-4" />
              {t('pos.barcode_scan')}
            </Button>
          </div>

          {/* Category Buttons */}
          <div 
            ref={categoryScrollRef}
            className="flex gap-3 overflow-x-auto pb-2 scroll-smooth"
            style={{ 
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            <button
              onClick={() => onCategoryChange("all")}
              className={`px-5 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap text-sm ${
                selectedCategory === "all"
                  ? "bg-slate-600 text-white shadow-md"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-slate-400 dark:hover:border-slate-500"
              }`}
            >
              {t('pos.all_products')} <span className={`font-semibold ${selectedCategory === "all" ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`}>{products.length}</span>
            </button>
            
            {/* Dynamic category buttons based on products */}
            {Array.from(new Set(products.map(p => p.category_name).filter(Boolean))).map((categoryName) => {
              const categoryProducts = products.filter(p => p.category_name === categoryName);
              const categoryId = categoryProducts[0]?.category;
              const categoryKey = categoryId || categoryName;
              const count = categoryProducts.length;
              
              return (
                <button
                  key={categoryName}
                  onClick={() => onCategoryChange(String(categoryKey))}
                  className={`px-5 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap text-sm ${
                    selectedCategory === String(categoryKey)
                      ? "bg-slate-600 text-white shadow-md"
                      : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-slate-400 dark:hover:border-slate-500"
                  }`}
                >
                  {categoryName} <span className={`font-semibold ${selectedCategory === String(categoryKey) ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {filteredProducts.length} {t('pos.product')} {filteredProducts.length !== 1 ? t('pos.available') : t('pos.available')}
            </div>
            {cart.length > 0 && (
              <div className="text-sm font-medium text-slate-600 dark:text-slate-400">
                {cart.length} {t('pos.item')} {cart.length !== 1 ? t('pos.in_cart') : t('pos.in_cart')}
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
            {filteredProducts.map((product) => {
              const stock = product.total_stock || 0;
              const isOutOfStock = stock <= 0;
              const inCart = cart.find(item => item.product.id === product.id);

              return (
                <button
                  key={product.id}
                  onClick={() => !isOutOfStock && onAddToCart(product)}
                  disabled={isOutOfStock}
                  className={`
                    relative text-left rounded-xl border-2 transition-all duration-200 overflow-hidden
                    ${
                      isOutOfStock
                        ? "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 cursor-not-allowed opacity-50"
                        : inCart
                          ? "bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 border-slate-500 shadow-lg scale-[1.02] ring-2 ring-slate-200 dark:ring-slate-800"
                          : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-slate-400 hover:shadow-lg hover:scale-[1.02] active:scale-95"
                    }
                  `}
                >
                  {inCart && (
                    <div className="absolute top-2 left-2 z-10 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm font-bold rounded-full h-7 w-7 flex items-center justify-center shadow-lg ring-2 ring-white dark:ring-gray-800">
                      {inCart.quantity}
                    </div>
                  )}
                  
                  {/* Product Image at Top */}
                  <div className="relative w-full h-32 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
                    {product.image ? (
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Package className="h-8 w-8 text-gray-300 dark:text-gray-600" />
                      </div>
                    )}
                    
                    {/* SKU at bottom of image */}
                    {product.sku && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm px-2 py-0.5">
                        <div className="text-[10px] text-white font-mono truncate">
                          {product.sku}
                        </div>
                      </div>
                    )}
                    
                    {/* Stock Badge on Image */}
                    <div className={`absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-xs font-semibold shadow-md backdrop-blur-sm ${
                      isOutOfStock 
                        ? 'bg-red-500/90 text-white' 
                        : stock < 10
                          ? 'bg-amber-500/90 text-white'
                          : 'bg-slate-500/90 text-white'
                    }`}>
                      {isOutOfStock ? t('pos.out_of_stock') : `${stock}`}
                    </div>
                  </div>
                  
                  {/* Product Details Below Image */}
                  <div className="p-2 space-y-1">
                    {/* Price */}
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Rs.</span>
                      <span className="text-base font-bold text-slate-600 dark:text-slate-400">
                        {Number(product.selling_price).toFixed(0)}
                      </span>
                    </div>
                    
                    {/* Product Name */}
                    <div className="font-medium text-xs text-gray-900 dark:text-gray-100 line-clamp-2 leading-tight">
                      {product.name}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          
          {filteredProducts.length === 0 && (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
                <Search className="h-8 w-8 text-gray-400 dark:text-gray-500" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
                {searchQuery ? t('common.not_found') : t('pos.no_products')}
              </p>
              {searchQuery && (
                <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                  {t('pos.try_search')}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
