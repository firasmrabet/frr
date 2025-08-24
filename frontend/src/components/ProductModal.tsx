import React, { useState } from 'react';
import { X, ShoppingCart, Star, Minus, Plus } from 'lucide-react';
import { Product } from '../types';
import { useAppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

interface ProductModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProductModal({ product, isOpen, onClose }: ProductModalProps) {
  // Hooks must always run unconditionally at the top of the component
  const { state, dispatch } = useAppContext();
  const [selectedVariations, setSelectedVariations] = useState<{ [key: string]: string }>({});
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const navigate = useNavigate();
  // On récupère userId du contexte (voir AppContext)

  React.useEffect(() => {
    if (!product) return;
    if (product.variations) {
      const defaultVariations: { [key: string]: string } = {};
      product.variations.forEach(variation => {
        if (variation.options && variation.options.length > 0) {
          defaultVariations[variation.type] = variation.options[0].name;
        }
      });
      setSelectedVariations(defaultVariations);
    }
  }, [product]);

  // Guard early after hooks
  if (!product) return null;
  if (!isOpen) return null;


  const calculateTotalPrice = () => {
    let total = product.price * quantity;
    
    product.variations?.forEach(variation => {
      const selectedOption = variation.options.find(opt => opt.name === selectedVariations[variation.type]);
      if (selectedOption && selectedOption.price) {
        total += selectedOption.price * quantity;
      }
    });
    
    return total;
  };


  const handleAddToCart = () => {
    // Vérifier si connecté
    if (!state || !state.userId) {
      navigate('/login');
      return;
    }
    dispatch({
      type: 'ADD_TO_CART',
      payload: {
        product,
        quantity,
        variations: selectedVariations
      }
    });
  };

  const handleRequestQuote = () => {
    if (!state || !state.userId) {
      navigate('/login');
      return;
    }
    dispatch({ type: 'TOGGLE_QUOTE_MODAL', payload: product });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl sm:max-w-3xl w-full max-h-[90vh] overflow-auto mx-auto">
        <div className="p-6">
          <div className="relative mb-6">
            <h2 className="text-2xl font-bold text-gray-800 text-center">{product.name}</h2>
            <button
              onClick={onClose}
              className="absolute right-0 top-0 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Fermer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 place-items-center gap-8">
            {/* Images - centered column */}
            <div className="px-4 md:px-6 lg:px-8 flex flex-col items-center">
              <div className="mb-4">
                {/* Support single image in `product.image` (admin) or multiple in `product.images` */}
                {((product.images && product.images.length > 0) || product.image) ? (
                  <>
                    {/** build images array using images or fallback to single image */}
                    {(() => {
                      const imagesArray: string[] = (product.images && product.images.length > 0)
                        ? product.images
                        : (product.image ? [product.image] : []);
                      const imgSrc = imagesArray[selectedImageIndex] || imagesArray[0];
                      return (
                        <>
                          <img
                            src={imgSrc}
                            alt={product.name}
                            className="w-full max-w-md h-64 md:h-80 object-cover rounded-lg mx-auto"
                            onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/placeholder-image.svg'; }}
                          />
                          {imagesArray.length > 1 && (
                            <div className="flex justify-center space-x-2 mt-4">
                              {imagesArray.map((image: string, index: number) => (
                                <button
                                  key={index}
                                  onClick={() => setSelectedImageIndex(index)}
                                  className={`w-16 h-16 rounded-md overflow-hidden border-2 ${
                                    selectedImageIndex === index ? 'border-blue-600' : 'border-gray-200'
                                  }`}
                                >
                                  <img src={image} alt="" className="w-full h-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/placeholder-image.svg'; }} />
                                </button>
                              ))}
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </>
                ) : (
                  <div className="w-full h-96 flex items-center justify-center bg-gray-100 rounded-lg text-gray-400">
                    Pas d'image disponible
                  </div>
                )}
              </div>

              {/* Product details */}
              <div className="w-full max-w-md text-center">
                <div className="flex items-center justify-center space-x-4 mb-4">
                  <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded">
                    {product.brand}
                  </span>
                  {/** fixed rating display */}
                  <div className="flex items-center space-x-1">
                    <Star className="w-5 h-5 text-yellow-400 fill-current" />
                    <span className="font-medium">4.8</span>
                    <span className="text-gray-500">(100 avis)</span>
                  </div>
                </div>

                <p className="text-gray-600 mb-6">{product.description}</p>

                {/* Specifications */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Caractéristiques techniques</h3>
                  <div className="flex justify-center">
                    {/* Style: if the last item is in an odd position (alone on its row), span it across both columns and center it */}
                    <style>{`.characteristics-grid > div:last-child:nth-child(odd){grid-column:1/-1; justify-self:center;}`}</style>
                    <div className="characteristics-grid grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm mx-auto w-full max-w-2xl justify-items-center">
                      {Object.entries(product.specifications || product.characteristics || {}).map(([key, value]) => (
                        <div key={key} className="py-2 w-full max-w-sm">
                          <div className="flex items-center gap-3 justify-center text-center">
                            <span className="font-medium text-gray-700 whitespace-nowrap">{key}:</span>
                            <span className="text-gray-600">{value}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Variations */}
                {product.variations && product.variations.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3">Options</h3>
                    {product.variations.map((variation) => (
                      <div key={variation.type} className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {variation.type}
                        </label>
                        <select
                          value={selectedVariations[variation.type] || ''}
                          onChange={(e) => setSelectedVariations(prev => ({
                            ...prev,
                            [variation.type]: e.target.value
                          }))}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          {variation.options.map((option) => (
                            <option key={option.name} value={option.name}>
                              {option.name} {option.price && option.price !== 0 && `(+${option.price} TND)`}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                )}

                {/* Quantity */}
                <div className="mb-6 text-center">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quantité</label>
                  <div className="flex items-center justify-center space-x-3 mt-2">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-2 border border-gray-300 rounded-md hover:bg-gray-50"
                      aria-label="Réduire la quantité"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="font-medium text-lg px-4">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="p-2 border border-gray-300 rounded-md hover:bg-gray-50"
                      aria-label="Augmenter la quantité"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Price */}
                <div className="mb-6">
                  <div className="text-3xl font-bold text-gray-800">
                    {calculateTotalPrice().toLocaleString()} TND
                  </div>
                  {product.originalPrice && (
                    <div className="text-lg text-gray-500 line-through">
                      {(product.originalPrice * quantity).toLocaleString()} TND
                    </div>
                  )}
                  {/* stock display removed from modal */}
                </div>

                {/* Actions */}
                <div className="flex space-x-4">
                    <button
                      onClick={handleAddToCart}
                      className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                    >
                    <ShoppingCart className="w-5 h-5" />
                    <span>Ajouter au panier</span>
                  </button>
                  
                </div>

                <button
                  onClick={handleRequestQuote}
                  className="w-full mt-3 bg-orange-500 text-white py-3 px-6 rounded-md hover:bg-orange-600 transition-colors"
                >
                  Demander un devis
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}