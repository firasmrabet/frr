// Produit individuel
export interface Product {
  id: string; // Identifiant unique
  name: string; // Nom du produit
  description: string; // Description du produit
  category: string; // ID de la catégorie (doit correspondre à Category.id)
  price: number; // Prix actuel
  originalPrice?: number; // Prix d'origine (si promo)
  currency: string; // Devise (ex: "TND")
  image: string; // Image principale
  specifications: { [key: string]: string }; // Caractéristiques techniques
  // Admin/supabase custom products may store specs under `characteristics`.
  // Allow it as an optional alias so components can safely fallback to it.
  characteristics?: { [key: string]: string };
  variations?: {
    type: string; // Type de variation (ex: "Couleur", "Taille")
    options: { 
      name: string; 
      price?: number; 
      stock?: number;
    }[];
  }[];
  // in_stock removed from DB schema
  stock?: number; // Quantité en stock
  rating: number; // Note moyenne
  reviews: number; // Nombre d'avis
  brand: string; // Marque
  tags: string[]; // Mots-clés
    images: string[]; // Autres images du produit
}

// Catégorie de produits
export interface Category {
  id: string; // Identifiant unique
  name: string; // Nom de la catégorie
  description: string; // Description de la catégorie
  image: string; // Image de la catégorie
  productCount: number; // Nombre de produits
}

// Article dans le panier
export interface CartItem {
  product: Product;
  quantity: number;
  selectedVariations: { [key: string]: string }; // Valeur choisie pour chaque variation
  totalPrice: number;
}

// Demande de devis
export interface QuoteRequest {
  name: string;
  email: string;
  phone: string;
  company?: string;
  products: CartItem[];
  message: string;
}
