import React from 'react';
import { X, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

export default function Cart() {
  const { state, dispatch } = useAppContext();
  const navigate = useNavigate();

  if (!state.isCartOpen) return null;

  const totalPrice = state.cart.reduce((sum, item) => sum + item.totalPrice, 0);

  const updateQuantity = (index: string, newQuantity: number, variations: { [key: string]: string }) => {
    const item = state.cart[parseInt(index)];
    if (!item) return;
    if (newQuantity <= 0) {
      dispatch({ type: 'REMOVE_FROM_CART', payload: { productId: item.product.id, variations: item.selectedVariations } });
    } else {
      dispatch({
        type: 'UPDATE_CART_ITEM',
        payload: {
          productId: item.product.id,
          quantity: newQuantity,
          variations
        }
      });
    }
  };

  const handleRequestQuote = () => {
    if (!state || !state.userId) {
      navigate('/login');
      return;
    }
    if (state.cart.length > 0) {
      dispatch({ type: 'TOGGLE_QUOTE_MODAL', payload: null });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
      <div className="bg-white w-full max-w-md h-full overflow-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Panier ({state.cart.reduce((sum, item) => sum + item.quantity, 0)})</h2>
            <button
              onClick={() => dispatch({ type: 'TOGGLE_CART' })}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {state.cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <ShoppingBag className="w-16 h-16 mb-4" />
            <p>Votre panier est vide</p>
          </div>
        ) : (
          <>
            <div className="flex-1 p-6 space-y-4">
              {state.cart.map((item, index) => (
                <div key={`${item.product.id}-${JSON.stringify(item.selectedVariations)}`} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex space-x-4">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-16 h-16 object-cover rounded-md"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-sm">{item.product.name}</h3>
                      <p className="text-xs text-gray-500 mb-2">{item.product.brand}</p>
                      
                      {Object.keys(item.selectedVariations).length > 0 && (
                        <div className="text-xs text-gray-600 mb-2">
                          {Object.entries(item.selectedVariations).map(([key, value]) => (
                            <div key={key}>
                              <span className="font-medium">{key}:</span> {value}
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateQuantity(index.toString(), item.quantity - 1, item.selectedVariations)}
                            className="p-1 border border-gray-300 rounded hover:bg-gray-50"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-sm font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(index.toString(), item.quantity + 1, item.selectedVariations)}
                            className="p-1 border border-gray-300 rounded hover:bg-gray-50"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <button
                          onClick={() => dispatch({ type: 'REMOVE_FROM_CART', payload: { productId: item.product.id, variations: item.selectedVariations } })}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="text-sm font-semibold mt-2">
                        {item.totalPrice.toLocaleString()} TND
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-semibold">Total:</span>
                <span className="text-xl font-bold text-blue-600">
                  {totalPrice.toLocaleString()} TND
                </span>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={handleRequestQuote}
                  className="w-full bg-orange-500 text-white py-3 rounded-md hover:bg-orange-600 transition-colors"
                >
                  Demander un devis pour le panier
                </button>
                <button
                  onClick={() => dispatch({ type: 'EXPLICIT_CLEAR_CART' })}
                  className="w-full bg-gray-500 text-white py-3 rounded-md hover:bg-gray-600 transition-colors"
                >
                  Vider le panier
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}