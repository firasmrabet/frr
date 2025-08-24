import { useState, useEffect } from 'react';
import { mergeWithStaticData } from '../services/adminService';

// Hook to get all products (static + custom)
export const useProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const allProducts = await mergeWithStaticData.getProducts();
      setProducts(allProducts);
    } catch (err) {
      setError('Erreur lors du chargement des produits');
      console.error('Error loading products:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour mettre à jour un produit
  const updateProduct = async (id: string, updates: any) => {
    try {
      setLoading(true);
      setError(null);
      // Appel du service pour mettre à jour le produit dans Supabase
      const updated = await mergeWithStaticData.updateProduct(id, updates);
      if (updated) {
        await loadProducts(); // Recharge la liste après modification
      }
      return updated;
    } catch (err) {
      setError('Erreur lors de la mise à jour du produit');
      console.error('Error updating product:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  return {
    products,
    loading,
    error,
    reload: loadProducts,
    updateProduct
  };
};
