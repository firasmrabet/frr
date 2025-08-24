import { useState, useEffect } from 'react';
import { mergeWithStaticData } from '../services/adminService';

// Hook to get all categories (static + custom)
export const useCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const allCategories = await mergeWithStaticData.getCategories();
      setCategories(allCategories);
    } catch (err) {
      setError('Erreur lors du chargement des catégories');
      console.error('Error loading categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  return {
    categories,
    loading,
    error,
    reload: loadCategories
  };
};
