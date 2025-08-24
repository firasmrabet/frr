import React, { useState } from 'react';
import { ShoppingCart, Eye, Star } from 'lucide-react';
import { Product } from '../types';
import { useAppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

interface ProductCardProps {
  product: Product;
  onProductClick: (product: Product) => void;
}

export default function ProductCard({ product, onProductClick }: ProductCardProps) {
  const { state, dispatch } = useAppContext();
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);

  // ...isFavorite supprimé...
  const discountPercentage = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  // Correction: valeur par défaut pour specifications
  const specifications = product.specifications || {};

  // Display fixed rating & reviews as requested
  const displayRating = 4.8;
  const displayReviews = 100;

  // Do not display or depend on stock in product cards — always show as available
  const isAvailable = true;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Check if user is authenticated
    if (!state || !state.userId) {
      navigate('/login');
      return;
    }
    
    const defaultVariations: { [key: string]: string } = {};
    
    product.variations?.forEach(variation => {
      if (variation.options.length > 0) {
        defaultVariations[variation.type] = variation.options[0].name;
      }
    });

    dispatch({
      type: 'ADD_TO_CART',
      payload: {
        product,
        quantity: 1,
        variations: defaultVariations
      }
    });
  };

  // ...handleToggleFavorite supprimé...

  const handleRequestQuote = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Check if user is authenticated
    if (!state || !state.userId) {
      navigate('/login');
      return;
    }
    
    dispatch({ type: 'TOGGLE_QUOTE_MODAL', payload: product });
  };

  return (
    <div
      className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onProductClick(product)}
    >
      <div className="relative flex items-center justify-center bg-gray-50 overflow-hidden">
          <img
            src={imageError ? 'https://images.pexels.com/photos/159298/gears-cogs-machine-machinery-159298.jpeg?auto=compress&cs=tinysrgb&w=400' : product.image}
            alt={product.name}
            onError={() => setImageError(true)}
            className="max-h-40 w-auto object-contain p-3 transition-transform duration-300 group-hover:scale-105"
          />
        
        {discountPercentage > 0 && (
          <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-bold">
            -{discountPercentage}%
          </div>
        )}

  {/* stock/rupture badge intentionally removed from product cards */}

        <div className={`absolute top-2 right-2 transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          <div className="flex flex-col space-y-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onProductClick(product);
              }}
              className="p-2 bg-white text-gray-600 hover:bg-blue-500 hover:text-white transition-colors rounded-full shadow-md"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-1">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="text-sm text-gray-600">{displayRating}</span>
            <span className="text-xs text-gray-500">({displayReviews})</span>
          </div>
        </div>

        <h3 className="text-sm font-medium text-gray-800 mb-2 line-clamp-2 hover:text-blue-600 transition-colors">
          {product.name}
        </h3>

        <div className="text-xs text-gray-500 mb-3">
          {Object.entries(specifications).slice(0, 2).map(([key, value], index) => (
            <div key={index}>
              <span className="font-medium">{key}:</span> {value}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mb-3">
          <div className="flex flex-col">
            <span className="text-lg font-bold text-gray-800">
              {product.price.toLocaleString()} TND
            </span>
            {product.originalPrice && (
              <span className="text-sm text-gray-500 line-through">
                {product.originalPrice.toLocaleString()} TND
              </span>
            )}
          </div>
          {/* stock info removed from card UI */}
        </div>

        <div className="flex space-x-2">
          <button
            onClick={handleAddToCart}
            disabled={!isAvailable}
            className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm flex items-center justify-center space-x-1"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Ajouter</span>
          </button>
          <button
            onClick={handleRequestQuote}
            className="bg-orange-500 text-white py-2 px-3 rounded-md hover:bg-orange-600 transition-colors text-xs"
          >
            Devis
          </button>
        </div>
      </div>
    </div>
  );
}
