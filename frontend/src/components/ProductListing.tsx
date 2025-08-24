import React, { useState, useMemo } from 'react';
import { Filter, SortDesc, Grid, List } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useDataContext } from '../context/DataContext';
import ProductCard from './ProductCard';
import { Product } from '../types';

interface ProductListingProps {
  onProductClick: (product: Product) => void;
}

export default function ProductListing({ onProductClick }: ProductListingProps) {
  const { state, dispatch } = useAppContext();
  const { categories, products } = useDataContext();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('name');
  const [showFilters, setShowFilters] = useState(false);
  const [localFilters, setLocalFilters] = useState({
    priceMin: 0,
    priceMax: 50000
  });

  // brands removed from listing as per request

  const currentCategory = categories.find(c => c.id === state.selectedCategory);

  // Helper: return the category id for a product (tries category_id, category (if id), or look up by name)
  const resolveProductCategoryId = (prod: any) => {
    if (!prod) return null;
    // Prefer explicit category_id when present
    if (prod.category_id) return prod.category_id;

    // Handle category when it might be an object { id, name } or a string
    const rawCat = prod.category;
    if (!rawCat && rawCat !== 0) return null;

    // If it's an object with id, use it
    if (typeof rawCat === 'object' && rawCat !== null) {
      if (rawCat.id) return rawCat.id;
      if (rawCat.name) {
        const byName = categories.find(c => c.name.toLowerCase() === String(rawCat.name).toLowerCase());
        if (byName) return byName.id;
      }
      return null;
    }

    // If it's a string, try id match first, then name match
    const asString = String(rawCat).trim();
    if (!asString) return null;
    const matchById = categories.find(c => c.id === asString);
    if (matchById) return matchById.id;
    const matchByName = categories.find(c => c.name.toLowerCase() === asString.toLowerCase());
    if (matchByName) return matchByName.id;

    // As a last resort, return the raw value (could be the selectedCategory id)
    return asString;
  };

  // Filter products based on search, category, and filters
  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Filter by category FIRST
  const selectedCatId = state.selectedCategory;
  if (selectedCatId) {
      filtered = filtered.filter(product => {
        const prod: any = product as any;
        // If the product has explicit category_id and matches, accept
        if (prod.category_id && prod.category_id === selectedCatId) return true;
        // If the product has a category string that equals the selected id, accept
        if (prod.category && String(prod.category) === selectedCatId) return true;
        // If category is a name (static products), map name -> id and compare
        if (prod.category) {
          const maybeByName = categories.find(c => c.name.toLowerCase() === String(prod.category).toLowerCase());
          if (maybeByName && maybeByName.id === selectedCatId) return true;
        }
        // Fallback to resolver (handles objects, other shapes)
        const prodCatId = resolveProductCategoryId(prod);
        return prodCatId === selectedCatId;
      });
    }

    // Filter by search query
    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(q) ||
        product.description.toLowerCase().includes(q) ||
        product.brand.toLowerCase().includes(q) ||
        product.tags.some((tag: string) => tag.toLowerCase().includes(q))
      );
    }

    // Filter by price range
    filtered = filtered.filter(product =>
      product.price >= localFilters.priceMin && product.price <= localFilters.priceMax
    );

  // brands filtering removed

  // Stock-based filtering removed — all products shown regardless of stock

    return filtered;
  }, [products, categories, state.selectedCategory, state.searchQuery, localFilters]);

  // Sort products
  const sortedProducts = useMemo(() => {
    const sorted = [...filteredProducts];
    
    switch (sortBy) {
      case 'price-asc':
        return sorted.sort((a, b) => a.price - b.price);
      case 'price-desc':
        return sorted.sort((a, b) => b.price - a.price);
      case 'rating':
        return sorted.sort((a, b) => b.rating - a.rating);
      case 'name':
      default:
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
    }
  }, [filteredProducts, sortBy]);

  

  const handleBrandToggle = (brand: string) => {
    const key = brand; // brand param is the normalized key
    setLocalFilters(prev => ({
      ...prev,
      selectedBrands: prev.selectedBrands.includes(key)
        ? prev.selectedBrands.filter(b => b !== key)
        : [...prev.selectedBrands, key]
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                {currentCategory ? currentCategory.name : 'Tous les produits'}
              </h1>
              <p className="text-gray-600 mt-2">
                {filteredProducts.length} produit{filteredProducts.length !== 1 ? 's' : ''} trouvé{filteredProducts.length !== 1 ? 's' : ''}
                {state.searchQuery && ` pour "${state.searchQuery}"`}
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* View mode toggle */}
              <div className="flex border border-gray-300 rounded-lg">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-600'}`}
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-600'}`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>

              {/* Sort dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="name">Trier par nom</option>
                <option value="price-asc">Prix croissant</option>
                <option value="price-desc">Prix décroissant</option>
                <option value="rating">Meilleures notes</option>
              </select>

              {/* Filter toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                <Filter className="w-5 h-5" />
                <span>Filtres</span>
              </button>
            </div>
            
          </div>

          {/* Active filters display */}
          {(state.searchQuery || state.selectedCategory || localFilters.selectedBrands.length > 0) && (
            <div className="flex flex-wrap items-center space-x-2">
              <span className="text-sm text-gray-600">Filtres actifs:</span>
              {state.searchQuery && (
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                  Recherche: "{state.searchQuery}"
                </span>
              )}
              {state.selectedCategory && (
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                  {currentCategory?.name}
                </span>
              )}
              {/* no brand chips to show */}
            </div>
          )}
        </div>

        <div className="flex gap-8">

          
          {/* Filters sidebar */}
          {showFilters && (
            <div className="w-80 bg-white p-6 rounded-lg shadow-md h-fit">
              <h3 className="text-lg font-semibold mb-4">Filtres</h3>
              
              {/* Price range */}
              <div className="mb-6">
                <h4 className="font-medium mb-3">Prix (TND)</h4>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={localFilters.priceMin}
                      onChange={(e) => setLocalFilters(prev => ({ ...prev, priceMin: Number(e.target.value) }))}
                      className="border border-gray-300 rounded px-3 py-2 text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={localFilters.priceMax}
                      onChange={(e) => setLocalFilters(prev => ({ ...prev, priceMax: Number(e.target.value) }))}
                      className="border border-gray-300 rounded px-3 py-2 text-sm"
                    />
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50000"
                    step="100"
                    value={localFilters.priceMax}
                    onChange={(e) => setLocalFilters(prev => ({ ...prev, priceMax: Number(e.target.value) }))}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Marques removed */}

              {/* Stock filter removed */}

              {/* Reset filters */}
              <button
                onClick={() => setLocalFilters({
                  priceMin: 0,
                  priceMax: 50000
                })}
                className="w-full text-sm text-gray-600 hover:text-gray-800 underline"
              >
                Réinitialiser les filtres
              </button>
            </div>
          )}

          {/* Products grid */}
          <div className="flex-1">
            {sortedProducts.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-xl text-gray-600 mb-4">Aucun produit trouvé</p>
                <button
                    onClick={() => {
                    dispatch({ type: 'SET_SEARCH_QUERY', payload: '' });
                    dispatch({ type: 'SET_CATEGORY', payload: null });
                    setLocalFilters({
                      priceMin: 0,
                      priceMax: 50000,
                      selectedBrands: []
                    });
                  }}
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  Réinitialiser tous les filtres
                </button>
              </div>
            ) : (
              <div className={
                viewMode === 'grid' 
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                  : 'space-y-4'
              }>
                {sortedProducts.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onProductClick={onProductClick}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}