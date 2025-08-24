import { supabase } from '../supabaseClient';

// Local sanitizer: replace known-broken test CDN with local placeholder and accept only http(s) or relative paths
const sanitizeImageUrl = (url: any) => {
  if (!url) return '';
  const s = String(url).trim();
  if (/your\.cdn/i.test(s)) return '/placeholder-image.svg';
  if (/^(https?:\/\/|\/)/i.test(s)) return s;
  return '/placeholder-image.svg';
};

// Types for admin data
export interface CustomCategory {
  id: string;
  name: string;
  description: string;
  image: string;
  characteristics: string[];
  stock?: number;
  images?: string[];
  created_at: string;
  updated_at: string;
}

export interface CustomProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  images?: string[];
  category_id: string;
  characteristics: { [key: string]: string };
  variations?: Array<{
    type: string;
    options: Array<{
      name: string;
      price: number;
    }>;
  }>;
  stock?: number;
  created_at: string;
  updated_at: string;
}

// Categories Management
export const categoriesService = {
  // Get all custom categories
  async getAll(): Promise<CustomCategory[]> {
    try {
      const { data, error } = await supabase
        .from('custom_categories')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  },

  // Create new category
  async create(category: Omit<CustomCategory, 'id' | 'created_at' | 'updated_at'>): Promise<CustomCategory | null> {
    try {
  // sanitize image URL
  const safeImage = sanitizeImageUrl((category as any).image);
      const { data, error } = await supabase
          .from('custom_categories')
          .insert([{
    ...category,
    image: safeImage,
    characteristics: category.characteristics ?? []
          }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
  console.error('Error creating category:', error);
  // Rethrow so callers (UI) can surface the error message
  throw error;
    }
  },

  // Update category
  async update(id: string, updates: Partial<Omit<CustomCategory, 'id' | 'created_at'>>): Promise<CustomCategory | null> {
    try {
      // sanitize image when present
      if ((updates as any).image) {
        (updates as any).image = sanitizeImageUrl((updates as any).image);
      }
      const { data, error } = await supabase
        .from('custom_categories')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
  console.error('Error updating category:', error);
  // Rethrow so UI can show the real error
  throw error;
    }
  },

  // Delete category
  async delete(id: string): Promise<boolean> {
    try {
      // First delete all products in this category
      await supabase
        .from('custom_products')
        .delete()
        .eq('category_id', id);

      // Then delete the category
      const { error } = await supabase
        .from('custom_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting category:', error);
      return false;
    }
  }
};

// Products Management
export const productsService = {
  // Get all custom products
  async getAll(): Promise<CustomProduct[]> {
    try {
      const { data, error } = await supabase
        .from('custom_products')
        .select(`
          *,
          custom_categories (
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  },

  // Get products by category
  async getByCategory(categoryId: string): Promise<CustomProduct[]> {
    try {
      const { data, error } = await supabase
        .from('custom_products')
        .select('*')
        .eq('category_id', categoryId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching products by category:', error);
      return [];
    }
  },

  // Create new product
  async create(product: Omit<CustomProduct, 'id' | 'created_at' | 'updated_at'>): Promise<CustomProduct | null> {
    try {
      // Validate and normalize price to avoid numeric overflow in DB (numeric(10,2))
      const priceNum = Number(product.price);
      if (!Number.isFinite(priceNum) || isNaN(priceNum)) {
        throw new Error('Prix invalide : doit être un nombre');
      }
      // numeric(10,2) can store up to < 1e8; reject larger values
      const MAX_ALLOWED = 100000000; // 10^8
      if (Math.abs(priceNum) >= MAX_ALLOWED) {
        throw new Error(`Prix invalide : valeur trop élevée (doit être inférieure à ${MAX_ALLOWED})`);
      }
      // Round to 2 decimals
      const normalizedPrice = Math.round(priceNum * 100) / 100;

      // Only send allowed columns to PostgREST to avoid schema errors
      const insertPayload: any = {
        name: product.name,
        description: product.description,
        price: normalizedPrice,
  image: sanitizeImageUrl(product.image),
  category_id: product.category_id,
  characteristics: product.characteristics,
  variations: product.variations,
        // in_stock removed from schema; do not send it
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('custom_products')
        .insert([insertPayload])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      // Propagate a readable error so the UI can show it
      console.error('Error creating product:', error);
      throw error;
    }
  },

  // Update product
  async update(id: string, updates: Partial<Omit<CustomProduct, 'id' | 'created_at'>>): Promise<CustomProduct | null> {
    try {
      // Sanitize updates: only allow columns that exist in the DB schema
  const allowedFields = ['name', 'description', 'price', 'image', 'category_id', 'characteristics', 'variations'];
      const payload: any = { updated_at: new Date().toISOString() };
      for (const key of allowedFields) {
        if (Object.prototype.hasOwnProperty.call(updates, key)) {
          // @ts-ignore
          // sanitize image fields
          if (key === 'image') payload.image = sanitizeImageUrl((updates as any).image);
          else payload[key] = (updates as any)[key];
        }
      }

      const { data, error } = await supabase
        .from('custom_products')
        .update(payload)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating product:', error);
      return null;
    }
  },

  // Delete product
  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('custom_products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting product:', error);
      return false;
    }
  }
};

// Initialize tables (run this once to create the tables)
export const initializeTables = async () => {
  try {
    // Create custom_categories table
    const { error: categoriesError } = await supabase.rpc('create_custom_categories_table');
    if (categoriesError && !categoriesError.message.includes('already exists')) {
      console.error('Error creating categories table:', categoriesError);
    }

    // Create custom_products table
    const { error: productsError } = await supabase.rpc('create_custom_products_table');
    if (productsError && !productsError.message.includes('already exists')) {
      console.error('Error creating products table:', productsError);
    }

    console.log('Tables initialized successfully');
  } catch (error) {
    console.error('Error initializing tables:', error);
  }
};

// Helper function to merge custom data with static data
export const mergeWithStaticData = {
  // Merge custom categories with static categories
  async getCategories() {
    try {
      const customCategories = await categoriesService.getAll();

      // Import static categories
      const { categories: staticCategories } = await import('../data/products');

      // Convert custom categories to the same format as static ones
      const formattedCustomCategories = customCategories.map(cat => ({
        id: cat.id,
        name: cat.name,
        description: cat.description,
        image: cat.image,
  productCount: 0, // Will be calculated dynamically
  isCustom: true,
  // Preserve the characteristics array so downstream consumers (forms)
  // can render per-characteristic inputs. Ensure it's an array.
  characteristics: Array.isArray(cat.characteristics) ? cat.characteristics : (cat.characteristics ? Object.keys(cat.characteristics) : [])
      }));

      return [...staticCategories, ...formattedCustomCategories];
    } catch (error) {
      console.error('Error loading categories, falling back to static data:', error);
      // Fallback to static data only
      const { categories: staticCategories } = await import('../data/products');
      return staticCategories;
    }
  },

  // Merge custom products with static products
  async getProducts() {
    try {
      const customProducts = await productsService.getAll();

      // Import static products
      const { products: staticProducts } = await import('../data/products');

      // Convert custom products to the same format as static ones
      const formattedCustomProducts = customProducts.map(prod => ({
        id: prod.id,
        name: prod.name,
        description: prod.description,
        price: prod.price,
        image: prod.image,
  // Provide both `category` (keeps compatibility with static data) and
  // `category_id` so consumers can reliably resolve the product's
  // category regardless of source.
  category: prod.category_id,
  category_id: prod.category_id,
  // in_stock removed from schema
  rating: 0,
  reviews: 0,
  brand: 'Custom',
  tags: [],
  variations: prod.variations || [],
  characteristics: prod.characteristics,
  // Map admin 'characteristics' to the UI's expected 'specifications'
  // so ProductModal and ProductCard can render them uniformly.
  specifications: prod.characteristics || {},
  isCustom: true
      }));

      return [...staticProducts, ...formattedCustomProducts];
    } catch (error) {
      console.error('Error loading products, falling back to static data:', error);
      // Fallback to static data only
      const { products: staticProducts } = await import('../data/products');
      return staticProducts;
    }
  },

  // Update a custom product via productsService and return the updated merged item
  async updateProduct(id: string, updates: Partial<any>) {
    try {
      const updated = await productsService.update(id, updates as any);
      return updated;
    } catch (error) {
      console.error('Error updating product via mergeWithStaticData:', error);
      return null;
    }
  }
};
