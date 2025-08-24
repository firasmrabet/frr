import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { categoriesService, productsService, CustomCategory, CustomProduct } from '../services/adminService';
import { useDataContext } from '../context/DataContext';
import { useCategories } from '../hooks/useCategories';
import { useProducts } from '../hooks/useProducts';
import { supabase } from '../supabaseClient';

export default function AdminPage(): JSX.Element | null {
  const { state } = useAppContext();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'categories' | 'products'>('categories');

  React.useEffect(() => {
    if (!state.isAdmin) navigate('/');
  }, [state.isAdmin, navigate]);

  if (!state.isAdmin) return null;

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded shadow">
        <h1 className="text-2xl font-bold mb-4">Interface Admin</h1>
        
        <div className="flex items-center justify-between">
          <div className="flex gap-3 items-center">
            <button onClick={() => navigate('/')} className="px-4 py-2 bg-blue-600 text-white rounded">Retour au site</button>
            <nav className="ml-4 inline-flex rounded-md bg-gray-100 p-1" aria-label="Admin tabs">
              <button
                onClick={() => setActiveTab('categories')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === 'categories' ? 'bg-white text-gray-900 shadow' : 'text-gray-600 hover:bg-white'}`}
              >
                Catégories
              </button>
              <button
                onClick={() => setActiveTab('products')}
                className={`ml-1 px-4 py-2 rounded-md text-sm font-medium ${activeTab === 'products' ? 'bg-white text-gray-900 shadow' : 'text-gray-600 hover:bg-white'}`}
              >
                Produits
              </button>
            </nav>
          </div>
        </div>

        {/* Render only the active management panel so the screen shows one section at a time */}
        <div className="mt-6">
          {activeTab === 'categories' ? (
            <div className="space-y-6">
              <CategoriesManagement />
            </div>
          ) : (
            <div className="space-y-6">
              <ProductsManagement />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper: convert a File to a data URL (base64) for immediate preview/storage
// Upload file to Supabase Storage 'images' bucket and return public URL
const uploadFileToSupabase = async (file: File, pathPrefix = 'uploads') => {
    const path = `${pathPrefix}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-_]/g, '_')}`;
    const { error: uploadErr } = await supabase.storage.from('images').upload(path, file, { upsert: true });
  if (uploadErr) throw uploadErr;
  const publicUrl = supabase.storage.from('images').getPublicUrl(path).data.publicUrl;
  return publicUrl;
};

// Sanitize image URL before saving to DB
const sanitizeImageUrl = (url?: string) => {
  if (!url) return '';
  const trimmed = String(url).trim();
  // Replace obviously-broken test CDN references
  if (/your\.cdn/i.test(trimmed)) return '/placeholder-image.svg';
  // Accept local relative paths or http(s) urls
  if (/^(https?:\/\/|\/)/i.test(trimmed)) return trimmed;
  // Fallback to placeholder
  return '/placeholder-image.svg';
};

// Check that an image URL actually loads (with timeout). Returns true if load succeeds.
const checkImageExists = (url: string, timeout = 5000): Promise<boolean> => {
  return new Promise((resolve) => {
    if (!url) return resolve(false);
    try {
      const img = new Image();
      let done = false;
      const timer = setTimeout(() => {
        if (!done) { done = true; resolve(false); }
      }, timeout);
      img.onload = () => { if (!done) { done = true; clearTimeout(timer); resolve(true); } };
      img.onerror = () => { if (!done) { done = true; clearTimeout(timer); resolve(false); } };
      img.src = url;
      // In some environments setting src after onload/onerror may trigger sync events
    } catch (e) {
      return resolve(false);
    }
  });
};

// Categories Management Component
function CategoriesManagement() {
  const [categories, setCategories] = useState<CustomCategory[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CustomCategory | null>(null);
  const [loading, setLoading] = useState(true);

  // Load categories
  useEffect(() => {
    loadCategories();
  }, []);

  // Access global data reload so we can notify the DataContext after changes
  const { reloadData } = useDataContext();

  const loadCategories = async () => {
    setLoading(true);
    const data = await categoriesService.getAll();
    setCategories(data);
    setLoading(false);
  };

  const { reload } = useCategories();
  const handleSaveCategory = async (categoryData: Omit<CustomCategory, 'id' | 'created_at' | 'updated_at'>) => {
    // sanitize image before saving
    const categoryToSave = { ...categoryData, image: sanitizeImageUrl((categoryData as any).image) };
    if (editingCategory) {
      // Update existing category
      const updated = await categoriesService.update(editingCategory.id, categoryToSave);
      if (updated) {
        await loadCategories();
  // refresh global merged data so ProductForm sees new characteristics
  await reloadData();
  reload();
        setEditingCategory(null);
      }
    } else {
      // Create new category
      const created = await categoriesService.create(categoryToSave);
      if (created) {
        await loadCategories();
  // refresh global merged data so ProductForm sees new categories immediately
  await reloadData();
  reload();
        setShowAddForm(false);
      }
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ? Tous les produits associés seront également supprimés.')) {
      const success = await categoriesService.delete(id);
      if (success) {
        await loadCategories();
  // refresh global merged data after deletion
  await reloadData();
      }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Catégories</h2>
        <button
          onClick={() => { setEditingCategory(null); setShowAddForm(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Ajouter une catégorie
        </button>
      </div>

      {(showAddForm || editingCategory) && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h3 className="text-lg font-medium mb-4">
            {editingCategory ? 'Modifier la Catégorie' : 'Nouvelle Catégorie'}
          </h3>
          <CategoryForm
            category={editingCategory}
            onCancel={() => {
              setShowAddForm(false);
              setEditingCategory(null);
            }}
            onSave={handleSaveCategory}
          />
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md">
        {loading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Chargement...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="p-6">
            <div className="text-center text-gray-500 py-8">
              Aucune catégorie personnalisée pour le moment.
              <br />
              Cliquez sur "Ajouter une catégorie" pour commencer.
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Catégorie
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Caractéristiques
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categories.map((category) => (
                  <tr key={category.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img
                          className="h-10 w-10 rounded-lg object-cover mr-3"
                          src={sanitizeImageUrl(category.image || '/placeholder-image.svg')}
                          alt={category.name}
                          onError={(e) => { e.currentTarget.src = '/placeholder-image.svg'; }}
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{category.name}</div>
                          <div className="text-sm text-gray-500">
                            Créée le {new Date(category.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {category.description || 'Aucune description'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {category.characteristics.length} caractéristique(s)
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => { setShowAddForm(false); setEditingCategory(category); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// Products Management Component
function ProductsManagement() {
  // Use DataContext hook for global reload and immediate UI updates
  // Pull merged categories (static + custom) from the global DataContext so the
    // admin product form can select any category shown in the site's header.
    const { reloadData, addProduct, updateProductInContext, removeProductInContext, categories } = useDataContext();
  const [products, setProducts] = useState<CustomProduct[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<CustomProduct | null>(null);
  const [loading, setLoading] = useState(true);

  // Provide a sorted & grouped categories list for admin UI.
  // Keep a full sorted list (static first, custom next) for display mapping,
  // but also expose `customCategories` which contains only admin-created categories
  // — this will be used by the ProductForm select so it shows only admin categories.
  const sortedCategories = useMemo(() => {
    if (!categories || categories.length === 0) return [];
    const staticCats = categories.filter((c: any) => !c.isCustom).slice().sort((a: any, b: any) => a.name.localeCompare(b.name));
    const customCats = categories.filter((c: any) => c.isCustom).slice().sort((a: any, b: any) => a.name.localeCompare(b.name));
    return [...staticCats, ...customCats];
  }, [categories]);

  // Only admin-created categories (used for the ProductForm select)
  const customCategories = useMemo(() => {
    if (!categories || categories.length === 0) return [];
    // Normalize characteristics shape for custom categories to always be an array of strings
    return categories
      .filter((c: any) => c.isCustom)
      .map((c: any) => {
        const cat = { ...c };
        const ch = cat.characteristics;
        if (!ch) {
          cat.characteristics = [];
        } else if (Array.isArray(ch)) {
          cat.characteristics = ch.map((x: any) => String(x).trim()).filter((x: string) => x);
        } else if (typeof ch === 'string') {
          // try parse JSON array like string, else split by comma/newline
          try {
            const parsed = JSON.parse(ch);
            if (Array.isArray(parsed)) cat.characteristics = parsed.map((x: any) => String(x).trim()).filter((x: string) => x);
            else cat.characteristics = [String(parsed).trim()];
          } catch (e) {
            cat.characteristics = ch.split(/[,\n]/).map((s: string) => s.trim()).filter((s: string) => s);
          }
        } else if (typeof ch === 'object') {
          cat.characteristics = Object.keys(ch).map(k => String(k));
        } else {
          cat.characteristics = [];
        }
        return cat;
      })
      .slice()
      .sort((a: any, b: any) => a.name.localeCompare(b.name));
  }, [categories]);

  // Load products and categories
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
  setLoading(true);
  const productsData = await productsService.getAll();
  setProducts(productsData);
  setLoading(false);
  };

  const { reload, updateProduct } = useProducts();
  const handleSaveProduct = async (productData: Omit<CustomProduct, 'id' | 'created_at' | 'updated_at'>) => {
    if (editingProduct) {
      // Update existing product via hook
      const updated = await updateProduct(editingProduct.id, productData);
      if (updated) {
        // update local admin list and global merged list
        await loadData();
        reload();
        updateProductInContext(editingProduct.id, updated);
        await reloadData();
        setEditingProduct(null);
        return updated;
      }
    } else {
      // Create new product
      const created = await productsService.create(productData);
      if (created) {
        // prepend to admin local and global merged list so it appears immediately
        await loadData();
        reload();
        addProduct(created);
        await reloadData();
        setShowAddForm(false);
        return created;
      }
    }
    return null;
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      const success = await productsService.delete(id);
      if (success) {
        await loadData();
        removeProductInContext(id);
      }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Produits</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center disabled:opacity-50"
          disabled={customCategories.length === 0}
        >
          <Plus className="w-4 h-4 mr-2" />
          Ajouter un produit
        </button>
      </div>

  {customCategories.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-yellow-800">
    Vous devez d'abord créer au moins une catégorie personnalisée (onglet Catégories) avant de pouvoir ajouter des produits.
          </p>
        </div>
      )}

  {(showAddForm || editingProduct) && customCategories.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h3 className="text-lg font-medium mb-4">
            {editingProduct ? 'Modifier le Produit' : 'Nouveau Produit'}
          </h3>
          <ProductForm
            product={editingProduct}
    categories={customCategories}
            onCancel={() => {
              setShowAddForm(false);
              setEditingProduct(null);
            }}
            onSave={handleSaveProduct}
          />
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md">
        {loading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Chargement...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="p-6">
            <div className="text-center text-gray-500 py-8">
              Aucun produit personnalisé pour le moment.
              <br />
              {categories.length > 0 ? 'Cliquez sur "Ajouter un produit" pour commencer.' : 'Créez d\'abord une catégorie.'}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Produit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Catégorie
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prix
                  </th>
                  {/* Stock column removed intentionally */}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img
                          className="h-10 w-10 rounded-lg object-cover mr-3"
                          src={sanitizeImageUrl(product.image || '/placeholder-image.svg')}
                          alt={product.name}
                          onError={(e) => { e.currentTarget.src = '/placeholder-image.svg'; }}
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-500 max-w-xs truncate">
                            {product.description || 'Aucune description'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                        {sortedCategories.find((cat: any) => cat.id === product.category_id)?.name || 'Catégorie supprimée'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {product.price.toLocaleString()} TND
                      </div>
                    </td>
                    {/* Stock display removed from admin products table */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => { setShowAddForm(false); setEditingProduct(product); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// Category Form Component
function CategoryForm({
  category,
  onCancel,
  onSave
}: {
    category?: CustomCategory | null;
    onCancel: () => void;
  onSave: (data: Omit<CustomCategory, 'id' | 'created_at' | 'updated_at'>) => void;
}) {
  const { state } = useAppContext();
  const [formData, setFormData] = useState({
    name: category?.name || '',
    description: category?.description || '',
    image: category?.image || '',
  characteristics: (category?.characteristics && category.characteristics.length) ? category.characteristics : ['']
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addCharacteristic = () => {
    setFormData(prev => ({
      ...prev,
      characteristics: [...prev.characteristics, '']
    }));
  };

  const removeCharacteristic = (index: number) => {
    setFormData(prev => ({
      ...prev,
      characteristics: prev.characteristics.filter((_, i) => i !== index)
    }));
  };

  const updateCharacteristic = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      characteristics: prev.characteristics.map((char, i) => i === index ? value : char)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setSaving(true);
    setError(null);
    try {
      // Vérifie la session utilisateur Supabase
      const { supabase } = await import('../supabaseClient');
      const { data } = await supabase.auth.getSession();
      const email = data.session?.user?.email;
      if (!email || !state.isAdmin) {
        setError('Vous devez être connecté en tant qu’admin pour ajouter une catégorie.');
        setSaving(false);
        return;
      }
      // Require a valid image URL before saving
      const imageUrl = (formData.image || '').trim();
      if (!imageUrl) {
        setError('Veuillez coller une URL d\'image valide.');
        setSaving(false);
        return;
      }
      const imgOk = await checkImageExists(sanitizeImageUrl(imageUrl));
      if (!imgOk) {
        setError('L\'URL de l\'image est invalide ou l\'image ne peut pas être chargée.');
        setSaving(false);
        return;
      }
      await onSave({
        name: formData.name.trim(),
        description: formData.description.trim(),
        image: formData.image.trim(),
        characteristics: formData.characteristics.filter(char => char.trim() !== '')
      });
    } catch (err) {
      setError('Erreur lors de l’ajout de la catégorie. Vérifiez votre connexion ou vos droits.');
      console.error('Erreur ajout catégorie:', err);
    } finally {
      setSaving(false);
    }
  };

  // When the category prop changes (e.g. clicking edit on another row), reset the form data
  useEffect(() => {
    setFormData({
      name: category?.name || '',
      description: category?.description || '',
      image: category?.image || '',
      characteristics: (category?.characteristics && category.characteristics.length) ? category.characteristics : ['']
    });
  }, [category]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-100 text-red-700 p-2 rounded mb-2 text-sm">
          {error}
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nom de la catégorie *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Ex: Transformateurs haute tension"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          rows={3}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Description de la catégorie..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Image (collez l'URL)
        </label>
        <input
          type="url"
          value={formData.image}
          onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value.trim() }))}
          placeholder="https://example.com/image.jpg"
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        />
        {formData.image && (
          <img src={sanitizeImageUrl(formData.image)} alt="preview" className="mt-3 h-32 object-contain" />
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Caractéristiques spécifiques à cette catégorie
        </label>
        {formData.characteristics.map((char, index) => (
          <div key={index} className="flex items-center space-x-2 mb-2">
            <input
              type="text"
              value={char}
              onChange={(e) => updateCharacteristic(index, e.target.value)}
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ex: Puissance, Tension, Fréquence..."
            />
            {formData.characteristics.length > 1 && (
              <button
                type="button"
                onClick={() => removeCharacteristic(index)}
                className="text-red-600 hover:text-red-800"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
        <div className="mt-2">
          <button
            type="button"
            onClick={addCharacteristic}
            className="px-3 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 text-sm"
          >
            + Ajouter une caractéristique
          </button>
        </div>
        <button
          type="submit"
          disabled={saving || !formData.name.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
        >
          {saving && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          )}
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
    </form>
  );
}

// Product Form Component
function ProductForm({
  product,
  categories = [],
  onCancel,
  onSave
}: {
    product?: CustomProduct | null;
    categories: CustomCategory[];
  onCancel: () => void;
  onSave: (data: Omit<CustomProduct, 'id' | 'created_at' | 'updated_at'>) => Promise<any | null>;
}) {
  const { state } = useAppContext();
  const [formData, setFormData] = useState({
  name: product?.name || '',
  description: product?.description || '',
  price: product?.price || 0,
  image: product?.image || '',
  category_id: product?.category_id || (categories[0]?.id || ''),
  characteristics: product?.characteristics || {},
  characteristicsRaw: product && product.characteristics ? Object.entries(product.characteristics).map(([k,v]) => `${k}: ${v}`).join('\n') : '',
  variations: product?.variations || [],
  stock: product?.stock ?? 1
  });

  const [saving, setSaving] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CustomCategory | null>(
    categories.find(cat => cat.id === formData.category_id) || categories[0] || null
  );

  // If creating a new product and there is at least one admin category, preselect it so
  // its characteristic inputs are shown immediately.
  useEffect(() => {
    if (!product && categories && categories.length > 0) {
      const first = categories[0];
      if (first && !formData.category_id) {
        setFormData(prev => ({ ...prev, category_id: first.id }));
        setSelectedCategory(first as CustomCategory);
      }
    }
  }, [product, categories]);

  // Update characteristics when category changes
  useEffect(() => {
    if (selectedCategory && !product) {
      // Initialize characteristics for new product.
      // Support two shapes coming from categories: an array of names or an object mapping.
      const newCharacteristics: { [key: string]: string } = {};
      if (Array.isArray(selectedCategory.characteristics) && selectedCategory.characteristics.length > 0) {
        selectedCategory.characteristics.forEach((char: string) => {
          newCharacteristics[char] = '';
        });
      } else if (selectedCategory.characteristics && typeof selectedCategory.characteristics === 'object') {
        Object.keys(selectedCategory.characteristics).forEach((char: string) => {
          newCharacteristics[char] = '';
        });
      }
  // Also populate the freeform textarea representation so admin can edit in bulk
  const raw = Object.entries(newCharacteristics).map(([k, v]) => `${k}: ${v}`).join('\n');
  setFormData(prev => ({ ...prev, characteristics: newCharacteristics, characteristicsRaw: raw }));
    }
  }, [selectedCategory, product]);

  const handleCategoryChange = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    setSelectedCategory(category || null);
    setFormData(prev => ({
      ...prev,
      category_id: categoryId,
      // Reset characteristics when changing category. Support array or object shapes.
      characteristics: (category && Array.isArray(category.characteristics))
        ? category.characteristics.reduce((acc: any, char: string) => ({ ...acc, [char]: '' }), {})
        : (category && category.characteristics && typeof category.characteristics === 'object')
          ? Object.keys(category.characteristics).reduce((acc: any, char: string) => ({ ...acc, [char]: '' }), {})
          : {}
    }));
  };

  // Compute characteristic keys to render (supports array or object on the category)
  const characteristicKeys = useMemo(() => {
    if (!selectedCategory) return [] as string[];
    if (Array.isArray(selectedCategory.characteristics)) return selectedCategory.characteristics as string[];
    if (selectedCategory.characteristics && typeof selectedCategory.characteristics === 'object') return Object.keys(selectedCategory.characteristics as Record<string, any>);
    return [] as string[];
  }, [selectedCategory]);

  const handleCharacteristicChange = (characteristic: string, value: string) => {
    const newChars = {
      ...formData.characteristics,
      [characteristic]: value
    };
    const raw = Object.entries(newChars).map(([k, v]) => `${k}: ${v}`).join('\n');
    setFormData(prev => ({
      ...prev,
      characteristics: newChars,
      characteristicsRaw: raw
    }));
  };

  /*
  const fillFromCategory = () => {
    if (!selectedCategory) return;
    const ch = selectedCategory.characteristics;
    const result: { [k: string]: string } = {};
    if (Array.isArray(ch)) {
      ch.forEach((k: string) => { result[k] = formData.characteristics[k] || '' });
    } else if (ch && typeof ch === 'object') {
      // keep values if present in the object
      Object.keys(ch).forEach((k: string) => { result[k] = String((ch as any)[k] ?? formData.characteristics[k] ?? '') });
    }
  // Also update textarea representation
  const raw = Object.entries(result).map(([k, v]) => `${k}: ${v}`).join('\n');
  setFormData(prev => ({ ...prev, characteristics: result, characteristicsRaw: raw }));
  };
  */

  const parseCharacteristicsRaw = (raw: string) => {
    const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
    const obj: { [k: string]: string } = {};
    lines.forEach(line => {
      const sepIndex = line.indexOf(':');
      if (sepIndex === -1) return;
      const key = line.slice(0, sepIndex).trim();
      const val = line.slice(sepIndex + 1).trim();
      if (key) obj[key] = val;
    });
    return obj;
  };

  // When the admin edits the textarea directly, parse it and update the characteristics object
  const handleCharacteristicsRawChange = (raw: string) => {
    const parsed = parseCharacteristicsRaw(raw);
    setFormData(prev => ({ ...prev, characteristicsRaw: raw, characteristics: { ...prev.characteristics, ...parsed } }));
  };

  /*
  const addVariation = () => {
    setFormData(prev => ({
      ...prev,
      variations: [
        ...prev.variations,
        {
          type: '',
          options: [{ name: '', price: 0 }]
        }
      ]
    }));
  };

  const removeVariation = (index: number) => {
    setFormData(prev => ({
      ...prev,
      variations: prev.variations.filter((_, i) => i !== index)
    }));
  };

  const updateVariation = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      variations: prev.variations.map((variation, i) =>
        i === index ? { ...variation, [field]: value } : variation
      )
    }));
  };

  const addVariationOption = (variationIndex: number) => {
    setFormData(prev => ({
      ...prev,
      variations: prev.variations.map((variation, i) =>
        i === variationIndex
          ? { ...variation, options: [...variation.options, { name: '', price: 0 }] }
          : variation
      )
    }));
  };

  const removeVariationOption = (variationIndex: number, optionIndex: number) => {
    setFormData(prev => ({
      ...prev,
      variations: prev.variations.map((variation, i) =>
        i === variationIndex
          ? { ...variation, options: variation.options.filter((_, j) => j !== optionIndex) }
          : variation
      )
    }));
  };

  const updateVariationOption = (variationIndex: number, optionIndex: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      variations: prev.variations.map((variation, i) =>
        i === variationIndex
          ? {
              ...variation,
              options: variation.options.map((option, j) =>
                j === optionIndex ? { ...option, [field]: value } : option
              )
            }
          : variation
      )
    }));
  };
  */

  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.category_id || formData.price <= 0) return;

    setSaving(true);
    setError(null);
    try {
      // Vérifie la session utilisateur Supabase
      const { supabase } = await import('../supabaseClient');
      const { data } = await supabase.auth.getSession();
      const email = data.session?.user?.email;
  if (!email || !state.isAdmin) {
        setError('Vous devez être connecté en tant qu’admin pour ajouter un produit.');
        setSaving(false);
        return;
      }
      // Require a valid image URL before saving product
      const imageUrl = (formData.image || '').trim();
      if (!imageUrl) {
        setError('Veuillez coller une URL d\'image valide pour le produit.');
        setSaving(false);
        return;
      }
      const imgOk = await checkImageExists(sanitizeImageUrl(imageUrl));
      if (!imgOk) {
        setError('L\'URL de l\'image du produit est invalide ou l\'image ne peut pas être chargée.');
        setSaving(false);
        return;
      }
      // Ensure category_id is a UUID that exists in custom_categories.
      // If admin selected a static category, create or find a corresponding custom category.
      let categoryIdToUse = formData.category_id;
      const selectedCat = categories.find(c => c.id === formData.category_id) || null;
  if (selectedCat && !(selectedCat as any).isCustom) {
        // Try to find an existing custom category with the same name
        const existingCustom = (await categoriesService.getAll()).find((cc: any) => cc.name.toLowerCase() === String(selectedCat.name).toLowerCase());
        if (existingCustom) {
          categoryIdToUse = existingCustom.id;
        } else {
          // Create a custom category copy and use its id
          const created = await categoriesService.create({
            name: selectedCat.name,
            description: selectedCat.description || '',
            image: selectedCat.image || '',
            characteristics: []
          });
          if (created && (created as any).id) {
            categoryIdToUse = (created as any).id;
          }
        }
      }

      // Compute characteristics: if selected category had no predefined list, parse the freeform textarea
      const characteristicsToSend = (selectedCat && Array.isArray(selectedCat.characteristics) && selectedCat.characteristics.length > 0)
        ? formData.characteristics
        : parseCharacteristicsRaw(formData.characteristicsRaw || '');

  const result = await onSave({
  name: formData.name.trim(),
  description: formData.description.trim(),
  price: Number(formData.price),
  image: sanitizeImageUrl(formData.image.trim()),
  category_id: categoryIdToUse,
  characteristics: characteristicsToSend,
  variations: formData.variations.filter(v => v.type.trim() !== ''),
      });
      if (result) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    } catch (err) {
  // Show a readable error message returned by the service when possible
  const message = (err && (err as any).message) ? (err as any).message : 'Erreur lors de l’ajout du produit. Vérifiez votre connexion ou vos droits.';
  setError(message);
  console.error('Erreur ajout produit:', err);
    } finally {
      setSaving(false);
    }
  };

  // When the `product` prop changes (clicking edit on another product), reset the form data
  useEffect(() => {
    setFormData({
      name: product?.name || '',
      description: product?.description || '',
      price: product?.price || 0,
      image: product?.image || '',
      category_id: product?.category_id || (categories[0]?.id || ''),
      characteristics: product?.characteristics || {},
      characteristicsRaw: product && product.characteristics ? Object.entries(product.characteristics).map(([k,v]) => `${k}: ${v}`).join('\n') : '',
      variations: product?.variations || [],
      stock: product?.stock ?? 1
    });
    // Update selectedCategory based on product
    setSelectedCategory(categories.find(cat => cat.id === (product?.category_id || '')) || categories[0] || null);
  }, [product, categories]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-100 text-red-700 p-2 rounded mb-2 text-sm">
          {error}
        </div>
      )}
      {saved && (
        <div className="bg-green-100 text-green-700 p-2 rounded mb-2 text-sm">
          Enregistré avec succès
        </div>
      )}
      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nom du produit *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Ex: Transformateur 100kVA"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Prix (TND) *
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={formData.price}
            onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="0.00"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          rows={3}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
          placeholder="Description du produit..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Catégorie *
          </label>
          <select
            value={formData.category_id}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            required
          >
            <option value="">Sélectionnez une catégorie personnalisée...</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">Affiche uniquement les catégories créées par l'admin.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Image (collez l'URL)
          </label>
          <input
            type="url"
            value={formData.image}
            onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value.trim() }))}
            placeholder="https://example.com/image.jpg"
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
          />
          {formData.image && (
            <img src={sanitizeImageUrl(formData.image)} alt="preview" className="mt-3 h-32 object-contain" />
          )}
        </div>
      </div>

  {/* Characteristics */}
      {characteristicKeys.length > 0 && (
        <div>
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-medium text-gray-900 mb-3">Caractéristiques</h4>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500" title="Caractéristiques définies par la catégorie"></span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {characteristicKeys.map((characteristic) => (
              <div key={characteristic}>
                <label className="block text-sm font-medium text-gray-700 mb-2">{characteristic}</label>
                <input
                  type="text"
                  value={formData.characteristics[characteristic] || ''}
                  onChange={(e) => handleCharacteristicChange(characteristic, e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder={`Valeur pour ${characteristic}`}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* If the selected category has no predefined characteristics, show a freeform textarea
          allowing the admin to enter "key: value" per line. This is parsed before submit. */}
      {selectedCategory && (!Array.isArray(selectedCategory.characteristics) || selectedCategory.characteristics.length === 0) && (
        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-3">Caractéristiques (format clé: valeur par ligne)</h4>
          <textarea
            value={formData.characteristicsRaw}
            onChange={(e) => handleCharacteristicsRawChange(e.target.value)}
            rows={6}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder={`Ex:\nPuissance: 100 kVA\nTension: 400 V`}
          />
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={saving || !formData.name.trim() || !formData.category_id || formData.price <= 0}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center"
        >
          {saving && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          )}
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
    </form>
  );
}
