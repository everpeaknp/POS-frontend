import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ChevronLeft, ChevronRight, RotateCcw, Filter, Scan, Package } from "lucide-react";
import type { Product } from "@/lib/api/inventory";
import { useRef, useState } from "react";
import Image from "next/image";

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
  searchInputRef,
}: POSProductGridProps) {
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
                placeholder="Search products by name, SKU, or category..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 h-12 text-base border-gray-300 dark:border-gray-700 focus:border-green-500 focus:ring-green-500 shadow-sm dark:bg-gray-800 dark:text-white"
                autoFocus
              />
            </div>
            
            {/* Filter Icons */}
            <button
              onClick={handleReset}
              className="w-12 h-12 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-950 flex items-center justify-center transition-all flex-shrink-0"
              title="Reset filters"
            >
              <RotateCcw className={`h-4 w-4 text-gray-600 dark:text-gray-400 transition-transform duration-500 ${isRefreshing ? 'rotate-180' : ''}`} />
            </button>
            <button
              onClick={onToggleAvailable}
              className={`w-12 h-12 rounded-lg border-2 transition-all flex items-center justify-center flex-shrink-0 ${
                showOnlyAvailable 
                  ? 'border-green-500 bg-green-50 dark:bg-green-950 text-green-600' 
                  : 'border-gray-200 dark:border-gray-700 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-950 text-gray-600 dark:text-gray-400'
              }`}
              title={showOnlyAvailable ? "Showing available only (click to show all)" : "Showing all products (click to show available only)"}
            >
              <Filter className="h-4 w-4" />
            </button>
            <button
              onClick={() => scrollCategories('left')}
              className="w-12 h-12 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-950 flex items-center justify-center transition-all flex-shrink-0"
              title="Scroll left"
            >
              <ChevronLeft className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </button>
            <button
              onClick={() => scrollCategories('right')}
              className="w-12 h-12 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-950 flex items-center justify-center transition-all flex-shrink-0"
              title="Scroll right"
            >
              <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </button>
            
            <Button
              onClick={onShowBarcodeScanner}
              disabled={!selectedWarehouse}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white gap-2 shadow-md hover:shadow-lg transition-all h-12 flex-shrink-0"
            >
              <Scan className="h-4 w-4" />
              Scan Barcode
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
                  ? "bg-green-600 text-white shadow-md"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-green-400 dark:hover:border-green-500"
              }`}
            >
              All Products <span className={`font-semibold ${selectedCategory === "all" ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`}>{products.length}</span>
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
                      ? "bg-green-600 text-white shadow-md"
                      : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-green-400 dark:hover:border-green-500"
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
              {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} available
            </div>
            {cart.length > 0 && (
              <div className="text-sm font-medium text-green-600 dark:text-green-400">
                {cart.length} item{cart.length !== 1 ? 's' : ''} in cart
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
                          ? "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-500 shadow-lg scale-[1.02] ring-2 ring-green-200 dark:ring-green-800"
                          : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-green-400 hover:shadow-lg hover:scale-[1.02] active:scale-95"
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
                          : 'bg-green-500/90 text-white'
                    }`}>
                      {isOutOfStock ? 'Out' : `${stock}`}
                    </div>
                  </div>
                  
                  {/* Product Details Below Image */}
                  <div className="p-2 space-y-1">
                    {/* Price */}
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Rs.</span>
                      <span className="text-base font-bold text-green-600 dark:text-green-400">
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
                {searchQuery ? "No products found" : "No products available"}
              </p>
              {searchQuery && (
                <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                  Try a different search term
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
