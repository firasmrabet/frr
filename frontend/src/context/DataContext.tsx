import React, { createContext, useContext, useState, useEffect } from 'react';
import { mergeWithStaticData } from '../services/adminService';

interface DataContextType {
  categories: any[];
  products: any[];
  loading: boolean;
  error: string | null;
  reloadData: () => Promise<void>;
  addProduct: (prod: any) => void;
  updateProductInContext: (id: string, updates: any) => void;
  removeProductInContext: (id: string) => void;
}

const DataContext = createContext<DataContextType | null>(null);

export const useDataContext = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useDataContext must be used within a DataProvider');
  }
  return context;
};

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load categories and products in parallel
      const [categoriesData, productsData] = await Promise.all([
        mergeWithStaticData.getCategories(),
        mergeWithStaticData.getProducts()
      ]);

      // Normalize category.characteristics to a consistent array of strings so
      // downstream forms can reliably render inputs per characteristic.
      const normalizedCategories = (categoriesData || []).map((c: any) => {
        const cat = { ...c };
        const ch = cat.characteristics;
        if (!ch) {
          cat.characteristics = [];
        } else if (Array.isArray(ch)) {
          cat.characteristics = ch.map((x: any) => String(x).trim()).filter((x: string) => x);
        } else if (typeof ch === 'string') {
          try {
            const parsed = JSON.parse(ch);
            if (Array.isArray(parsed)) cat.characteristics = parsed.map((x: any) => String(x).trim()).filter((x: string) => x);
            else cat.characteristics = [String(parsed).trim()];
          } catch (e) {
            cat.characteristics = ch.split(/[,\n\r]+/).map((s: string) => s.trim()).filter((s: string) => s);
          }
        } else if (typeof ch === 'object') {
          cat.characteristics = Object.keys(ch).map(k => String(k));
        } else {
          cat.characteristics = [];
        }
        return cat;
      });

      setCategories(normalizedCategories);
      setProducts(productsData);
      // Debugging: log counts so we can confirm custom products are merged
      try {
        const customCount = (productsData || []).filter((p: any) => p.isCustom).length;
        console.debug(`[DataContext] Loaded ${categoriesData.length} categories, ${productsData.length} products (${customCount} custom)`);
      } catch (e) {}
    } catch (err) {
      setError('Erreur lors du chargement des données');
      console.error('Error loading data:', err);

      // Fallback to empty arrays to prevent crashes
      setCategories([]);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const reloadData = async () => {
    await loadData();
  };

  // Add a created custom product to the local merged products array
  const addProduct = (prod: any) => {
    try {
      if (!prod) return;
      // Normalize into the merged format used by mergeWithStaticData
      const merged = {
        id: prod.id,
        name: prod.name,
        description: prod.description,
        price: prod.price,
        image: prod.image,
        images: prod.images || (prod.image ? [prod.image] : []),
        // keep both fields for compatibility
        category: prod.category_id || prod.category || null,
        category_id: prod.category_id || prod.category || null,
        rating: prod.rating ?? 0,
        reviews: prod.reviews ?? 0,
        brand: prod.brand || 'Custom',
        tags: prod.tags || [],
        variations: prod.variations || [],
        characteristics: prod.characteristics || {},
        isCustom: true,
        created_at: prod.created_at,
        updated_at: prod.updated_at
      };
      setProducts(prev => [merged, ...prev]);
    } catch (e) {
      console.error('addProduct error', e);
    }
  };

  const updateProductInContext = (id: string, updates: any) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const removeProductInContext = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  return (
    <DataContext.Provider value={{
      categories,
      products,
      loading,
      error,
      reloadData,
      addProduct,
      updateProductInContext,
      removeProductInContext
    }}>
      {children}
    </DataContext.Provider>
  );
}
