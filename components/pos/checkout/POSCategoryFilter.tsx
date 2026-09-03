"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight, RotateCcw, Filter } from "lucide-react";
import { type Product } from "@/lib/api/inventory";

interface POSCategoryFilterProps {
  products: Product[];
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  setSearchQuery: (query: string) => void;
}

export function POSCategoryFilter({
  products,
  selectedCategory,
  setSelectedCategory,
  setSearchQuery,
}: POSCategoryFilterProps) {
  const categoryScrollRef = useRef<HTMLDivElement>(null);

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

  const uniqueCategories = Array.from(
    new Set(products.map(p => p.category_name).filter(Boolean))
  );

  return (
    <div className="bg-white border-b shadow-sm">
      <div className="p-4 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">Menu Categories</h3>
          
          {/* Navigation Icons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSelectedCategory("all");
                setSearchQuery("");
              }}
              className="w-9 h-9 rounded-lg border-2 border-gray-200 hover:border-green-500 hover:bg-green-50 flex items-center justify-center transition-all"
              title="Reset filters"
            >
              <RotateCcw className="h-4 w-4 text-gray-600" />
            </button>
            <button
              className="w-9 h-9 rounded-lg border-2 border-gray-200 hover:border-green-500 hover:bg-green-50 flex items-center justify-center transition-all"
              title="Filters"
            >
              <Filter className="h-4 w-4 text-gray-600" />
            </button>
            <button
              onClick={() => scrollCategories('left')}
              className="w-9 h-9 rounded-lg border-2 border-gray-200 hover:border-green-500 hover:bg-green-50 flex items-center justify-center transition-all"
              title="Scroll left"
            >
              <ChevronLeft className="h-4 w-4 text-gray-600" />
            </button>
            <button
              onClick={() => scrollCategories('right')}
              className="w-9 h-9 rounded-lg border-2 border-gray-200 hover:border-green-500 hover:bg-green-50 flex items-center justify-center transition-all"
              title="Scroll right"
            >
              <ChevronRight className="h-4 w-4 text-gray-600" />
            </button>
          </div>
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
            onClick={() => setSelectedCategory("all")}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all whitespace-nowrap ${
              selectedCategory === "all"
                ? "bg-green-50 border-green-500 shadow-md"
                : "bg-white border-gray-200 hover:border-green-300"
            }`}
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white font-bold">
              All
            </div>
            <div className="text-left">
              <div className="font-semibold text-gray-900">All Menus</div>
              <div className="text-xs text-gray-500">{products.length} Items</div>
            </div>
          </button>
          
          {/* Dynamic category buttons */}
          {uniqueCategories.map((categoryName) => {
            const categoryProducts = products.filter(p => p.category_name === categoryName);
            const categoryId = categoryProducts[0]?.category;
            const count = categoryProducts.length;
            
            return (
              <button
                key={categoryName}
                onClick={() => setSelectedCategory(String(categoryId))}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all whitespace-nowrap ${
                  selectedCategory === String(categoryId)
                    ? "bg-green-50 border-green-500 shadow-md"
                    : "bg-white border-gray-200 hover:border-green-300"
                }`}
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                  {categoryName?.charAt(0).toUpperCase()}
                </div>
                <div className="text-left">
                  <div className="font-semibold text-gray-900">{categoryName}</div>
                  <div className="text-xs text-gray-500">{count} Items</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
