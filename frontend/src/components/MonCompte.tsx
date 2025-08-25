

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUser, FiLogOut } from 'react-icons/fi';
import { useAppContext } from '../context/AppContext';
import { supabase } from '../supabaseClient';
function MonCompte() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { state } = useAppContext();

  useEffect(() => {
    async function fetchUser() {
      const { data } = await supabase.auth.getUser();
      if (data?.user) setUser(data.user);
      setLoading(false);
    }
    fetchUser();
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [loading, user, navigate]);

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Chargement...</div>;
  }
  if (!user) {
    return <div className="flex justify-center items-center h-screen text-red-600">Connecte-toi pour voir ton compte.</div>;
  }

  // Historique panier
  const cartItems = state.cart;
  const totalCart = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);

  // Historique devis réel
  const quoteHistory = state.quoteHistory;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-300">
  <div className="max-w-lg w-full bg-white rounded-xl shadow-lg p-8" style={{ maxWidth: '80rem', marginTop: '5%', marginBottom: '5%' }}>
        <div className="flex items-center mb-6 justify-between">
          <div className="flex items-center">
            <FiUser className="w-10 h-10 text-blue-600 mr-3" />
            <div>
              <h2 className="text-2xl font-bold text-blue-700">Mon compte</h2>
              <div className="text-gray-600">{user.email}</div>
            </div>
          </div>
          <button
            className="flex items-center bg-red-100 text-red-600 px-2 py-1 rounded hover:bg-red-200 transition max-w-[120px] overflow-hidden"
            onClick={async () => {
              try {
                // Persist current cart to Supabase before signing out so the filled state is saved
                const currentUser = user;
                if (currentUser && state?.cart) {
                  const serializeCart = (cart) => cart.map(item => ({
                    product: {
                      id: item.product.id,
                      name: item.product.name,
                      price: item.product.price,
                      image: item.product.image || ''
                    },
                    quantity: item.quantity,
                    selectedVariations: item.selectedVariations,
                    totalPrice: item.totalPrice,
                    addedAt: item.addedAt || null
                  }));
                  const payload = { user_id: currentUser.id, items: serializeCart(state.cart) };
                  try {
                    const { error: upsertErr } = await supabase.from('carts').upsert(payload, { onConflict: 'user_id' });
                    if (upsertErr) console.error('Error upserting cart before signOut', upsertErr);
                    else console.log('Cart upserted before signOut for', currentUser.id);
                  } catch (e) {
                    console.error('Unexpected error upserting cart before signOut', e);
                  }
                }
              } finally {
                await supabase.auth.signOut();
                navigate('/login');
              }
            }}
            title="Déconnexion"
          >
            <FiLogOut className="w-5 h-5 mr-1 flex-shrink-0" />
            <span className="truncate text-sm">Déconnexion</span>
          </button>
        </div>
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Informations personnelles</h3>
          <div className="bg-gray-50 p-4 rounded">
            <div>Email: {user.email}</div>
          </div>
        </div>
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Produits ajoutés au panier</h3>
          <div className="bg-gray-50 p-4 rounded">
            {cartItems.length === 0 ? (
              <div className="text-gray-500">Aucun produit dans le panier.</div>
            ) : (
              <ul className="list-disc pl-5">
                {cartItems.map((item, idx) => (
                  <li key={idx}>
                    {item.product.name} — {item.quantity} x {item.product.price} {item.product.currency} = {item.totalPrice} {item.product.currency}
                  </li>
                ))}
              </ul>
            )}
            <div className="font-bold mt-2">Total panier: {totalCart} {cartItems[0]?.product.currency || ''}</div>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">Historique des devis</h3>
          <div className="bg-gray-50 p-4 rounded">
            {quoteHistory.length === 0 ? (
              <div className="text-gray-500">Aucun devis pour le moment.</div>
            ) : (
              // Make the history scrollable and show total per quote
              <div className="space-y-4">
                <div className="max-h-96 overflow-auto p-1">
                  {quoteHistory.map((q, idx) => {
                    const total = Array.isArray(q.products)
                      ? q.products.reduce((s, item) => s + (item.totalPrice ?? ((item.product?.price || 0) * (item.quantity || 1))), 0)
                      : 0;
                    return (
                      <div key={idx} className="border rounded-lg p-4 bg-white shadow-sm mb-3">
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center space-x-4">
                            <span className="font-bold text-blue-700">Devis #{idx + 1}</span>
                            <span className="text-sm text-gray-500">{q.email}</span>
                          </div>
                          {q.date && (
                            <span className="text-xs text-gray-400">
                              {new Date(q.date).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                            </span>
                          )}
                        </div>
                        <div className="mb-2 text-gray-700">{q.message}</div>
                        <div>
                          <span className="font-semibold">Produits demandés :</span>
                          <ul className="list-disc pl-5 mt-1">
                            {Array.isArray(q.products) && q.products.map((item, i) => (
                              <li key={i} className="text-gray-800">
                                {item.product?.name || 'Produit inconnu'} — {item.quantity} x {item.product?.price ?? ''} {item.product?.currency ?? ''} = {item.totalPrice ?? ((item.product?.price || 0) * (item.quantity || 1))} {item.product?.currency ?? ''}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="mt-3 text-right font-bold text-gray-800">Totale: {total.toLocaleString()} TND</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MonCompte;
