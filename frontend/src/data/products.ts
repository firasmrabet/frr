import { Product, Category } from '../types';

// Static categories and products removed — app will rely on admin-created (custom) data from the database.
export const categories: Category[] = [];

export const products: Product[] = [];

// helper lists remain but are derived from the (now empty) products array
export const featuredProducts = products.slice(0, 8);
export const newArrivals = products.slice(0, 8);
export const bestSellers = products.filter(p => (p.rating ?? 0) >= 4.7).slice(0, 6);
